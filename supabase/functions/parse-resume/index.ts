import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sentry, initSentry } from '../shared/sentry.ts'

// Initialize Sentry for error monitoring
initSentry()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ParsedResume {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    website?: string
    summary: string
  }
  experience: Array<{
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    current: boolean
    description: string
    achievements: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
    gpa?: string
    honors?: string
  }>
  skills: Array<{
    id: string
    name: string
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    category: 'Technical' | 'Soft' | 'Language' | 'Other'
  }>
  projects: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    startDate: string
    endDate: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting check (very strict for AI parsing)
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(clientIP, 5, 3600000)) { // 5 parses per hour
    return new Response(
      JSON.stringify({ error: 'Resume parsing rate limit exceeded. Please try again later.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' },
        status: 429,
      }
    )
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('resume') as File

    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload PDF, Word document, or text file.')
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }

    // Extract text from file
    let extractedText: string
    
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    } else if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(file)
    } else {
      extractedText = await extractTextFromWord(file)
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable text.')
    }

    // Parse resume using OpenAI
    const parsedResume = await parseResumeWithAI(extractedText)
    
    // Calculate confidence score based on extracted data completeness
    const confidence = calculateConfidenceScore(parsedResume)

    // Clean up - no need to store the file permanently
    
    return new Response(
      JSON.stringify({
        parsedResume,
        confidence,
        message: 'Resume parsed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Resume parsing error:', error)

    // Send error to Sentry (PII-free)
    sentry.captureException(error as Error, {
      function_name: 'parse-resume',
      file_type: 'unknown',
      error_stage: 'parsing'
    })

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function extractTextFromPDF(file: File): Promise<string> {
  // For PDF extraction, we'll use a simple approach
  // In production, you might want to use a more robust PDF parsing library
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Simple text extraction - look for text between stream objects
    const text = new TextDecoder().decode(uint8Array)
    
    // Extract readable text using regex patterns
    const textMatches = text.match(/\(([^)]+)\)/g) || []
    const extractedText = textMatches
      .map(match => match.slice(1, -1))
      .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
      .join(' ')
    
    if (extractedText.length < 50) {
      throw new Error('Could not extract sufficient text from PDF')
    }
    
    return extractedText
  } catch (error) {
    throw new Error('Failed to extract text from PDF. Please try a different format.')
  }
}

async function extractTextFromWord(file: File): Promise<string> {
  // For Word documents, we'll extract what we can
  // In production, you might want to use a more robust Word parsing library
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Simple text extraction for Word documents
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array)
    
    // Extract readable text
    const cleanText = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    if (cleanText.length < 50) {
      throw new Error('Could not extract sufficient text from Word document')
    }
    
    return cleanText
  } catch (error) {
    throw new Error('Failed to extract text from Word document. Please try a different format.')
  }
}

async function parseResumeWithAI(text: string): Promise<ParsedResume> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback to heuristic parsing if no OpenAI key
    return parseResumeHeuristic(text)
  }

  try {
    const prompt = `
Parse the following resume text and extract structured information. Return a JSON object with the following structure:

{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string", 
    "location": "string",
    "linkedin": "string (optional)",
    "website": "string (optional)",
    "summary": "string"
  },
  "experience": [
    {
      "id": "string (generate unique)",
      "company": "string",
      "position": "string", 
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or empty if current",
      "current": boolean,
      "description": "string",
      "achievements": ["string array of bullet points"]
    }
  ],
  "education": [
    {
      "id": "string (generate unique)",
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY-MM format", 
      "endDate": "YYYY-MM format",
      "gpa": "string (optional)",
      "honors": "string (optional)"
    }
  ],
  "skills": [
    {
      "id": "string (generate unique)",
      "name": "string",
      "level": "Beginner|Intermediate|Advanced|Expert",
      "category": "Technical|Soft|Language|Other"
    }
  ],
  "projects": [
    {
      "id": "string (generate unique)",
      "name": "string",
      "description": "string",
      "technologies": ["string array"],
      "url": "string (optional)",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format"
    }
  ]
}

Resume text:
${text}

Important: Return only valid JSON. If information is missing, use empty strings or empty arrays. For dates, estimate based on context or use approximate dates.
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing expert. Extract structured data from resume text and return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API request failed')
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const parsedResume = JSON.parse(content)
    
    // Validate and clean the parsed data
    return validateAndCleanParsedResume(parsedResume)

  } catch (error) {
    console.error('OpenAI parsing failed, falling back to heuristic parsing:', error)
    return parseResumeHeuristic(text)
  }
}

function parseResumeHeuristic(text: string): ParsedResume {
  // Fallback heuristic parsing when AI is not available
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  const email = emailMatch ? emailMatch[0] : ''
  
  // Extract phone
  const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g)
  const phone = phoneMatch ? phoneMatch[0] : ''
  
  // Extract name (assume first line or line before email)
  let fullName = ''
  if (lines.length > 0) {
    fullName = lines[0].replace(/[^\w\s]/g, '').trim()
  }
  
  // Extract skills (look for common skill keywords)
  const skillKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'Git', 'AWS', 'Docker']
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  ).map((skill, index) => ({
    id: `skill-${index}`,
    name: skill,
    level: 'Intermediate' as const,
    category: 'Technical' as const
  }))

  return {
    personalInfo: {
      fullName,
      email,
      phone,
      location: '',
      summary: 'Imported from uploaded resume'
    },
    experience: [],
    education: [],
    skills: foundSkills,
    projects: []
  }
}

function validateAndCleanParsedResume(parsed: any): ParsedResume {
  // Ensure all required fields exist and have proper types
  const cleaned: ParsedResume = {
    personalInfo: {
      fullName: parsed.personalInfo?.fullName || '',
      email: parsed.personalInfo?.email || '',
      phone: parsed.personalInfo?.phone || '',
      location: parsed.personalInfo?.location || '',
      linkedin: parsed.personalInfo?.linkedin || undefined,
      website: parsed.personalInfo?.website || undefined,
      summary: parsed.personalInfo?.summary || ''
    },
    experience: (parsed.experience || []).map((exp: any, index: number) => ({
      id: exp.id || `exp-${index}`,
      company: exp.company || '',
      position: exp.position || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements : []
    })),
    education: (parsed.education || []).map((edu: any, index: number) => ({
      id: edu.id || `edu-${index}`,
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.gpa || undefined,
      honors: edu.honors || undefined
    })),
    skills: (parsed.skills || []).map((skill: any, index: number) => ({
      id: skill.id || `skill-${index}`,
      name: skill.name || '',
      level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.level) 
        ? skill.level : 'Intermediate',
      category: ['Technical', 'Soft', 'Language', 'Other'].includes(skill.category)
        ? skill.category : 'Technical'
    })),
    projects: (parsed.projects || []).map((project: any, index: number) => ({
      id: project.id || `project-${index}`,
      name: project.name || '',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      url: project.url || undefined,
      startDate: project.startDate || '',
      endDate: project.endDate || ''
    }))
  }

  return cleaned
}

function calculateConfidenceScore(parsed: ParsedResume): number {
  let score = 0
  let maxScore = 0

  // Personal info scoring
  maxScore += 5
  if (parsed.personalInfo.fullName) score += 1
  if (parsed.personalInfo.email) score += 1
  if (parsed.personalInfo.phone) score += 1
  if (parsed.personalInfo.location) score += 1
  if (parsed.personalInfo.summary) score += 1

  // Experience scoring
  maxScore += 3
  if (parsed.experience.length > 0) {
    score += 1
    if (parsed.experience.some(exp => exp.company && exp.position)) score += 1
    if (parsed.experience.some(exp => exp.achievements.length > 0)) score += 1
  }

  // Education scoring
  maxScore += 2
  if (parsed.education.length > 0) {
    score += 1
    if (parsed.education.some(edu => edu.institution && edu.degree)) score += 1
  }

  // Skills scoring
  maxScore += 1
  if (parsed.skills.length > 0) score += 1

  return Math.min(score / maxScore, 1)
}
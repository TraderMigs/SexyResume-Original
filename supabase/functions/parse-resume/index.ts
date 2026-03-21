import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(clientIP, 10, 3600000)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' }, status: 429 }
    )
  }

  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')

    const formData = await req.formData()
    const file = formData.get('resume') as File

    if (!file) throw new Error('No file provided')

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload PDF, Word document, or text file.')
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.')
    }

    let extractedText = ''

    if (file.type === 'text/plain') {
      extractedText = await file.text()
    } else if (file.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(file)
    } else {
      extractedText = await extractTextFromWord(file)
    }

    if (!extractedText || extractedText.trim().length < 30) {
      throw new Error('Could not extract readable text from this file. Please ensure the file contains text (not a scanned image).')
    }

    const parsedResume = await parseResumeWithClaude(extractedText)
    const confidence = calculateConfidenceScore(parsedResume)

    return new Response(
      JSON.stringify({ parsedResume, confidence, message: 'Resume parsed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Resume parsing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const base64 = btoa(String.fromCharCode(...bytes))

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('Anthropic API key not configured')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 },
              },
              {
                type: 'text',
                text: 'Extract ALL text content from this PDF document. Return only the raw text exactly as it appears, preserving line breaks and structure. Do not summarize or interpret — just extract.',
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude PDF extraction failed: ${err}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''

  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF. Please try a Word or text file.')
  }
}

async function extractTextFromWord(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array)

    const xmlMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []
    let extracted = xmlMatches
      .map(m => m.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (extracted.length < 30) {
      extracted = text
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    if (extracted.length < 30) throw new Error('Could not extract text from Word document')
    return extracted

  } catch (error) {
    throw new Error('Failed to extract text from Word document. Please try PDF or text format.')
  }
}

async function parseResumeWithClaude(text: string): Promise<any> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) throw new Error('Anthropic API key not configured')

  const prompt = `You are an expert resume parser. Extract structured information from the resume text below.

Return a JSON object with EXACTLY this structure:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "City, State format only — never include job titles or roles here",
    "linkedin": "string or empty string",
    "website": "string or empty string",
    "summary": "string - professional summary or objective if present"
  },
  "experience": [
    {
      "id": "exp-1",
      "company": "string",
      "position": "string",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM or empty if current",
      "current": boolean,
      "description": "string",
      "achievements": ["array of bullet point strings"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY-MM or year",
      "endDate": "YYYY-MM or year",
      "gpa": "string or empty",
      "honors": "string or empty"
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "name": "string",
      "level": "Beginner or Intermediate or Advanced or Expert",
      "category": "Technical or Soft or Language or Other"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "string",
      "description": "string",
      "technologies": ["array"],
      "url": "string or empty",
      "startDate": "YYYY-MM or empty",
      "endDate": "YYYY-MM or empty"
    }
  ]
}

CRITICAL RULES:
- location must ONLY contain city/state/country — never a job title, role, or any other text
- Do not invent or hallucinate any information
- Extract only what is actually in the resume
- Use empty strings for missing text fields, false for booleans, empty arrays for arrays
- Return ONLY the JSON object — no explanation, no markdown, no code fences

Resume text:
${text.substring(0, 8000)}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text || ''

  try {
    const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return validateAndClean(JSON.parse(clean))
  } catch {
    throw new Error('Failed to parse AI response into structured resume data.')
  }
}

function validateAndClean(parsed: any) {
  return {
    personalInfo: {
      fullName: parsed.personalInfo?.fullName || '',
      email: parsed.personalInfo?.email || '',
      phone: parsed.personalInfo?.phone || '',
      location: parsed.personalInfo?.location || '',
      linkedin: parsed.personalInfo?.linkedin || '',
      website: parsed.personalInfo?.website || '',
      summary: parsed.personalInfo?.summary || '',
    },
    experience: (parsed.experience || []).map((exp: any, i: number) => ({
      id: exp.id || `exp-${i + 1}`,
      company: exp.company || '',
      position: exp.position || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: exp.current || false,
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    })),
    education: (parsed.education || []).map((edu: any, i: number) => ({
      id: edu.id || `edu-${i + 1}`,
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
      honors: edu.honors || '',
    })),
    skills: (parsed.skills || []).map((skill: any, i: number) => ({
      id: skill.id || `skill-${i + 1}`,
      name: skill.name || '',
      level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.level) ? skill.level : 'Intermediate',
      category: ['Technical', 'Soft', 'Language', 'Other'].includes(skill.category) ? skill.category : 'Technical',
    })),
    projects: (parsed.projects || []).map((proj: any, i: number) => ({
      id: proj.id || `proj-${i + 1}`,
      name: proj.name || '',
      description: proj.description || '',
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      url: proj.url || '',
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
    })),
  }
}

function calculateConfidenceScore(parsed: any): number {
  let score = 0, max = 11
  if (parsed.personalInfo.fullName) score++
  if (parsed.personalInfo.email) score++
  if (parsed.personalInfo.phone) score++
  if (parsed.personalInfo.location) score++
  if (parsed.personalInfo.summary) score++
  if (parsed.experience.length > 0) score++
  if (parsed.experience.some((e: any) => e.company && e.position)) score++
  if (parsed.experience.some((e: any) => e.achievements.length > 0)) score++
  if (parsed.education.length > 0) score++
  if (parsed.education.some((e: any) => e.institution && e.degree)) score++
  if (parsed.skills.length > 0) score++
  return Math.min(score / max, 1)
}

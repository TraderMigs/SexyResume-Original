import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
}

interface GenerateCoverLetterRequest {
  resumeId?: string
  resumeData?: any
  targetRole: string
  companyName?: string
  jobDescription?: string
  tone: 'formal' | 'neutral' | 'friendly'
  length: 'short' | 'standard' | 'detailed'
  keywords?: string[]
  matchResumeTemplate?: boolean
}

interface CoverLetterSection {
  id: string
  type: 'header' | 'opening' | 'body' | 'closing' | 'signature'
  title: string
  content: string
  editable: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST': {
        if (action === 'generate') {
          return await generateCoverLetter(req, supabaseClient, user)
        }
        break
      }

      case 'GET': {
        if (action === 'cover-letter') {
          // Get all user's cover letters
          return await getUserCoverLetters(supabaseClient, user)
        } else {
          // Get specific cover letter
          return await getCoverLetter(action, supabaseClient, user)
        }
      }

      case 'PUT': {
        // Update cover letter
        return await updateCoverLetter(action, req, supabaseClient, user)
      }

      case 'DELETE': {
        // Delete cover letter
        return await deleteCoverLetter(action, supabaseClient, user)
      }

      default:
        throw new Error('Method not allowed')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateCoverLetter(req: Request, supabaseClient: any, user: any) {
  const startTime = Date.now()
  let telemetryData: any = {
    userId: user.id,
    success: false,
    generationTimeMs: 0,
    tone: 'neutral',
    length: 'standard',
    hasJobDescription: false,
    hasCompanyName: false,
    keywordCount: 0
  }

  try {
    const requestData: GenerateCoverLetterRequest = await req.json()
    
    // Update telemetry data
    telemetryData.tone = requestData.tone
    telemetryData.length = requestData.length
    telemetryData.hasJobDescription = !!requestData.jobDescription
    telemetryData.hasCompanyName = !!requestData.companyName
    telemetryData.keywordCount = requestData.keywords?.length || 0

    // Validate required fields
    if (!requestData.targetRole) {
      throw new Error('Target role is required')
    }

    // Validate request data
    const validation = validateCoverLetterRequest(requestData)
    if (!validation.isValid) {
      throw new Error(validation.error!)
    }

    // Get resume data
    let resumeData = requestData.resumeData
    if (!resumeData && requestData.resumeId) {
      const { data: resume, error: resumeError } = await supabaseClient
        .from('resumes')
        .select('*')
        .eq('id', requestData.resumeId)
        .eq('user_id', user.id)
        .single()

      if (resumeError || !resume) {
        throw new Error('Resume not found or access denied')
      }
      resumeData = resume.data
    }

    if (!resumeData) {
      throw new Error('Resume data is required')
    }

    // Generate cover letter using AI
    const coverLetterContent = await generateWithAI(requestData, resumeData)
    
    // Calculate word count
    const wordCount = countWords(coverLetterContent.plainText)

    // Save to database
    const { data: coverLetter, error: saveError } = await supabaseClient
      .from('cover_letters')
      .insert({
        user_id: user.id,
        resume_id: requestData.resumeId,
        target_role: requestData.targetRole,
        company_name: requestData.companyName,
        job_description: requestData.jobDescription,
        tone: requestData.tone,
        length: requestData.length,
        keywords: requestData.keywords || [],
        match_resume_template: requestData.matchResumeTemplate || false,
        sections: coverLetterContent.sections,
        plain_text: coverLetterContent.plainText,
        html_content: coverLetterContent.htmlContent,
        word_count: wordCount
      })
      .select()
      .single()

    if (saveError) throw saveError

    // Record successful telemetry
    telemetryData.success = true
    telemetryData.generationTimeMs = Date.now() - startTime
    telemetryData.tokenUsage = coverLetterContent.tokenUsage

    await recordTelemetry(supabaseClient, telemetryData)

    return new Response(
      JSON.stringify(coverLetter),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )

  } catch (error) {
    // Record failed telemetry
    telemetryData.success = false
    telemetryData.generationTimeMs = Date.now() - startTime
    telemetryData.errorMessage = error.message

    await recordTelemetry(supabaseClient, telemetryData)

    throw error
  }
}

async function generateWithAI(request: GenerateCoverLetterRequest, resumeData: any) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback to template-based generation
    return generateWithTemplate(request, resumeData)
  }

  try {
    const prompt = buildPrompt(request, resumeData)
    
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
            content: 'You are a professional cover letter writer. Create compelling, personalized cover letters based on resume data and job requirements. Always use facts from the provided resume and job description. Never hallucinate or invent information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
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

    // Parse the AI response into structured format
    const parsed = parseAIResponse(content, request)
    
    return {
      ...parsed,
      tokenUsage: data.usage?.total_tokens || 0
    }

  } catch (error) {
    console.error('AI generation failed, falling back to template:', error)
    return generateWithTemplate(request, resumeData)
  }
}

function buildPrompt(request: GenerateCoverLetterRequest, resumeData: any): string {
  const { personalInfo, experience, skills } = resumeData
  
  let prompt = `Create a ${request.tone} ${request.length} cover letter for the position of "${request.targetRole}"`
  
  if (request.companyName) {
    prompt += ` at ${request.companyName}`
  }
  
  prompt += '.\n\n'
  
  // Add resume context
  prompt += 'RESUME INFORMATION:\n'
  prompt += `Name: ${personalInfo?.fullName || 'Not provided'}\n`
  prompt += `Email: ${personalInfo?.email || 'Not provided'}\n`
  
  if (personalInfo?.summary) {
    prompt += `Professional Summary: ${personalInfo.summary}\n`
  }
  
  if (experience && experience.length > 0) {
    prompt += '\nWork Experience:\n'
    experience.slice(0, 3).forEach((exp: any, index: number) => {
      prompt += `${index + 1}. ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n`
      if (exp.description) prompt += `   ${exp.description}\n`
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.slice(0, 2).forEach((achievement: string) => {
          if (achievement.trim()) prompt += `   • ${achievement}\n`
        })
      }
    })
  }
  
  if (skills && skills.length > 0) {
    prompt += '\nKey Skills:\n'
    skills.slice(0, 10).forEach((skill: any) => {
      prompt += `• ${skill.name} (${skill.level})\n`
    })
  }
  
  // Add job context
  if (request.jobDescription) {
    prompt += `\nJOB DESCRIPTION:\n${request.jobDescription}\n`
  }
  
  if (request.keywords && request.keywords.length > 0) {
    prompt += `\nIMPORTANT KEYWORDS TO INCLUDE: ${request.keywords.join(', ')}\n`
  }
  
  // Add instructions
  prompt += '\nINSTRUCTIONS:\n'
  prompt += '1. Only use facts from the resume and job description provided\n'
  prompt += '2. Do not invent or hallucinate any information\n'
  prompt += '3. Structure the letter with clear opening, body, and closing paragraphs\n'
  prompt += '4. Match the requested tone and length\n'
  prompt += '5. Include relevant keywords naturally\n'
  prompt += '6. Focus on how the candidate\'s experience matches the role\n'
  
  if (request.length === 'short') {
    prompt += '7. Keep it concise - maximum 250 words\n'
  } else if (request.length === 'standard') {
    prompt += '7. Standard length - 300-400 words\n'
  } else {
    prompt += '7. Detailed version - 400-500 words\n'
  }
  
  prompt += '\nReturn the cover letter in plain text format.'
  
  return prompt
}

function parseAIResponse(content: string, request: GenerateCoverLetterRequest) {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim())
  
  const sections: CoverLetterSection[] = []
  
  // Header section
  sections.push({
    id: 'header',
    type: 'header',
    title: 'Header',
    content: `[Your Name]\n[Your Address]\n[Your Email]\n[Your Phone]\n\n[Date]\n\n[Hiring Manager's Name]\n${request.companyName || '[Company Name]'}\n[Company Address]`,
    editable: true
  })
  
  // Opening paragraph
  if (paragraphs.length > 0) {
    sections.push({
      id: 'opening',
      type: 'opening',
      title: 'Opening',
      content: paragraphs[0],
      editable: true
    })
  }
  
  // Body paragraphs
  if (paragraphs.length > 2) {
    const bodyContent = paragraphs.slice(1, -1).join('\n\n')
    sections.push({
      id: 'body',
      type: 'body',
      title: 'Body',
      content: bodyContent,
      editable: true
    })
  }
  
  // Closing paragraph
  if (paragraphs.length > 1) {
    sections.push({
      id: 'closing',
      type: 'closing',
      title: 'Closing',
      content: paragraphs[paragraphs.length - 1],
      editable: true
    })
  }
  
  // Signature
  sections.push({
    id: 'signature',
    type: 'signature',
    title: 'Signature',
    content: 'Sincerely,\n[Your Name]',
    editable: true
  })
  
  const plainText = content
  const htmlContent = generateHTMLContent(sections, request.matchResumeTemplate)
  
  return {
    sections,
    plainText,
    htmlContent
  }
}

function generateWithTemplate(request: GenerateCoverLetterRequest, resumeData: any) {
  const { personalInfo, experience } = resumeData
  
  const sections: CoverLetterSection[] = []
  
  // Header
  sections.push({
    id: 'header',
    type: 'header',
    title: 'Header',
    content: `${personalInfo?.fullName || '[Your Name]'}\n${personalInfo?.email || '[Your Email]'}\n${personalInfo?.phone || '[Your Phone]'}\n\n[Date]\n\n[Hiring Manager's Name]\n${request.companyName || '[Company Name]'}\n[Company Address]`,
    editable: true
  })
  
  // Opening
  const openingContent = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${request.targetRole} position${request.companyName ? ` at ${request.companyName}` : ''}. With my background in ${experience?.[0]?.position || 'relevant experience'}, I am excited about the opportunity to contribute to your team.`
  
  sections.push({
    id: 'opening',
    type: 'opening',
    title: 'Opening',
    content: openingContent,
    editable: true
  })
  
  // Body
  let bodyContent = `In my previous role as ${experience?.[0]?.position || 'a professional'}`
  if (experience?.[0]?.company) {
    bodyContent += ` at ${experience[0].company}`
  }
  bodyContent += ', I developed skills that directly align with your requirements.'
  
  if (experience?.[0]?.achievements && experience[0].achievements.length > 0) {
    bodyContent += ` ${experience[0].achievements[0]}`
  }
  
  if (request.keywords && request.keywords.length > 0) {
    bodyContent += `\n\nI have experience with ${request.keywords.slice(0, 3).join(', ')}, which I believe will be valuable in this role.`
  }
  
  sections.push({
    id: 'body',
    type: 'body',
    title: 'Body',
    content: bodyContent,
    editable: true
  })
  
  // Closing
  const closingContent = `I am excited about the opportunity to bring my skills and enthusiasm to your team. I would welcome the chance to discuss how my experience can contribute to your organization's success. Thank you for your consideration.`
  
  sections.push({
    id: 'closing',
    type: 'closing',
    title: 'Closing',
    content: closingContent,
    editable: true
  })
  
  // Signature
  sections.push({
    id: 'signature',
    type: 'signature',
    title: 'Signature',
    content: `Sincerely,\n${personalInfo?.fullName || '[Your Name]'}`,
    editable: true
  })
  
  const plainText = sections.map(s => s.content).join('\n\n')
  const htmlContent = generateHTMLContent(sections, request.matchResumeTemplate)
  
  return {
    sections,
    plainText,
    htmlContent,
    tokenUsage: 0
  }
}

function generateHTMLContent(sections: CoverLetterSection[], matchTemplate: boolean = false): string {
  const styles = matchTemplate ? `
    <style>
      .cover-letter {
        font-family: 'Inter', sans-serif;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 1in;
        line-height: 1.6;
        color: #333;
      }
      .header {
        margin-bottom: 2rem;
      }
      .section {
        margin-bottom: 1.5rem;
      }
      .section-content {
        white-space: pre-line;
      }
    </style>
  ` : `
    <style>
      .cover-letter {
        font-family: 'Times New Roman', serif;
        max-width: 8.5in;
        margin: 0 auto;
        padding: 1in;
        line-height: 1.6;
        color: #000;
      }
      .section {
        margin-bottom: 1.5rem;
      }
      .section-content {
        white-space: pre-line;
      }
    </style>
  `
  
  let html = `<!DOCTYPE html><html><head>${styles}</head><body><div class="cover-letter">`
  
  sections.forEach(section => {
    html += `<div class="section ${section.type}"><div class="section-content">${section.content}</div></div>`
  })
  
  html += '</div></body></html>'
  
  return html
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

async function recordTelemetry(supabaseClient: any, telemetryData: any) {
  try {
    await supabaseClient
      .from('cover_letter_telemetry')
      .insert({
        user_id: telemetryData.userId,
        success: telemetryData.success,
        token_usage: telemetryData.tokenUsage,
        generation_time_ms: telemetryData.generationTimeMs,
        tone: telemetryData.tone,
        length: telemetryData.length,
        has_job_description: telemetryData.hasJobDescription,
        has_company_name: telemetryData.hasCompanyName,
        keyword_count: telemetryData.keywordCount,
        error_message: telemetryData.errorMessage
      })
  } catch (error) {
    console.error('Failed to record telemetry:', error)
  }
}

async function getUserCoverLetters(supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('cover_letters')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function getCoverLetter(coverLetterId: string, supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('cover_letters')
    .select('*')
    .eq('id', coverLetterId)
    .eq('user_id', user.id)
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function updateCoverLetter(coverLetterId: string, req: Request, supabaseClient: any, user: any) {
  const updateData = await req.json()
  
  // Calculate word count if content changed
  if (updateData.sections || updateData.plain_text) {
    const plainText = updateData.plain_text || updateData.sections?.map((s: any) => s.content).join('\n\n') || ''
    updateData.word_count = countWords(plainText)
  }

  const { data, error } = await supabaseClient
    .from('cover_letters')
    .update(updateData)
    .eq('id', coverLetterId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  // Create a new draft version
  if (updateData.sections) {
    const { data: latestDraft } = await supabaseClient
      .from('cover_letter_drafts')
      .select('edit_count')
      .eq('cover_letter_id', coverLetterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    await supabaseClient
      .from('cover_letter_drafts')
      .insert({
        cover_letter_id: coverLetterId,
        sections: updateData.sections,
        plain_text: updateData.plain_text || '',
        html_content: updateData.html_content || '',
        word_count: updateData.word_count || 0,
        edit_count: (latestDraft?.edit_count || 0) + 1
      })
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function deleteCoverLetter(coverLetterId: string, supabaseClient: any, user: any) {
  const { error } = await supabaseClient
    .from('cover_letters')
    .delete()
    .eq('id', coverLetterId)
    .eq('user_id', user.id)

  if (error) throw error

  return new Response(
    JSON.stringify({ message: 'Cover letter deleted successfully' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}
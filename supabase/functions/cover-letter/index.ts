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
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST': {
        if (action === 'generate') {
          return await generateCoverLetter(req, supabaseClient, user)
        }
        return await generateCoverLetter(req, supabaseClient, user)
      }
      case 'GET': {
        if (action === 'cover-letter') {
          return await getUserCoverLetters(supabaseClient, user)
        }
        return await getCoverLetter(action, supabaseClient, user)
      }
      case 'PUT': {
        return await updateCoverLetter(action, req, supabaseClient, user)
      }
      case 'DELETE': {
        return await deleteCoverLetter(action, supabaseClient, user)
      }
      default:
        throw new Error('Method not allowed')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function generateCoverLetter(req: Request, supabaseClient: any, user: any) {
  const startTime = Date.now()
  const telemetry: any = { userId: user.id, success: false, generationTimeMs: 0, tone: 'neutral', length: 'standard', hasJobDescription: false, hasCompanyName: false, keywordCount: 0 }

  try {
    const requestData: GenerateCoverLetterRequest = await req.json()

    if (!requestData.targetRole) throw new Error('Target role is required')

    telemetry.tone = requestData.tone
    telemetry.length = requestData.length
    telemetry.hasJobDescription = !!requestData.jobDescription
    telemetry.hasCompanyName = !!requestData.companyName
    telemetry.keywordCount = requestData.keywords?.length || 0

    let resumeData = requestData.resumeData
    if (!resumeData && requestData.resumeId) {
      const { data: resume, error: resumeError } = await supabaseClient
        .from('resumes')
        .select('*')
        .eq('id', requestData.resumeId)
        .eq('user_id', user.id)
        .single()

      if (resumeError || !resume) throw new Error('Resume not found or access denied')
      resumeData = resume.data
    }

    if (!resumeData) throw new Error('Resume data is required')

    const coverLetterContent = await generateWithClaude(requestData, resumeData)
    const wordCount = countWords(coverLetterContent.plainText)

    const { data: coverLetter, error: saveError } = await supabaseClient
      .from('cover_letters')
      .insert({
        user_id: user.id,
        resume_id: requestData.resumeId || null,
        target_role: requestData.targetRole,
        company_name: requestData.companyName || null,
        job_description: requestData.jobDescription || null,
        tone: requestData.tone,
        length: requestData.length,
        keywords: requestData.keywords || [],
        match_resume_template: requestData.matchResumeTemplate || false,
        sections: coverLetterContent.sections,
        plain_text: coverLetterContent.plainText,
        html_content: coverLetterContent.htmlContent,
        word_count: wordCount,
      })
      .select()
      .single()

    if (saveError) throw saveError

    telemetry.success = true
    telemetry.generationTimeMs = Date.now() - startTime
    await recordTelemetry(supabaseClient, telemetry)

    return new Response(
      JSON.stringify(coverLetter),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    telemetry.success = false
    telemetry.generationTimeMs = Date.now() - startTime
    telemetry.errorMessage = error.message
    await recordTelemetry(supabaseClient, telemetry)
    throw error
  }
}

async function generateWithClaude(request: GenerateCoverLetterRequest, resumeData: any) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return generateFallback(request, resumeData)
  }

  const { personalInfo, experience, skills } = resumeData

  const lengthGuide: Record<string, string> = {
    short: 'Keep it concise — 200-250 words maximum.',
    standard: 'Standard length — 300-400 words.',
    detailed: 'Detailed — 400-500 words with specific examples.',
  }

  const toneGuide: Record<string, string> = {
    formal: 'Write in a formal, traditional business style.',
    neutral: 'Write in a professional, balanced tone.',
    friendly: 'Write in a warm, personable tone while remaining professional.',
  }

  const prompt = `You are a professional cover letter writer. Write a cover letter for the following position.

Position: ${request.targetRole}${request.companyName ? ` at ${request.companyName}` : ''}
Tone: ${toneGuide[request.tone] || toneGuide.neutral}
Length: ${lengthGuide[request.length] || lengthGuide.standard}
${request.keywords?.length ? `Keywords to naturally include: ${request.keywords.join(', ')}` : ''}

Candidate information:
Name: ${personalInfo?.fullName || 'The candidate'}
${personalInfo?.summary ? `Summary: ${personalInfo.summary}` : ''}
${experience?.length ? `Most recent role: ${experience[0]?.position} at ${experience[0]?.company}` : ''}
${experience?.length > 1 ? `Previous role: ${experience[1]?.position} at ${experience[1]?.company}` : ''}
Key skills: ${(skills || []).slice(0, 8).map((s: any) => s.name).join(', ')}
${experience?.[0]?.achievements?.length ? `Key achievement: ${experience[0].achievements[0]}` : ''}
${request.jobDescription ? `\nJob description:\n${request.jobDescription.substring(0, 1000)}` : ''}

Rules:
- Only use facts provided — never invent information
- Write the letter body only (opening paragraph through closing paragraph)
- Do NOT include addresses, date, or "Sincerely, [name]" — just the letter body paragraphs
- Make it compelling and specific to the role
- Return ONLY the letter text, no explanation`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    console.error('Claude cover letter failed, using fallback')
    return generateFallback(request, resumeData)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text || ''

  if (!content) return generateFallback(request, resumeData)

  return buildStructuredResponse(content, request, resumeData)
}

function buildStructuredResponse(aiContent: string, request: GenerateCoverLetterRequest, resumeData: any) {
  const { personalInfo } = resumeData
  const paragraphs = aiContent.split('\n\n').filter(p => p.trim())

  const sections: CoverLetterSection[] = []

  sections.push({
    id: 'header',
    type: 'header',
    title: 'Header',
    content: `${personalInfo?.fullName || '[Your Name]'}\n${personalInfo?.email || '[Your Email]'}\n${personalInfo?.phone || '[Your Phone]'}\n\n[Date]\n\nHiring Manager\n${request.companyName || '[Company Name]'}`,
    editable: true,
  })

  if (paragraphs.length > 0) {
    sections.push({
      id: 'opening',
      type: 'opening',
      title: 'Opening',
      content: paragraphs[0],
      editable: true,
    })
  }

  if (paragraphs.length > 2) {
    sections.push({
      id: 'body',
      type: 'body',
      title: 'Body',
      content: paragraphs.slice(1, -1).join('\n\n'),
      editable: true,
    })
  }

  if (paragraphs.length > 1) {
    sections.push({
      id: 'closing',
      type: 'closing',
      title: 'Closing',
      content: paragraphs[paragraphs.length - 1],
      editable: true,
    })
  }

  sections.push({
    id: 'signature',
    type: 'signature',
    title: 'Signature',
    content: `Sincerely,\n${personalInfo?.fullName || '[Your Name]'}`,
    editable: true,
  })

  const plainText = sections.map(s => s.content).join('\n\n')
  const htmlContent = buildHTML(sections)

  return { sections, plainText, htmlContent }
}

function generateFallback(request: GenerateCoverLetterRequest, resumeData: any) {
  const { personalInfo, experience } = resumeData

  const sections: CoverLetterSection[] = [
    {
      id: 'header',
      type: 'header',
      title: 'Header',
      content: `${personalInfo?.fullName || '[Your Name]'}\n${personalInfo?.email || '[Your Email]'}\n${personalInfo?.phone || '[Your Phone]'}\n\n[Date]\n\nHiring Manager\n${request.companyName || '[Company Name]'}`,
      editable: true,
    },
    {
      id: 'opening',
      type: 'opening',
      title: 'Opening',
      content: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${request.targetRole} position${request.companyName ? ` at ${request.companyName}` : ''}. With my background in ${experience?.[0]?.position || 'the field'}, I am confident in my ability to contribute meaningfully to your team.`,
      editable: true,
    },
    {
      id: 'body',
      type: 'body',
      title: 'Body',
      content: `In my previous role as ${experience?.[0]?.position || 'a professional'}${experience?.[0]?.company ? ` at ${experience[0].company}` : ''}, I developed skills directly applicable to this position.${experience?.[0]?.achievements?.[0] ? ` ${experience[0].achievements[0]}` : ''}\n\nI am excited about the opportunity to bring my experience and dedication to your organization.`,
      editable: true,
    },
    {
      id: 'closing',
      type: 'closing',
      title: 'Closing',
      content: `Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience can contribute to your team's success.`,
      editable: true,
    },
    {
      id: 'signature',
      type: 'signature',
      title: 'Signature',
      content: `Sincerely,\n${personalInfo?.fullName || '[Your Name]'}`,
      editable: true,
    },
  ]

  const plainText = sections.map(s => s.content).join('\n\n')
  return { sections, plainText, htmlContent: buildHTML(sections), tokenUsage: 0 }
}

function buildHTML(sections: CoverLetterSection[]): string {
  const style = `<style>
    .cover-letter { font-family: 'Times New Roman', serif; max-width: 8.5in; margin: 0 auto; padding: 1in; line-height: 1.6; color: #000; }
    .section { margin-bottom: 1.5rem; }
    .section-content { white-space: pre-line; }
  </style>`

  let html = `<!DOCTYPE html><html><head>${style}</head><body><div class="cover-letter">`
  sections.forEach(s => {
    html += `<div class="section ${s.type}"><div class="section-content">${s.content}</div></div>`
  })
  html += '</div></body></html>'
  return html
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

async function recordTelemetry(supabaseClient: any, data: any) {
  try {
    await supabaseClient.from('cover_letter_telemetry').insert({
      user_id: data.userId,
      success: data.success,
      token_usage: data.tokenUsage || null,
      generation_time_ms: data.generationTimeMs,
      tone: data.tone,
      length: data.length,
      has_job_description: data.hasJobDescription,
      has_company_name: data.hasCompanyName,
      keyword_count: data.keywordCount,
      error_message: data.errorMessage || null,
    })
  } catch (e) {
    console.error('Telemetry error:', e)
  }
}

async function getUserCoverLetters(supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('cover_letters')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
}

async function getCoverLetter(id: string, supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('cover_letters')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
}

async function updateCoverLetter(id: string, req: Request, supabaseClient: any, user: any) {
  const updateData = await req.json()

  if (updateData.sections || updateData.plain_text) {
    const text = updateData.plain_text || updateData.sections?.map((s: any) => s.content).join('\n\n') || ''
    updateData.word_count = countWords(text)
  }

  const { data, error } = await supabaseClient
    .from('cover_letters')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
}

async function deleteCoverLetter(id: string, supabaseClient: any, user: any) {
  const { error } = await supabaseClient
    .from('cover_letters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  return new Response(
    JSON.stringify({ message: 'Cover letter deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}

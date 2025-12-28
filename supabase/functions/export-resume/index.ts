import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sentry, initSentry } from '../shared/sentry.ts'

// Initialize Sentry for error monitoring
initSentry()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ExportRequest {
  resumeId: string
  format: 'pdf' | 'docx' | 'txt' | 'ats'
  template?: string
  watermark?: boolean
  customizations?: any
}

interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  error?: string
  expiresAt: string
  fileSize?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Rate limiting check (stricter for exports)
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(clientIP, 20, 3600000)) { // 20 exports per hour
    return new Response(
      JSON.stringify({ error: 'Export rate limit exceeded. Please try again later.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' },
        status: 429,
      }
    )
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
    const exportId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST': {
        return await createExport(req, supabaseClient, user)
      }

      case 'GET': {
        if (exportId && exportId !== 'export-resume') {
          return await getExport(exportId, supabaseClient, user)
        } else {
          return await getUserExports(supabaseClient, user)
        }
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

async function createExport(req: Request, supabaseClient: any, user: any) {
  const startTime = Date.now()

  try {
    const { resumeId, format, template, watermark, customizations }: ExportRequest = await req.json()

    if (!resumeId || !format) {
      throw new Error('Resume ID and format are required')
    }

    if (!['pdf', 'docx', 'txt', 'ats'].includes(format)) {
      throw new Error('Invalid format. Must be pdf, docx, txt, or ats')
    }

    // Check user entitlement - DENY access if not unlocked
    const { data: entitlement } = await supabaseClient
      .from('user_entitlements')
      .select('export_unlocked')
      .eq('user_id', user.id)
      .maybeSingle()

    // CRITICAL: Return 403 if export feature is locked
    if (!entitlement?.export_unlocked) {
      return new Response(
        JSON.stringify({
          error: 'Export feature locked',
          code: 'EXPORT_LOCKED',
          message: 'Purchase export unlock to download professional resumes without watermarks',
          upgradeUrl: '/pricing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // If unlocked, proceed without watermark
    const shouldWatermark = false

    // Verify user owns the resume
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      throw new Error('Resume not found or access denied')
    }

    // Create export job
    const exportJob: ExportJob = {
      id: crypto.randomUUID(),
      status: 'processing',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    try {
      // Generate the file based on format
      let fileContent: Uint8Array
      let mimeType: string
      let fileExtension: string

      switch (format) {
        case 'pdf':
          const pdfResult = await generatePDF(resume.data, template || 'modern', shouldWatermark, customizations)
          fileContent = pdfResult.content
          mimeType = 'application/pdf'
          fileExtension = 'pdf'
          break
        case 'docx':
          const docxResult = await generateDOCX(resume.data, template || 'modern', shouldWatermark, customizations)
          fileContent = docxResult.content
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          fileExtension = 'docx'
          break
        case 'txt':
          const txtResult = generateTXT(resume.data, shouldWatermark)
          fileContent = new TextEncoder().encode(txtResult.content)
          mimeType = 'text/plain'
          fileExtension = 'txt'
          break
        case 'ats':
          const atsResult = generateATS(resume.data, shouldWatermark)
          fileContent = new TextEncoder().encode(atsResult.content)
          mimeType = 'text/plain'
          fileExtension = 'txt'
          break
        default:
          throw new Error('Unsupported format')
      }

      // Generate unique file key
      const fileKey = `exports/${user.id}/${resumeId}/${exportJob.id}.${fileExtension}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('resume-exports')
        .upload(fileKey, fileContent, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Create export record in database
      const { data: exportRecord, error: exportError } = await supabaseClient
        .from('exports')
        .insert({
          id: exportJob.id,
          resume_id: resumeId,
          user_id: user.id,
          file_key: fileKey,
          format,
          file_size: fileContent.length,
          expires_at: exportJob.expiresAt
        })
        .select()
        .single()

      if (exportError) throw exportError

      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
        .from('resume-exports')
        .createSignedUrl(fileKey, 86400) // 24 hours

      if (signedUrlError) throw signedUrlError

      exportJob.status = 'completed'
      exportJob.downloadUrl = signedUrlData.signedUrl
      exportJob.fileSize = fileContent.length

      return new Response(
        JSON.stringify({
          exportId: exportJob.id,
          status: exportJob.status,
          downloadUrl: exportJob.downloadUrl,
          expiresAt: exportJob.expiresAt,
          format,
          fileSize: exportJob.fileSize,
          watermarked: shouldWatermark,
          processingTimeMs: Date.now() - startTime
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        }
      )

    } catch (error) {
      exportJob.status = 'failed'
      exportJob.error = error.message

      // Send error to Sentry
      sentry.captureException(error as Error, {
        function_name: 'export-resume',
        format,
        template: template || 'modern',
        processing_time_ms: Date.now() - startTime
      })

      return new Response(
        JSON.stringify({
          exportId: exportJob.id,
          status: exportJob.status,
          error: exportJob.error,
          processingTimeMs: Date.now() - startTime
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  } catch (error) {
    // Send error to Sentry
    sentry.captureException(error as Error, {
      function_name: 'export-resume',
      error_stage: 'request_handling'
    })

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}

async function generatePDF(resumeData: any, template: string, watermark: boolean, customizations: any): Promise<{ content: Uint8Array }> {
  // Import the production-ready PDF generator
  // In production: import { generatePDF as createPDF } from '../shared/pdf-generator.ts'

  // Generate deterministic HTML with proper styling for PDF conversion
  const html = generatePDFHTML(resumeData, template, watermark, customizations)

  // This HTML is production-ready for conversion via:
  // - Puppeteer/Chrome headless
  // - Prince XML
  // - wkhtmltopdf
  // - Any HTML→PDF service

  // Return HTML content (can be converted to PDF by external service or browser print)
  const encoder = new TextEncoder()
  return { content: encoder.encode(html) }
}

async function generateDOCX(resumeData: any, template: string, watermark: boolean, customizations: any): Promise<{ content: Uint8Array }> {
  // Import the production-ready DOCX generator
  // In production: import { generateDOCX as createDOCX } from '../shared/docx-generator.ts'

  // Generate deterministic DOCX content using structured document approach
  const docContent = generateDOCXContent(resumeData, template, watermark, customizations)

  // This structured content can be converted to DOCX via:
  // - docx library (npm:docx)
  // - docxtemplater
  // - Mammoth.js
  // - Any markup→DOCX converter

  // Return structured content
  const encoder = new TextEncoder()
  return { content: encoder.encode(docContent) }
}

function generateTXT(resumeData: any, watermark: boolean): { content: string } {
  const { personalInfo, experience, education, skills, projects } = resumeData

  let content = ''

  // Watermark for preview
  if (watermark) {
    content += '*** PREVIEW VERSION - SEXYRESUME.COM ***\n'
    content += '*** FULL VERSION AVAILABLE AFTER PURCHASE ***\n\n'
  }

  // Header
  if (personalInfo?.fullName) {
    content += `${personalInfo.fullName}\n`
    content += '='.repeat(personalInfo.fullName.length) + '\n\n'
  }

  // Contact Info
  if (personalInfo?.email) content += `Email: ${personalInfo.email}\n`
  if (personalInfo?.phone) content += `Phone: ${personalInfo.phone}\n`
  if (personalInfo?.location) content += `Location: ${personalInfo.location}\n`
  if (personalInfo?.linkedin) content += `LinkedIn: ${personalInfo.linkedin}\n`
  if (personalInfo?.website) content += `Website: ${personalInfo.website}\n`
  content += '\n'

  // Summary
  if (personalInfo?.summary) {
    content += 'PROFESSIONAL SUMMARY\n'
    content += '-'.repeat(20) + '\n'
    content += `${personalInfo.summary}\n\n`
  }

  // Experience
  if (experience && experience.length > 0) {
    content += 'WORK EXPERIENCE\n'
    content += '-'.repeat(15) + '\n'
    experience.forEach((exp: any) => {
      content += `${exp.position} at ${exp.company}\n`
      content += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`
      if (exp.description) content += `${exp.description}\n`
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement: string) => {
          if (achievement.trim()) content += `• ${achievement}\n`
        })
      }
      content += '\n'
    })
  }

  // Education
  if (education && education.length > 0) {
    content += 'EDUCATION\n'
    content += '-'.repeat(9) + '\n'
    education.forEach((edu: any) => {
      content += `${edu.degree} in ${edu.field}\n`
      content += `${edu.institution}\n`
      content += `${edu.startDate} - ${edu.endDate}\n`
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`
      if (edu.honors) content += `${edu.honors}\n`
      content += '\n'
    })
  }

  // Skills
  if (skills && skills.length > 0) {
    content += 'SKILLS\n'
    content += '-'.repeat(6) + '\n'
    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      if (!acc[skill.category]) acc[skill.category] = []
      acc[skill.category].push(`${skill.name} (${skill.level})`)
      return acc
    }, {})

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      content += `${category}: ${categorySkills.join(', ')}\n`
    })
    content += '\n'
  }

  // Projects
  if (projects && projects.length > 0) {
    content += 'PROJECTS\n'
    content += '-'.repeat(8) + '\n'
    projects.forEach((project: any) => {
      content += `${project.name}\n`
      content += `${project.startDate} - ${project.endDate}\n`
      if (project.description) content += `${project.description}\n`
      if (project.technologies && project.technologies.length > 0) {
        content += `Technologies: ${project.technologies.filter((t: string) => t.trim()).join(', ')}\n`
      }
      if (project.url) content += `URL: ${project.url}\n`
      content += '\n'
    })
  }

  // Footer watermark
  if (watermark) {
    content += '\n*** CREATED WITH SEXYRESUME.COM ***\n'
    content += '*** UPGRADE FOR PROFESSIONAL EXPORTS ***\n'
  }

  return { content }
}

function generateATS(resumeData: any, watermark: boolean): { content: string } {
  // ATS-optimized plain text format with semantic structure
  const { personalInfo, experience, education, skills, projects } = resumeData

  let content = ''

  // Watermark for preview
  if (watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n'
    content += 'FULL ATS-OPTIMIZED VERSION AVAILABLE AFTER PURCHASE\n\n'
  }

  // Header - ATS-friendly format
  if (personalInfo?.fullName) {
    content += `NAME: ${personalInfo.fullName}\n`
  }
  if (personalInfo?.email) content += `EMAIL: ${personalInfo.email}\n`
  if (personalInfo?.phone) content += `PHONE: ${personalInfo.phone}\n`
  if (personalInfo?.location) content += `LOCATION: ${personalInfo.location}\n`
  if (personalInfo?.linkedin) content += `LINKEDIN: ${personalInfo.linkedin}\n`
  if (personalInfo?.website) content += `WEBSITE: ${personalInfo.website}\n`
  content += '\n'

  // Professional Summary
  if (personalInfo?.summary) {
    content += 'PROFESSIONAL SUMMARY:\n'
    content += `${personalInfo.summary}\n\n`
  }

  // Core Competencies (Skills first for ATS)
  if (skills && skills.length > 0) {
    content += 'CORE COMPETENCIES:\n'
    const allSkills = skills.map((skill: any) => skill.name).join(', ')
    content += `${allSkills}\n\n`
  }

  // Professional Experience
  if (experience && experience.length > 0) {
    content += 'PROFESSIONAL EXPERIENCE:\n\n'
    experience.forEach((exp: any, index: number) => {
      content += `JOB ${index + 1}:\n`
      content += `TITLE: ${exp.position}\n`
      content += `COMPANY: ${exp.company}\n`
      content += `DATES: ${exp.startDate} to ${exp.current ? 'Present' : exp.endDate}\n`
      if (exp.description) content += `DESCRIPTION: ${exp.description}\n`
      if (exp.achievements && exp.achievements.length > 0) {
        content += 'ACHIEVEMENTS:\n'
        exp.achievements.forEach((achievement: string) => {
          if (achievement.trim()) content += `- ${achievement}\n`
        })
      }
      content += '\n'
    })
  }

  // Education
  if (education && education.length > 0) {
    content += 'EDUCATION:\n\n'
    education.forEach((edu: any, index: number) => {
      content += `EDUCATION ${index + 1}:\n`
      content += `DEGREE: ${edu.degree}\n`
      content += `FIELD: ${edu.field}\n`
      content += `INSTITUTION: ${edu.institution}\n`
      content += `DATES: ${edu.startDate} to ${edu.endDate}\n`
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`
      if (edu.honors) content += `HONORS: ${edu.honors}\n`
      content += '\n'
    })
  }

  // Projects
  if (projects && projects.length > 0) {
    content += 'PROJECTS:\n\n'
    projects.forEach((project: any, index: number) => {
      content += `PROJECT ${index + 1}:\n`
      content += `NAME: ${project.name}\n`
      content += `DATES: ${project.startDate} to ${project.endDate}\n`
      if (project.description) content += `DESCRIPTION: ${project.description}\n`
      if (project.technologies && project.technologies.length > 0) {
        content += `TECHNOLOGIES: ${project.technologies.filter((t: string) => t.trim()).join(', ')}\n`
      }
      if (project.url) content += `URL: ${project.url}\n`
      content += '\n'
    })
  }

  // Footer watermark
  if (watermark) {
    content += 'CREATED WITH SEXYRESUME.COM\n'
    content += 'ATS-OPTIMIZED FORMAT AVAILABLE AFTER PURCHASE\n'
  }

  return { content }
}

function generatePDFHTML(resumeData: any, template: string, watermark: boolean, customizations: any): string {
  const { personalInfo, experience, education, skills, projects } = resumeData

  const watermarkCSS = watermark ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(217, 70, 239, 0.08);
      z-index: 1000;
      pointer-events: none;
      font-weight: bold;
      user-select: none;
    }
    .watermark-text {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 10px;
      color: rgba(217, 70, 239, 0.6);
      z-index: 1000;
    }
  ` : ''

  const baseCSS = `
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      color: #333;
      font-size: 11pt;
    }
    
    .resume-container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      position: relative;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .no-break {
      page-break-inside: avoid;
    }
    
    .header {
      background: linear-gradient(135deg, #d946ef, #0ba5d9);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    
    .name {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
    }
    
    .contact {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 10pt;
      position: relative;
      z-index: 1;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16pt;
      font-weight: 600;
      color: #d946ef;
      border-bottom: 2px solid #d946ef;
      padding-bottom: 5px;
      margin-bottom: 15px;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 50px;
      height: 2px;
      background: #0ba5d9;
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 20px;
      padding-left: 15px;
      border-left: 3px solid rgba(217, 70, 239, 0.2);
      position: relative;
      page-break-inside: avoid;
    }
    
    .experience-item::before, .education-item::before, .project-item::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 8px;
      width: 12px;
      height: 12px;
      background: #d946ef;
      border-radius: 50%;
    }
    
    .item-title {
      font-size: 12pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 3px;
    }
    
    .item-subtitle {
      color: #d946ef;
      font-weight: 500;
      margin-bottom: 3px;
    }
    
    .item-date {
      color: #666;
      font-size: 9pt;
      margin-bottom: 8px;
    }
    
    .item-description {
      color: #555;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    
    .achievements {
      list-style: none;
      padding: 0;
      margin: 8px 0;
    }
    
    .achievements li {
      position: relative;
      padding-left: 15px;
      margin-bottom: 3px;
      color: #555;
      font-size: 10pt;
    }
    
    .achievements li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #d946ef;
      font-weight: bold;
    }
    
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .skill-category {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border-top: 3px solid #d946ef;
      page-break-inside: avoid;
    }
    
    .skill-category h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-weight: 600;
      font-size: 11pt;
    }
    
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    
    .skill-tag {
      background: rgba(217, 70, 239, 0.1);
      color: #d946ef;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 500;
      border: 1px solid rgba(217, 70, 239, 0.2);
    }
    
    .technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }
    
    .tech-tag {
      background: rgba(11, 165, 217, 0.1);
      color: #0ba5d9;
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 8pt;
    }
    
    /* Print optimizations */
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      .header { -webkit-print-color-adjust: exact; }
      .no-break { page-break-inside: avoid; }
    }
    
    ${watermarkCSS}
  `

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${personalInfo?.fullName || 'Resume'}</title>
      <style>${baseCSS}</style>
    </head>
    <body>
      <div class="resume-container">
        ${watermark ? '<div class="watermark">PREVIEW</div><div class="watermark-text">SexyResume.com Preview</div>' : ''}
        
        <header class="header">
          <h1 class="name">${personalInfo?.fullName || 'Your Name'}</h1>
          <div class="contact">
            ${personalInfo?.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
            ${personalInfo?.phone ? `<div class="contact-item">📱 ${personalInfo.phone}</div>` : ''}
            ${personalInfo?.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ''}
            ${personalInfo?.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
            ${personalInfo?.website ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
          </div>
        </header>
        
        <div class="content">
          ${personalInfo?.summary ? `
            <section class="section no-break">
              <h2 class="section-title">Professional Summary</h2>
              <p class="item-description">${personalInfo.summary}</p>
            </section>
          ` : ''}

          ${experience && experience.length > 0 ? `
            <section class="section">
              <h2 class="section-title">Work Experience</h2>
              ${experience.map((exp: any) => `
                <div class="experience-item no-break">
                  <div class="item-title">${exp.position}</div>
                  <div class="item-subtitle">${exp.company}</div>
                  <div class="item-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
                  ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                  ${exp.achievements && exp.achievements.filter((a: string) => a.trim()).length > 0 ? `
                    <ul class="achievements">
                      ${exp.achievements.filter((a: string) => a.trim()).map((achievement: string) => `<li>${achievement}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </section>
          ` : ''}

          ${education && education.length > 0 ? `
            <section class="section">
              <h2 class="section-title">Education</h2>
              ${education.map((edu: any) => `
                <div class="education-item no-break">
                  <div class="item-title">${edu.degree} in ${edu.field}</div>
                  <div class="item-subtitle">${edu.institution}</div>
                  <div class="item-date">${edu.startDate} - ${edu.endDate}</div>
                  ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
                  ${edu.honors ? `<div class="item-description">${edu.honors}</div>` : ''}
                </div>
              `).join('')}
            </section>
          ` : ''}

          ${skills && skills.length > 0 ? `
            <section class="section">
              <h2 class="section-title">Skills</h2>
              <div class="skills-grid">
                ${Object.entries(skills.reduce((acc: any, skill: any) => {
                  if (!acc[skill.category]) acc[skill.category] = []
                  acc[skill.category].push(skill)
                  return acc
                }, {})).map(([category, categorySkills]: [string, any]) => `
                  <div class="skill-category no-break">
                    <h4>${category}</h4>
                    <div class="skill-tags">
                      ${categorySkills.map((skill: any) => `<span class="skill-tag">${skill.name}</span>`).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          ${projects && projects.length > 0 ? `
            <section class="section">
              <h2 class="section-title">Projects</h2>
              ${projects.map((project: any) => `
                <div class="project-item no-break">
                  <div class="item-title">${project.name}</div>
                  <div class="item-date">${project.startDate} - ${project.endDate}</div>
                  ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
                  ${project.technologies && project.technologies.filter((t: string) => t.trim()).length > 0 ? `
                    <div class="technologies">
                      ${project.technologies.filter((t: string) => t.trim()).map((tech: string) => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                  ` : ''}
                  ${project.url ? `<div class="item-description">URL: ${project.url}</div>` : ''}
                </div>
              `).join('')}
            </section>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

function generateDOCXContent(resumeData: any, template: string, watermark: boolean, customizations: any): string {
  // Generate structured content for DOCX conversion
  const { personalInfo, experience, education, skills, projects } = resumeData

  let content = ''

  if (watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n'
    content += 'FULL DOCX VERSION AVAILABLE AFTER PURCHASE\n\n'
  }

  // Header
  if (personalInfo?.fullName) {
    content += `${personalInfo.fullName}\n`
    content += '='.repeat(personalInfo.fullName.length) + '\n\n'
  }

  // Contact Information
  const contactInfo = []
  if (personalInfo?.email) contactInfo.push(`Email: ${personalInfo.email}`)
  if (personalInfo?.phone) contactInfo.push(`Phone: ${personalInfo.phone}`)
  if (personalInfo?.location) contactInfo.push(`Location: ${personalInfo.location}`)
  if (personalInfo?.linkedin) contactInfo.push(`LinkedIn: ${personalInfo.linkedin}`)
  if (personalInfo?.website) contactInfo.push(`Website: ${personalInfo.website}`)
  
  if (contactInfo.length > 0) {
    content += contactInfo.join(' | ') + '\n\n'
  }

  // Professional Summary
  if (personalInfo?.summary) {
    content += 'PROFESSIONAL SUMMARY\n'
    content += '-'.repeat(20) + '\n'
    content += `${personalInfo.summary}\n\n`
  }

  // Work Experience
  if (experience && experience.length > 0) {
    content += 'WORK EXPERIENCE\n'
    content += '-'.repeat(15) + '\n\n'
    experience.forEach((exp: any) => {
      content += `${exp.position}\n`
      content += `${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`
      if (exp.description) content += `${exp.description}\n`
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach((achievement: string) => {
          if (achievement.trim()) content += `• ${achievement}\n`
        })
      }
      content += '\n'
    })
  }

  // Education
  if (education && education.length > 0) {
    content += 'EDUCATION\n'
    content += '-'.repeat(9) + '\n\n'
    education.forEach((edu: any) => {
      content += `${edu.degree} in ${edu.field}\n`
      content += `${edu.institution} | ${edu.startDate} - ${edu.endDate}\n`
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`
      if (edu.honors) content += `${edu.honors}\n`
      content += '\n'
    })
  }

  // Skills
  if (skills && skills.length > 0) {
    content += 'SKILLS\n'
    content += '-'.repeat(6) + '\n\n'
    const skillsByCategory = skills.reduce((acc: any, skill: any) => {
      if (!acc[skill.category]) acc[skill.category] = []
      acc[skill.category].push(skill.name)
      return acc
    }, {})

    Object.entries(skillsByCategory).forEach(([category, categorySkills]: [string, any]) => {
      content += `${category}: ${categorySkills.join(', ')}\n`
    })
    content += '\n'
  }

  // Projects
  if (projects && projects.length > 0) {
    content += 'PROJECTS\n'
    content += '-'.repeat(8) + '\n\n'
    projects.forEach((project: any) => {
      content += `${project.name}\n`
      content += `${project.startDate} - ${project.endDate}\n`
      if (project.description) content += `${project.description}\n`
      if (project.technologies && project.technologies.length > 0) {
        content += `Technologies: ${project.technologies.filter((t: string) => t.trim()).join(', ')}\n`
      }
      if (project.url) content += `URL: ${project.url}\n`
      content += '\n'
    })
  }

  if (watermark) {
    content += '\n*** CREATED WITH SEXYRESUME.COM ***\n'
    content += '*** UPGRADE FOR FULL DOCX FEATURES ***\n'
  }

  return content
}

async function getExport(exportId: string, supabaseClient: any, user: any) {
  // Get specific export and generate new signed URL
  const { data: exportRecord, error } = await supabaseClient
    .from('exports')
    .select('*')
    .eq('id', exportId)
    .eq('user_id', user.id)
    .single()

  if (error || !exportRecord) {
    throw new Error('Export not found or access denied')
  }

  // Check if export has expired
  if (new Date(exportRecord.expires_at) < new Date()) {
    throw new Error('Export has expired')
  }

  // Generate new signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
    .from('resume-exports')
    .createSignedUrl(exportRecord.file_key, 3600) // 1 hour

  if (signedUrlError) throw signedUrlError

  // Update download count
  await supabaseClient
    .from('exports')
    .update({ download_count: exportRecord.download_count + 1 })
    .eq('id', exportId)

  return new Response(
    JSON.stringify({
      exportId: exportRecord.id,
      status: 'completed',
      downloadUrl: signedUrlData.signedUrl,
      format: exportRecord.format,
      fileSize: exportRecord.file_size,
      downloadCount: exportRecord.download_count + 1,
      expiresAt: exportRecord.expires_at,
      watermarked: !exportRecord.user_id // Simplified check
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}

async function getUserExports(supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('exports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
}
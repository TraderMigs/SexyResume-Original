import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ExportRequest {
  resumeId: string
  format: 'pdf' | 'docx' | 'txt'
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
    const exportId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'POST': {
        const { resumeId, format }: ExportRequest = await req.json()

        if (!resumeId || !format) {
          throw new Error('Resume ID and format are required')
        }

        if (!['pdf', 'docx', 'txt'].includes(format)) {
          throw new Error('Invalid format. Must be pdf, docx, or txt')
        }

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

        // Generate file content based on format
        let fileContent: string
        let mimeType: string
        let fileExtension: string

        switch (format) {
          case 'txt':
            fileContent = generateTextResume(resume.data)
            mimeType = 'text/plain'
            fileExtension = 'txt'
            break
          case 'pdf':
            // In a real implementation, you'd use a PDF generation library
            fileContent = generateTextResume(resume.data) // Placeholder
            mimeType = 'application/pdf'
            fileExtension = 'pdf'
            break
          case 'docx':
            // In a real implementation, you'd use a DOCX generation library
            fileContent = generateTextResume(resume.data) // Placeholder
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            fileExtension = 'docx'
            break
        }

        // Generate unique file key
        const fileKey = `exports/${user.id}/${resumeId}/${Date.now()}.${fileExtension}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('resume-exports')
          .upload(fileKey, new Blob([fileContent], { type: mimeType }), {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Create export record
        const { data: exportRecord, error: exportError } = await supabaseClient
          .from('exports')
          .insert({
            resume_id: resumeId,
            user_id: user.id,
            file_key: fileKey,
            format,
            file_size: fileContent.length
          })
          .select()
          .single()

        if (exportError) throw exportError

        // Generate signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
          .from('resume-exports')
          .createSignedUrl(fileKey, 86400) // 24 hours

        if (signedUrlError) throw signedUrlError

        return new Response(
          JSON.stringify({
            exportId: exportRecord.id,
            downloadUrl: signedUrlData.signedUrl,
            expiresAt: exportRecord.expires_at,
            format,
            fileSize: exportRecord.file_size
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        )
      }

      case 'GET': {
        if (!exportId || exportId === 'exports') {
          // Get user's export history
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
        } else {
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
              downloadUrl: signedUrlData.signedUrl,
              format: exportRecord.format,
              fileSize: exportRecord.file_size,
              downloadCount: exportRecord.download_count + 1
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
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

function generateTextResume(resumeData: any): string {
  const { personalInfo, experience, education, skills } = resumeData

  let content = ''

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
  }

  return content
}
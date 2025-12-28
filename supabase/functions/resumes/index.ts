import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
}

interface ResumeRequest {
  title?: string
  data: any
  template?: string
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
    const resumeId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'GET': {
        if (resumeId && resumeId !== 'resumes') {
          // Get specific resume
          const { data, error } = await supabaseClient
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
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
        } else {
          // Get all user's resumes
          const { data, error } = await supabaseClient
            .from('resumes')
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
      }

      case 'POST': {
        const { title, data, template }: ResumeRequest = await req.json()

        if (!data) {
          throw new Error('Resume data is required')
        }

        const { data: resume, error } = await supabaseClient
          .from('resumes')
          .insert({
            user_id: user.id,
            title: title || 'My Resume',
            data,
            template: template || 'modern'
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify(resume),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        )
      }

      case 'PUT': {
        if (!resumeId || resumeId === 'resumes') {
          throw new Error('Resume ID is required for updates')
        }

        const { title, data, template }: ResumeRequest = await req.json()

        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (data !== undefined) updateData.data = data
        if (template !== undefined) updateData.template = template

        // Validate data if provided
        if (data !== undefined) {
          const validation = validateResumeData(data)
          if (!validation.isValid) {
            throw new Error(validation.error!)
          }
        }

        const { data: resume, error } = await supabaseClient
          .from('resumes')
          .update(updateData)
          .eq('id', resumeId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify(resume),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'DELETE': {
        if (!resumeId || resumeId === 'resumes') {
          throw new Error('Resume ID is required for deletion')
        }

        const { error } = await supabaseClient
          .from('resumes')
          .delete()
          .eq('id', resumeId)
          .eq('user_id', user.id)

        if (error) throw error

        return new Response(
          JSON.stringify({ message: 'Resume deleted successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
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
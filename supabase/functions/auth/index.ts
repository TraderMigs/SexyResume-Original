import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface SignUpRequest {
  email: string
  password: string
  fullName: string
}

interface SignInRequest {
  email: string
  password: string
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

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'signup': {
        if (req.method !== 'POST') {
          throw new Error('Method not allowed')
        }

        const { email, password, fullName }: SignUpRequest = await req.json()

        if (!email || !password || !fullName) {
          throw new Error('Email, password, and full name are required')
        }

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            user: data.user,
            session: data.session,
            message: 'User created successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        )
      }

      case 'signin': {
        if (req.method !== 'POST') {
          throw new Error('Method not allowed')
        }

        const { email, password }: SignInRequest = await req.json()

        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        // Additional rate limiting for failed login attempts
        const loginKey = `login:${email}`
        if (!checkRateLimit(loginKey, 5, 300000)) { // 5 attempts per 5 minutes per email
          throw new Error('Too many login attempts. Please try again in 5 minutes.')
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        return new Response(
          JSON.stringify({
            user: data.user,
            session: data.session,
            message: 'Signed in successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'signout': {
        if (req.method !== 'POST') {
          throw new Error('Method not allowed')
        }

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('No authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const { error } = await supabaseClient.auth.signOut(token)

        if (error) throw error

        return new Response(
          JSON.stringify({ message: 'Signed out successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'me': {
        if (req.method !== 'GET') {
          throw new Error('Method not allowed')
        }

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('No authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error } = await supabaseClient.auth.getUser(token)

        if (error) throw error

        // Get user profile
        const { data: profile, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        return new Response(
          JSON.stringify({ user, profile }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      default:
        throw new Error('Not found')
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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') throw new Error('Method not allowed')

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

    const body = await req.json()
    const { resumeData, targetRole, targetIndustry, tonePreset = 'professional' } = body

    if (!resumeData) throw new Error('Resume data is required')

    const enhanced = await enhanceWithClaude(resumeData, targetRole, targetIndustry, tonePreset)

    return new Response(
      JSON.stringify({ enhanced, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('AI enhance error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function enhanceWithClaude(resumeData: any, targetRole: string, targetIndustry: string, tonePreset: string) {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) throw new Error('Anthropic API key not configured')

  const toneInstructions: Record<string, string> = {
    executive: 'Use authoritative, strategic language. Emphasize leadership impact and high-level achievements. Use strong action verbs and quantifiable outcomes.',
    professional: 'Use confident, professional language. Focus on results and contributions. Clear and impactful phrasing.',
    creative: 'Use expressive, dynamic language. Highlight creativity and innovative thinking. Show personality while remaining professional.',
    technical: 'Use precise, technical language. Emphasize technical skills, methodologies, and measurable outcomes.',
    entry_level: 'Use enthusiastic, positive language. Highlight potential, transferable skills, and eagerness to learn.',
  }

  const tone = toneInstructions[tonePreset] || toneInstructions.professional

  const { personalInfo, experience, skills } = resumeData

  const prompt = `You are a professional resume writer. Enhance the following resume content to be more compelling and impactful.

Tone guidance: ${tone}
${targetRole ? `Target role: ${targetRole}` : ''}
${targetIndustry ? `Target industry: ${targetIndustry}` : ''}

Return a JSON object with EXACTLY this structure — only include sections that exist in the original data:
{
  "personalInfo": {
    "summary": "enhanced professional summary (2-4 sentences, powerful and targeted)"
  },
  "experience": [
    {
      "id": "same id as original",
      "description": "enhanced role description",
      "achievements": ["enhanced bullet 1", "enhanced bullet 2", ...]
    }
  ],
  "skills": [
    {
      "id": "same id as original",
      "name": "skill name unchanged",
      "level": "same level as original",
      "category": "same category as original"
    }
  ]
}

Rules:
- Only use facts from the original data — never invent information
- Make descriptions more impactful with stronger action verbs
- Quantify achievements where the original data has numbers
- Keep all IDs the same as the originals
- Return ONLY the JSON object, no explanation, no markdown fences

Original resume data:
Name: ${personalInfo?.fullName || ''}
Current summary: ${personalInfo?.summary || 'None provided'}

Experience:
${(experience || []).slice(0, 5).map((e: any) => `
ID: ${e.id}
Role: ${e.position} at ${e.company}
Description: ${e.description || ''}
Achievements: ${(e.achievements || []).join(' | ')}
`).join('\n')}

Skills: ${(skills || []).map((s: any) => `${s.name} (${s.level})`).join(', ')}`

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
    return JSON.parse(clean)
  } catch {
    throw new Error('Failed to parse AI enhancement response.')
  }
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { code } = await req.json();
    if (!code || typeof code !== 'string') throw new Error('Code is required');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const normalizedCode = code.trim().toUpperCase();

    // Look up promo code
    const { data: promoCode, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .filter('code', 'ilike', normalizedCode)
      .maybeSingle();

    if (codeError) throw new Error('Failed to look up code');
    if (!promoCode) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Check expiry
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'This code has expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Check total uses
    if (promoCode.max_uses_total !== null && promoCode.times_used >= promoCode.max_uses_total) {
      return new Response(JSON.stringify({ success: false, error: 'This code has reached its usage limit' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Check per-email uses
    const { count: emailCount } = await supabase
      .from('promo_code_uses')
      .select('id', { count: 'exact', head: true })
      .eq('promo_code_id', promoCode.id)
      .eq('email', user.email!);

    if ((emailCount ?? 0) >= promoCode.max_uses_per_email) {
      return new Response(JSON.stringify({ success: false, error: 'You have already used this code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // Check per-IP uses
    if (ip !== 'unknown') {
      const { count: ipCount } = await supabase
        .from('promo_code_uses')
        .select('id', { count: 'exact', head: true })
        .eq('promo_code_id', promoCode.id)
        .eq('ip_address', ip);

      if ((ipCount ?? 0) >= promoCode.max_uses_per_ip) {
        return new Response(JSON.stringify({ success: false, error: 'This code has already been used from your network' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
    }

    // All checks passed — unlock export
    const { error: entitlementError } = await supabase
      .from('user_entitlements')
      .upsert({
        user_id: user.id,
        export_unlocked: true,
        export_unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (entitlementError) throw new Error('Failed to unlock access');

    // Record usage
    await supabase.from('promo_code_uses').insert({
      promo_code_id: promoCode.id,
      user_id: user.id,
      email: user.email!,
      ip_address: ip,
    });

    // Increment times_used
    await supabase
      .from('promo_codes')
      .update({ times_used: promoCode.times_used + 1, updated_at: new Date().toISOString() })
      .eq('id', promoCode.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error: any) {
    console.error('redeem-code error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    });
  }
});

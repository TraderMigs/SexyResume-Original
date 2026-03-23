import React, { useState } from 'react';
import { Search, Loader, ChevronDown, ChevronUp } from 'lucide-react';

// ── Static industry data ──────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    id: 'corporate',
    label: 'Corporate / Finance / Law',
    color: '#1e3a5f',
    accent: '#2563eb',
    male: {
      attire: 'Dark navy or charcoal suit, white or light blue dress shirt, silk tie. Leather Oxford or Derby shoes in black or dark brown.',
      grooming: 'Hair neatly cut and styled. Clean shave or very well-groomed beard kept short and professional.',
      color: 'Stick to navy, charcoal, black, white, light grey. No bright colors or loud patterns.',
      notes: 'No visible tattoos. Conservative watch. Minimal accessories.'
    },
    female: {
      attire: 'Tailored pantsuit or pencil skirt suit in navy, black, or grey. Silk blouse. Closed-toe heels or flats.',
      grooming: 'Hair neatly styled — up or down is fine. Natural or understated makeup.',
      color: 'Navy, black, charcoal, cream, blush. Avoid overly bright or patterned fabrics.',
      notes: 'Simple jewelry only. No statement pieces. Neutral nail polish.'
    }
  },
  {
    id: 'tech',
    label: 'Tech / Startups / Engineering',
    color: '#1a1a2e',
    accent: '#7c3aed',
    male: {
      attire: 'Smart casual: dark chinos or slim-fit trousers, collared shirt or clean polo, minimalist leather sneakers or loafers.',
      grooming: 'Well-groomed. Beard is fine — keep it shaped. Hair clean and intentional.',
      color: 'Muted tones, navy, slate, olive, white. A pop of color is acceptable.',
      notes: 'Avoid suits unless told otherwise. Smart > formal in most tech settings.'
    },
    female: {
      attire: 'Clean blouse or smart casual top with tailored trousers or dark jeans. Blazer optional. Minimalist sneakers or flats.',
      grooming: 'Natural makeup or none. Hair clean and tidy.',
      color: 'Earth tones, navy, olive, slate, white. Bold colors work in creative tech.',
      notes: 'Startup culture is relaxed — read the company vibe before dressing up too much.'
    }
  },
  {
    id: 'healthcare',
    label: 'Healthcare / Medical',
    color: '#0c4a6e',
    accent: '#0ea5e9',
    male: {
      attire: 'Business casual to business formal depending on role. Clean slacks, button-down shirt, tie optional. White coat if clinical.',
      grooming: 'Clean-shaven preferred in clinical roles. Short hair or neatly tied back.',
      color: 'White, light blue, navy, grey. Avoid anything flashy.',
      notes: 'Closed-toe shoes required in clinical settings. No jewelry near patients.'
    },
    female: {
      attire: 'Scrubs for clinical roles. Business casual blazer and trousers or shift dress for admin/management roles.',
      grooming: 'Hair pulled back or up in clinical settings. Minimal makeup.',
      color: 'Scrub colors vary by facility. Business attire: navy, grey, white.',
      notes: 'Minimal jewelry. Comfortable closed-toe shoes mandatory in clinical environments.'
    }
  },
  {
    id: 'creative',
    label: 'Creative / Media / Design',
    color: '#2d1b69',
    accent: '#d946ef',
    male: {
      attire: 'Express yourself — but intentionally. Tailored dark jeans, interesting shirt or jacket, clean sneakers or boots.',
      grooming: 'Creative grooming is accepted — stylized hair, beard, etc. Keep it polished not sloppy.',
      color: 'Bold colors, patterns, and statement pieces work here. Wear your portfolio.',
      notes: 'Your appearance signals your aesthetic sense. Intentional > conventional.'
    },
    female: {
      attire: 'Fashion-forward but professional. Structured dress, interesting separates, statement blazer. Show personality.',
      grooming: 'Expressive hair colors may be welcome. Makeup can be bold.',
      color: 'Color and pattern are assets in creative fields. Make it cohesive.',
      notes: 'Research company culture — a boutique agency vs a media corp have different vibes.'
    }
  },
  {
    id: 'trades',
    label: 'Skilled Trades / Labor',
    color: '#1c1917',
    accent: '#f97316',
    male: {
      attire: 'For the interview: clean dark jeans or work pants, solid collared shirt or clean polo. Sturdy clean boots.',
      grooming: 'Clean and tidy. Beard acceptable. Hair neat.',
      color: 'Dark neutrals. Avoid white (shows grime). Navy, grey, black are reliable.',
      notes: 'Showing up clean and organized signals professionalism in trades more than suit-wearing.'
    },
    female: {
      attire: 'For interview: clean dark jeans or work pants, collared shirt or clean blouse. Sturdy closed-toe shoes.',
      grooming: 'Hair tied back. Minimal makeup.',
      color: 'Dark neutrals. Practical over fashionable.',
      notes: 'Same as male — cleanliness and practicality signal readiness over formality.'
    }
  },
  {
    id: 'education',
    label: 'Education / Academic',
    color: '#14532d',
    accent: '#16a34a',
    male: {
      attire: 'Business casual. Khakis or chinos, button-down shirt, blazer optional. Clean loafers or oxfords.',
      grooming: 'Neat hair. Beard is fine and common in academia.',
      color: 'Earth tones, navy, forest green, grey. Avoid extremes.',
      notes: 'K-12 is more conservative than university. Read the school culture.'
    },
    female: {
      attire: 'Smart casual: blouse with cardigan or blazer, trousers or midi skirt. Comfortable flats or low heels.',
      grooming: 'Professional and approachable. Natural or light makeup.',
      color: 'Warm tones, navy, soft patterns. Inviting but professional.',
      notes: 'Comfort matters for long days on your feet. Practical footwear is respected.'
    }
  },
  {
    id: 'hospitality',
    label: 'Hospitality / Service / Food',
    color: '#7f1d1d',
    accent: '#dc2626',
    male: {
      attire: 'Clean pressed dark trousers, crisp white or black dress shirt. Tie optional. Polished leather shoes.',
      grooming: 'Clean-shaven or very neat short beard. Hair styled and off the face.',
      color: 'Black and white dominant. Very clean and sharp appearance.',
      notes: 'Appearance directly reflects the establishment. No tattoos visible in fine dining.'
    },
    female: {
      attire: 'Tailored dark trousers or skirt, crisp blouse, low comfortable heels or flats.',
      grooming: 'Hair up or neatly back. Professional makeup. Neutral nail polish.',
      color: 'Black, white, navy. Clean and sharp.',
      notes: 'Fine dining is strictest. Fast casual has more flexibility.'
    }
  },
  {
    id: 'government',
    label: 'Government / Military / Public Service',
    color: '#1e3a5f',
    accent: '#475569',
    male: {
      attire: 'Conservative business formal. Dark suit, white shirt, conservative tie. Black or dark brown oxford shoes.',
      grooming: 'Military-adjacent: very clean cut, short hair, clean shave preferred.',
      color: 'Navy, charcoal, black. No bright or casual colors.',
      notes: 'Err on the side of over-dressed. Conservative is always right here.'
    },
    female: {
      attire: 'Conservative business formal. Tailored suit, modest blouse, closed-toe low heels.',
      grooming: 'Professional and conservative. Modest makeup, hair neatly styled.',
      color: 'Navy, grey, black. Nothing flashy or trendy.',
      notes: 'Same rule — more formal is always better than less.'
    }
  }
];

// ── Industry Card ─────────────────────────────────────────────────────────────
function IndustryCard({ industry }: { industry: typeof INDUSTRIES[0] }) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const data = gender === 'male' ? industry.male : industry.female;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ background: `linear-gradient(135deg, ${industry.color}, ${industry.accent})` }}
      >
        <span className="font-bold text-white text-sm">{industry.label}</span>
        {open ? <ChevronUp size={16} color="white" /> : <ChevronDown size={16} color="white" />}
      </button>

      {open && (
        <div className="bg-white px-5 py-4">
          {/* Gender toggle */}
          <div className="flex gap-2 mb-4">
            {(['male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: gender === g ? industry.accent : '#f3f4f6',
                  color: gender === g ? 'white' : '#6b7280'
                }}
              >
                {g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-bold text-gray-800 mb-1">Attire</p>
              <p className="text-gray-600 leading-relaxed">{data.attire}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Hair, Beard & Grooming</p>
              <p className="text-gray-600 leading-relaxed">{data.grooming}</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 mb-1">Colors</p>
              <p className="text-gray-600 leading-relaxed">{data.color}</p>
            </div>
            <div className="rounded-xl px-4 py-3" style={{ background: '#faf5ff', borderLeft: `3px solid ${industry.accent}` }}>
              <p className="text-xs font-semibold text-purple-700 mb-1">Pro Tips</p>
              <p className="text-gray-600 text-xs leading-relaxed">{data.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Career Search ──────────────────────────────────────────────────────────
function AICareerSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a professional career image consultant with deep knowledge of 2026 workplace dress codes, grooming standards, and first-impression etiquette across all industries. Give concise, practical, up-to-date advice. Format your response in clear sections: Male Attire, Female Attire, Grooming & Hair, Color Guide, and Pro Tips. Be specific and actionable. Do not use em dashes.`,
          messages: [
            {
              role: 'user',
              content: `What is the recommended interview attire, grooming, hair style, beard guidance, color choices, and overall appearance for someone interviewing for a "${query}" position in 2026? Cover both male and female recommendations. Include any industry-specific rules about tattoos, hair color, piercings, or unconventional styling.`
            }
          ]
        })
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      if (!text) throw new Error('No response received');
      setResult(text);
    } catch (e: any) {
      setError('Search failed. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-purple-100 overflow-hidden" style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)' }}>
      <div className="px-6 py-5 border-b border-purple-100">
        <h3 className="font-black text-gray-900 text-base mb-1">Search Any Career</h3>
        <p className="text-sm text-gray-500">Type any job title and get AI-powered attire recommendations for 2026.</p>
      </div>

      <div className="px-6 py-5">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. nurse, software engineer, chef, pilot..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#d946ef)' }}
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        {result && (
          <div className="mt-5 rounded-xl bg-white border border-purple-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: '#d946ef' }} />
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">AI Recommendations for: {query}</p>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main BigDayAttire ─────────────────────────────────────────────────────────
export default function BigDayAttire() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">Big Day Attire</h2>
        <p className="text-sm text-gray-400 mt-1">
          2026 interview dress code guide — attire, grooming, hair, color and style by industry. Tap any category to expand.
        </p>
      </div>

      {/* AI Search — top */}
      <div className="mb-8">
        <AICareerSearch />
      </div>

      {/* Static industry cards */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Browse by Industry</p>
        <div className="flex flex-col gap-3">
          {INDUSTRIES.map(industry => (
            <IndustryCard key={industry.id} industry={industry} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-8 rounded-2xl px-5 py-4 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <p className="text-xs text-gray-400 leading-relaxed">
          Attire recommendations reflect 2026 professional standards. When in doubt, dress one level above what you think is required. First impressions are formed in under 7 seconds.
        </p>
      </div>
    </div>
  );
}

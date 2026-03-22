import React, { useState } from 'react';
import { Upload, Sparkles, Download, FileText, CheckCircle, ArrowRight, Star, Zap, Shield } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onUpload: () => void;
}

const TEMPLATES = [
  { name: 'Modern', color: '#d946ef' },
  { name: 'Executive', color: '#7c3aed' },
  { name: 'Tech', color: '#0ba5d9' },
  { name: 'Healthcare', color: '#059669' },
  { name: 'Creative', color: '#f59e0b' },
  { name: 'Federal', color: '#6366f1' },
];

export default function LandingPage({ onSignIn, onUpload }: LandingPageProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 40%, #eff6ff 100%)'
      }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #0ba5d9, transparent)' }} />

        <div className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '1px solid #e9d5ff', color: '#7c3aed' }}>
            <Sparkles size={14} />
            AI-Powered Resume Builder
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Your resume,{' '}
            <span style={{
              background: 'linear-gradient(135deg,#d946ef,#7c3aed,#0ba5d9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>elevated.</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your existing resume. Watch AI transform it. Download a professional,
            watermark-free version for $7 — pay once, keep forever.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={onUpload}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-lg font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
              style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
            >
              <Upload size={22} />
              Upload My Resume
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-gray-700 text-lg font-semibold border-2 border-gray-200 hover:border-purple-300 hover:text-purple-700 transition-all bg-white"
            >
              Build from scratch
            </button>
          </div>

          <p className="text-sm text-gray-400">No credit card required to start · $7 to unlock &amp; download</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Three steps. Done.</h2>
          <p className="text-center text-gray-400 mb-14">From upload to download in under 5 minutes.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload your resume',
                desc: 'Drop any PDF or Word doc. Our AI reads every word and parses it into a clean, editable structure.',
                color: '#d946ef',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Pick a template',
                desc: 'Choose from 10 professional templates — Modern, Executive, Tech, Healthcare, Creative and more.',
                color: '#7c3aed',
              },
              {
                step: '03',
                icon: Download,
                title: 'Download for $7',
                desc: 'One-time payment. PDF, Word, or plain text — all formats, no watermark, yours to keep.',
                color: '#0ba5d9',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative p-6 rounded-2xl border border-gray-100 hover:border-purple-100 hover:shadow-lg transition-all">
                <div className="text-6xl font-black mb-4 select-none" style={{ color: `${color}18` }}>{step}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES PREVIEW ─────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">10 Professional Templates</h2>
          <p className="text-center text-gray-400 mb-12">Every industry. Every level. Every style.</p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
            {TEMPLATES.map(({ name, color }) => (
              <div
                key={name}
                onMouseEnter={() => setHoveredTemplate(name)}
                onMouseLeave={() => setHoveredTemplate(null)}
                className="rounded-xl p-4 text-center cursor-default transition-all"
                style={{
                  background: hoveredTemplate === name ? `${color}18` : 'white',
                  border: `2px solid ${hoveredTemplate === name ? color : '#e5e7eb'}`,
                  transform: hoveredTemplate === name ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${color}20` }}>
                  <FileText size={16} style={{ color }} />
                </div>
                <p className="text-xs font-semibold text-gray-600">{name}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={onUpload}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed,#0ba5d9)' }}>
              <Upload size={20} />
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-14">Why SexyResume?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Zap, title: 'AI Parsing', desc: 'Upload any PDF or Word doc — AI extracts every section instantly.', color: '#d946ef' },
              { icon: Star, title: '$7 One-Time', desc: 'No subscriptions. Pay once, download in PDF, Word & plain text. No recurring charges.', color: '#7c3aed' },
              { icon: Shield, title: 'Privacy First', desc: 'Files auto-delete after 24 hours. GDPR compliant. No permanent storage.', color: '#0ba5d9' },
              { icon: FileText, title: 'Cover Letter', desc: 'AI generates a matching cover letter after you unlock — included free.', color: '#059669' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed,#0ba5d9)' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to get hired?</h2>
          <p className="text-purple-100 text-lg mb-10">
            Upload your resume now. It takes 30 seconds.
          </p>
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white rounded-2xl text-purple-700 font-black text-xl shadow-2xl hover:scale-105 transition-all"
          >
            <Upload size={24} />
            Upload My Resume
          </button>
          <div className="flex items-center justify-center gap-6 mt-8 text-purple-200 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Free to start</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> $7 to download</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} /> No subscription</span>
          </div>
        </div>
      </section>

    </div>
  );
}

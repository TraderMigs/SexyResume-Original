import React, { useEffect, useState, useCallback } from 'react';
import { usePayments } from '../hooks/usePayments';
import { Resume } from '../types/resume';
import { Download, FileText, Eye, Sparkles, CheckCircle, Loader } from 'lucide-react';

interface PaymentSuccessProps {
  resume: Resume;
  onClose: () => void;
  onGenerateCoverLetter: () => void;
  onDownload: (format: 'pdf' | 'docx' | 'txt') => void;
}

const CELEBRATION_LINES = [
  { emoji: '😌', text: 'Sexifying your resume...' },
  { emoji: '💅🏾', text: 'Oh....looking good!' },
  { emoji: '👀', text: 'What are you wearing for the interview?' },
  { emoji: '🚀', text: 'OK, your resume just got elevated!' },
  { emoji: '🏅', text: 'Smile. This interview is already won!' },
];

export default function PaymentSuccess({ resume, onClose, onGenerateCoverLetter, onDownload }: PaymentSuccessProps) {
  const { refreshEntitlement, entitlement } = usePayments();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [celebrationIdx, setCelebrationIdx] = useState(0);
  const [celebrationPhase, setCelebrationPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [retryCount, setRetryCount] = useState(0);

  // Cycle celebration messages while checking
  useEffect(() => {
    if (unlocked) return;
    const phases: Array<'enter' | 'visible' | 'exit'> = ['enter', 'visible', 'exit'];
    const durations = { enter: 400, visible: 2800, exit: 400 };

    let current: 'enter' | 'visible' | 'exit' = celebrationPhase;
    const t = setTimeout(() => {
      if (current === 'enter') setCelebrationPhase('visible');
      else if (current === 'visible') setCelebrationPhase('exit');
      else {
        setCelebrationIdx(i => (i + 1) % CELEBRATION_LINES.length);
        setCelebrationPhase('enter');
      }
    }, durations[current]);

    return () => clearTimeout(t);
  }, [celebrationPhase, unlocked]);

  // Poll for entitlement unlock
  const poll = useCallback(async () => {
    await refreshEntitlement();
    setRetryCount(r => r + 1);
  }, [refreshEntitlement]);

  useEffect(() => {
    if (entitlement?.exportUnlocked) {
      setUnlocked(true);
      setChecking(false);
      return;
    }
    if (retryCount >= 8) { setChecking(false); return; }
    const delays = [1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000];
    const t = setTimeout(poll, delays[retryCount] || 5000);
    return () => clearTimeout(t);
  }, [retryCount, entitlement, poll]);

  const msgStyle: React.CSSProperties = {
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity: celebrationPhase === 'visible' ? 1 : 0,
    transform: celebrationPhase === 'enter'
      ? 'translateY(16px)'
      : celebrationPhase === 'exit'
        ? 'translateY(-16px)'
        : 'translateY(0)',
  };

  const current = CELEBRATION_LINES[celebrationIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Gradient top bar */}
        <div style={{ height: '5px', background: 'linear-gradient(90deg,#d946ef,#7c3aed,#0ba5d9)' }} />

        <div className="p-6 sm:p-8">
          {!unlocked && checking ? (
            // ── LOADING / CELEBRATION STATE ────────────────────────────────
            <>
              <div className="text-center mb-6">
                {/* Gradient spinner */}
                <div className="relative w-14 h-14 mx-auto mb-5">
                  <svg className="animate-spin w-14 h-14" viewBox="0 0 56 56" fill="none">
                    <defs>
                      <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#0ba5d9" />
                      </linearGradient>
                    </defs>
                    <circle cx="28" cy="28" r="23" stroke="#f3e8ff" strokeWidth="5" fill="none" />
                    <path d="M28 5 A23 23 0 0 1 51 28" stroke="url(#sg2)" strokeWidth="5" strokeLinecap="round" fill="none" />
                  </svg>
                </div>

                <div style={{ height: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={msgStyle}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>{current.emoji}</div>
                    <p style={{
                      fontSize: '1.1rem', fontWeight: '800', margin: 0,
                      background: 'linear-gradient(90deg,#d946ef,#0ba5d9)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>{current.text}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mt-3">Unlocking your resume... just a sec</p>
              </div>
            </>
          ) : unlocked ? (
            // ── SUCCESS STATE ──────────────────────────────────────────────
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
                  <CheckCircle size={32} color="white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  Your resume is ready. 🎉
                </h2>
                <p className="text-gray-500 text-sm">
                  Watermark-free · Professional · Yours forever
                </p>
              </div>

              {/* Resume name badge */}
              {resume.personalInfo?.fullName && (
                <div className="rounded-xl p-3 mb-5 text-center"
                  style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)' }}>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Resume for</p>
                  <p className="text-lg font-bold text-gray-800">{resume.personalInfo.fullName}</p>
                  <p className="text-xs text-gray-400 capitalize">{resume.template} template</p>
                </div>
              )}

              {/* Download buttons */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['pdf', 'docx', 'txt'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => onDownload(fmt)}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      borderColor: '#d946ef22',
                      background: 'linear-gradient(135deg,#fdf4ff,#fff)',
                    }}
                  >
                    <Download size={18} style={{ color: '#d946ef' }} />
                    <span className="text-xs font-bold mt-1 uppercase text-gray-700">{fmt}</span>
                  </button>
                ))}
              </div>

              {/* Cover letter CTA */}
              <button
                onClick={onGenerateCoverLetter}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 mb-3 transition-all hover:scale-[1.01]"
                style={{ borderColor: '#0ba5d922', background: 'linear-gradient(135deg,#eff6ff,#fff)' }}
              >
                <FileText size={18} style={{ color: '#0ba5d9' }} />
                <span className="font-bold text-gray-700 text-sm">Generate Cover Letter</span>
                <span className="text-xs text-gray-400 ml-1">— AI writes it for you</span>
              </button>

              {/* Preview / edit */}
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed,#0ba5d9)' }}
              >
                <Eye size={18} />
                View & Edit Resume
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                One-time payment · No subscription · Download anytime
              </p>
            </>
          ) : (
            // ── TIMEOUT STATE ──────────────────────────────────────────────
            <>
              <div className="text-center">
                <Sparkles size={40} className="mx-auto mb-4" style={{ color: '#d946ef' }} />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Payment received!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Your payment went through. It may take a moment to reflect.
                  Try refreshing the page — your export will be unlocked.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 rounded-xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}
                >
                  Refresh Page
                </button>
                <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600">
                  Go back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

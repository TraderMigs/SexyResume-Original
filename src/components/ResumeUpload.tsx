import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Resume } from '../types/resume';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';

interface ResumeUploadProps {
  onResumeLoaded: (resume: Partial<Resume>) => void;
  onClose: () => void;
}

const getMessages = (isLoggedIn: boolean) => [
  { text: 'Sexifying your resume.', emoji: '😌' },
  { text: 'Oh....looking good!', emoji: '💅🏾' },
  { text: 'What are you wearing for the interview?', emoji: '👀' },
  isLoggedIn
    ? { text: 'Syncing to your account...', emoji: '🔒' }
    : { text: 'Log in after. Got dressing tips for ya!', emoji: '👖' },
  { text: 'OK, your resume just got elevated!', emoji: '🚀' },
  { text: 'Smile. This interview is already won!', emoji: '🏅' },
];

export default function ResumeUpload({ onResumeLoaded, onClose }: ResumeUploadProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slideshow state
  const [msgIndex, setMsgIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = getMessages(!!user);

  // Drive the enter → visible → exit → next cycle
  useEffect(() => {
    if (!isUploading) return;

    const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

    if (phase === 'enter') {
      // enter animation: 400ms
      timerRef.current = setTimeout(() => setPhase('visible'), 400);
    } else if (phase === 'visible') {
      // hold: 3200ms
      timerRef.current = setTimeout(() => setPhase('exit'), 3200);
    } else if (phase === 'exit') {
      // exit animation: 400ms, then advance
      timerRef.current = setTimeout(() => {
        setMsgIndex(i => (i + 1) % messages.length);
        setPhase('enter');
      }, 400);
    }

    return clear;
  }, [isUploading, phase, messages.length]);

  // Reset on new upload
  const startUpload = () => {
    setMsgIndex(0);
    setPhase('enter');
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    startUpload();

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB limit.');

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, Word, or text files only.');
      }

      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Parse failed' }));
        throw new Error(err.error || 'Failed to parse resume. Please try again.');
      }

      const result = await response.json();
      const parsed = result.parsedResume;

      const sanitized: Partial<Resume> = {
        personalInfo: parsed.personalInfo ? {
          fullName: DOMPurify.sanitize(parsed.personalInfo.fullName || ''),
          email: DOMPurify.sanitize(parsed.personalInfo.email || ''),
          phone: DOMPurify.sanitize(parsed.personalInfo.phone || ''),
          location: DOMPurify.sanitize(parsed.personalInfo.location || ''),
          linkedin: DOMPurify.sanitize(parsed.personalInfo.linkedin || ''),
          website: DOMPurify.sanitize(parsed.personalInfo.website || ''),
          summary: DOMPurify.sanitize(parsed.personalInfo.summary || ''),
        } : undefined,
        experience: parsed.experience || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
      };

      onResumeLoaded(sanitized);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
    }
  }, [onResumeLoaded, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const currentMsg = messages[msgIndex];

  // CSS transform/opacity values per phase
  const msgStyle: React.CSSProperties = {
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity: phase === 'visible' ? 1 : 0,
    transform: phase === 'enter'
      ? 'translateY(24px)'
      : phase === 'exit'
        ? 'translateY(-24px)'
        : 'translateY(0)',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">

        {/* Gradient top bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #d946ef, #0ba5d9)' }} />

        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Upload Resume</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              disabled={isUploading}
            >
              &times;
            </button>
          </div>

          {/* Drop zone / loading card */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            className={`rounded-xl border-2 border-dashed transition-colors ${
              isUploading
                ? 'border-transparent bg-gradient-to-br from-purple-50 to-pink-50'
                : isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isUploading ? (
              // ── LOADING SLIDESHOW ──────────────────────────────────
              <div className="w-full px-6 py-8 flex flex-col items-center text-center">

                {/* Gradient arc spinner */}
                <div className="relative w-12 h-12 mb-6">
                  <svg
                    className="animate-spin w-12 h-12"
                    viewBox="0 0 48 48"
                    fill="none"
                  >
                    <defs>
                      <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#0ba5d9" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="24" cy="24" r="20"
                      stroke="#f3e8ff"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M24 4 A20 20 0 0 1 44 24"
                      stroke="url(#spinGrad)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Animated message */}
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={msgStyle}>
                    <div
                      style={{
                        fontSize: '2rem',
                        marginBottom: '0.3rem',
                        lineHeight: 1,
                      }}
                    >
                      {currentMsg.emoji}
                    </div>
                    <p
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        background: 'linear-gradient(90deg, #d946ef, #0ba5d9)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1.3,
                        margin: 0,
                      }}
                    >
                      {currentMsg.text}
                    </p>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mt-4">
                  {messages.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === msgIndex ? '20px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: i === msgIndex
                          ? 'linear-gradient(90deg,#d946ef,#0ba5d9)'
                          : '#e9d5ff',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // ── IDLE DROP ZONE ─────────────────────────────────────
              <div className="text-center px-6 py-10">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-base text-gray-700 mb-1 font-medium">
                  Drop your resume here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-5">
                  PDF, Word (.docx), or text files — max 10MB
                </p>
                <label className="inline-block cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    disabled={isUploading}
                  />
                  <span className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
                    style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
                    Choose File
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* How it works — hidden during upload */}
          {!isUploading && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-0.5">How it works</p>
                <p>Our AI reads your resume and fills in your info — name, contact details, work history, education, and skills.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Resume } from '../types/resume';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { getAllTemplates } from '../lib/templateRegistry';
import { renderTemplate } from '../lib/templateRenderer';
import { Download, FileText, File, Sparkles, CheckCircle, Loader, AlertCircle, Zap } from 'lucide-react';

interface DownloadTabProps {
  resume: Resume;
  onGenerateCoverLetter?: () => void;
}

export default function DownloadTab({ resume, onGenerateCoverLetter }: DownloadTabProps) {
  const { entitlement, refreshEntitlement } = usePayments();
  const { session } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);

  // On mount: if not yet unlocked, poll until it flips
  useEffect(() => {
    if (entitlement?.exportUnlocked) return;
    if (pollCount >= 8) return;
    const t = setTimeout(async () => {
      await refreshEntitlement();
      setPollCount(c => c + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [entitlement, pollCount]);

  const getRenderedTemplate = () => {
    try {
      if (!resume?.personalInfo) return { html: '', css: '' };
      const templates = getAllTemplates();
      const template = templates.find(t => t.id === resume.template) || templates[0];
      if (!template) return { html: '', css: '' };
      const rendered = renderTemplate(resume, template);
      return { html: rendered.html, css: rendered.css };
    } catch {
      return { html: '', css: '' };
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt' | 'ats') => {
    if (!resume.id) { setError('Please save your resume before downloading.'); return; }
    if (!session?.access_token) { setError('Session expired. Please sign in again.'); return; }
    setIsExporting(true);
    setError(null);
    setExportResult(null);
    setLastFormat(format);
    try {
      const { html: renderedHtml, css: renderedCss } = format === 'pdf' ? getRenderedTemplate() : { html: '', css: '' };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          format,
          template: resume.template || 'modern',
          watermark: false,
          renderedHtml,
          renderedCss,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Export failed');
      }
      const result = await response.json();
      if (result.downloadUrl) {
        const fileResponse = await fetch(result.downloadUrl);
        const blob = await fileResponse.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.${format === 'ats' ? 'txt' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        setExportResult(result.downloadUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!entitlement?.exportUnlocked) {
    if (pollCount < 8) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <svg className="animate-spin w-14 h-14" viewBox="0 0 56 56" fill="none">
              <defs>
                <linearGradient id="sg-dl" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#0ba5d9" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r="23" stroke="#f3e8ff" strokeWidth="5" fill="none" />
              <path d="M28 5 A23 23 0 0 1 51 28" stroke="url(#sg-dl)" strokeWidth="5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-600">Confirming your unlock...</p>
          <p className="text-xs text-gray-400 mt-1">Just a moment</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '2px solid #e9d5ff' }}>
          <Download className="w-7 h-7" style={{ color: '#d946ef' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Unlock to Download</h3>
        <p className="text-sm text-gray-400 mb-4">Purchase export access to download your resume here.</p>
        <button onClick={() => { setPollCount(0); refreshEntitlement(); }}
          className="text-sm text-purple-600 underline">Try refreshing</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
          <CheckCircle size={30} color="white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Your resume is ready.</h2>
        <p className="text-gray-400 text-sm">Watermark-free · Professional · Download anytime</p>
      </div>

      {/* Resume name badge */}
      {resume.personalInfo?.fullName && (
        <div className="rounded-xl p-4 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '1px solid #e9d5ff' }}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Resume for</p>
          <p className="text-xl font-bold text-gray-800">{resume.personalInfo.fullName}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{resume.template || 'modern'} template</p>
        </div>
      )}

      {/* Download buttons */}
      <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Download Format</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { fmt: 'pdf' as const, label: 'PDF', desc: 'Styled · Best for sharing', icon: <FileText size={22} /> },
          { fmt: 'docx' as const, label: 'Word', desc: 'Editable · Clean format', icon: <File size={22} /> },
          { fmt: 'txt' as const, label: 'Plain Text', desc: 'Simple · Universal', icon: <FileText size={22} /> },
          { fmt: 'ats' as const, label: 'ATS-Optimized', desc: 'For job portals & scanners', icon: <Zap size={22} /> },
        ]).map(({ fmt, label, desc, icon }) => (
          <button
            key={fmt}
            onClick={() => handleDownload(fmt)}
            disabled={isExporting}
            className="flex flex-col items-center justify-center py-5 px-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: '#d946ef33', background: 'linear-gradient(135deg,#fdf4ff,#fff)' }}
          >
            {isExporting && lastFormat === fmt
              ? <Loader size={22} className="animate-spin" style={{ color: '#d946ef' }} />
              : <span style={{ color: '#d946ef' }}>{icon}</span>
            }
            <span className="text-sm font-bold mt-2 text-gray-800">{label}</span>
            <span className="text-xs text-gray-400 mt-0.5 text-center">{desc}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {exportResult && !isExporting && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 text-sm font-semibold">Downloaded successfully!</p>
            <button
              onClick={async () => {
                const fileResponse = await fetch(exportResult);
                const blob = await fileResponse.blob();
                const objectUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = objectUrl;
                link.download = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.${lastFormat === 'ats' ? 'txt' : lastFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
              }}
              className="text-xs text-green-600 underline mt-0.5"
            >Download again</button>
          </div>
        </div>
      )}

      {/* Cover letter CTA */}
      <div className="border-t border-gray-100 pt-6">
        <button
          onClick={onGenerateCoverLetter}
          className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border-2 transition-all hover:scale-[1.01]"
          style={{ borderColor: '#0ba5d922', background: 'linear-gradient(135deg,#eff6ff,#fff)' }}
        >
          <Sparkles size={20} style={{ color: '#0ba5d9' }} />
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">Generate a Cover Letter</p>
            <p className="text-xs text-gray-400">AI writes a tailored cover letter for you - free</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">
        One-time payment · No subscription · Download anytime
      </p>
    </div>
  );
}

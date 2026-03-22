import React, { useState } from 'react';
import { Resume } from '../types/resume';
import { usePayments } from '../hooks/usePayments';
import { Download, FileText, File, Sparkles, CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface DownloadTabProps {
  resume: Resume;
  onGenerateCoverLetter?: () => void;
}

export default function DownloadTab({ resume, onGenerateCoverLetter }: DownloadTabProps) {
  const { entitlement } = usePayments();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<string>('');

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!resume.id) { setError('Please save your resume before downloading.'); return; }
    setIsExporting(true);
    setError(null);
    setExportResult(null);
    setLastFormat(format);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          format,
          template: resume.template || 'modern',
          watermark: false,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Export failed');
      }
      const result = await response.json();
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setExportResult(result.downloadUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!entitlement?.exportUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '2px solid #e9d5ff' }}>
          <Download className="w-7 h-7" style={{ color: '#d946ef' }} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Unlock to Download</h3>
        <p className="text-sm text-gray-400">Purchase export access to download your resume here.</p>
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
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { fmt: 'pdf' as const, label: 'PDF', desc: 'Best for sharing', icon: <FileText size={22} /> },
          { fmt: 'docx' as const, label: 'Word', desc: 'Editable format', icon: <File size={22} /> },
          { fmt: 'txt' as const, label: 'Plain Text', desc: 'Simple & clean', icon: <FileText size={22} /> },
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
            <span className="text-xs text-gray-400 mt-0.5">{desc}</span>
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
              onClick={() => { const link = document.createElement('a'); link.href = exportResult; link.download = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.${lastFormat}`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
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
            <p className="text-xs text-gray-400">AI writes a tailored cover letter for you — free</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">
        One-time payment · No subscription · Download anytime
      </p>
    </div>
  );
}

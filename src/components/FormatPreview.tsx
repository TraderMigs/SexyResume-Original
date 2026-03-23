import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Resume } from '../types/resume';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../contexts/AuthContext';
import { getAllTemplates } from '../lib/templateRegistry';
import { renderTemplate } from '../lib/templateRenderer';
import { Lock, FileText, File, Zap, Download, Loader, CheckCircle } from 'lucide-react';

interface FormatPreviewProps {
  resume: Resume;
  onUnlockClick?: () => void;
  onDownload?: (format: 'pdf' | 'docx' | 'ats') => void;
}

const TEMPLATE_WIDTH_PX = 816;

// ── PDF Preview ───────────────────────────────────────────────────────────────
function PDFPreviewCard({ resume, isUnlocked, onDownload }: any) {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resume?.personalInfo) return;
    const templates = getAllTemplates();
    const template = templates.find((t: any) => t.id === resume.template) || templates[0];
    if (template) {
      try {
        const rendered = renderTemplate(resume, template);
        setHtml(rendered.html);
        setCss(rendered.css);
      } catch (e) { console.error(e); }
    }
  }, [resume]);

  const updateScale = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const w = containerRef.current.offsetWidth;
    const s = Math.min(w / TEMPLATE_WIDTH_PX, 1);
    setScale(s);
    setScaledHeight(contentRef.current.scrollHeight * s);
  }, []);

  useEffect(() => { if (!html) return; const t = setTimeout(updateScale, 50); return () => clearTimeout(t); }, [html, updateScale]);
  useEffect(() => { if (!html) return; const obs = new ResizeObserver(updateScale); if (containerRef.current) obs.observe(containerRef.current); return () => obs.disconnect(); }, [html, updateScale]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
          <FileText size={16} color="white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">PDF</p>
          <p className="text-xs text-gray-400">Styled · Matches your template · Best for sending</p>
        </div>
      </div>

      <div ref={containerRef} className="relative border-2 border-purple-100 rounded-xl overflow-hidden shadow-lg bg-white"
        style={{ height: scaledHeight ? `${scaledHeight}px` : 'auto', maxWidth: '816px', margin: '0 auto', width: '100%' }}>
        {html ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <div style={{ width: `${TEMPLATE_WIDTH_PX}px`, transformOrigin: 'top left', transform: `scale(${scale})`, position: 'absolute', top: 0, left: 0 }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '-100%', width: '300%', height: '300%', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', transform: 'rotate(-35deg)', transformOrigin: 'center center' }}>
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} style={{ width: '200px', padding: '30px 0', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'rgba(180,0,200,0.12)', fontFamily: 'Arial,sans-serif', letterSpacing: '2px', userSelect: 'none', whiteSpace: 'nowrap' }}>SEXYRESUME.COM</div>
                  ))}
                </div>
              </div>
              <div ref={contentRef} style={{ userSelect: 'none', WebkitUserSelect: 'none', position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '600px' }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
        )}

        {/* Blur gate — starts at 30% from bottom, shows 70% of content */}
        {!isUnlocked && scaledHeight && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 20, background: 'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.85) 50%,white 100%)', pointerEvents: 'none' }} />
        )}
        {isUnlocked && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', zIndex: 20, display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => onDownload('pdf')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 shadow-lg" style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
              <Download size={16} /> Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Word Preview ──────────────────────────────────────────────────────────────
function WordPreviewCard({ resume, isUnlocked, onDownload }: any) {
  const { personalInfo, experience, education, skills } = resume;

  const wordHtml = `
    <div style="font-family: 'Calibri', 'Arial', sans-serif; padding: 56px 64px; color: #1a1a1a; line-height: 1.6; background: white;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px; color: #1a1a1a;">${personalInfo?.fullName || ''}</h1>
        <p style="font-size: 12px; color: #555; margin: 0;">${[personalInfo?.email, personalInfo?.phone, personalInfo?.location].filter(Boolean).join('  |  ')}</p>
        ${personalInfo?.linkedin ? `<p style="font-size: 12px; color: #555; margin: 4px 0 0;">${personalInfo.linkedin}</p>` : ''}
      </div>
      <hr style="border: none; border-top: 2px solid #1a1a1a; margin: 0 0 20px;" />
      ${personalInfo?.summary ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 0 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Professional Summary</h2>
          <p style="font-size: 12px; color: #333; margin: 0; line-height: 1.6;">${personalInfo.summary}</p>
        </div>` : ''}
      ${experience?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 0 0 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Work Experience</h2>
          ${experience.map((exp: any) => `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <p style="font-size: 13px; font-weight: 700; margin: 0;">${exp.position}</p>
                <p style="font-size: 11px; color: #555; margin: 0; white-space: nowrap;">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
              </div>
              <p style="font-size: 12px; font-style: italic; color: #444; margin: 2px 0 6px;">${exp.company}</p>
              ${exp.description ? `<p style="font-size: 12px; color: #333; margin: 0 0 4px;">${exp.description}</p>` : ''}
              ${exp.achievements?.filter((a: string) => a.trim()).map((a: string) => `<p style="font-size: 12px; color: #333; margin: 3px 0 0; padding-left: 16px;">• ${a}</p>`).join('') || ''}
            </div>`).join('')}
        </div>` : ''}
      ${education?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 0 0 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Education</h2>
          ${education.map((edu: any) => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <p style="font-size: 13px; font-weight: 700; margin: 0;">${edu.degree} in ${edu.field}</p>
                <p style="font-size: 11px; color: #555; margin: 0;">${edu.startDate} - ${edu.endDate}</p>
              </div>
              <p style="font-size: 12px; font-style: italic; color: #444; margin: 2px 0 0;">${edu.institution}</p>
              ${edu.gpa ? `<p style="font-size: 12px; color: #555; margin: 2px 0 0;">GPA: ${edu.gpa}</p>` : ''}
            </div>`).join('')}
        </div>` : ''}
      ${skills?.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a1a; margin: 0 0 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Skills</h2>
          ${Object.entries(skills.reduce((acc: any, s: any) => { if (!acc[s.category]) acc[s.category] = []; acc[s.category].push(s.name); return acc; }, {})).map(([cat, ss]: [string, any]) => `
            <p style="font-size: 12px; color: #333; margin: 0 0 4px;"><strong>${cat}:</strong> ${ss.join(', ')}</p>`).join('')}
        </div>` : ''}
    </div>
  `;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2b579a' }}>
          <File size={16} color="white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Word Document</p>
          <p className="text-xs text-gray-400">Editable · ATS-safe · Clean professional layout</p>
        </div>
      </div>

      <div className="relative border-2 border-blue-100 rounded-xl overflow-hidden shadow-lg bg-white" style={{ maxWidth: '816px', margin: '0 auto', width: '100%' }}>
        <div style={{ userSelect: 'none', WebkitUserSelect: 'none' }} dangerouslySetInnerHTML={{ __html: wordHtml }} />

        {!isUnlocked && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 20, background: 'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.85) 50%,white 100%)', pointerEvents: 'none' }} />
        )}
        {isUnlocked && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => onDownload('docx')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 shadow-lg" style={{ background: '#2b579a' }}>
              <Download size={16} /> Download Word
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ATS Preview ───────────────────────────────────────────────────────────────
function ATSPreviewCard({ resume, isUnlocked, onDownload }: any) {
  const { personalInfo, experience, education, skills } = resume;

  const atsText = [
    personalInfo?.fullName ? `NAME: ${personalInfo.fullName}` : '',
    personalInfo?.email ? `EMAIL: ${personalInfo.email}` : '',
    personalInfo?.phone ? `PHONE: ${personalInfo.phone}` : '',
    personalInfo?.location ? `LOCATION: ${personalInfo.location}` : '',
    '',
    personalInfo?.summary ? `PROFESSIONAL SUMMARY:\n${personalInfo.summary}` : '',
    '',
    skills?.length > 0 ? `CORE COMPETENCIES:\n${skills.map((s: any) => s.name).join(', ')}` : '',
    '',
    experience?.length > 0 ? 'PROFESSIONAL EXPERIENCE:\n' + experience.map((exp: any, i: number) =>
      `JOB ${i + 1}:\nTITLE: ${exp.position}\nCOMPANY: ${exp.company}\nDATES: ${exp.startDate} to ${exp.current ? 'Present' : exp.endDate}\n${exp.description ? `DESCRIPTION: ${exp.description}\n` : ''}${exp.achievements?.filter((a: string) => a.trim()).map((a: string) => `- ${a}`).join('\n') || ''}`
    ).join('\n\n') : '',
    '',
    education?.length > 0 ? 'EDUCATION:\n' + education.map((edu: any, i: number) =>
      `EDUCATION ${i + 1}:\nDEGREE: ${edu.degree}\nFIELD: ${edu.field}\nINSTITUTION: ${edu.institution}\nDATES: ${edu.startDate} to ${edu.endDate}`
    ).join('\n\n') : '',
  ].filter(Boolean).join('\n');

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#16a34a' }}>
          <Zap size={16} color="white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">ATS-Optimized</p>
          <p className="text-xs text-gray-400">Plain text · Structured for job portals & scanners</p>
        </div>
      </div>

      <div className="relative border-2 border-green-100 rounded-xl overflow-hidden shadow-lg" style={{ maxWidth: '816px', margin: '0 auto', width: '100%', background: '#0d1117' }}>
        <div style={{ padding: '28px 32px', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', lineHeight: '1.8', color: '#e6edf3', whiteSpace: 'pre-wrap', userSelect: 'none', WebkitUserSelect: 'none' }}>
          <span style={{ color: '#7ee787' }}>{'// ATS-OPTIMIZED RESUME FORMAT'}</span>{'\n'}
          <span style={{ color: '#7ee787' }}>{'// Maximum compatibility with applicant tracking systems'}</span>{'\n\n'}
          {atsText}
        </div>

        {!isUnlocked && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', zIndex: 20, background: 'linear-gradient(to bottom,rgba(13,17,23,0) 0%,rgba(13,17,23,0.85) 50%,#0d1117 100%)', pointerEvents: 'none' }} />
        )}
        {isUnlocked && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => onDownload('ats')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 shadow-lg" style={{ background: '#16a34a' }}>
              <Download size={16} /> Download ATS Version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main FormatPreview ────────────────────────────────────────────────────────
export default function FormatPreview({ resume, onUnlockClick, onDownload }: FormatPreviewProps) {
  const { entitlement } = usePayments();
  const { session } = useAuth();
  const isUnlocked = entitlement?.exportUnlocked === true;
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'docx' | 'ats') => {
    if (onDownload) { onDownload(format); return; }
    if (!resume.id || !session?.access_token) return;
    setIsDownloading(true);
    setActiveFormat(format);
    try {
      let renderedHtml = '';
      let renderedCss = '';
      if (format === 'pdf') {
        try {
          const templates = getAllTemplates();
          const template = templates.find((t: any) => t.id === resume.template) || templates[0];
          if (template) {
            const rendered = renderTemplate(resume, template);
            renderedHtml = rendered.html;
            renderedCss = rendered.css;
          }
        } catch (e) { console.error(e); }
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, format, template: resume.template || 'modern', watermark: false, renderedHtml, renderedCss }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Export failed'); }
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
      }
    } catch (e: any) { console.error('Download error:', e); }
    finally { setIsDownloading(false); setActiveFormat(null); }
  };

  if (!resume?.personalInfo?.fullName && !resume?.experience?.length && !resume?.education?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '2px solid #e9d5ff' }}>
          <FileText className="w-6 h-6" style={{ color: '#d946ef' }} />
        </div>
        <p className="font-bold text-gray-800 mb-1">Your resume preview will appear here</p>
        <p className="text-sm text-gray-400">Fill in your Personal Info or upload a resume to see previews of all download formats.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-900">Choose Your Format</h2>
        <p className="text-sm text-gray-400 mt-0.5">Scroll through each format below — see exactly what you get before downloading.</p>
      </div>

      <div className="flex flex-col gap-10">
        <PDFPreviewCard resume={resume} isUnlocked={isUnlocked} onDownload={handleDownload} />
        <WordPreviewCard resume={resume} isUnlocked={isUnlocked} onDownload={handleDownload} />
        <ATSPreviewCard resume={resume} isUnlocked={isUnlocked} onDownload={handleDownload} />
      </div>

      {/* Single unified unlock CTA — shown only when not yet unlocked */}
      {!isUnlocked && (
        <div className="mt-10 rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '2px solid #e9d5ff' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg,#d946ef,#0ba5d9)' }}>
            <Lock size={24} color="white" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-1">Unlock All 3 Formats</h3>
          <p className="text-sm text-gray-500 mb-6">PDF · Word · ATS-Optimized — all included, one payment, yours forever.</p>
          <button
            onClick={onUnlockClick}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base transition-all hover:scale-105 shadow-xl"
            style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed,#0ba5d9)' }}
          >
            <Lock size={18} />
            Unlock All 3 Formats — $7.00
          </button>
          <p className="text-xs text-gray-400 mt-3">One-time · No subscription · Download anytime</p>
        </div>
      )}

      {/* Unlocked confirmation banner */}
      {isUnlocked && (
        <div className="mt-10 rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', border: '2px solid #86efac' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
            <p className="font-bold text-green-800">All formats unlocked</p>
          </div>
          <p className="text-xs text-green-600">Click any format above to download · No watermarks · Download anytime</p>
        </div>
      )}

      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader size={32} className="animate-spin" style={{ color: '#d946ef' }} />
            <p className="font-bold text-gray-800">Preparing your {activeFormat?.toUpperCase()} download...</p>
          </div>
        </div>
      )}
    </div>
  );
}

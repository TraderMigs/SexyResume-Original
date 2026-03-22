import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Resume } from '../types/resume';
import { getAllTemplates } from '../lib/templateRegistry';
import { renderTemplate } from '../lib/templateRenderer';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface ResumeHookPreviewProps {
  resume: Resume;
  onSignIn: () => void;
}

const TEMPLATE_WIDTH_PX = 816;

// Pick 3 random templates from the full list, seeded once per mount
function pickThreeRandom(allIds: string[]): string[] {
  const shuffled = [...allIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function TemplatePreviewFrame({
  resume,
  templateId,
  isActive,
}: {
  resume: Resume;
  templateId: string;
  isActive: boolean;
}) {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!resume?.personalInfo) return;
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === templateId) || templates[0];
    if (template) {
      try {
        const rendered = renderTemplate(resume, template);
        setHtml(rendered.html);
        setCss(rendered.css);
      } catch (err) {
        console.error('Render error:', err);
      }
    }
  }, [resume, templateId]);

  const updateScale = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const w = containerRef.current.offsetWidth;
    const s = Math.min(w / TEMPLATE_WIDTH_PX, 1);
    setScale(s);
    setScaledHeight(contentRef.current.scrollHeight * s);
  }, []);

  useEffect(() => {
    if (!html) return;
    const t = setTimeout(updateScale, 50);
    return () => clearTimeout(t);
  }, [html, updateScale]);

  useEffect(() => {
    if (!html) return;
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [html, updateScale]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl"
      style={{ height: scaledHeight ? `${scaledHeight}px` : 'auto', position: 'relative' }}
    >
      {html ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <div
            ref={contentRef}
            style={{
              width: `${TEMPLATE_WIDTH_PX}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      )}
    </div>
  );
}

export default function ResumeHookPreview({ resume, onSignIn }: ResumeHookPreviewProps) {
  const allTemplates = getAllTemplates();
  const allIds = allTemplates.map(t => t.id);

  // Pick 3 random templates once on mount
  const [threeIds] = useState<string[]>(() => pickThreeRandom(allIds));
  const [activeIdx, setActiveIdx] = useState(0);

  const activeTemplateId = threeIds[activeIdx];
  const activeTemplateName = allTemplates.find(t => t.id === activeTemplateId)?.name ?? '';

  return (
    <div className="w-full max-w-2xl mx-auto px-4">

      {/* Header message */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '1px solid #e9d5ff', color: '#7c3aed' }}>
          <Sparkles size={14} />
          Your resume is looking sexy already
        </div>
        <h2 className="text-2xl font-black text-gray-900">
          Here's a preview — pick a style
        </h2>
        <p className="text-gray-500 text-sm mt-1">Tap each template to see your resume transform</p>
      </div>

      {/* 3 template selector pills */}
      <div className="flex gap-2 justify-center mb-4">
        {threeIds.map((id, idx) => {
          const name = allTemplates.find(t => t.id === id)?.name ?? id;
          const isActive = idx === activeIdx;
          return (
            <button
              key={id}
              onClick={() => setActiveIdx(idx)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg,#d946ef,#7c3aed)'
                  : 'white',
                color: isActive ? 'white' : '#6b7280',
                border: isActive ? 'none' : '2px solid #e5e7eb',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isActive ? '0 4px 12px rgba(217,70,239,0.3)' : 'none',
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Preview with blur gate */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-100">

        {/* Live template preview */}
        <div style={{ maxHeight: '420px', overflow: 'hidden' }}>
          {threeIds.map((id, idx) => (
            <TemplatePreviewFrame
              key={id}
              resume={resume}
              templateId={id}
              isActive={idx === activeIdx}
            />
          ))}
        </div>

        {/* Blur gradient gate over bottom half */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '65%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.97) 70%, white 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-6 px-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}>
            <Lock size={20} color="white" />
          </div>

          <p className="text-lg font-black text-gray-900 mb-1">
            7 more sexy templates inside
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Plus editing, AI enhancements, and cover letter — all free after sign up.
          </p>

          <button
            onClick={onSignIn}
            className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-black text-base shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
          >
            Sign In — It's Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs text-gray-400 mt-3">
            No credit card · Free account · $7 to download
          </p>
        </div>
      </div>

      {/* Currently viewing label */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Viewing: <span className="font-semibold text-purple-600">{activeTemplateName}</span> template
      </p>
    </div>
  );
}

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Resume } from '../types/resume';
import { getAllTemplates } from '../lib/templateRegistry';
import { renderTemplate } from '../lib/templateRenderer';
import { usePayments } from '../hooks/usePayments';
import { Lock } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
  onUnlockClick?: () => void;
}

const TEMPLATE_WIDTH_PX = 816; // 8.5in at 96dpi

export default function ResumePreview({ resume, onUnlockClick }: ResumePreviewProps) {
  const { entitlement } = usePayments();
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedCss, setRenderedCss] = useState('');
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isUnlocked = entitlement?.exportUnlocked === true;

  useEffect(() => {
    // Guard against undefined personalInfo (data not yet hydrated)
    if (!resume?.personalInfo) return;
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === resume.template) || templates[0];
    if (template) {
      try {
        const rendered = renderTemplate(resume, template);
        setRenderedHtml(rendered.html);
        setRenderedCss(rendered.css);
      } catch (err) {
        console.error('Template render error:', err);
      }
    }
  }, [resume]);

  const updateScale = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const newScale = Math.min(containerWidth / TEMPLATE_WIDTH_PX, 1);
    setScale(newScale);
    setScaledHeight(contentRef.current.scrollHeight * newScale);
  }, []);

  useEffect(() => {
    if (!renderedHtml) return;
    const t = setTimeout(updateScale, 50);
    return () => clearTimeout(t);
  }, [renderedHtml, updateScale]);

  useEffect(() => {
    if (!renderedHtml) return;
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderedHtml, updateScale]);

  // No personalInfo means resume is empty — show prompt instead of infinite spinner
  if (!resume?.personalInfo?.fullName && !resume?.experience?.length && !resume?.education?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '2px solid #e9d5ff' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <p className="font-bold text-gray-800 mb-1">Your resume preview will appear here</p>
        <p className="text-sm text-gray-400">Fill in your Personal Info or upload a resume to see a live preview.</p>
      </div>
    );
  }

  if (!renderedHtml) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Template: <span className="font-medium text-gray-700 capitalize">{resume.template}</span>
        </p>
        {isUnlocked
          ? <span className="text-xs text-green-600 font-medium">✓ Unlocked</span>
          : <span className="text-xs text-gray-400">Preview — watermarked</span>
        }
      </div>

      <div
        ref={containerRef}
        className="relative border border-gray-200 rounded-xl overflow-hidden shadow-md bg-white"
        style={{ height: scaledHeight ? `${scaledHeight}px` : 'auto', maxWidth: '816px', margin: '0 auto' }}
      >
        <style dangerouslySetInnerHTML={{ __html: renderedCss }} />

        {/* Scale wrapper — shrinks template to fit any screen */}
        <div style={{
          width: `${TEMPLATE_WIDTH_PX}px`,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}>
          {/* Watermark */}
          {!isUnlocked && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: '-100%', width: '300%', height: '300%',
                display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
                transform: 'rotate(-35deg)', transformOrigin: 'center center',
              }}>
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} style={{
                    width: '200px', padding: '30px 0', textAlign: 'center',
                    fontSize: '11px', fontWeight: '700',
                    color: 'rgba(180,0,200,0.12)', fontFamily: 'Arial,sans-serif',
                    letterSpacing: '2px', userSelect: 'none', whiteSpace: 'nowrap',
                  }}>
                    SEXYRESUME.COM
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume content */}
          <div
            ref={contentRef}
            style={{
              userSelect: isUnlocked ? 'text' : 'none',
              WebkitUserSelect: isUnlocked ? 'text' : 'none',
              position: 'relative', zIndex: 1,
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Blur + unlock gate */}
        {!isUnlocked && scaledHeight && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', zIndex: 20,
            background: 'linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,0.65) 20%,rgba(255,255,255,0.95) 40%,rgba(255,255,255,1) 55%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-end', paddingBottom: '1.75rem',
          }}>
            <div style={{ textAlign: 'center', padding: '0 1rem', maxWidth: '280px', width: '100%' }}>
              <div style={{
                width: '44px', height: '44px',
                background: 'linear-gradient(135deg,#d946ef,#0ba5d9)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.6rem',
                boxShadow: '0 4px 16px rgba(217,70,239,0.3)',
              }}>
                <Lock size={18} color="white" />
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: '700', color: '#111827', margin: '0 0 0.2rem', fontFamily: 'Inter,sans-serif' }}>
                Your resume looks great.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.75rem', fontFamily: 'Inter,sans-serif', lineHeight: '1.4' }}>
                Unlock a clean, watermark-free copy — ready to download and send.
              </p>
              <button
                onClick={onUnlockClick}
                style={{
                  background: 'linear-gradient(135deg,#d946ef,#0ba5d9)',
                  color: 'white', border: 'none', borderRadius: '8px',
                  padding: '0.6rem 1.5rem', fontSize: '0.88rem', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  boxShadow: '0 4px 16px rgba(217,70,239,0.35)',
                  width: '100%', maxWidth: '200px',
                }}
              >
                Unlock Now — $7.00
              </button>
              <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: '0.35rem 0 0', fontFamily: 'Inter,sans-serif' }}>
                One-time · No subscription · Instant download
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

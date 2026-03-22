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
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === resume.template) || templates[0];
    if (template) {
      const rendered = renderTemplate(resume, template);
      setRenderedHtml(rendered.html);
      setRenderedCss(rendered.css);
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
        style={{ height: scaledHeight ? `${scaledHeight}px` : 'auto' }}
      >
        <style dangerouslySetInnerHTML={{ __html: renderedCss }} />

        {/* Scale wrapper — shrinks template to fit any screen */}
        <div style={{
          width: `${TEMPLATE_WIDTH_PX}px`,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
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

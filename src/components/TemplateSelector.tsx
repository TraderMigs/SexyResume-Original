import React, { useState, useEffect } from 'react';
import { Resume } from '../types/resume';
import { Template, TemplateRecommendation, TemplateCustomization } from '../types/template';
import { getAllTemplates } from '../lib/templateRegistry';
import { getTemplateRecommendations } from '../lib/templateRecommendation';
import { renderTemplate } from '../lib/templateRenderer';
import { trackEvent } from '../lib/analytics';
import { Palette, Wand2, Eye, Check, Star, Sparkles, Lock } from 'lucide-react';

interface TemplateSelectorProps {
  resume: Resume;
  selectedTemplate: string;
  onTemplateChange: (templateId: string, customizations?: Partial<TemplateCustomization>) => void;
  customizations?: TemplateCustomization;
  requiresAuthForMore?: boolean;
  onAuthRequired?: () => void;
}

export default function TemplateSelector({
  resume,
  selectedTemplate,
  onTemplateChange,
  customizations,
  requiresAuthForMore = false,
  onAuthRequired,
}: TemplateSelectorProps) {
  const [templates] = useState<Template[]>(getAllTemplates());
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    // Guard against undefined personalInfo (resume not yet hydrated)
    if (resume?.personalInfo?.fullName || (resume?.experience?.length ?? 0) > 0) {
      const recs = getTemplateRecommendations(resume);
      setRecommendations(recs);
    }
  }, [resume]);

  // First template is always free; the rest require auth when anon
  const freeTemplateId = templates[0]?.id;

  const isLocked = (templateId: string) =>
    requiresAuthForMore && templateId !== freeTemplateId;

  const handleTemplateSelect = (templateId: string) => {
    if (isLocked(templateId)) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    const recommendation = recommendations.find(r => r.template.id === templateId);
    const rankInRecs = recommendations.findIndex(r => r.template.id === templateId);
    trackEvent('template_chosen', {
      template_id: templateId,
      recommendation_score: recommendation?.score,
      was_recommended: !!recommendation,
      rank_in_recommendations: rankInRecs >= 0 ? rankInRecs + 1 : undefined,
    });
    onTemplateChange(templateId);
    setPreviewTemplate(null);
  };

  const handleCustomizationChange = (field: keyof TemplateCustomization, value: any) => {
    onTemplateChange(selectedTemplate, { ...customizations, [field]: value });
  };

  const getRecommendationScore = (templateId: string) =>
    recommendations.find(r => r.template.id === templateId)?.score ?? 0;

  const getRecommendationReasons = (templateId: string) =>
    recommendations.find(r => r.template.id === templateId)?.reasons ?? [];

  const isRecommended = (templateId: string) =>
    recommendations.slice(0, 2).some(r => r.template.id === templateId);

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Choose Template</h2>
        </div>
        {!requiresAuthForMore && (
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span>Customize</span>
          </button>
        )}
      </div>

      {/* Sign-in nudge banner for anon */}
      {requiresAuthForMore && (
        <div className="mb-6 rounded-xl p-4 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', border: '1px solid #e9d5ff' }}>
          <div>
            <p className="font-bold text-purple-900 text-sm">9 more templates available</p>
            <p className="text-purple-600 text-xs mt-0.5">Sign in to unlock all templates, customization, and editing.</p>
          </div>
          <button
            onClick={onAuthRequired}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold whitespace-nowrap flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
          >
            Sign In
          </button>
        </div>
      )}

      {/* AI Recommendations (only for authed) */}
      {!requiresAuthForMore && recommendations.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-sexy-pink-50 to-sexy-cyan-50 rounded-lg p-4 border border-sexy-pink-100">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-sexy-pink-600" />
            <h3 className="font-medium text-gray-900">AI Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 2).map((rec) => (
              <div
                key={rec.template.id}
                className="bg-white rounded-lg p-3 border border-sexy-pink-200 cursor-pointer hover:border-sexy-pink-400 transition-colors"
                onClick={() => handleTemplateSelect(rec.template.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rec.template.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-600">{rec.score}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.template.description}</p>
                <div className="text-xs text-sexy-pink-600">{rec.reasons.slice(0, 2).join(' • ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map((template) => {
          const locked = isLocked(template.id);
          return (
            <div
              key={template.id}
              className={`relative border-2 rounded-lg p-4 transition-all ${
                locked
                  ? 'border-gray-100 bg-gray-50 cursor-pointer hover:border-purple-300'
                  : selectedTemplate === template.id
                    ? 'border-sexy-pink-500 bg-sexy-pink-50 cursor-pointer hover:shadow-md'
                    : 'border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => locked ? (onAuthRequired && onAuthRequired()) : handleTemplateSelect(template.id)}
            >
              {/* Lock overlay */}
              {locked && (
                <div className="absolute inset-0 rounded-lg flex flex-col items-center justify-center z-10"
                  style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}>
                    <Lock size={16} color="white" />
                  </div>
                  <p className="text-xs font-bold text-purple-700">Sign in to unlock</p>
                </div>
              )}

              {isRecommended(template.id) && !locked && (
                <div className="absolute -top-2 -right-2 bg-sexy-pink-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Recommended</span>
                </div>
              )}

              {selectedTemplate === template.id && !locked && (
                <div className="absolute top-2 right-2 bg-sexy-pink-600 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}

              <div className="mb-3">
                <h3 className={`font-semibold mb-1 ${locked ? 'text-gray-400' : 'text-gray-900'}`}>{template.name}</h3>
                <p className={`text-sm mb-2 ${locked ? 'text-gray-300' : 'text-gray-600'}`}>{template.description}</p>
                {!locked && (
                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                    <span className={`px-2 py-1 rounded-full bg-${template.category === 'modern' ? 'blue' : template.category === 'creative' ? 'purple' : template.category === 'classic' ? 'gray' : template.category === 'minimal' ? 'green' : 'indigo'}-100 text-${template.category === 'modern' ? 'blue' : template.category === 'creative' ? 'purple' : template.category === 'classic' ? 'gray' : template.category === 'minimal' ? 'green' : 'indigo'}-800`}>
                      {template.category}
                    </span>
                    {getRecommendationScore(template.id) > 0 && (
                      <span className="text-sexy-pink-600 font-medium">{getRecommendationScore(template.id)}% match</span>
                    )}
                  </div>
                )}
              </div>

              {!locked && (
                <>
                  <div className="text-xs text-gray-500 mb-3">
                    <div className="mb-1"><strong>Best for:</strong> {template.suitedFor.slice(0, 2).join(', ')}</div>
                    <div><strong>Industries:</strong> {template.industries.slice(0, 2).join(', ')}</div>
                  </div>
                  {getRecommendationReasons(template.id).length > 0 && (
                    <div className="text-xs text-sexy-pink-600 bg-sexy-pink-50 rounded p-2">
                      <strong>Why recommended:</strong>
                      <ul className="mt-1 space-y-1">
                        {getRecommendationReasons(template.id).slice(0, 2).map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template.id); }}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Customization MODAL (authed only) */}
      {showCustomization && selectedTemplateObj && !requiresAuthForMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-sexy-pink-600" />
                <h3 className="text-lg font-bold text-gray-900">Customize Template</h3>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >✕</button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Applying to: <span className="text-purple-600">{selectedTemplateObj.name}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={customizations?.font || selectedTemplateObj.customizations.fonts[0]}
                  onChange={(e) => handleCustomizationChange('font', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                >
                  {selectedTemplateObj.customizations.fonts.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
                <div className="flex gap-3 flex-wrap">
                  {selectedTemplateObj.customizations.accentColors.map((color) => {
                    const isSelected = (customizations?.accentColor || selectedTemplateObj.customizations.accentColors[0]) === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleCustomizationChange('accentColor', color)}
                        className="w-10 h-10 rounded-full transition-all focus:outline-none"
                        style={{
                          backgroundColor: color,
                          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                          boxShadow: isSelected ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                        }}
                        aria-label={`Select ${color}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizations?.hideEmptySections ?? true}
                    onChange={(e) => handleCustomizationChange('hideEmptySections', e.target.checked)}
                    className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Hide empty sections</span>
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setShowCustomization(false)}
                className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <h3 className="text-base font-semibold text-gray-900 truncate pr-4">
                Template Preview: {templates.find(t => t.id === previewTemplate)?.name}
              </h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <TemplatePreview resume={resume} templateId={previewTemplate} customizations={customizations} />
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 shrink-0">
              <button onClick={() => setPreviewTemplate(null)} className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">Close</button>
              <button
                onClick={() => { handleTemplateSelect(previewTemplate); setPreviewTemplate(null); }}
                className="px-6 py-2.5 bg-sexy-pink-600 text-white rounded-xl hover:bg-sexy-pink-700 transition-colors text-sm font-semibold"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatePreview({
  resume, templateId, customizations
}: {
  resume: Resume;
  templateId: string;
  customizations?: TemplateCustomization;
}) {
  const [rendered, setRendered] = useState<{ html: string; css: string } | null>(null);

  useEffect(() => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (template) {
      const r = renderTemplate(resume, template, customizations);
      setRendered({ html: r.html, css: r.css });
    }
  }, [resume, templateId, customizations]);

  if (!rendered) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sexy-pink-600" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
      <style dangerouslySetInnerHTML={{ __html: rendered.css }} />
      <div style={{ width: '816px', transformOrigin: 'top left', transform: 'scale(var(--preview-scale, 0.45))', display: 'block' }}
        ref={(el) => {
          if (el) {
            const parent = el.parentElement;
            if (parent) {
              const s = parent.offsetWidth / 816;
              el.style.setProperty('--preview-scale', String(s));
              parent.style.height = `${el.scrollHeight * s}px`;
            }
          }
        }}
        dangerouslySetInnerHTML={{ __html: rendered.html }} />
    </div>
  );
}

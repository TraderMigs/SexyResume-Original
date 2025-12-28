import React, { useState, useEffect } from 'react';
import { Resume } from '../types/resume';
import { Template, TemplateRecommendation, TemplateCustomization } from '../types/template';
import { getAllTemplates } from '../lib/templateRegistry';
import { getTemplateRecommendations } from '../lib/templateRecommendation';
import { renderTemplate } from '../lib/templateRenderer';
import { trackEvent } from '../lib/analytics';
import { Palette, Wand2, Eye, Check, Star, Sparkles } from 'lucide-react';

interface TemplateSelectorProps {
  resume: Resume;
  selectedTemplate: string;
  onTemplateChange: (templateId: string, customizations?: Partial<TemplateCustomization>) => void;
  customizations?: TemplateCustomization;
}

export default function TemplateSelector({ 
  resume, 
  selectedTemplate, 
  onTemplateChange, 
  customizations 
}: TemplateSelectorProps) {
  const [templates] = useState<Template[]>(getAllTemplates());
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (resume.personalInfo.fullName || resume.experience.length > 0) {
      const recs = getTemplateRecommendations(resume);
      setRecommendations(recs);
    }
  }, [resume]);

  const handleTemplateSelect = (templateId: string) => {
    const recommendation = recommendations.find(r => r.template.id === templateId);
    const rankInRecs = recommendations.findIndex(r => r.template.id === templateId);

    // Track template chosen event
    trackEvent('template_chosen', {
      template_id: templateId,
      recommendation_score: recommendation?.score,
      was_recommended: !!recommendation,
      rank_in_recommendations: rankInRecs >= 0 ? rankInRecs + 1 : undefined
    });

    onTemplateChange(templateId);
    setPreviewTemplate(null);
  };

  const handleCustomizationChange = (field: keyof TemplateCustomization, value: any) => {
    const newCustomizations = { ...customizations, [field]: value };
    onTemplateChange(selectedTemplate, newCustomizations);
  };

  const getRecommendationScore = (templateId: string): number => {
    const rec = recommendations.find(r => r.template.id === templateId);
    return rec ? rec.score : 0;
  };

  const getRecommendationReasons = (templateId: string): string[] => {
    const rec = recommendations.find(r => r.template.id === templateId);
    return rec ? rec.reasons : [];
  };

  const isRecommended = (templateId: string): boolean => {
    return recommendations.slice(0, 2).some(r => r.template.id === templateId);
  };

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Choose Template</h2>
        </div>
        <button
          onClick={() => setShowCustomization(!showCustomization)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500"
        >
          <Wand2 className="w-4 h-4" />
          <span>Customize</span>
        </button>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
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
                <div className="text-xs text-sexy-pink-600">
                  {rec.reasons.slice(0, 2).join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? 'border-sexy-pink-500 bg-sexy-pink-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            {isRecommended(template.id) && (
              <div className="absolute -top-2 -right-2 bg-sexy-pink-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>Recommended</span>
              </div>
            )}

            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 bg-sexy-pink-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}

            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-700">
                <span className={`px-2 py-1 rounded-full bg-${template.category === 'modern' ? 'blue' : template.category === 'creative' ? 'purple' : template.category === 'classic' ? 'gray' : template.category === 'minimal' ? 'green' : 'indigo'}-100 text-${template.category === 'modern' ? 'blue' : template.category === 'creative' ? 'purple' : template.category === 'classic' ? 'gray' : template.category === 'minimal' ? 'green' : 'indigo'}-800`}>
                  {template.category}
                </span>
                {getRecommendationScore(template.id) > 0 && (
                  <span className="text-sexy-pink-600 font-medium">
                    {getRecommendationScore(template.id)}% match
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              <div className="mb-1">
                <strong>Best for:</strong> {template.suitedFor.slice(0, 2).join(', ')}
              </div>
              <div>
                <strong>Industries:</strong> {template.industries.slice(0, 2).join(', ')}
              </div>
            </div>

            {getRecommendationReasons(template.id).length > 0 && (
              <div className="text-xs text-sexy-pink-600 bg-sexy-pink-50 rounded p-2">
                <strong>Why recommended:</strong>
                <ul className="mt-1 space-y-1">
                  {getRecommendationReasons(template.id).slice(0, 2).map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewTemplate(template.id);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customization Panel */}
      {showCustomization && selectedTemplateObj && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Customize Template</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={customizations?.font || selectedTemplateObj.customizations.fonts[0]}
                onChange={(e) => handleCustomizationChange('font', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
              >
                {selectedTemplateObj.customizations.fonts.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="flex space-x-2">
                {selectedTemplateObj.customizations.accentColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleCustomizationChange('accentColor', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500 ${
                      (customizations?.accentColor || selectedTemplateObj.customizations.accentColors[0]) === color
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} accent color`}
                  />
                ))}
              </div>
            </div>

            {/* Section Order */}
            {selectedTemplateObj.customizations.sectionOrder && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Order
                </label>
                <div className="text-sm text-gray-600">
                  Drag and drop functionality would be implemented here for reordering sections.
                </div>
              </div>
            )}

            {/* Hide Empty Sections */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={customizations?.hideEmptySections ?? true}
                  onChange={(e) => handleCustomizationChange('hideEmptySections', e.target.checked)}
                  className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500"
                />
                <span className="text-sm text-gray-700">Hide empty sections</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Template Preview: {templates.find(t => t.id === previewTemplate)?.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <TemplatePreview 
                resume={resume} 
                templateId={previewTemplate} 
                customizations={customizations}
              />
            </div>
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleTemplateSelect(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-6 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
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

// Template Preview Component
function TemplatePreview({ 
  resume, 
  templateId, 
  customizations 
}: { 
  resume: Resume; 
  templateId: string; 
  customizations?: TemplateCustomization;
}) {
  const [renderedTemplate, setRenderedTemplate] = useState<{ html: string; css: string } | null>(null);

  useEffect(() => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (template) {
      const rendered = renderTemplate(resume, template, customizations);
      setRenderedTemplate({ html: rendered.html, css: rendered.css });
    }
  }, [resume, templateId, customizations]);

  if (!renderedTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sexy-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="transform scale-75 origin-top-left w-[133%] border border-gray-200 rounded-lg overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: renderedTemplate.css }} />
      <div dangerouslySetInnerHTML={{ __html: renderedTemplate.html }} />
    </div>
  );
}
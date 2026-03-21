import React, { useEffect, useState } from 'react';
import { Resume } from '../types/resume';
import { getAllTemplates } from '../lib/templateRegistry';
import { renderTemplate } from '../lib/templateRenderer';
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [renderedCss, setRenderedCss] = useState<string>('');

  useEffect(() => {
    const templates = getAllTemplates();
    const template = templates.find(t => t.id === resume.template) || templates[0];
    if (template) {
      const rendered = renderTemplate(resume, template);
      setRenderedHtml(rendered.html);
      setRenderedCss(rendered.css);
    }
  }, [resume]);

  if (!renderedHtml) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Template: <span className="font-medium text-gray-700 capitalize">{resume.template}</span>
        </p>
        <p className="text-xs text-gray-400">This is how your resume will look when exported</p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md bg-white">
        <style dangerouslySetInnerHTML={{ __html: renderedCss }} />
        <div
          className="resume-preview-container"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}

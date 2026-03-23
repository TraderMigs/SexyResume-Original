import React, { useState } from 'react';
import { CoverLetterRequest } from '../types/coverLetter';
import { Resume } from '../types/resume';
import { useCoverLetter } from '../hooks/useCoverLetter';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Wand2,
  Settings,
  AlertCircle,
  Loader,
  Copy,
  Printer,
  ChevronLeft,
  CheckCircle,
  X
} from 'lucide-react';

interface CoverLetterGeneratorProps {
  resume: Resume;
  onClose: () => void;
}

export default function CoverLetterGenerator({ resume, onClose }: CoverLetterGeneratorProps) {
  const { user } = useAuth();
  const { generateCoverLetter, generating, error, clearError } = useCoverLetter();

  const [request, setRequest] = useState<CoverLetterRequest>({
    resumeId: resume.id,
    targetRole: '',
    companyName: '',
    jobDescription: '',
    tone: 'neutral',
    length: 'standard',
    keywords: [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'form' | 'result'>('form');

  const handleGenerate = async () => {
    if (!request.targetRole.trim()) return;

    try {
      clearError();
      const coverLetter = await generateCoverLetter({
        ...request,
        resumeData: {
          personalInfo: resume.personalInfo,
          experience: resume.experience,
          skills: resume.skills,
          projects: resume.projects,
          education: resume.education,
        },
        keywords: keywordInput.split(',').map(k => k.trim()).filter(k => k.length > 0)
      });

      const text = coverLetter?.plain_text
        || coverLetter?.sections?.map((s: any) => s.content).join('\n\n')
        || '';

      setGeneratedText(text);
      setView('result');
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = generatedText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Cover Letter – ${resume.personalInfo.fullName || 'Resume'}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body><pre>${generatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const updateRequest = (field: keyof CoverLetterRequest, value: any) => {
    setRequest(prev => ({ ...prev, [field]: value }));
  };

  // ── Result View ──────────────────────────────────────────────────────────────
  if (view === 'result') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setView('form')}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Cover Letter Ready</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={() => { setGeneratedText(''); setView('form'); }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors ml-auto"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate New</span>
            </button>
          </div>

          {/* Letter body */}
          <div className="flex-1 overflow-y-auto p-6">
            <textarea
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              className="w-full h-full min-h-[400px] p-4 border border-gray-200 rounded-lg font-serif text-gray-800 leading-relaxed resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: '13px', lineHeight: '1.7' }}
            />
            <p className="text-xs text-gray-400 mt-2">You can edit the text above before copying or printing.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form View ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Cover Letter</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Advanced</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={request.targetRole}
                onChange={(e) => updateRequest('targetRole', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={request.companyName}
                onChange={(e) => updateRequest('companyName', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Job description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Job Description <span className="text-gray-400 font-normal">(optional — improves targeting)</span>
            </label>
            <textarea
              value={request.jobDescription}
              onChange={(e) => updateRequest('jobDescription', e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              placeholder="Paste the job description here..."
            />
          </div>

          {/* Tone & Length */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tone</label>
              <select
                value={request.tone}
                onChange={(e) => updateRequest('tone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="formal">Formal</option>
                <option value="neutral">Neutral</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Length</label>
              <select
                value={request.length}
                onChange={(e) => updateRequest('length', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="short">Short (~250 words)</option>
                <option value="standard">Standard (300–400 words)</option>
                <option value="detailed">Detailed (400–500 words)</option>
              </select>
            </div>
          </div>

          {/* Advanced */}
          {showAdvanced && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keywords to Emphasize
                </label>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="React, leadership, project management (comma-separated)"
                />
              </div>

            </div>
          )}

          {/* Resume context chip */}
          <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-3 text-sm text-gray-600">
            <span>Using: <strong className="text-gray-800">{resume.personalInfo.fullName || 'Your resume'}</strong></span>
            <span>·</span>
            <span>{resume.experience.length} positions</span>
            <span>·</span>
            <span>{resume.skills.length} skills</span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-5 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !request.targetRole.trim()}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate Cover Letter</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

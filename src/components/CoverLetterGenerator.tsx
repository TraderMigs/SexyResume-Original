import React, { useState, useEffect } from 'react';
import { CoverLetterRequest } from '../types/coverLetter';
import { Resume } from '../types/resume';
import { useCoverLetter } from '../hooks/useCoverLetter';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Wand2, Settings, AlertCircle, Loader, Save, Eye } from 'lucide-react';

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
    matchResumeTemplate: true
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    if (!request.targetRole.trim()) {
      return;
    }

    try {
      clearError();
      const coverLetter = await generateCoverLetter({
        ...request,
        keywords: keywordInput.split(',').map(k => k.trim()).filter(k => k.length > 0)
      });
      
      // Navigate to editor (this would be handled by parent component)
      console.log('Generated cover letter:', coverLetter);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const updateRequest = (field: keyof CoverLetterRequest, value: any) => {
    setRequest(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600 mb-4">
            Please sign in to generate personalized cover letters with AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Generate Cover Letter</h2>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Advanced</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Role *
            </label>
            <input
              type="text"
              value={request.targetRole}
              onChange={(e) => updateRequest('targetRole', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
              placeholder="Software Engineer, Marketing Manager, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={request.companyName}
              onChange={(e) => updateRequest('companyName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
              placeholder="Company Name (optional)"
            />
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <textarea
            value={request.jobDescription}
            onChange={(e) => updateRequest('jobDescription', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all resize-none"
            placeholder="Paste the job description here to create a more targeted cover letter..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Adding a job description helps create a more personalized and relevant cover letter.
          </p>
        </div>

        {/* Style Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={request.tone}
              onChange={(e) => updateRequest('tone', e.target.value as CoverLetterRequest['tone'])}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
            >
              <option value="formal">Formal</option>
              <option value="neutral">Neutral</option>
              <option value="friendly">Friendly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length
            </label>
            <select
              value={request.length}
              onChange={(e) => updateRequest('length', e.target.value as CoverLetterRequest['length'])}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
            >
              <option value="short">Short (250 words)</option>
              <option value="standard">Standard (300-400 words)</option>
              <option value="detailed">Detailed (400-500 words)</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords to Emphasize
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
                placeholder="React, leadership, project management (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate keywords with commas. These will be naturally incorporated into your cover letter.
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={request.matchResumeTemplate}
                  onChange={(e) => updateRequest('matchResumeTemplate', e.target.checked)}
                  className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500"
                />
                <span className="text-sm text-gray-700">Match resume template styling</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Apply the same fonts and colors as your resume for consistent branding.
              </p>
            </div>
          </div>
        )}

        {/* Resume Context */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Using Resume Data</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium">{resume.personalInfo.fullName || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600">Experience:</span>
              <span className="ml-2 font-medium">{resume.experience.length} positions</span>
            </div>
            <div>
              <span className="text-gray-600">Skills:</span>
              <span className="ml-2 font-medium">{resume.skills.length} skills</span>
            </div>
            <div>
              <span className="text-gray-600">Projects:</span>
              <span className="ml-2 font-medium">{resume.projects?.length || 0} projects</span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex space-x-4">
          <button
            onClick={handleGenerate}
            disabled={generating || !request.targetRole.trim()}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating Cover Letter...</span>
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
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Better Results</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include a detailed job description for more targeted content</li>
            <li>• Add specific keywords from the job posting</li>
            <li>• Choose the appropriate tone for the company culture</li>
            <li>• Review and edit the generated content before sending</li>
          </ul>
        </div>

        {/* AI Content Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">⚠️ AI Content Disclaimer</h4>
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> AI-generated cover letters are assistive tools only. You are responsible for:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 mt-2">
            <li>• Reviewing all content for accuracy and appropriateness</li>
            <li>• Verifying that information matches your actual experience</li>
            <li>• Ensuring content is suitable for your target employer</li>
            <li>• Taking full responsibility for the final content you submit</li>
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            AI-generated content is not guaranteed to be accurate, complete, or suitable for all situations.
          </p>
        </div>
      </div>
    </div>
  );
}
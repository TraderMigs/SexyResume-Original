import React, { useState } from 'react';
import { Resume } from '../types/resume';
import { Eye, Download, AlertTriangle, X, FileText, File, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePayments } from '../hooks/usePayments';

interface ExportPreviewProps {
  resume: Resume;
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'docx' | 'txt' | 'ats', watermark: boolean) => void;
}

export default function ExportPreview({ resume, isOpen, onClose, onExport }: ExportPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'txt' | 'ats'>('pdf');
  const [previewMode, setPreviewMode] = useState(true);
  const { user } = useAuth();
  const { entitlement } = usePayments();

  if (!isOpen) return null;

  const handlePreview = () => {
    onExport(selectedFormat, true); // With watermark for preview
  };

  const handleFullExport = () => {
    onExport(selectedFormat, false); // Without watermark for full export
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'docx': return <File className="w-5 h-5" />;
      case 'txt': return <FileText className="w-5 h-5" />;
      case 'ats': return <Zap className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf': return 'Professional PDF with perfect formatting';
      case 'docx': return 'Editable Word document';
      case 'txt': return 'Simple plain text format';
      case 'ats': return 'Optimized for applicant tracking systems';
      default: return '';
    }
  };

  const getFormatFeatures = (format: string) => {
    switch (format) {
      case 'pdf':
        return [
          'Perfect page breaks and pagination',
          'Embedded fonts for consistent display',
          'Print-ready with proper margins',
          'Vector graphics and gradients'
        ];
      case 'docx':
        return [
          'Fully editable in Microsoft Word',
          'Maintains formatting and styles',
          'Compatible with Google Docs',
          'Easy to customize further'
        ];
      case 'txt':
        return [
          'Universal compatibility',
          'Lightweight and fast',
          'Email-friendly format',
          'No formatting dependencies'
        ];
      case 'ats':
        return [
          'Semantic headings for ATS parsing',
          'Keywords prominently featured',
          'Simple structure ATS can read',
          'Optimized for automated screening'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Export Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { format: 'pdf' as const, label: 'PDF', recommended: true },
                { format: 'docx' as const, label: 'Word Document' },
                { format: 'txt' as const, label: 'Plain Text' },
                { format: 'ats' as const, label: 'ATS-Optimized', special: true }
              ].map(({ format, label, recommended, special }) => (
                <div
                  key={format}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all relative ${
                    selectedFormat === format
                      ? 'border-sexy-pink-500 bg-sexy-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format)}
                >
                  {recommended && (
                    <div className="absolute -top-2 -right-2 bg-sexy-pink-600 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                  {special && (
                    <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      ATS-Ready
                    </div>
                  )}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`${selectedFormat === format ? 'text-sexy-pink-600' : 'text-gray-400'}`}>
                      {getFormatIcon(format)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-500">{getFormatDescription(format)}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    {getFormatFeatures(format).slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Format Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {selectedFormat === 'ats' ? 'ATS-Optimized' : selectedFormat.toUpperCase()} Format Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              {getFormatFeatures(selectedFormat).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview vs Full Export */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">Preview vs Full Export</h3>
                <div className="text-sm text-amber-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="preview"
                      name="exportType"
                      checked={previewMode}
                      onChange={() => setPreviewMode(true)}
                      className="text-amber-600"
                    />
                    <label htmlFor="preview" className="font-medium">Preview Mode (Free)</label>
                  </div>
                  <div className="ml-6 text-xs space-y-1">
                    <p>• Includes watermark overlay for identification</p>
                    <p>• Shows exact formatting and layout</p>
                    <p>• Perfect for reviewing before final export</p>
                    <p>• All features visible except watermark removal</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <input
                      type="radio"
                      id="full"
                      name="exportType"
                      checked={!previewMode}
                      onChange={() => setPreviewMode(false)}
                      className="text-amber-600"
                    />
                    <label htmlFor="full" className="font-medium">
                      Full Export {!entitlement?.exportUnlocked && '(Requires Purchase)'}
                    </label>
                  </div>
                  <div className="ml-6 text-xs space-y-1">
                    <p>• No watermarks or restrictions</p>
                    <p>• Professional quality output</p>
                    <p>• Ready for job applications</p>
                    <p>• Includes all premium formatting features</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Resume Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{resume.personalInfo.fullName || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-gray-600">Template:</span>
                <span className="ml-2 font-medium capitalize">{resume.template}</span>
              </div>
              <div>
                <span className="text-gray-600">Experience:</span>
                <span className="ml-2 font-medium">{resume.experience.length} positions</span>
              </div>
              <div>
                <span className="text-gray-600">Education:</span>
                <span className="ml-2 font-medium">{resume.education.length} entries</span>
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

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {previewMode ? (
              <button
                onClick={handlePreview}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Eye className="w-5 h-5" />
                <span>Generate Preview ({selectedFormat === 'ats' ? 'ATS' : selectedFormat.toUpperCase()})</span>
              </button>
            ) : (
              <button
                onClick={handleFullExport}
                disabled={!entitlement?.exportUnlocked}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export Full Resume ({selectedFormat === 'ats' ? 'ATS' : selectedFormat.toUpperCase()})</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {!entitlement?.exportUnlocked && !previewMode && (
            <div className="text-center text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p>
                <strong>Purchase required for full export.</strong> 
                Preview mode is always free and shows the exact formatting you'll get.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
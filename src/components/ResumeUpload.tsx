import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';
import { Resume } from '../types/resume';
import { useParseReview } from '../hooks/useParseReview';
import { validateFile, sanitizeInput, logSecurityEvent } from '../lib/security';
import { trackEvent } from '../lib/analytics';
import ParseReviewWorkspace from './ParseReviewWorkspace';

interface ResumeUploadProps {
  onParsedResume: (resume: Partial<Resume>) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'parsing' | 'success' | 'error';
  progress: number;
  error?: string;
  parsedData?: Partial<Resume>;
  confidence?: number;
}

export default function ResumeUpload({ onParsedResume, onClose, isOpen }: ResumeUploadProps) {
  const { createParseReview } = useParseReview();
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [showParseReview, setShowParseReview] = useState(false);
  const [parseReviewData, setParseReviewData] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['.pdf', '.docx', '.doc', '.txt'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    const validation = validateFileSecure(file);
    return validation.isValid ? null : validation.error || 'Invalid file';
  };

  const validateFileSecure = (file: File): { isValid: boolean; error?: string } => {
    // Enhanced file validation with security checks
    const validation = validateFile(file);
    if (!validation.isValid) {
      logSecurityEvent({
        type: 'invalid_input',
        details: `File upload rejected: ${validation.error}`,
        ip: 'unknown'
      });
      return validation;
    }

    // Additional security checks
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.php', '.asp', '.jsp'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      logSecurityEvent({
        type: 'suspicious_activity',
        details: `Suspicious file extension detected: ${file.name}`,
        ip: 'unknown'
      });
      return { isValid: false, error: 'File type not allowed for security reasons' };
    }

    // Check for double extensions (e.g., file.pdf.exe)
    const extensionCount = (file.name.match(/\./g) || []).length;
    if (extensionCount > 1) {
      return { isValid: false, error: 'Files with multiple extensions are not allowed' };
    }

    return { isValid: true };
  };
  const uploadAndParseResume = async (file: File) => {
    const startTime = Date.now();

    try {
      setUploadState({ status: 'uploading', progress: 20 });

      // Track parse started event
      trackEvent('parse_started', {
        file_type: file.type,
        file_size: file.size
      });

      // Create parse review for enhanced validation
      const parseReview = await createParseReview(file);

      const duration_ms = Date.now() - startTime;
      const sections_found = [
        parseReview.personalInfo,
        parseReview.experience,
        parseReview.education,
        parseReview.skills,
        parseReview.projects
      ].filter(Boolean).length;

      // Track parse completed event
      trackEvent('parse_completed', {
        confidence: parseReview.overallConfidence || 0.5,
        sections_found,
        duration_ms
      });

      setUploadState({
        status: 'success',
        progress: 100,
        parsedData: parseReview,
        confidence: parseReview.overallConfidence
      });

      // Show parse review workspace
      setParseReviewData(parseReview);
      setShowParseReview(true);

    } catch (error: any) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error.message || 'Failed to parse resume'
      });
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({ status: 'error', progress: 0, error: validationError });
      return;
    }

    await uploadAndParseResume(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUseParseData = () => {
    if (uploadState.parsedData) {
      onParsedResume(uploadState.parsedData);
      onClose();
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleParseReviewComplete = (validatedData: any) => {
    onParsedResume(validatedData);
    setShowParseReview(false);
    onClose();
  };

  const handleParseReviewCancel = () => {
    setShowParseReview(false);
    setUploadState({ status: 'idle', progress: 0 });
  };

  if (!isOpen) return null;

  if (showParseReview && parseReviewData) {
    return (
      <ParseReviewWorkspace
        parseData={parseReviewData}
        onComplete={handleParseReviewComplete}
        onCancel={handleParseReviewCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Resume</h2>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500"
            aria-label="Close upload dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {uploadState.status === 'idle' && (
            <div>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-sexy-pink-500 bg-sexy-pink-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your resume here, or click to browse
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF, Word documents, and text files (max 10MB)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="resume-file-input"
                  aria-label="Upload resume file"
                />
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload your existing resume in PDF, Word, or text format</li>
                      <li>• Our AI will extract and organize your information</li>
                      <li>• Review and edit the parsed data before saving</li>
                      <li>• Your original file is automatically deleted after processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(uploadState.status === 'uploading' || uploadState.status === 'parsing') && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <Loader className="w-8 h-8 text-sexy-pink-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {uploadState.status === 'uploading' ? 'Uploading...' : 'Parsing Resume...'}
              </h3>
              <p className="text-gray-500 mb-4">
                {uploadState.status === 'uploading' 
                  ? 'Uploading your resume file'
                  : 'AI is extracting information from your resume'
                }
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-sexy-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{uploadState.progress}% complete</p>
            </div>
          )}

          {uploadState.status === 'success' && uploadState.parsedData && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">Ready for Review!</h3>
              </div>

              {uploadState.confidence && uploadState.confidence < 0.7 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-1">Manual Review Required</h4>
                      <p className="text-sm text-amber-800">
                        The AI extraction has low confidence. Please review and correct the data in the next step.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">Parse Analysis:</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Overall Confidence:</span>
                    <span className="ml-2 text-gray-600">{Math.round(uploadState.confidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sections Found:</span>
                    <span className="ml-2 text-gray-600">{uploadState.parsedData.sections?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fields Detected:</span>
                    <span className="ml-2 text-gray-600">
                      {uploadState.parsedData.sections?.reduce((total, section) => total + section.fields.length, 0) || 0}
                    </span>
                  </div>
                  {uploadState.confidence && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-700">Next Step:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        uploadState.confidence >= 0.8 
                          ? 'bg-green-100 text-green-800'
                          : uploadState.confidence >= 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {uploadState.confidence >= 0.8 ? 'Quick Review' : 'Manual Validation Required'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowParseReview(true)}
                  className="flex-1 px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors font-medium"
                >
                  Review & Validate Data
                </button>
                <button
                  onClick={resetUpload}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Upload Different File
                </button>
              </div>
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Failed</h3>
              <p className="text-red-600 mb-6">{uploadState.error}</p>
              <button
                onClick={resetUpload}
                className="px-6 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
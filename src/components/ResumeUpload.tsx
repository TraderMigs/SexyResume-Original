import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { parseResume } from '../lib/fileTextExtract';
import { Resume } from '../types/resume';
import DOMPurify from 'dompurify';

interface ResumeUploadProps {
  onResumeLoaded: (resume: Partial<Resume>) => void;
  onClose: () => void;
}

export default function ResumeUpload({ onResumeLoaded, onClose }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, Word, or text files only.');
      }

      const parsedData = await parseResume(file);
      
      const sanitizedData = {
        ...parsedData,
        personalInfo: parsedData.personalInfo ? {
          fullName: DOMPurify.sanitize(parsedData.personalInfo.fullName || ''),
          email: DOMPurify.sanitize(parsedData.personalInfo.email || ''),
          phone: DOMPurify.sanitize(parsedData.personalInfo.phone || ''),
          location: DOMPurify.sanitize(parsedData.personalInfo.location || ''),
          linkedin: DOMPurify.sanitize(parsedData.personalInfo.linkedin || ''),
          website: DOMPurify.sanitize(parsedData.personalInfo.website || ''),
          summary: DOMPurify.sanitize(parsedData.personalInfo.summary || '')
        } : undefined
      };

      onResumeLoaded(sanitizedData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse resume';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onResumeLoaded, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Resume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUploading}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Processing your resume...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2">
                Drop your resume here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports PDF, Word documents, and text files (max 10MB)
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
                <span className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer inline-block">
                  Choose File
                </span>
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">How it works</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Upload your existing resume in PDF, Word, or text format</li>
                <li>Our AI will extract and organize your information</li>
                <li>Review and edit the parsed data before saving</li>
                <li>Your original file is automatically deleted after processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

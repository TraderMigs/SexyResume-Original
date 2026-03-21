import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
  const [progress, setProgress] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setProgress('Uploading your resume...');

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB limit.');

      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, Word, or text files only.');
      }

      setProgress('AI is reading your resume...');

      const formData = new FormData();
      formData.append('resume', file);

      // No login required — uses anon key
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Parse failed' }));
        throw new Error(err.error || 'Failed to parse resume. Please try again.');
      }

      const result = await response.json();
      const parsed = result.parsedResume;

      const sanitized: Partial<Resume> = {
        personalInfo: parsed.personalInfo ? {
          fullName: DOMPurify.sanitize(parsed.personalInfo.fullName || ''),
          email: DOMPurify.sanitize(parsed.personalInfo.email || ''),
          phone: DOMPurify.sanitize(parsed.personalInfo.phone || ''),
          location: DOMPurify.sanitize(parsed.personalInfo.location || ''),
          linkedin: DOMPurify.sanitize(parsed.personalInfo.linkedin || ''),
          website: DOMPurify.sanitize(parsed.personalInfo.website || ''),
          summary: DOMPurify.sanitize(parsed.personalInfo.summary || ''),
        } : undefined,
        experience: parsed.experience || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
      };

      onResumeLoaded(sanitized);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  }, [onResumeLoaded, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Resume</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" disabled={isUploading}>
            &times;
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">{progress}</p>
              <p className="text-sm text-gray-400 mt-1">This takes a few seconds...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2 font-medium">Drop your resume here, or click to browse</p>
              <p className="text-sm text-gray-500 mb-6">PDF, Word (.docx), or text files — max 10MB</p>
              <label className="inline-block cursor-pointer">
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileInput} disabled={isUploading} />
                <span className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
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

        <div className="mt-5 p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How it works</p>
            <p>Our AI reads your resume and automatically fills in your information — name, contact details, work history, education, and skills. Review everything before saving.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

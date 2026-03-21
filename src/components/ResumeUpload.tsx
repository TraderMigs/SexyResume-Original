import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Resume } from '../types/resume';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';

interface ResumeUploadProps {
  onResumeLoaded: (resume: Partial<Resume>) => void;
  onClose: () => void;
}

export default function ResumeUpload({ onResumeLoaded, onClose }: ResumeUploadProps) {
  const { session } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setProgress('Uploading your resume...');

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

      // If user is signed in, use the Claude-powered edge function
      if (session?.access_token) {
        setProgress('Analyzing your resume with AI...');

        const formData = new FormData();
        formData.append('resume', file);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to parse resume');
        }

        const result = await response.json();
        const parsed = result.parsedResume;

        // Sanitize all text fields
        const sanitized: Partial<Resume> = {
          personalInfo: parsed.personalInfo
            ? {
                fullName: DOMPurify.sanitize(parsed.personalInfo.fullName || ''),
                email: DOMPurify.sanitize(parsed.personalInfo.email || ''),
                phone: DOMPurify.sanitize(parsed.personalInfo.phone || ''),
                location: DOMPurify.sanitize(parsed.personalInfo.location || ''),
                linkedin: DOMPurify.sanitize(parsed.personalInfo.linkedin || ''),
                website: DOMPurify.sanitize(parsed.personalInfo.website || ''),
                summary: DOMPurify.sanitize(parsed.personalInfo.summary || ''),
              }
            : undefined,
          experience: parsed.experience || [],
          education: parsed.education || [],
          skills: parsed.skills || [],
          projects: parsed.projects || [],
        };

        setProgress('Done!');
        onResumeLoaded(sanitized);
        onClose();

      } else {
        // Not signed in — use client-side basic text extraction (no AI parsing)
        // Just load raw text into the summary so user can fill in manually
        setProgress('Loading file...');

        let rawText = '';
        if (file.type === 'text/plain') {
          rawText = await file.text();
        } else {
          throw new Error('Please sign in to use AI-powered resume parsing for PDF and Word files.');
        }

        const sanitized: Partial<Resume> = {
          personalInfo: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            website: '',
            summary: DOMPurify.sanitize(rawText.substring(0, 1000)),
          },
          experience: [],
          education: [],
          skills: [],
          projects: [],
        };

        onResumeLoaded(sanitized);
        onClose();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse resume';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress('');
    }
  }, [onResumeLoaded, onClose, session]);

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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={isUploading}
          >
            &times;
          </button>
        </div>

        {!session && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Sign in to unlock AI-powered parsing for PDF and Word files.
          </div>
        )}

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
              <p className="text-gray-600 font-medium">{progress}</p>
              <p className="text-sm text-gray-400 mt-1">This may take a few seconds...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2 font-medium">
                Drop your resume here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PDF, Word (.docx), or text files — max 10MB
              </p>
              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
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

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How it works</p>
              <p>Our AI reads your resume and automatically fills in all your information — name, contact details, work history, education, and skills. Review everything before saving.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

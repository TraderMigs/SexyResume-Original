import React from 'react';
import { CoverLetter } from '../types/coverLetter';
import { useCoverLetter } from '../hooks/useCoverLetter';
import { FileText, Calendar, CreditCard as Edit3, Trash2, Eye, MoreVertical } from 'lucide-react';

interface CoverLetterListProps {
  onEdit: (coverLetter: CoverLetter) => void;
  onPreview: (coverLetter: CoverLetter) => void;
}

export default function CoverLetterList({ onEdit, onPreview }: CoverLetterListProps) {
  const { coverLetters, loading, deleteCoverLetter } = useCoverLetter();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cover letter?')) {
      try {
        await deleteCoverLetter(id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'formal': return 'bg-blue-100 text-blue-800';
      case 'friendly': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLengthColor = (length: string) => {
    switch (length) {
      case 'short': return 'bg-yellow-100 text-yellow-800';
      case 'detailed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sexy-pink-600"></div>
        </div>
      </div>
    );
  }

  if (coverLetters.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Cover Letters Yet</h3>
          <p className="text-gray-600">
            Generate your first AI-powered cover letter to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-5 h-5 text-sexy-pink-600" />
        <h2 className="text-xl font-semibold text-gray-900">Your Cover Letters</h2>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
          {coverLetters.length}
        </span>
      </div>

      <div className="space-y-4">
        {coverLetters.map((coverLetter) => (
          <div
            key={coverLetter.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium text-gray-900">{coverLetter.targetRole}</h3>
                  {coverLetter.companyName && (
                    <>
                      <span className="text-gray-400">at</span>
                      <span className="text-sexy-pink-600 font-medium">{coverLetter.companyName}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(coverLetter.createdAt)}</span>
                  </div>
                  <span>{coverLetter.wordCount} words</span>
                  {coverLetter.lastEditedAt !== coverLetter.createdAt && (
                    <span>Edited {formatDate(coverLetter.lastEditedAt)}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(coverLetter.tone)}`}>
                    {coverLetter.tone}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLengthColor(coverLetter.length)}`}>
                    {coverLetter.length}
                  </span>
                  {coverLetter.matchResumeTemplate && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-sexy-pink-100 text-sexy-pink-800">
                      Styled
                    </span>
                  )}
                  {coverLetter.keywords.length > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {coverLetter.keywords.length} keywords
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onPreview(coverLetter)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onEdit(coverLetter)}
                  className="p-2 text-gray-400 hover:text-sexy-pink-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(coverLetter.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
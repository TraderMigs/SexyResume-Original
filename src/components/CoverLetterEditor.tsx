import React, { useState, useEffect } from 'react';
import { CoverLetter, CoverLetterSection } from '../types/coverLetter';
import { useCoverLetter } from '../hooks/useCoverLetter';
import { CreditCard as Edit3, Save, Eye, Download, RotateCcw, Type, Palette, AlertCircle, CheckCircle } from 'lucide-react';

interface CoverLetterEditorProps {
  coverLetter: CoverLetter;
  onClose: () => void;
}

export default function CoverLetterEditor({ coverLetter: initialCoverLetter, onClose }: CoverLetterEditorProps) {
  const { updateCoverLetter, saving, error, clearError } = useCoverLetter();
  
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(initialCoverLetter);
  const [originalSections, setOriginalSections] = useState<CoverLetterSection[]>(initialCoverLetter.sections);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(coverLetter.sections) !== JSON.stringify(originalSections);
    setHasUnsavedChanges(hasChanges);
  }, [coverLetter.sections, originalSections]);

  const updateSection = (sectionId: string, content: string) => {
    setCoverLetter(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      )
    }));
  };

  const handleSave = async () => {
    try {
      clearError();
      
      // Regenerate plain text and word count
      const plainText = coverLetter.sections.map(s => s.content).join('\n\n');
      const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      await updateCoverLetter(coverLetter.id, {
        sections: coverLetter.sections,
        plainText,
        wordCount,
        lastEditedAt: new Date().toISOString()
      });
      
      setOriginalSections([...coverLetter.sections]);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleRevert = () => {
    setCoverLetter(prev => ({
      ...prev,
      sections: [...originalSections]
    }));
    setHasUnsavedChanges(false);
  };

  const getWordCount = () => {
    const plainText = coverLetter.sections.map(s => s.content).join('\n\n');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getDiffCount = () => {
    let changes = 0;
    coverLetter.sections.forEach((section, index) => {
      if (originalSections[index] && section.content !== originalSections[index].content) {
        changes++;
      }
    });
    return changes;
  };

  const generatePreviewHTML = () => {
    const styles = coverLetter.matchResumeTemplate ? `
      <style>
        body { 
          font-family: 'Inter', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 1in; 
        }
        .section { margin-bottom: 1.5rem; }
        .header { margin-bottom: 2rem; }
        .opening, .body, .closing { margin-bottom: 1.5rem; }
        .signature { margin-top: 2rem; }
        .section-content { white-space: pre-line; }
      </style>
    ` : `
      <style>
        body { 
          font-family: 'Times New Roman', serif; 
          line-height: 1.6; 
          color: #000; 
          max-width: 8.5in; 
          margin: 0 auto; 
          padding: 1in; 
        }
        .section { margin-bottom: 1.5rem; }
        .section-content { white-space: pre-line; }
      </style>
    `;

    let html = `<!DOCTYPE html><html><head>${styles}</head><body>`;
    
    coverLetter.sections.forEach(section => {
      html += `<div class="section ${section.type}"><div class="section-content">${section.content}</div></div>`;
    });
    
    html += '</body></html>';
    return html;
  };

  const handleExport = () => {
    const htmlContent = generatePreviewHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coverLetter.targetRole.replace(/\s+/g, '_')}_Cover_Letter.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Cover Letter: {coverLetter.targetRole}
          </h2>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>{getWordCount()} words</span>
            <span>•</span>
            <span className="capitalize">{coverLetter.tone} tone</span>
            <span>•</span>
            <span className="capitalize">{coverLetter.length} length</span>
            {hasUnsavedChanges && (
              <>
                <span>•</span>
                <span className="text-amber-600">{getDiffCount()} unsaved changes</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastSaved && !hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          
          <button
            onClick={handleRevert}
            disabled={!hasUnsavedChanges}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revert</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'edit'
                ? 'border-sexy-pink-500 text-sexy-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'preview'
                ? 'border-sexy-pink-500 text-sexy-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'edit' ? (
          <div className="space-y-6">
            {coverLetter.sections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <span className="text-xs text-gray-500 capitalize">{section.type}</span>
                </div>
                
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(section.id, e.target.value)}
                  rows={section.type === 'body' ? 8 : section.type === 'header' ? 6 : 4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent resize-none"
                  placeholder={`Enter ${section.title.toLowerCase()} content...`}
                />
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>{section.content.trim().split(/\s+/).filter(w => w.length > 0).length} words</span>
                  {originalSections.find(s => s.id === section.id)?.content !== section.content && (
                    <span className="text-amber-600">Modified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: generatePreviewHTML().replace(/<!DOCTYPE html><html><head>.*?<\/head><body>/, '').replace(/<\/body><\/html>/, '') }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>{coverLetter.matchResumeTemplate ? 'Resume styling' : 'Classic styling'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span className="capitalize">{coverLetter.tone} tone</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export HTML</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
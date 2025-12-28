import React, { useState, useEffect, useRef } from 'react';
import { ParseReviewData, ParsedSection, ParsedField, ParseSnapshot } from '../types/parseReview';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../lib/analytics';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  HelpCircle, 
  Split, 
  Eye, 
  EyeOff,
  Save,
  RotateCcw,
  Loader,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';

interface ParseReviewWorkspaceProps {
  parseData: ParseReviewData;
  onComplete: (validatedData: any) => void;
  onCancel: () => void;
}

export default function ParseReviewWorkspace({ 
  parseData, 
  onComplete, 
  onCancel 
}: ParseReviewWorkspaceProps) {
  const { user } = useAuth();
  const [sections, setSections] = useState<ParsedSection[]>(parseData.sections);
  const [snapshots, setSnapshots] = useState<ParseSnapshot[]>(parseData.snapshots || []);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showEmptySections, setShowEmptySections] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [sections]);

  const handleAutoSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Create auto-save snapshot
      const snapshot: ParseSnapshot = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        sections: [...sections],
        description: 'Auto-save',
        isAutoSave: true
      };

      setSnapshots(prev => [...prev.slice(-9), snapshot]); // Keep last 10 snapshots
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (sectionId: string, fieldId: string, updates: Partial<ParsedField>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    ));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId 
        ? { ...section, isVisible: !section.isVisible }
        : section
    ));
  };

  const copyFromSource = (sectionId: string, fieldId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const field = section?.fields.find(f => f.id === fieldId);
    
    if (field?.provenance?.sourceText) {
      updateField(sectionId, fieldId, {
        correctedValue: field.provenance.sourceText,
        status: 'corrected'
      });
    }
  };

  const markAsUnknown = (sectionId: string, fieldId: string) => {
    updateField(sectionId, fieldId, {
      correctedValue: '',
      status: 'unknown'
    });
  };

  const splitBulletPoint = (sectionId: string, fieldId: string, splitIndex: number) => {
    const section = sections.find(s => s.id === sectionId);
    const field = section?.fields.find(f => f.id === fieldId);
    
    if (field && field.correctedValue) {
      const text = field.correctedValue;
      const beforeSplit = text.substring(0, splitIndex).trim();
      const afterSplit = text.substring(splitIndex).trim();
      
      if (beforeSplit && afterSplit) {
        // Create new field for the split content
        const newField: ParsedField = {
          ...field,
          id: `${fieldId}-split-${Date.now()}`,
          correctedValue: afterSplit,
          status: 'corrected'
        };

        updateField(sectionId, fieldId, { correctedValue: beforeSplit });
        
        // Add new field after current one
        setSections(prev => prev.map(section =>
          section.id === sectionId
            ? {
                ...section,
                fields: [
                  ...section.fields.slice(0, section.fields.findIndex(f => f.id === fieldId) + 1),
                  newField,
                  ...section.fields.slice(section.fields.findIndex(f => f.id === fieldId) + 1)
                ]
              }
            : section
        ));
      }
    }
  };

  const revertToSnapshot = (snapshot: ParseSnapshot) => {
    setSections([...snapshot.sections]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertTriangle;
    return HelpCircle;
  };

  const handleComplete = async () => {
    try {
      setSaving(true);

      // Validate all corrections
      const corrections = sections.flatMap(section =>
        section.fields
          .filter(field => field.status === 'corrected' || field.status === 'validated')
          .map(field => ({
            fieldId: field.id,
            correctedValue: field.correctedValue,
            status: field.status
          }))
      );

      // Calculate final confidence
      const allFields = sections.flatMap(s => s.fields);
      const finalConfidence = allFields.reduce((sum, f) => sum + (f.confidence || 0), 0) / allFields.length;

      // Track review saved event
      trackEvent('review_saved', {
        corrections_made: corrections.length,
        final_confidence: finalConfidence,
        sections_corrected: Array.from(new Set(
          sections
            .filter(s => s.fields.some(f => f.status === 'corrected'))
            .map(s => s.name)
        )),
        review_duration_seconds: Math.floor((Date.now() - new Date(parseData.createdAt || Date.now()).getTime()) / 1000)
      });

      // Convert to resume format and complete
      const resumeData = convertToResumeFormat(sections);
      onComplete(resumeData);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const convertToResumeFormat = (sections: ParsedSection[]) => {
    const resume: any = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: [],
      projects: []
    };

    sections.forEach(section => {
      switch (section.sectionName) {
        case 'Personal Information':
          section.fields.forEach(field => {
            const value = field.correctedValue || field.originalValue;
            switch (field.fieldName) {
              case 'fullName': resume.personalInfo.fullName = value; break;
              case 'email': resume.personalInfo.email = value; break;
              case 'phone': resume.personalInfo.phone = value; break;
              case 'location': resume.personalInfo.location = value; break;
              case 'linkedin': resume.personalInfo.linkedin = value; break;
              case 'website': resume.personalInfo.website = value; break;
              case 'summary': resume.personalInfo.summary = value; break;
            }
          });
          break;
        // Add other section conversions as needed
      }
    });

    return resume;
  };

  const visibleSections = sections.filter(section => 
    showEmptySections || !section.isEmpty || section.fields.some(f => f.correctedValue || f.originalValue)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Parse Review</h1>
            <p className="text-sm text-gray-600 mt-1">
              Review and correct AI-extracted data from {parseData.originalFileName}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {saving && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            
            {lastSaved && !saving && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Save className="w-4 h-4" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEmptySections(!showEmptySections)}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showEmptySections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showEmptySections ? 'Hide' : 'Show'} Empty</span>
              </button>
              
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-6 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 transition-colors"
              >
                Complete Review
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Original Document Preview */}
        <div className="w-1/2 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Original Document</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{parseData.originalFileName}</span>
              <span>•</span>
              <span className="capitalize">{parseData.originalFileType}</span>
            </div>
          </div>
          
          {/* Document preview would go here */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Document preview not available</p>
            <p className="text-sm text-gray-500 mt-1">
              Original content is used for reference during field correction
            </p>
          </div>
        </div>

        {/* Right Panel - Structured Form */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Extracted Data</h2>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-sexy-pink-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(parseData.overallConfidence * 100)}% Confidence
                  </span>
                </div>
              </div>

              {/* Snapshots */}
              {snapshots.length > 0 && (
                <div className="mb-4">
                  <details className="group">
                    <summary className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                      <span>Version History ({snapshots.length})</span>
                    </summary>
                    <div className="mt-2 ml-6 space-y-1">
                      {snapshots.slice(-5).map((snapshot) => (
                        <button
                          key={snapshot.id}
                          onClick={() => revertToSnapshot(snapshot)}
                          className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{snapshot.description}</span>
                          <span>•</span>
                          <span>{new Date(snapshot.timestamp).toLocaleTimeString()}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {visibleSections.map((section) => (
                <ParsedSectionComponent
                  key={section.id}
                  section={section}
                  selectedField={selectedField}
                  onFieldSelect={setSelectedField}
                  onFieldUpdate={updateField}
                  onToggleVisibility={toggleSectionVisibility}
                  onCopyFromSource={copyFromSource}
                  onMarkUnknown={markAsUnknown}
                  onSplitBullet={splitBulletPoint}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for each parsed section
interface ParsedSectionComponentProps {
  section: ParsedSection;
  selectedField: string | null;
  onFieldSelect: (fieldId: string | null) => void;
  onFieldUpdate: (sectionId: string, fieldId: string, updates: Partial<ParsedField>) => void;
  onToggleVisibility: (sectionId: string) => void;
  onCopyFromSource: (sectionId: string, fieldId: string) => void;
  onMarkUnknown: (sectionId: string, fieldId: string) => void;
  onSplitBullet: (sectionId: string, fieldId: string, splitIndex: number) => void;
}

function ParsedSectionComponent({
  section,
  selectedField,
  onFieldSelect,
  onFieldUpdate,
  onToggleVisibility,
  onCopyFromSource,
  onMarkUnknown,
  onSplitBullet
}: ParsedSectionComponentProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertTriangle;
    return HelpCircle;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => onToggleVisibility(section.id)}
      >
        <div className="flex items-center space-x-3">
          {section.isVisible ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <h3 className="font-medium text-gray-900">{section.sectionName}</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(section.confidence)}`}>
            {Math.round(section.confidence * 100)}%
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          {section.fields.length} fields
        </div>
      </div>

      {section.isVisible && (
        <div className="p-4 space-y-4">
          {section.fields.map((field) => (
            <ParsedFieldComponent
              key={field.id}
              field={field}
              sectionId={section.id}
              isSelected={selectedField === field.id}
              onSelect={() => onFieldSelect(field.id)}
              onUpdate={(updates) => onFieldUpdate(section.id, field.id, updates)}
              onCopyFromSource={() => onCopyFromSource(section.id, field.id)}
              onMarkUnknown={() => onMarkUnknown(section.id, field.id)}
              onSplitBullet={(splitIndex) => onSplitBullet(section.id, field.id, splitIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component for individual parsed fields
interface ParsedFieldComponentProps {
  field: ParsedField;
  sectionId: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ParsedField>) => void;
  onCopyFromSource: () => void;
  onMarkUnknown: () => void;
  onSplitBullet: (splitIndex: number) => void;
}

function ParsedFieldComponent({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onCopyFromSource,
  onMarkUnknown,
  onSplitBullet
}: ParsedFieldComponentProps) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertTriangle;
    return HelpCircle;
  };

  const ConfidenceIcon = getConfidenceIcon(field.confidence);

  const handleTextChange = (value: string) => {
    onUpdate({
      correctedValue: value,
      status: value !== field.originalValue ? 'corrected' : 'validated'
    });
  };

  const handleSplitAtCursor = () => {
    if (textareaRef.current) {
      const position = textareaRef.current.selectionStart;
      onSplitBullet(position);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-3 transition-all ${
        isSelected ? 'border-sexy-pink-500 bg-sexy-pink-50' : 'border-gray-200'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="font-medium text-gray-900 text-sm">
            {field.fieldName}
          </label>
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getConfidenceColor(field.confidence)}`}>
            <ConfidenceIcon className="w-3 h-3" />
            <span>{Math.round(field.confidence * 100)}%</span>
          </div>
        </div>

        {isSelected && (
          <div className="flex items-center space-x-1">
            {field.provenance?.sourceText && (
              <button
                onClick={onCopyFromSource}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500"
                title="Copy from source"
                aria-label="Copy from source text"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onMarkUnknown}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500"
              title="Mark as unknown"
              aria-label="Mark field as unknown"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSplitAtCursor}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500"
              title="Split at cursor"
              aria-label="Split text at cursor position"
            >
              <Split className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={field.correctedValue || field.originalValue}
        onChange={(e) => handleTextChange(e.target.value)}
        onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent resize-none"
        rows={field.correctedValue?.includes('\n') ? 3 : 1}
        aria-label={`${field.fieldName} field`}
        aria-describedby={field.warnings.length > 0 ? `${field.id}-warnings` : undefined}
      />

      {field.warnings.length > 0 && (
        <div id={`${field.id}-warnings`} className="mt-2 space-y-1">
          {field.warnings.map((warning, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {field.provenance && (
        <div className="mt-2 text-xs text-gray-500">
          {field.provenance.page && `Page ${field.provenance.page}`}
          {field.provenance.line && `, Line ${field.provenance.line}`}
          {field.provenance.sourceText && (
            <div className="mt-1 p-2 bg-gray-100 rounded text-gray-700 italic">
              "{field.provenance.sourceText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
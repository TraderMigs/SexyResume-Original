export interface ParsedField {
  id: string;
  fieldName: string;
  originalValue: string;
  correctedValue: string;
  confidence: number; // 0-1
  provenance?: {
    page?: number;
    line?: number;
    offset?: number;
    sourceText?: string;
  };
  status: 'pending' | 'validated' | 'corrected' | 'unknown';
  warnings: string[];
}

export interface ParsedSection {
  id: string;
  sectionName: string;
  fields: ParsedField[];
  confidence: number;
  isEmpty: boolean;
  isVisible: boolean;
}

export interface ParseReviewData {
  id: string;
  userId: string;
  originalFileName: string;
  originalFileUrl?: string;
  originalFileType: string;
  sections: ParsedSection[];
  overallConfidence: number;
  parseVersion: string;
  createdAt: string;
  updatedAt: string;
  snapshots: ParseSnapshot[];
}

export interface ParseSnapshot {
  id: string;
  timestamp: string;
  sections: ParsedSection[];
  description: string;
  isAutoSave: boolean;
}

export interface ValidationRequest {
  parseId: string;
  corrections: {
    fieldId: string;
    correctedValue: string;
    status: ParsedField['status'];
  }[];
}

export interface ValidationResponse {
  updatedSections: ParsedSection[];
  overallConfidence: number;
  completenessScore: number;
}
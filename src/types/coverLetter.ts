export interface CoverLetterRequest {
  resumeId?: string;
  resumeData?: any;
  targetRole: string;
  companyName?: string;
  jobDescription?: string;
  tone: 'formal' | 'neutral' | 'friendly';
  length: 'short' | 'standard' | 'detailed';
  keywords?: string[];
  matchResumeTemplate?: boolean;
}

export interface CoverLetterSection {
  id: string;
  type: 'header' | 'opening' | 'body' | 'closing' | 'signature';
  title: string;
  content: string;
  editable: boolean;
}

export interface CoverLetter {
  id: string;
  userId: string;
  resumeId?: string;
  targetRole: string;
  companyName?: string;
  jobDescription?: string;
  tone: 'formal' | 'neutral' | 'friendly';
  length: 'short' | 'standard' | 'detailed';
  keywords: string[];
  matchResumeTemplate: boolean;
  sections: CoverLetterSection[];
  plainText: string;
  htmlContent: string;
  wordCount: number;
  generatedAt: string;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterDraft {
  id: string;
  coverLetterId: string;
  sections: CoverLetterSection[];
  plainText: string;
  htmlContent: string;
  wordCount: number;
  editCount: number;
  lastSavedAt: string;
}

export interface GenerationTelemetry {
  id: string;
  userId: string;
  success: boolean;
  tokenUsage?: number;
  generationTimeMs: number;
  tone: string;
  length: string;
  hasJobDescription: boolean;
  hasCompanyName: boolean;
  keywordCount: number;
  errorMessage?: string;
  createdAt: string;
}
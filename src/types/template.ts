export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'creative' | 'minimal' | 'executive';
  suitedFor: string[];
  industries: string[];
  features: string[];
  customizations: {
    fonts: string[];
    accentColors: string[];
    sectionOrder: boolean;
    layout: 'single-column' | 'two-column' | 'sidebar';
  };
  constraints: {
    maxExperience?: number;
    maxEducation?: number;
    maxSkills?: number;
    maxProjects?: number;
    recommendedSections: string[];
  };
  preview: string; // URL to preview image
}

export interface TemplateCustomization {
  templateId: string;
  font: string;
  accentColor: string;
  sectionOrder?: string[];
  hideEmptySections: boolean;
}

export interface TemplateRecommendation {
  template: Template;
  score: number;
  reasons: string[];
  matchedCriteria: string[];
}
import { Template } from '../types/template';

export const TEMPLATE_REGISTRY: Record<string, Template> = {
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean, contemporary design with gradient header and modern typography',
    category: 'modern',
    suitedFor: ['Software Engineer', 'Product Manager', 'Designer', 'Marketing Professional'],
    industries: ['Technology', 'Startups', 'Digital Marketing', 'Design'],
    features: ['Gradient header', 'Icon integration', 'Skills visualization', 'Project showcase'],
    customizations: {
      fonts: ['Inter', 'Roboto', 'Open Sans', 'Lato'],
      accentColors: ['#d946ef', '#0ba5d9', '#10b981', '#f59e0b', '#ef4444'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 8,
      maxEducation: 4,
      maxSkills: 20,
      maxProjects: 6,
      recommendedSections: ['personalInfo', 'experience', 'skills', 'education']
    },
    preview: '/templates/modern-preview.jpg'
  },

  classic: {
    id: 'classic',
    name: 'Classic Professional',
    description: 'Traditional, conservative design perfect for corporate environments',
    category: 'classic',
    suitedFor: ['Business Analyst', 'Accountant', 'Lawyer', 'Consultant', 'Manager'],
    industries: ['Finance', 'Legal', 'Consulting', 'Healthcare', 'Government'],
    features: ['Clean typography', 'Professional layout', 'Emphasis on experience', 'Conservative styling'],
    customizations: {
      fonts: ['Times New Roman', 'Georgia', 'Garamond', 'Crimson Text'],
      accentColors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#111827'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 10,
      maxEducation: 5,
      maxSkills: 15,
      maxProjects: 4,
      recommendedSections: ['personalInfo', 'experience', 'education', 'skills']
    },
    preview: '/templates/classic-preview.jpg'
  },

  creative: {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Bold, artistic design showcasing creativity and visual projects',
    category: 'creative',
    suitedFor: ['Graphic Designer', 'Artist', 'Photographer', 'Creative Director', 'UX Designer'],
    industries: ['Design', 'Advertising', 'Media', 'Entertainment', 'Fashion'],
    features: ['Visual project gallery', 'Creative typography', 'Color-rich design', 'Portfolio focus'],
    customizations: {
      fonts: ['Montserrat', 'Playfair Display', 'Oswald', 'Poppins'],
      accentColors: ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'],
      sectionOrder: true,
      layout: 'two-column'
    },
    constraints: {
      maxExperience: 6,
      maxEducation: 3,
      maxSkills: 25,
      maxProjects: 8,
      recommendedSections: ['personalInfo', 'projects', 'skills', 'experience']
    },
    preview: '/templates/creative-preview.jpg'
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Ultra-clean, minimalist design focusing on content over decoration',
    category: 'minimal',
    suitedFor: ['Developer', 'Researcher', 'Academic', 'Writer', 'Analyst'],
    industries: ['Technology', 'Research', 'Academia', 'Publishing', 'Consulting'],
    features: ['Minimal styling', 'Typography focus', 'Clean spacing', 'Content-first approach'],
    customizations: {
      fonts: ['Source Sans Pro', 'Nunito', 'Work Sans', 'IBM Plex Sans'],
      accentColors: ['#000000', '#374151', '#6b7280', '#059669', '#dc2626'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 12,
      maxEducation: 6,
      maxSkills: 18,
      maxProjects: 5,
      recommendedSections: ['personalInfo', 'experience', 'education', 'skills']
    },
    preview: '/templates/minimal-preview.jpg'
  },

  executive: {
    id: 'executive',
    name: 'Executive Leadership',
    description: 'Sophisticated design for senior-level professionals and executives',
    category: 'executive',
    suitedFor: ['CEO', 'VP', 'Director', 'Senior Manager', 'Executive'],
    industries: ['Finance', 'Consulting', 'Healthcare', 'Manufacturing', 'Real Estate'],
    features: ['Executive styling', 'Achievement focus', 'Leadership emphasis', 'Premium layout'],
    customizations: {
      fonts: ['Merriweather', 'Libre Baskerville', 'Crimson Pro', 'Source Serif Pro'],
      accentColors: ['#1e40af', '#7c2d12', '#166534', '#92400e', '#1f2937'],
      sectionOrder: true,
      layout: 'sidebar'
    },
    constraints: {
      maxExperience: 15,
      maxEducation: 4,
      maxSkills: 12,
      maxProjects: 3,
      recommendedSections: ['personalInfo', 'experience', 'education', 'skills']
    },
    preview: '/templates/executive-preview.jpg'
  }
};

export const getTemplate = (id: string): Template | undefined => {
  return TEMPLATE_REGISTRY[id];
};

export const getAllTemplates = (): Template[] => {
  return Object.values(TEMPLATE_REGISTRY);
};

export const getTemplatesByCategory = (category: string): Template[] => {
  return getAllTemplates().filter(template => template.category === category);
};
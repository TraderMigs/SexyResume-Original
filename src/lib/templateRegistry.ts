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
  },

  tech: {
    id: 'tech',
    name: 'Tech & Developer',
    description: 'Two-column layout built for engineers — skills front and center, GitHub-ready',
    category: 'modern',
    suitedFor: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist'],
    industries: ['Technology', 'Startups', 'Fintech', 'Gaming', 'Cybersecurity'],
    features: ['Dark sidebar', 'Skill tags', 'GitHub/portfolio links', 'Tech-stack display'],
    customizations: {
      fonts: ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Inter'],
      accentColors: ['#6366f1', '#0ea5e9', '#10b981', '#f97316', '#ec4899'],
      sectionOrder: true,
      layout: 'two-column'
    },
    constraints: {
      maxExperience: 8,
      maxEducation: 3,
      maxSkills: 30,
      maxProjects: 8,
      recommendedSections: ['personalInfo', 'skills', 'experience', 'projects', 'education']
    },
    preview: '/templates/tech-preview.jpg'
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare & Nursing',
    description: 'Credential-forward layout built for medical professionals and nurses',
    category: 'classic',
    suitedFor: ['Registered Nurse', 'Medical Assistant', 'Physical Therapist', 'Doctor', 'Healthcare Administrator'],
    industries: ['Healthcare', 'Hospitals', 'Clinics', 'Pharmaceuticals', 'Medical Devices'],
    features: ['Credentials highlight', 'Certifications section', 'Clinical experience focus', 'Clean professional layout'],
    customizations: {
      fonts: ['Georgia', 'Cambria', 'Palatino', 'Times New Roman'],
      accentColors: ['#0369a1', '#0891b2', '#059669', '#7c3aed', '#1e40af'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 10,
      maxEducation: 6,
      maxSkills: 20,
      maxProjects: 3,
      recommendedSections: ['personalInfo', 'experience', 'education', 'skills']
    },
    preview: '/templates/healthcare-preview.jpg'
  },

  academic: {
    id: 'academic',
    name: 'Academic & Research',
    description: 'Publication-ready CV format for academics, researchers and PhD candidates',
    category: 'classic',
    suitedFor: ['Professor', 'Researcher', 'PhD Candidate', 'Postdoc', 'Academic'],
    industries: ['Academia', 'Research', 'Universities', 'Think Tanks', 'Government Research'],
    features: ['Publications section', 'Research focus', 'Serif typography', 'Conference & grants'],
    customizations: {
      fonts: ['Garamond', 'Times New Roman', 'Palatino', 'Book Antiqua'],
      accentColors: ['#1e3a5f', '#7c2d12', '#166534', '#4a1942', '#1f2937'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 15,
      maxEducation: 8,
      maxSkills: 20,
      maxProjects: 10,
      recommendedSections: ['personalInfo', 'education', 'experience', 'skills', 'projects']
    },
    preview: '/templates/academic-preview.jpg'
  },

  entrylevel: {
    id: 'entrylevel',
    name: 'Entry Level & New Grad',
    description: 'Education-first layout that makes the most of limited work experience',
    category: 'modern',
    suitedFor: ['Recent Graduate', 'Intern', 'Entry Level', 'Career Changer', 'Student'],
    industries: ['Any Industry', 'Technology', 'Business', 'Healthcare', 'Education'],
    features: ['Education first', 'Projects showcase', 'Skills emphasis', 'Activities & honors'],
    customizations: {
      fonts: ['Nunito', 'Poppins', 'Raleway', 'Quicksand'],
      accentColors: ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 5,
      maxEducation: 4,
      maxSkills: 20,
      maxProjects: 8,
      recommendedSections: ['personalInfo', 'education', 'projects', 'skills', 'experience']
    },
    preview: '/templates/entrylevel-preview.jpg'
  },

  sales: {
    id: 'sales',
    name: 'Sales & Marketing',
    description: 'Bold, metrics-driven layout built to showcase numbers and results',
    category: 'modern',
    suitedFor: ['Sales Manager', 'Account Executive', 'Marketing Manager', 'Business Development', 'Growth Hacker'],
    industries: ['Sales', 'Marketing', 'Advertising', 'Real Estate', 'Insurance'],
    features: ['Metrics-forward', 'Bold header', 'Achievement highlights', 'Revenue numbers'],
    customizations: {
      fonts: ['Montserrat', 'Raleway', 'Oswald', 'Barlow'],
      accentColors: ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 8,
      maxEducation: 3,
      maxSkills: 15,
      maxProjects: 4,
      recommendedSections: ['personalInfo', 'experience', 'skills', 'education']
    },
    preview: '/templates/sales-preview.jpg'
  },

  federal: {
    id: 'federal',
    name: 'Federal & Government',
    description: 'Strict formatting compliance for US federal job applications',
    category: 'classic',
    suitedFor: ['Federal Employee', 'Government Contractor', 'Military Veteran', 'Public Servant', 'Policy Analyst'],
    industries: ['Federal Government', 'State Government', 'Military', 'Defense', 'Public Policy'],
    features: ['GS grade compatible', 'Detailed descriptions', 'KSA sections', 'Compliance formatting'],
    customizations: {
      fonts: ['Times New Roman', 'Arial', 'Calibri', 'Georgia'],
      accentColors: ['#1e3a5f', '#1f2937', '#374151', '#1e40af', '#166534'],
      sectionOrder: true,
      layout: 'single-column'
    },
    constraints: {
      maxExperience: 20,
      maxEducation: 8,
      maxSkills: 25,
      maxProjects: 5,
      recommendedSections: ['personalInfo', 'experience', 'education', 'skills']
    },
    preview: '/templates/federal-preview.jpg'
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

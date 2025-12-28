import { Resume } from '../types/resume';
import { TemplateCustomization } from '../types/template';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'ats';
  template: string;
  watermark: boolean;
  mode: 'styled' | 'ats-safe';
  atsValidation?: boolean;
  customizations?: TemplateCustomization;
  pagination?: {
    pageBreaks: boolean;
    widowOrphanControl: boolean;
    maxLinesPerPage: number;
  };
}

export interface ATSValidationResult {
  isATSFriendly: boolean;
  extractedFields: Record<string, string>;
  warnings: string[];
  score: number; // 0-100
  recommendations: string[];
}

export interface RenderedExport {
  content: string;
  atsValidation?: ATSValidationResult;
  metadata: {
    format: string;
    template: string;
    mode: 'styled' | 'ats-safe';
    watermarked: boolean;
    pageCount?: number;
    wordCount: number;
    generatedAt: string;
  };
}

export function renderForExport(resume: Resume, options: ExportOptions): RenderedExport {
  const renderer = getFormatRenderer(options.format, options.mode);
  const content = renderer(resume, options);
  
  let atsValidation: ATSValidationResult | undefined;
  if (options.atsValidation) {
    atsValidation = validateATSCompatibility(content, resume);
  }
  
  return {
    content,
    atsValidation,
    metadata: {
      format: options.format,
      template: options.template,
      mode: options.mode,
      watermarked: options.watermark,
      wordCount: countWords(content),
      generatedAt: new Date().toISOString()
    }
  };
}

function getFormatRenderer(format: string, mode: 'styled' | 'ats-safe') {
  const renderers = {
    pdf: mode === 'ats-safe' ? renderATSPDFContent : renderStyledPDFContent,
    docx: mode === 'ats-safe' ? renderATSDOCXContent : renderStyledDOCXContent,
    txt: renderTXTContent,
    ats: renderATSContent
  };

  return renderers[format as keyof typeof renderers] || renderTXTContent;
}

function renderStyledPDFContent(resume: Resume, options: ExportOptions): string {
  const { personalInfo, experience, education, skills, projects } = resume;
  
  const watermarkCSS = options.watermark ? `
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(217, 70, 239, 0.08);
      z-index: 1000;
      pointer-events: none;
      font-weight: bold;
      user-select: none;
    }
    .watermark-footer {
      position: fixed;
      bottom: 10px;
      right: 20px;
      font-size: 8pt;
      color: rgba(217, 70, 239, 0.6);
      z-index: 1000;
    }
  ` : '';

  const paginationCSS = options.pagination?.pageBreaks ? `
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    .avoid-orphan { orphans: 3; }
    .avoid-widow { widows: 3; }
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${personalInfo.fullName || 'Resume'} - SexyResume.com</title>
      <style>
        @page {
          size: A4;
          margin: 0.5in;
          @bottom-right {
            content: counter(page) " of " counter(pages);
            font-size: 8pt;
            color: #666;
          }
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.6;
          color: #333;
          font-size: 11pt;
        }
        
        .resume-container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          position: relative;
        }
        
        ${watermarkCSS}
        ${paginationCSS}
        ${getPDFTemplateStyles(options.template, options.customizations)}
      </style>
    </head>
    <body>
      <div class="resume-container">
        ${options.watermark ? '<div class="watermark-overlay">PREVIEW</div><div class="watermark-footer">SexyResume.com Preview</div>' : ''}
        ${renderPDFSections(resume, options)}
      </div>
    </body>
    </html>
  `;
}

function renderATSPDFContent(resume: Resume, options: ExportOptions): string {
  const { personalInfo, experience, education, skills, projects } = resume;
  
  const watermarkCSS = options.watermark ? `
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(0, 0, 0, 0.05);
      z-index: 1000;
      pointer-events: none;
      font-weight: bold;
      user-select: none;
    }
  ` : '';

  const atsCSS = `
    @page {
      size: A4;
      margin: 1in;
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      color: #000000;
      font-size: 11pt;
      background: white;
    }
    
    .resume-container {
      max-width: 100%;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .header {
      margin-bottom: 20px;
      text-align: left;
      border-bottom: 1px solid #000000;
      padding-bottom: 10px;
    }
    
    .name {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
      color: #000000;
    }
    
    .contact-info {
      font-size: 10pt;
      line-height: 1.3;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #000000;
      margin: 15px 0 8px 0;
      text-transform: uppercase;
      border-bottom: 1px solid #000000;
      padding-bottom: 2px;
    }
    
    .item-title {
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin-bottom: 2px;
    }
    
    .item-subtitle {
      font-size: 10pt;
      font-weight: normal;
      color: #000000;
      margin-bottom: 2px;
    }
    
    .item-date {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 5px;
    }
    
    .item-description {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 5px;
      line-height: 1.4;
    }
    
    .achievements {
      margin: 5px 0;
      padding-left: 20px;
    }
    
    .achievements li {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 3px;
      line-height: 1.4;
    }
    
    .skills-section {
      margin-bottom: 15px;
    }
    
    .skill-category {
      margin-bottom: 8px;
    }
    
    .skill-category-title {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 3px;
    }
    
    .skill-list {
      font-size: 10pt;
      line-height: 1.3;
    }
    
    /* ATS-specific rules */
    .no-float { float: none !important; }
    .no-absolute { position: static !important; }
    .no-background { background: white !important; }
    .black-text { color: #000000 !important; }
    
    /* Remove all decorative elements */
    .decorative { display: none !important; }
    
    ${watermarkCSS}
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${personalInfo.fullName || 'Resume'} - ATS Optimized</title>
      <style>${atsCSS}</style>
    </head>
    <body>
      <div class="resume-container">
        ${options.watermark ? '<div class="watermark-overlay">PREVIEW</div>' : ''}
        ${renderATSSections(resume, options)}
      </div>
    </body>
    </html>
  `;
}

function renderStyledDOCXContent(resume: Resume, options: ExportOptions): string {
  // Enhanced DOCX with full styling
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (options.watermark) {
    content += '[WATERMARK]PREVIEW VERSION - SEXYRESUME.COM[/WATERMARK]\n';
    content += '[WATERMARK]FULL STYLED VERSION AVAILABLE AFTER PURCHASE[/WATERMARK]\n\n';
  }

  // Styled header with formatting
  if (personalInfo.fullName) {
    content += `[HEADING1][FONT:${options.customizations?.font || 'Inter'}][COLOR:${options.customizations?.accentColor || '#d946ef'}]${personalInfo.fullName}[/COLOR][/FONT][/HEADING1]\n`;
  }

  // Styled contact information
  const contactInfo = [];
  if (personalInfo.email) contactInfo.push(`[ICON:email]${personalInfo.email}`);
  if (personalInfo.phone) contactInfo.push(`[ICON:phone]${personalInfo.phone}`);
  if (personalInfo.location) contactInfo.push(`[ICON:location]${personalInfo.location}`);
  if (personalInfo.linkedin) contactInfo.push(`[ICON:linkedin]LinkedIn Profile`);
  if (personalInfo.website) contactInfo.push(`[ICON:website]Portfolio Website`);
  
  if (contactInfo.length > 0) {
    content += `[TABLE][STYLE:no-border]${contactInfo.join(' | ')}[/STYLE][/TABLE]\n\n`;
  }

  // Rest of styled content...
  return content;
}

function renderATSDOCXContent(resume: Resume, options: ExportOptions): string {
  // ATS-optimized DOCX with minimal formatting
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (options.watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n';
    content += 'FULL ATS-OPTIMIZED VERSION AVAILABLE AFTER PURCHASE\n\n';
  }

  // Simple header without styling
  if (personalInfo.fullName) {
    content += `${personalInfo.fullName}\n`;
  }

  // Plain contact information
  if (personalInfo.email) content += `Email: ${personalInfo.email}\n`;
  if (personalInfo.phone) content += `Phone: ${personalInfo.phone}\n`;
  if (personalInfo.location) content += `Address: ${personalInfo.location}\n`;
  if (personalInfo.linkedin) content += `LinkedIn: ${personalInfo.linkedin}\n`;
  if (personalInfo.website) content += `Website: ${personalInfo.website}\n`;
  content += '\n';

  // ATS-friendly sections with semantic headers
  if (personalInfo.summary) {
    content += 'PROFESSIONAL SUMMARY\n';
    content += `${personalInfo.summary}\n\n`;
  }

  // Work experience with ATS-friendly structure
  if (experience.length > 0) {
    content += 'WORK EXPERIENCE\n\n';
    experience.forEach((exp, index) => {
      content += `JOB TITLE: ${exp.position}\n`;
      content += `COMPANY: ${exp.company}\n`;
      content += `EMPLOYMENT DATES: ${exp.startDate} to ${exp.current ? 'Present' : exp.endDate}\n`;
      if (exp.description) content += `JOB DESCRIPTION: ${exp.description}\n`;
      if (exp.achievements.filter(a => a.trim()).length > 0) {
        content += 'KEY ACCOMPLISHMENTS:\n';
        exp.achievements.filter(a => a.trim()).forEach((achievement) => {
          content += `- ${achievement}\n`;
        });
      }
      content += '\n';
    });
  }

  return content;
}

function renderDOCXContent(resume: Resume, options: ExportOptions): string {
  // Generate structured content for DOCX conversion
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (options.watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n';
    content += 'FULL DOCX VERSION AVAILABLE AFTER PURCHASE\n\n';
  }

  // Header with proper DOCX formatting markers
  if (personalInfo.fullName) {
    content += `[HEADING1]${personalInfo.fullName}[/HEADING1]\n`;
  }

  // Contact information in table format for DOCX
  const contactInfo = [];
  if (personalInfo.email) contactInfo.push(`Email: ${personalInfo.email}`);
  if (personalInfo.phone) contactInfo.push(`Phone: ${personalInfo.phone}`);
  if (personalInfo.location) contactInfo.push(`Location: ${personalInfo.location}`);
  if (personalInfo.linkedin) contactInfo.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.website) contactInfo.push(`Website: ${personalInfo.website}`);
  
  if (contactInfo.length > 0) {
    content += `[TABLE]${contactInfo.join(' | ')}[/TABLE]\n\n`;
  }

  // Professional Summary
  if (personalInfo.summary) {
    content += '[HEADING2]Professional Summary[/HEADING2]\n';
    content += `${personalInfo.summary}\n\n`;
  }

  // Work Experience
  if (experience.length > 0) {
    content += '[HEADING2]Work Experience[/HEADING2]\n\n';
    experience.forEach((exp) => {
      content += `[HEADING3]${exp.position}[/HEADING3]\n`;
      content += `[BOLD]${exp.company}[/BOLD] | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
      if (exp.description) content += `${exp.description}\n`;
      if (exp.achievements.filter(a => a.trim()).length > 0) {
        content += '[BULLETS]\n';
        exp.achievements.filter(a => a.trim()).forEach((achievement) => {
          content += `• ${achievement}\n`;
        });
        content += '[/BULLETS]\n';
      }
      content += '\n';
    });
  }

  // Education
  if (education.length > 0) {
    content += '[HEADING2]Education[/HEADING2]\n\n';
    education.forEach((edu) => {
      content += `[HEADING3]${edu.degree} in ${edu.field}[/HEADING3]\n`;
      content += `[BOLD]${edu.institution}[/BOLD] | ${edu.startDate} - ${edu.endDate}\n`;
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`;
      if (edu.honors) content += `${edu.honors}\n`;
      content += '\n';
    });
  }

  // Skills
  if (skills.length > 0) {
    content += '[HEADING2]Skills[/HEADING2]\n\n';
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(skillsByCategory).forEach(([category, categorySkills]) => {
      content += `[BOLD]${category}:[/BOLD] ${categorySkills.join(', ')}\n`;
    });
    content += '\n';
  }

  // Projects
  if (projects.length > 0) {
    content += '[HEADING2]Projects[/HEADING2]\n\n';
    projects.forEach((project) => {
      content += `[HEADING3]${project.name}[/HEADING3]\n`;
      content += `${project.startDate} - ${project.endDate}\n`;
      if (project.description) content += `${project.description}\n`;
      if (project.technologies.filter(t => t.trim()).length > 0) {
        content += `[BOLD]Technologies:[/BOLD] ${project.technologies.filter(t => t.trim()).join(', ')}\n`;
      }
      if (project.url) content += `[BOLD]URL:[/BOLD] ${project.url}\n`;
      content += '\n';
    });
  }

  if (options.watermark) {
    content += '\n[WATERMARK]CREATED WITH SEXYRESUME.COM[/WATERMARK]\n';
    content += '[WATERMARK]UPGRADE FOR FULL DOCX FEATURES[/WATERMARK]\n';
  }

  return content;
}

function renderTXTContent(resume: Resume, options: ExportOptions): string {
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (options.watermark) {
    content += '*** PREVIEW VERSION - SEXYRESUME.COM ***\n';
    content += '*** FULL VERSION AVAILABLE AFTER PURCHASE ***\n\n';
  }

  // Header
  if (personalInfo.fullName) {
    content += `${personalInfo.fullName}\n`;
    content += '='.repeat(personalInfo.fullName.length) + '\n\n';
  }

  // Contact Info
  if (personalInfo.email) content += `Email: ${personalInfo.email}\n`;
  if (personalInfo.phone) content += `Phone: ${personalInfo.phone}\n`;
  if (personalInfo.location) content += `Location: ${personalInfo.location}\n`;
  if (personalInfo.linkedin) content += `LinkedIn: ${personalInfo.linkedin}\n`;
  if (personalInfo.website) content += `Website: ${personalInfo.website}\n`;
  content += '\n';

  // Summary
  if (personalInfo.summary) {
    content += 'PROFESSIONAL SUMMARY\n';
    content += '-'.repeat(20) + '\n';
    content += `${personalInfo.summary}\n\n`;
  }

  // Experience
  if (experience.length > 0) {
    content += 'WORK EXPERIENCE\n';
    content += '-'.repeat(15) + '\n';
    experience.forEach((exp) => {
      content += `${exp.position} at ${exp.company}\n`;
      content += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
      if (exp.description) content += `${exp.description}\n`;
      if (exp.achievements.filter(a => a.trim()).length > 0) {
        exp.achievements.filter(a => a.trim()).forEach((achievement) => {
          content += `• ${achievement}\n`;
        });
      }
      content += '\n';
    });
  }

  // Education
  if (education.length > 0) {
    content += 'EDUCATION\n';
    content += '-'.repeat(9) + '\n';
    education.forEach((edu) => {
      content += `${edu.degree} in ${edu.field}\n`;
      content += `${edu.institution}\n`;
      content += `${edu.startDate} - ${edu.endDate}\n`;
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`;
      if (edu.honors) content += `${edu.honors}\n`;
      content += '\n';
    });
  }

  // Skills
  if (skills.length > 0) {
    content += 'SKILLS\n';
    content += '-'.repeat(6) + '\n';
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(skillsByCategory).forEach(([category, categorySkills]) => {
      content += `${category}: ${categorySkills.join(', ')}\n`;
    });
    content += '\n';
  }

  // Projects
  if (projects.length > 0) {
    content += 'PROJECTS\n';
    content += '-'.repeat(8) + '\n';
    projects.forEach((project) => {
      content += `${project.name}\n`;
      content += `${project.startDate} - ${project.endDate}\n`;
      if (project.description) content += `${project.description}\n`;
      if (project.technologies.filter(t => t.trim()).length > 0) {
        content += `Technologies: ${project.technologies.filter(t => t.trim()).join(', ')}\n`;
      }
      if (project.url) content += `URL: ${project.url}\n`;
      content += '\n';
    });
  }

  if (options.watermark) {
    content += '\n*** CREATED WITH SEXYRESUME.COM ***\n';
    content += '*** UPGRADE FOR PROFESSIONAL EXPORTS ***\n';
  }

  return content;
}

function renderATSContent(resume: Resume, options: ExportOptions): string {
  // ATS-optimized format with semantic structure
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (options.watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n';
    content += 'FULL ATS-OPTIMIZED VERSION AVAILABLE AFTER PURCHASE\n\n';
  }

  // Header - ATS-friendly format with clear labels
  if (personalInfo.fullName) {
    content += `CANDIDATE NAME: ${personalInfo.fullName}\n`;
  }
  if (personalInfo.email) content += `EMAIL ADDRESS: ${personalInfo.email}\n`;
  if (personalInfo.phone) content += `PHONE NUMBER: ${personalInfo.phone}\n`;
  if (personalInfo.location) content += `LOCATION: ${personalInfo.location}\n`;
  if (personalInfo.linkedin) content += `LINKEDIN PROFILE: ${personalInfo.linkedin}\n`;
  if (personalInfo.website) content += `WEBSITE: ${personalInfo.website}\n`;
  content += '\n';

  // Professional Summary
  if (personalInfo.summary) {
    content += 'PROFESSIONAL SUMMARY:\n';
    content += `${personalInfo.summary}\n\n`;
  }

  // Core Competencies (Skills first for ATS optimization)
  if (skills.length > 0) {
    content += 'CORE COMPETENCIES:\n';
    const technicalSkills = skills.filter(s => s.category === 'Technical').map(s => s.name);
    const softSkills = skills.filter(s => s.category === 'Soft').map(s => s.name);
    const languages = skills.filter(s => s.category === 'Language').map(s => s.name);
    const otherSkills = skills.filter(s => s.category === 'Other').map(s => s.name);

    if (technicalSkills.length > 0) {
      content += `TECHNICAL SKILLS: ${technicalSkills.join(', ')}\n`;
    }
    if (softSkills.length > 0) {
      content += `SOFT SKILLS: ${softSkills.join(', ')}\n`;
    }
    if (languages.length > 0) {
      content += `LANGUAGES: ${languages.join(', ')}\n`;
    }
    if (otherSkills.length > 0) {
      content += `OTHER SKILLS: ${otherSkills.join(', ')}\n`;
    }
    content += '\n';
  }

  // Professional Experience with ATS-friendly structure
  if (experience.length > 0) {
    content += 'PROFESSIONAL EXPERIENCE:\n\n';
    experience.forEach((exp, index) => {
      content += `POSITION ${index + 1}:\n`;
      content += `JOB TITLE: ${exp.position}\n`;
      content += `COMPANY NAME: ${exp.company}\n`;
      content += `EMPLOYMENT DATES: ${exp.startDate} to ${exp.current ? 'Present' : exp.endDate}\n`;
      if (exp.description) content += `JOB DESCRIPTION: ${exp.description}\n`;
      if (exp.achievements.filter(a => a.trim()).length > 0) {
        content += 'KEY ACHIEVEMENTS:\n';
        exp.achievements.filter(a => a.trim()).forEach((achievement) => {
          content += `- ${achievement}\n`;
        });
      }
      content += '\n';
    });
  }

  // Education with ATS structure
  if (education.length > 0) {
    content += 'EDUCATION:\n\n';
    education.forEach((edu, index) => {
      content += `EDUCATION ${index + 1}:\n`;
      content += `DEGREE TYPE: ${edu.degree}\n`;
      content += `FIELD OF STUDY: ${edu.field}\n`;
      content += `INSTITUTION NAME: ${edu.institution}\n`;
      content += `GRADUATION DATE: ${edu.endDate}\n`;
      if (edu.gpa) content += `GPA: ${edu.gpa}\n`;
      if (edu.honors) content += `HONORS AND AWARDS: ${edu.honors}\n`;
      content += '\n';
    });
  }

  // Projects with ATS structure
  if (projects.length > 0) {
    content += 'RELEVANT PROJECTS:\n\n';
    projects.forEach((project, index) => {
      content += `PROJECT ${index + 1}:\n`;
      content += `PROJECT NAME: ${project.name}\n`;
      content += `PROJECT DURATION: ${project.startDate} to ${project.endDate}\n`;
      if (project.description) content += `PROJECT DESCRIPTION: ${project.description}\n`;
      if (project.technologies.filter(t => t.trim()).length > 0) {
        content += `TECHNOLOGIES USED: ${project.technologies.filter(t => t.trim()).join(', ')}\n`;
      }
      if (project.url) content += `PROJECT URL: ${project.url}\n`;
      content += '\n';
    });
  }

  if (options.watermark) {
    content += 'DOCUMENT CREATED WITH SEXYRESUME.COM\n';
    content += 'ATS-OPTIMIZED FORMAT AVAILABLE AFTER PURCHASE\n';
  }

  return content;
}

function renderATSSections(resume: Resume, options: ExportOptions): string {
  const { personalInfo, experience, education, skills, projects } = resume;

  let html = `
    <header class="header">
      <h1 class="name">${personalInfo.fullName || 'Your Name'}</h1>
      <div class="contact-info">
        ${personalInfo.email ? `Email: ${personalInfo.email}<br>` : ''}
        ${personalInfo.phone ? `Phone: ${personalInfo.phone}<br>` : ''}
        ${personalInfo.location ? `Address: ${personalInfo.location}<br>` : ''}
        ${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin}<br>` : ''}
        ${personalInfo.website ? `Website: ${personalInfo.website}<br>` : ''}
      </div>
    </header>
  `;

  // Professional Summary
  if (personalInfo.summary) {
    html += `
      <section class="section">
        <h2 class="section-title">Professional Summary</h2>
        <div class="item-description">${personalInfo.summary}</div>
      </section>
    `;
  }

  // Core Competencies (Skills first for ATS)
  if (skills.length > 0) {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill.name);
      return acc;
    }, {} as Record<string, string[]>);

    html += `
      <section class="section skills-section">
        <h2 class="section-title">Core Competencies</h2>
        ${Object.entries(skillsByCategory).map(([category, categorySkills]) => `
          <div class="skill-category">
            <div class="skill-category-title">${category}:</div>
            <div class="skill-list">${categorySkills.join(', ')}</div>
          </div>
        `).join('')}
      </section>
    `;
  }

  // Professional Experience
  if (experience.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Professional Experience</h2>
        ${experience.map((exp) => `
          <div class="experience-item">
            <div class="item-title">${exp.position}</div>
            <div class="item-subtitle">${exp.company}</div>
            <div class="item-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            ${exp.achievements.filter(a => a.trim()).length > 0 ? `
              <ul class="achievements">
                ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  // Education
  if (education.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Education</h2>
        ${education.map(edu => `
          <div class="education-item">
            <div class="item-title">${edu.degree} in ${edu.field}</div>
            <div class="item-subtitle">${edu.institution}</div>
            <div class="item-date">${edu.startDate} - ${edu.endDate}</div>
            ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
            ${edu.honors ? `<div class="item-description">${edu.honors}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  // Projects
  if (projects.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Relevant Projects</h2>
        ${projects.map(project => `
          <div class="project-item">
            <div class="item-title">${project.name}</div>
            <div class="item-date">${project.startDate} - ${project.endDate}</div>
            ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            ${project.technologies.filter(t => t.trim()).length > 0 ? `
              <div class="item-description">Technologies: ${project.technologies.filter(t => t.trim()).join(', ')}</div>
            ` : ''}
            ${project.url ? `<div class="item-description">URL: ${project.url}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  return html;
}

function validateATSCompatibility(content: string, resume: Resume): ATSValidationResult {
  const warnings: string[] = [];
  const extractedFields: Record<string, string> = {};
  let score = 100;

  // Parse the content to extract fields (simplified ATS simulation)
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract name
  const nameMatch = text.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) {
    extractedFields.name = nameMatch[1];
  } else {
    warnings.push('Name not clearly identifiable');
    score -= 20;
  }

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    extractedFields.email = emailMatch[1];
  } else {
    warnings.push('Email address not found');
    score -= 15;
  }

  // Extract phone
  const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) {
    extractedFields.phone = phoneMatch[0];
  } else {
    warnings.push('Phone number not found');
    score -= 10;
  }

  // Check for complex formatting that might confuse ATS
  if (content.includes('position: absolute') || content.includes('float:')) {
    warnings.push('Complex positioning detected - may cause parsing issues');
    score -= 15;
  }

  if (content.includes('background-image') || content.includes('gradient')) {
    warnings.push('Background images/gradients may not be ATS-friendly');
    score -= 10;
  }

  // Check for non-standard fonts
  const nonStandardFonts = ['Montserrat', 'Playfair', 'Oswald', 'Poppins'];
  if (nonStandardFonts.some(font => content.includes(font))) {
    warnings.push('Non-standard fonts may not render correctly in ATS');
    score -= 5;
  }

  // Check section structure
  const hasProperSections = [
    'PROFESSIONAL SUMMARY',
    'WORK EXPERIENCE',
    'EDUCATION',
    'SKILLS'
  ].every(section => text.toUpperCase().includes(section));

  if (!hasProperSections) {
    warnings.push('Some standard resume sections may not be clearly labeled');
    score -= 10;
  }

  const recommendations: string[] = [];
  if (score < 80) {
    recommendations.push('Consider using ATS-safe mode for better compatibility');
  }
  if (warnings.some(w => w.includes('font'))) {
    recommendations.push('Use standard fonts like Arial, Times New Roman, or Calibri');
  }
  if (warnings.some(w => w.includes('positioning'))) {
    recommendations.push('Avoid complex layouts with absolute positioning');
  }

  return {
    isATSFriendly: score >= 80,
    extractedFields,
    warnings,
    score: Math.max(0, score),
    recommendations
  };
}

function getPDFTemplateStyles(template: string, customizations?: TemplateCustomization): string {
  const accentColor = customizations?.accentColor || '#d946ef';
  const font = customizations?.font || 'Inter';

  const baseStyles = `
    .header {
      background: linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, -20)});
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .name {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 10px;
      font-family: '${font}', sans-serif;
    }
    
    .section-title {
      font-size: 16pt;
      font-weight: 600;
      color: ${accentColor};
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 5px;
      margin-bottom: 15px;
      font-family: '${font}', sans-serif;
    }
    
    .item-title {
      font-size: 12pt;
      font-weight: 600;
      color: #333;
      font-family: '${font}', sans-serif;
    }
    
    .item-subtitle {
      color: ${accentColor};
      font-weight: 500;
    }
  `;

  // Template-specific styles
  switch (template) {
    case 'modern':
      return baseStyles + `
        .experience-item::before {
          background: ${accentColor};
        }
        .skill-tag {
          background: ${accentColor}15;
          color: ${accentColor};
          border: 1px solid ${accentColor}30;
        }
      `;
    case 'classic':
      return baseStyles + `
        .header {
          background: ${accentColor};
          text-align: left;
        }
        .section-title {
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      `;
    case 'minimal':
      return baseStyles + `
        .header {
          background: white;
          color: ${accentColor};
          border-bottom: 3px solid ${accentColor};
        }
        .section-title {
          border-bottom: 1px solid ${accentColor}50;
        }
      `;
    default:
      return baseStyles;
  }
}

function renderPDFSections(resume: Resume, options: ExportOptions): string {
  const { personalInfo, experience, education, skills, projects } = resume;

  let html = `
    <header class="header no-break">
      <h1 class="name">${personalInfo.fullName || 'Your Name'}</h1>
      <div class="contact">
        ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
        ${personalInfo.phone ? `<div class="contact-item">📱 ${personalInfo.phone}</div>` : ''}
        ${personalInfo.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ''}
        ${personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
        ${personalInfo.website ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
      </div>
    </header>
    
    <div class="content">
  `;

  // Professional Summary
  if (personalInfo.summary) {
    html += `
      <section class="section no-break">
        <h2 class="section-title">Professional Summary</h2>
        <p class="item-description avoid-orphan">${personalInfo.summary}</p>
      </section>
    `;
  }

  // Work Experience
  if (experience.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Work Experience</h2>
        ${experience.map((exp, index) => `
          <div class="experience-item no-break avoid-widow">
            <div class="item-title">${exp.position}</div>
            <div class="item-subtitle">${exp.company}</div>
            <div class="item-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            ${exp.achievements.filter(a => a.trim()).length > 0 ? `
              <ul class="achievements">
                ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          ${index < experience.length - 1 && index % 2 === 1 ? '<div class="page-break"></div>' : ''}
        `).join('')}
      </section>
    `;
  }

  // Education
  if (education.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Education</h2>
        ${education.map(edu => `
          <div class="education-item no-break">
            <div class="item-title">${edu.degree} in ${edu.field}</div>
            <div class="item-subtitle">${edu.institution}</div>
            <div class="item-date">${edu.startDate} - ${edu.endDate}</div>
            ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
            ${edu.honors ? `<div class="item-description">${edu.honors}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  // Skills
  if (skills.length > 0) {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof skills>);

    html += `
      <section class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-grid">
          ${Object.entries(skillsByCategory).map(([category, categorySkills]) => `
            <div class="skill-category no-break">
              <h4>${category}</h4>
              <div class="skill-tags">
                ${categorySkills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Projects
  if (projects.length > 0) {
    html += `
      <section class="section">
        <h2 class="section-title">Projects</h2>
        ${projects.map(project => `
          <div class="project-item no-break">
            <div class="item-title">${project.name}</div>
            <div class="item-date">${project.startDate} - ${project.endDate}</div>
            ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            ${project.technologies.filter(t => t.trim()).length > 0 ? `
              <div class="technologies">
                ${project.technologies.filter(t => t.trim()).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>
            ` : ''}
            ${project.url ? `<div class="item-description">URL: ${project.url}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  html += '</div>';
  return html;
}

// Utility functions
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
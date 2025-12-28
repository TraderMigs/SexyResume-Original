import { Resume } from '../types/resume';
import { Template, TemplateCustomization } from '../types/template';

export interface RenderedTemplate {
  html: string;
  css: string;
  metadata: {
    templateId: string;
    customizations: TemplateCustomization;
    generatedAt: string;
  };
}

export function renderTemplate(
  resume: Resume,
  template: Template,
  customizations?: Partial<TemplateCustomization>
): RenderedTemplate {
  const config: TemplateCustomization = {
    templateId: template.id,
    font: customizations?.font || template.customizations.fonts[0],
    accentColor: customizations?.accentColor || template.customizations.accentColors[0],
    sectionOrder: customizations?.sectionOrder || ['personalInfo', 'experience', 'education', 'skills', 'projects'],
    hideEmptySections: customizations?.hideEmptySections ?? true
  };

  const renderer = getTemplateRenderer(template.id);
  const { html, css } = renderer(resume, template, config);

  return {
    html,
    css,
    metadata: {
      templateId: template.id,
      customizations: config,
      generatedAt: new Date().toISOString()
    }
  };
}

function getTemplateRenderer(templateId: string) {
  const renderers = {
    modern: renderModernTemplate,
    classic: renderClassicTemplate,
    creative: renderCreativeTemplate,
    minimal: renderMinimalTemplate,
    executive: renderExecutiveTemplate
  };

  return renderers[templateId as keyof typeof renderers] || renderModernTemplate;
}

function renderModernTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;
  
  const css = `
    .resume-modern {
      font-family: '${config.font}', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .resume-header {
      background: linear-gradient(135deg, ${config.accentColor}, ${adjustColor(config.accentColor, -20)});
      color: white;
      padding: 2rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .resume-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      pointer-events: none;
    }
    
    .resume-name {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      position: relative;
      z-index: 1;
    }
    
    .resume-contact {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .resume-body {
      padding: 2rem;
    }
    
    .resume-section {
      margin-bottom: 2rem;
    }
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${config.accentColor};
      border-bottom: 2px solid ${config.accentColor};
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 50px;
      height: 2px;
      background: ${adjustColor(config.accentColor, 20)};
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 1.5rem;
      padding-left: 1rem;
      border-left: 3px solid ${config.accentColor}20;
      position: relative;
    }
    
    .experience-item::before, .education-item::before, .project-item::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 0.5rem;
      width: 12px;
      height: 12px;
      background: ${config.accentColor};
      border-radius: 50%;
    }
    
    .item-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.25rem;
    }
    
    .item-subtitle {
      color: ${config.accentColor};
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .item-date {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .item-description {
      color: #555;
      margin-bottom: 0.5rem;
    }
    
    .achievements {
      list-style: none;
      padding: 0;
    }
    
    .achievements li {
      position: relative;
      padding-left: 1rem;
      margin-bottom: 0.25rem;
      color: #555;
    }
    
    .achievements li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${config.accentColor};
      font-weight: bold;
    }
    
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .skill-category {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      border-top: 3px solid ${config.accentColor};
    }
    
    .skill-category h4 {
      margin: 0 0 0.75rem 0;
      color: #333;
      font-weight: 600;
    }
    
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .skill-tag {
      background: ${config.accentColor}15;
      color: ${config.accentColor};
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      border: 1px solid ${config.accentColor}30;
    }
    
    .technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .tech-tag {
      background: ${adjustColor(config.accentColor, 40)}15;
      color: ${adjustColor(config.accentColor, -10)};
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    
    @media print {
      .resume-modern {
        box-shadow: none;
      }
      .resume-header {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;

  const html = `
    <div class="resume-modern">
      <header class="resume-header">
        <h1 class="resume-name">${personalInfo.fullName || 'Your Name'}</h1>
        <div class="resume-contact">
          ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
          ${personalInfo.phone ? `<div class="contact-item">📱 ${personalInfo.phone}</div>` : ''}
          ${personalInfo.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ''}
          ${personalInfo.linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
          ${personalInfo.website ? `<div class="contact-item">🌐 Portfolio</div>` : ''}
        </div>
      </header>
      
      <div class="resume-body">
        ${renderSections(resume, config)}
      </div>
    </div>
  `;

  return { html, css };
}

function renderClassicTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const css = `
    .resume-classic {
      font-family: '${config.font}', serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #333;
      line-height: 1.7;
      padding: 1in;
    }
    
    .resume-header {
      text-align: center;
      border-bottom: 2px solid ${config.accentColor};
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    
    .resume-name {
      font-size: 2.2rem;
      font-weight: 700;
      color: ${config.accentColor};
      margin-bottom: 0.5rem;
      letter-spacing: 1px;
    }
    
    .resume-contact {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 2rem;
      font-size: 0.95rem;
      color: #555;
    }
    
    .section-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: ${config.accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid ${config.accentColor}50;
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5rem;
    }
    
    .item-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    
    .item-subtitle {
      color: ${config.accentColor};
      font-weight: 500;
      font-style: italic;
    }
    
    .item-date {
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .achievements {
      list-style-type: disc;
      margin-left: 1.5rem;
      margin-top: 0.5rem;
    }
    
    .achievements li {
      margin-bottom: 0.3rem;
      color: #555;
    }
    
    .skills-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .skill-category h4 {
      font-weight: 600;
      color: ${config.accentColor};
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    
    .skill-list {
      color: #555;
      line-height: 1.5;
    }
  `;

  const html = `
    <div class="resume-classic">
      <header class="resume-header">
        <h1 class="resume-name">${resume.personalInfo.fullName || 'Your Name'}</h1>
        <div class="resume-contact">
          ${resume.personalInfo.email ? `<span>${resume.personalInfo.email}</span>` : ''}
          ${resume.personalInfo.phone ? `<span>${resume.personalInfo.phone}</span>` : ''}
          ${resume.personalInfo.location ? `<span>${resume.personalInfo.location}</span>` : ''}
        </div>
      </header>
      
      ${renderSections(resume, config)}
    </div>
  `;

  return { html, css };
}

function renderCreativeTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const css = `
    .resume-creative {
      font-family: '${config.font}', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #333;
      line-height: 1.6;
      display: grid;
      grid-template-columns: 1fr 2fr;
      min-height: 11in;
    }
    
    .resume-sidebar {
      background: linear-gradient(180deg, ${config.accentColor}, ${adjustColor(config.accentColor, -30)});
      color: white;
      padding: 2rem 1.5rem;
      position: relative;
    }
    
    .resume-sidebar::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    }
    
    .sidebar-name {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    .sidebar-contact {
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    
    .sidebar-contact > div {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .sidebar-section {
      margin-bottom: 2rem;
    }
    
    .sidebar-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid rgba(255,255,255,0.3);
      padding-bottom: 0.5rem;
    }
    
    .skill-item {
      margin-bottom: 0.75rem;
    }
    
    .skill-name {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .skill-bar {
      height: 4px;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .skill-fill {
      height: 100%;
      background: white;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    
    .resume-main {
      padding: 2rem;
    }
    
    .main-section {
      margin-bottom: 2rem;
    }
    
    .main-section h2 {
      font-size: 1.4rem;
      font-weight: 600;
      color: ${config.accentColor};
      margin-bottom: 1rem;
      position: relative;
      padding-left: 1rem;
    }
    
    .main-section h2::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 100%;
      background: ${config.accentColor};
      border-radius: 2px;
    }
    
    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .project-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      background: #fafafa;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .project-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: ${config.accentColor};
      margin-bottom: 0.5rem;
    }
    
    .project-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .tech-badge {
      background: ${config.accentColor}15;
      color: ${config.accentColor};
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }
  `;

  const html = `
    <div class="resume-creative">
      <aside class="resume-sidebar">
        <h1 class="sidebar-name">${resume.personalInfo.fullName || 'Your Name'}</h1>
        <div class="sidebar-contact">
          ${resume.personalInfo.email ? `<div>📧 ${resume.personalInfo.email}</div>` : ''}
          ${resume.personalInfo.phone ? `<div>📱 ${resume.personalInfo.phone}</div>` : ''}
          ${resume.personalInfo.location ? `<div>📍 ${resume.personalInfo.location}</div>` : ''}
        </div>
        ${renderSidebarSections(resume, config)}
      </aside>
      
      <main class="resume-main">
        ${renderMainSections(resume, config)}
      </main>
    </div>
  `;

  return { html, css };
}

function renderMinimalTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const css = `
    .resume-minimal {
      font-family: '${config.font}', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #333;
      line-height: 1.8;
      padding: 2rem;
    }
    
    .resume-header {
      margin-bottom: 3rem;
    }
    
    .resume-name {
      font-size: 2.5rem;
      font-weight: 300;
      color: ${config.accentColor};
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
    }
    
    .resume-contact {
      color: #666;
      font-size: 0.95rem;
    }
    
    .resume-contact span {
      margin-right: 2rem;
    }
    
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: ${config.accentColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 3rem 0 1.5rem 0;
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 2rem;
      height: 1px;
      background: ${config.accentColor};
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .experience-item:last-child, .education-item:last-child, .project-item:last-child {
      border-bottom: none;
    }
    
    .item-header {
      margin-bottom: 0.75rem;
    }
    
    .item-title {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 0.25rem;
    }
    
    .item-subtitle {
      color: #666;
      font-weight: 400;
    }
    
    .item-date {
      color: #999;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    
    .item-description {
      color: #555;
      margin: 0.75rem 0;
    }
    
    .achievements {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0;
    }
    
    .achievements li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
      color: #555;
    }
    
    .achievements li::before {
      content: '—';
      position: absolute;
      left: 0;
      color: ${config.accentColor};
    }
    
    .skills-minimal {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
    
    .skill-category h4 {
      font-weight: 500;
      color: #333;
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
    
    .skill-list {
      color: #666;
      line-height: 1.6;
    }
  `;

  const html = `
    <div class="resume-minimal">
      <header class="resume-header">
        <h1 class="resume-name">${resume.personalInfo.fullName || 'Your Name'}</h1>
        <div class="resume-contact">
          ${resume.personalInfo.email ? `<span>${resume.personalInfo.email}</span>` : ''}
          ${resume.personalInfo.phone ? `<span>${resume.personalInfo.phone}</span>` : ''}
          ${resume.personalInfo.location ? `<span>${resume.personalInfo.location}</span>` : ''}
        </div>
      </header>
      
      ${renderSections(resume, config)}
    </div>
  `;

  return { html, css };
}

function renderExecutiveTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const css = `
    .resume-executive {
      font-family: '${config.font}', serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #333;
      line-height: 1.7;
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 11in;
    }
    
    .resume-sidebar {
      background: #f8f9fa;
      padding: 2rem 1.5rem;
      border-right: 3px solid ${config.accentColor};
    }
    
    .sidebar-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${config.accentColor};
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }
    
    .sidebar-contact {
      margin-bottom: 2rem;
      font-size: 0.85rem;
      color: #666;
    }
    
    .sidebar-contact > div {
      margin-bottom: 0.5rem;
    }
    
    .sidebar-section {
      margin-bottom: 2rem;
    }
    
    .sidebar-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: ${config.accentColor};
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .resume-main {
      padding: 2rem;
    }
    
    .main-section {
      margin-bottom: 2.5rem;
    }
    
    .main-section h2 {
      font-size: 1.3rem;
      font-weight: 600;
      color: ${config.accentColor};
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid ${config.accentColor};
      padding-bottom: 0.5rem;
    }
    
    .executive-summary {
      font-size: 1.05rem;
      color: #555;
      font-style: italic;
      border-left: 4px solid ${config.accentColor};
      padding-left: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .experience-item {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5rem;
    }
    
    .position-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }
    
    .company-name {
      color: ${config.accentColor};
      font-weight: 500;
      font-size: 1rem;
    }
    
    .date-range {
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .achievements {
      list-style: none;
      padding: 0;
      margin-top: 1rem;
    }
    
    .achievements li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
      color: #555;
    }
    
    .achievements li::before {
      content: '▪';
      position: absolute;
      left: 0;
      color: ${config.accentColor};
      font-weight: bold;
    }
  `;

  const html = `
    <div class="resume-executive">
      <aside class="resume-sidebar">
        <h1 class="sidebar-name">${resume.personalInfo.fullName || 'Your Name'}</h1>
        <div class="sidebar-contact">
          ${resume.personalInfo.email ? `<div>${resume.personalInfo.email}</div>` : ''}
          ${resume.personalInfo.phone ? `<div>${resume.personalInfo.phone}</div>` : ''}
          ${resume.personalInfo.location ? `<div>${resume.personalInfo.location}</div>` : ''}
        </div>
        ${renderExecutiveSidebar(resume, config)}
      </aside>
      
      <main class="resume-main">
        ${resume.personalInfo.summary ? `<div class="executive-summary">${resume.personalInfo.summary}</div>` : ''}
        ${renderExecutiveMain(resume, config)}
      </main>
    </div>
  `;

  return { html, css };
}

// Helper functions for rendering sections
function renderSections(resume: Resume, config: TemplateCustomization): string {
  const sections = [];
  
  if (resume.personalInfo.summary && config.sectionOrder.includes('personalInfo')) {
    sections.push(`
      <section class="resume-section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary-text">${resume.personalInfo.summary}</p>
      </section>
    `);
  }

  if (resume.experience.length > 0 && config.sectionOrder.includes('experience')) {
    sections.push(`
      <section class="resume-section">
        <h2 class="section-title">Work Experience</h2>
        ${resume.experience.map(exp => `
          <div class="experience-item">
            <div class="item-header">
              <div>
                <div class="item-title">${exp.position}</div>
                <div class="item-subtitle">${exp.company}</div>
              </div>
              <div class="item-date">${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
            </div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            ${exp.achievements.filter(a => a.trim()).length > 0 ? `
              <ul class="achievements">
                ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `);
  }

  if (resume.education.length > 0 && config.sectionOrder.includes('education')) {
    sections.push(`
      <section class="resume-section">
        <h2 class="section-title">Education</h2>
        ${resume.education.map(edu => `
          <div class="education-item">
            <div class="item-header">
              <div>
                <div class="item-title">${edu.degree} in ${edu.field}</div>
                <div class="item-subtitle">${edu.institution}</div>
              </div>
              <div class="item-date">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</div>
            </div>
            ${edu.gpa ? `<div class="item-description">GPA: ${edu.gpa}</div>` : ''}
            ${edu.honors ? `<div class="item-description">${edu.honors}</div>` : ''}
          </div>
        `).join('')}
      </section>
    `);
  }

  if (resume.skills.length > 0 && config.sectionOrder.includes('skills')) {
    const skillsByCategory = resume.skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof resume.skills>);

    sections.push(`
      <section class="resume-section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-grid">
          ${Object.entries(skillsByCategory).map(([category, skills]) => `
            <div class="skill-category">
              <h4>${category}</h4>
              <div class="skill-tags">
                ${skills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `);
  }

  if (resume.projects && resume.projects.length > 0 && config.sectionOrder.includes('projects')) {
    sections.push(`
      <section class="resume-section">
        <h2 class="section-title">Projects</h2>
        ${resume.projects.map(project => `
          <div class="project-item">
            <div class="item-header">
              <div>
                <div class="item-title">${project.name}</div>
                ${project.url ? `<div class="item-subtitle"><a href="${project.url}" target="_blank">View Project</a></div>` : ''}
              </div>
              <div class="item-date">${formatDate(project.startDate)} - ${formatDate(project.endDate)}</div>
            </div>
            ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
            ${project.technologies.filter(t => t.trim()).length > 0 ? `
              <div class="technologies">
                ${project.technologies.filter(t => t.trim()).map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `);
  }

  return sections.join('');
}

function renderSidebarSections(resume: Resume, config: TemplateCustomization): string {
  const sections = [];

  if (resume.skills.length > 0) {
    const skillsByCategory = resume.skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof resume.skills>);

    sections.push(`
      <div class="sidebar-section">
        <h3>Skills</h3>
        ${Object.entries(skillsByCategory).map(([category, skills]) => `
          <div style="margin-bottom: 1.5rem;">
            <h4 style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin-bottom: 0.5rem;">${category}</h4>
            ${skills.slice(0, 5).map(skill => `
              <div class="skill-item">
                <div class="skill-name">${skill.name}</div>
                <div class="skill-bar">
                  <div class="skill-fill" style="width: ${getSkillWidth(skill.level)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `);
  }

  return sections.join('');
}

function renderMainSections(resume: Resume, config: TemplateCustomization): string {
  const sections = [];

  if (resume.personalInfo.summary) {
    sections.push(`
      <div class="main-section">
        <h2>About</h2>
        <p>${resume.personalInfo.summary}</p>
      </div>
    `);
  }

  if (resume.projects && resume.projects.length > 0) {
    sections.push(`
      <div class="main-section">
        <h2>Featured Projects</h2>
        <div class="project-grid">
          ${resume.projects.map(project => `
            <div class="project-card">
              <div class="project-title">${project.name}</div>
              <p>${project.description}</p>
              ${project.technologies.filter(t => t.trim()).length > 0 ? `
                <div class="project-tech">
                  ${project.technologies.filter(t => t.trim()).map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  if (resume.experience.length > 0) {
    sections.push(`
      <div class="main-section">
        <h2>Experience</h2>
        ${resume.experience.map(exp => `
          <div class="experience-item">
            <div class="item-title">${exp.position}</div>
            <div class="item-subtitle">${exp.company}</div>
            <div class="item-date">${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
            ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `);
  }

  return sections.join('');
}

function renderExecutiveSidebar(resume: Resume, config: TemplateCustomization): string {
  const sections = [];

  if (resume.skills.length > 0) {
    const skillsByCategory = resume.skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof resume.skills>);

    sections.push(`
      <div class="sidebar-section">
        <h3>Core Competencies</h3>
        ${Object.entries(skillsByCategory).map(([category, skills]) => `
          <div style="margin-bottom: 1rem;">
            <h4 style="font-size: 0.85rem; margin-bottom: 0.5rem; color: #666;">${category}</h4>
            <div style="color: #555; font-size: 0.85rem; line-height: 1.4;">
              ${skills.slice(0, 6).map(skill => skill.name).join(' • ')}
            </div>
          </div>
        `).join('')}
      </div>
    `);
  }

  if (resume.education.length > 0) {
    sections.push(`
      <div class="sidebar-section">
        <h3>Education</h3>
        ${resume.education.map(edu => `
          <div style="margin-bottom: 1rem;">
            <div style="font-weight: 500; font-size: 0.9rem; color: #333;">${edu.degree}</div>
            <div style="color: #666; font-size: 0.85rem;">${edu.institution}</div>
            <div style="color: #999; font-size: 0.8rem;">${formatDate(edu.endDate)}</div>
          </div>
        `).join('')}
      </div>
    `);
  }

  return sections.join('');
}

function renderExecutiveMain(resume: Resume, config: TemplateCustomization): string {
  const sections = [];

  if (resume.experience.length > 0) {
    sections.push(`
      <div class="main-section">
        <h2>Professional Experience</h2>
        ${resume.experience.map(exp => `
          <div class="experience-item">
            <div class="experience-header">
              <div>
                <div class="position-title">${exp.position}</div>
                <div class="company-name">${exp.company}</div>
              </div>
              <div class="date-range">${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
            </div>
            ${exp.description ? `<div style="color: #555; margin: 0.75rem 0;">${exp.description}</div>` : ''}
            ${exp.achievements.filter(a => a.trim()).length > 0 ? `
              <ul class="achievements">
                ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `);
  }

  return sections.join('');
}

// Utility functions
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + '-01');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function adjustColor(color: string, amount: number): string {
  // Simple color adjustment - in production, use a proper color manipulation library
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getSkillWidth(level: string): number {
  const levels = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
  return levels[level as keyof typeof levels] || 50;
}
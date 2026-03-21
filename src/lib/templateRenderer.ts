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
  const renderers: Record<string, Function> = {
    modern: renderModernTemplate,
    tech: renderTechTemplate,
    healthcare: renderHealthcareTemplate,
    academic: renderAcademicTemplate,
    entrylevel: renderEntryLevelTemplate,
    sales: renderSalesTemplate,
    federal: renderFederalTemplate,
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

function renderTechTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-tech {
      font-family: '${config.font}', 'JetBrains Mono', monospace;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      display: flex;
      min-height: 11in;
    }
    .tech-sidebar {
      width: 35%;
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 2rem 1.5rem;
      box-sizing: border-box;
    }
    .tech-main {
      width: 65%;
      padding: 2rem;
      box-sizing: border-box;
    }
    .tech-name {
      color: ${config.accentColor};
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      letter-spacing: -0.5px;
    }
    .tech-title {
      color: #a6adc8;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .tech-contact { margin-bottom: 2rem; }
    .tech-contact div {
      color: #a6adc8;
      font-size: 0.78rem;
      margin-bottom: 0.4rem;
      word-break: break-all;
    }
    .tech-contact span { color: ${config.accentColor}; margin-right: 0.4rem; }
    .tech-sidebar h3 {
      color: ${config.accentColor};
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 1.5rem 0 0.75rem;
      border-bottom: 1px solid #313244;
      padding-bottom: 0.4rem;
    }
    .skill-tag {
      display: inline-block;
      background: #313244;
      color: #cdd6f4;
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.72rem;
      margin: 0.2rem 0.2rem 0 0;
    }
    .skill-tag.expert { background: ${config.accentColor}22; color: ${config.accentColor}; border: 1px solid ${config.accentColor}44; }
    .tech-main h2 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${config.accentColor};
      border-bottom: 2px solid ${config.accentColor};
      padding-bottom: 0.3rem;
      margin: 1.5rem 0 1rem;
    }
    .tech-main h2:first-child { margin-top: 0; }
    .exp-item { margin-bottom: 1.25rem; }
    .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.2rem; }
    .exp-title { font-weight: 700; font-size: 0.9rem; color: #1a1a2e; }
    .exp-date { font-size: 0.75rem; color: #6b7280; white-space: nowrap; }
    .exp-company { color: ${config.accentColor}; font-size: 0.82rem; margin-bottom: 0.3rem; }
    .exp-desc { font-size: 0.8rem; color: #4b5563; line-height: 1.5; }
    .exp-bullets { list-style: none; padding: 0; margin: 0.3rem 0 0; }
    .exp-bullets li { font-size: 0.8rem; color: #4b5563; padding-left: 1rem; position: relative; margin-bottom: 0.2rem; line-height: 1.4; }
    .exp-bullets li::before { content: '▸'; position: absolute; left: 0; color: ${config.accentColor}; }
    .proj-item { margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border-left: 3px solid ${config.accentColor}; border-radius: 0 4px 4px 0; }
    .proj-name { font-weight: 700; font-size: 0.85rem; color: #1a1a2e; }
    .proj-desc { font-size: 0.78rem; color: #4b5563; margin: 0.2rem 0; line-height: 1.4; }
    .proj-url { font-size: 0.72rem; color: ${config.accentColor}; }
  `;

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const html = `
    <div class="resume-tech">
      <div class="tech-sidebar">
        <div class="tech-name">${personalInfo.fullName || 'Your Name'}</div>
        <div class="tech-title">${experience[0]?.position || 'Software Engineer'}</div>
        <div class="tech-contact">
          ${personalInfo.email ? `<div><span>@</span>${personalInfo.email}</div>` : ''}
          ${personalInfo.phone ? `<div><span>#</span>${personalInfo.phone}</div>` : ''}
          ${personalInfo.location ? `<div><span>📍</span>${personalInfo.location}</div>` : ''}
          ${personalInfo.linkedin ? `<div><span>in</span>${personalInfo.linkedin}</div>` : ''}
          ${personalInfo.website ? `<div><span>🔗</span>${personalInfo.website}</div>` : ''}
        </div>

        ${Object.entries(skillsByCategory).map(([category, catSkills]) => `
          <h3>${category}</h3>
          <div>
            ${catSkills.map(s => `<span class="skill-tag ${s.level === 'Expert' ? 'expert' : ''}">${s.name}</span>`).join('')}
          </div>
        `).join('')}

        ${education.length > 0 ? `
          <h3>Education</h3>
          ${education.map(edu => `
            <div style="margin-bottom:0.75rem;">
              <div style="color:#cdd6f4;font-size:0.82rem;font-weight:600;">${edu.degree}</div>
              ${edu.field ? `<div style="color:#a6adc8;font-size:0.75rem;">${edu.field}</div>` : ''}
              <div style="color:#6c7086;font-size:0.75rem;">${edu.institution}</div>
              <div style="color:#6c7086;font-size:0.72rem;">${formatDate(edu.endDate)}</div>
            </div>
          `).join('')}
        ` : ''}
      </div>

      <div class="tech-main">
        ${personalInfo.summary ? `
          <h2>About</h2>
          <p style="font-size:0.82rem;color:#4b5563;line-height:1.6;margin:0;">${personalInfo.summary}</p>
        ` : ''}

        ${experience.length > 0 ? `
          <h2>Experience</h2>
          ${experience.map(exp => `
            <div class="exp-item">
              <div class="exp-header">
                <div class="exp-title">${exp.position}</div>
                <div class="exp-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
              </div>
              <div class="exp-company">${exp.company}</div>
              ${exp.description ? `<div class="exp-desc">${exp.description}</div>` : ''}
              ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                <ul class="exp-bullets">
                  ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}

        ${projects.length > 0 ? `
          <h2>Projects</h2>
          ${projects.map(proj => `
            <div class="proj-item">
              <div class="proj-name">${proj.name}</div>
              ${proj.description ? `<div class="proj-desc">${proj.description}</div>` : ''}
              ${proj.technologies.length > 0 ? `
                <div style="margin-top:0.3rem;">
                  ${proj.technologies.map(t => `<span class="skill-tag">${t}</span>`).join('')}
                </div>
              ` : ''}
              ${proj.url ? `<div class="proj-url">${proj.url}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}
      </div>
    </div>
  `;

  return { html, css };
}

function renderHealthcareTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-healthcare {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #1a202c;
      padding: 0.75in 1in;
      box-sizing: border-box;
      line-height: 1.5;
    }
    .hc-header { text-align: center; border-bottom: 3px solid ${config.accentColor}; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .hc-name { font-size: 1.8rem; font-weight: 700; color: ${config.accentColor}; letter-spacing: 1px; margin-bottom: 0.3rem; }
    .hc-credentials { font-size: 0.95rem; color: #4a5568; margin-bottom: 0.5rem; font-style: italic; }
    .hc-contact { font-size: 0.82rem; color: #718096; }
    .hc-contact span { margin: 0 0.75rem; }
    .hc-section { margin-bottom: 1.5rem; }
    .hc-section-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${config.accentColor};
      border-bottom: 1.5px solid ${config.accentColor}33;
      padding-bottom: 0.3rem;
      margin-bottom: 0.75rem;
    }
    .hc-exp-item { margin-bottom: 1rem; }
    .hc-exp-top { display: flex; justify-content: space-between; }
    .hc-exp-title { font-weight: 700; font-size: 0.92rem; }
    .hc-exp-date { font-size: 0.8rem; color: #718096; }
    .hc-exp-org { color: ${config.accentColor}; font-size: 0.85rem; margin-bottom: 0.25rem; }
    .hc-exp-desc { font-size: 0.82rem; color: #4a5568; }
    .hc-bullets { list-style: disc; padding-left: 1.2rem; margin: 0.3rem 0 0; }
    .hc-bullets li { font-size: 0.82rem; color: #4a5568; margin-bottom: 0.2rem; }
    .hc-edu-item { display: flex; justify-content: space-between; margin-bottom: 0.6rem; }
    .hc-edu-left .degree { font-weight: 700; font-size: 0.88rem; }
    .hc-edu-left .field { font-size: 0.82rem; color: #4a5568; }
    .hc-edu-left .inst { font-size: 0.82rem; color: ${config.accentColor}; }
    .hc-edu-right { font-size: 0.8rem; color: #718096; text-align: right; }
    .hc-skills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .hc-skill-chip {
      padding: 0.2rem 0.6rem;
      border: 1px solid ${config.accentColor}55;
      color: ${config.accentColor};
      border-radius: 20px;
      font-size: 0.78rem;
    }
    .hc-summary { font-size: 0.85rem; color: #4a5568; line-height: 1.7; font-style: italic; border-left: 3px solid ${config.accentColor}; padding-left: 1rem; }
  `;

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const html = `
    <div class="resume-healthcare">
      <div class="hc-header">
        <div class="hc-name">${personalInfo.fullName || 'Your Name'}</div>
        ${experience[0]?.position ? `<div class="hc-credentials">${experience[0].position}</div>` : ''}
        <div class="hc-contact">
          ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
          ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
          ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
          ${personalInfo.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>

      ${personalInfo.summary ? `
        <div class="hc-section">
          <div class="hc-section-title">Professional Summary</div>
          <div class="hc-summary">${personalInfo.summary}</div>
        </div>
      ` : ''}

      ${experience.length > 0 ? `
        <div class="hc-section">
          <div class="hc-section-title">Clinical Experience</div>
          ${experience.map(exp => `
            <div class="hc-exp-item">
              <div class="hc-exp-top">
                <div class="hc-exp-title">${exp.position}</div>
                <div class="hc-exp-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
              </div>
              <div class="hc-exp-org">${exp.company}</div>
              ${exp.description ? `<div class="hc-exp-desc">${exp.description}</div>` : ''}
              ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                <ul class="hc-bullets">
                  ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div class="hc-section">
          <div class="hc-section-title">Education & Credentials</div>
          ${education.map(edu => `
            <div class="hc-edu-item">
              <div class="hc-edu-left">
                <div class="degree">${edu.degree}</div>
                ${edu.field ? `<div class="field">${edu.field}</div>` : ''}
                <div class="inst">${edu.institution}</div>
                ${edu.honors ? `<div style="font-size:0.78rem;color:#718096;font-style:italic;">${edu.honors}</div>` : ''}
              </div>
              <div class="hc-edu-right">
                ${edu.endDate ? formatDate(edu.endDate) : ''}
                ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${skills.length > 0 ? `
        <div class="hc-section">
          <div class="hc-section-title">Clinical Skills & Competencies</div>
          ${Object.entries(skillsByCategory).map(([category, catSkills]) => `
            <div style="margin-bottom:0.5rem;">
              <div style="font-size:0.78rem;font-weight:700;color:#718096;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:1px;">${category}</div>
              <div class="hc-skills">
                ${catSkills.map(s => `<span class="hc-skill-chip">${s.name}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  return { html, css };
}

function renderAcademicTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-academic {
      font-family: 'Garamond', 'Times New Roman', serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #1a1a1a;
      padding: 1in 1.25in;
      box-sizing: border-box;
      line-height: 1.7;
    }
    .ac-name { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.2rem; color: ${config.accentColor}; }
    .ac-contact { font-size: 0.85rem; color: #555; margin-bottom: 0.5rem; }
    .ac-contact span { margin-right: 1.5rem; }
    .ac-divider { border: none; border-top: 2px solid ${config.accentColor}; margin: 0.75rem 0 1.5rem; }
    .ac-section { margin-bottom: 1.75rem; }
    .ac-section-title {
      font-size: 1rem;
      font-variant: small-caps;
      letter-spacing: 1px;
      color: ${config.accentColor};
      border-bottom: 1px solid ${config.accentColor}44;
      padding-bottom: 0.2rem;
      margin-bottom: 0.75rem;
    }
    .ac-entry { margin-bottom: 1rem; }
    .ac-entry-header { display: flex; justify-content: space-between; }
    .ac-entry-title { font-weight: 700; font-size: 0.9rem; }
    .ac-entry-date { font-size: 0.82rem; color: #777; }
    .ac-entry-sub { font-size: 0.85rem; color: #555; font-style: italic; }
    .ac-entry-org { font-size: 0.85rem; color: ${config.accentColor}; }
    .ac-entry-desc { font-size: 0.83rem; color: #444; margin-top: 0.3rem; line-height: 1.6; }
    .ac-bullets { list-style: none; padding: 0; margin: 0.3rem 0 0; }
    .ac-bullets li { font-size: 0.83rem; color: #444; padding-left: 1.2rem; position: relative; margin-bottom: 0.2rem; }
    .ac-bullets li::before { content: '•'; position: absolute; left: 0; color: ${config.accentColor}; }
    .ac-pub { font-size: 0.83rem; color: #333; margin-bottom: 0.5rem; line-height: 1.5; }
    .ac-pub em { color: ${config.accentColor}; }
    .ac-skills-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .ac-skill-item { font-size: 0.82rem; color: #444; padding-left: 0.75rem; border-left: 2px solid ${config.accentColor}33; }
  `;

  const html = `
    <div class="resume-academic">
      <div class="ac-name">${personalInfo.fullName || 'Your Name'}</div>
      ${experience[0]?.position ? `<div style="font-size:0.9rem;color:#555;font-style:italic;margin-bottom:0.3rem;">${experience[0].position}</div>` : ''}
      <div class="ac-contact">
        ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
        ${personalInfo.website ? `<span>${personalInfo.website}</span>` : ''}
      </div>
      <hr class="ac-divider" />

      ${personalInfo.summary ? `
        <div class="ac-section">
          <div class="ac-section-title">Research Interests</div>
          <p style="font-size:0.85rem;color:#444;line-height:1.7;margin:0;">${personalInfo.summary}</p>
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div class="ac-section">
          <div class="ac-section-title">Education</div>
          ${education.map(edu => `
            <div class="ac-entry">
              <div class="ac-entry-header">
                <div class="ac-entry-title">${edu.degree}${edu.field ? `, ${edu.field}` : ''}</div>
                <div class="ac-entry-date">${edu.endDate ? formatDate(edu.endDate) : ''}</div>
              </div>
              <div class="ac-entry-org">${edu.institution}</div>
              ${edu.honors ? `<div class="ac-entry-sub">${edu.honors}</div>` : ''}
              ${edu.gpa ? `<div style="font-size:0.8rem;color:#777;">GPA: ${edu.gpa}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${experience.length > 0 ? `
        <div class="ac-section">
          <div class="ac-section-title">Academic & Research Experience</div>
          ${experience.map(exp => `
            <div class="ac-entry">
              <div class="ac-entry-header">
                <div class="ac-entry-title">${exp.position}</div>
                <div class="ac-entry-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
              </div>
              <div class="ac-entry-org">${exp.company}</div>
              ${exp.description ? `<div class="ac-entry-desc">${exp.description}</div>` : ''}
              ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                <ul class="ac-bullets">
                  ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${projects.length > 0 ? `
        <div class="ac-section">
          <div class="ac-section-title">Publications & Research</div>
          ${projects.map(proj => `
            <div class="ac-pub">
              <strong>${proj.name}</strong>${proj.description ? `. <em>${proj.description}</em>` : ''}
              ${proj.url ? ` <a href="${proj.url}" style="color:${config.accentColor};">${proj.url}</a>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${skills.length > 0 ? `
        <div class="ac-section">
          <div class="ac-section-title">Skills & Methods</div>
          <div class="ac-skills-grid">
            ${skills.map(s => `<div class="ac-skill-item">${s.name}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  return { html, css };
}

function renderEntryLevelTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-entry {
      font-family: 'Nunito', 'Poppins', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #374151;
    }
    .entry-header {
      background: linear-gradient(135deg, ${config.accentColor} 0%, ${adjustColor(config.accentColor, -30)} 100%);
      color: white;
      padding: 2.5rem 2rem;
      text-align: center;
    }
    .entry-name { font-size: 2rem; font-weight: 800; margin-bottom: 0.25rem; letter-spacing: -0.5px; }
    .entry-tagline { font-size: 0.9rem; opacity: 0.85; margin-bottom: 0.75rem; }
    .entry-contact { font-size: 0.8rem; opacity: 0.9; }
    .entry-contact span { margin: 0 0.75rem; }
    .entry-body { padding: 1.5rem 2rem; }
    .entry-section { margin-bottom: 1.5rem; }
    .entry-section-title {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: ${config.accentColor};
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .entry-section-title::after { content: ''; flex: 1; height: 1px; background: ${config.accentColor}33; }
    .entry-edu-item { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; padding: 0.75rem; background: ${config.accentColor}08; border-radius: 8px; border-left: 3px solid ${config.accentColor}; }
    .entry-degree { font-weight: 700; font-size: 0.9rem; color: #1f2937; }
    .entry-school { font-size: 0.82rem; color: ${config.accentColor}; }
    .entry-edu-detail { font-size: 0.78rem; color: #6b7280; }
    .entry-date { font-size: 0.8rem; color: #6b7280; text-align: right; white-space: nowrap; }
    .entry-exp-item { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f3f4f6; }
    .entry-exp-item:last-child { border-bottom: none; }
    .entry-exp-header { display: flex; justify-content: space-between; margin-bottom: 0.2rem; }
    .entry-exp-title { font-weight: 700; font-size: 0.88rem; color: #1f2937; }
    .entry-exp-company { font-size: 0.82rem; color: ${config.accentColor}; margin-bottom: 0.25rem; }
    .entry-exp-desc { font-size: 0.8rem; color: #6b7280; line-height: 1.5; }
    .entry-bullets { list-style: none; padding: 0; margin: 0.25rem 0 0; }
    .entry-bullets li { font-size: 0.8rem; color: #4b5563; padding-left: 1rem; position: relative; margin-bottom: 0.2rem; }
    .entry-bullets li::before { content: '→'; position: absolute; left: 0; color: ${config.accentColor}; font-size: 0.7rem; line-height: 1.6; }
    .proj-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; }
    .proj-card-name { font-weight: 700; font-size: 0.88rem; color: #1f2937; margin-bottom: 0.2rem; }
    .proj-card-desc { font-size: 0.78rem; color: #6b7280; line-height: 1.4; }
    .proj-card-tags { margin-top: 0.4rem; }
    .proj-tag { display: inline-block; background: ${config.accentColor}15; color: ${config.accentColor}; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.7rem; margin-right: 0.25rem; font-weight: 600; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .skill-pill { background: ${config.accentColor}12; color: ${config.accentColor}; border-radius: 20px; padding: 0.2rem 0.6rem; font-size: 0.77rem; font-weight: 600; }
  `;

  const html = `
    <div class="resume-entry">
      <div class="entry-header">
        <div class="entry-name">${personalInfo.fullName || 'Your Name'}</div>
        ${education[0] ? `<div class="entry-tagline">${education[0].degree}${education[0].field ? ` in ${education[0].field}` : ''} · ${education[0].institution}</div>` : ''}
        <div class="entry-contact">
          ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
          ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
          ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
          ${personalInfo.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>

      <div class="entry-body">
        ${personalInfo.summary ? `
          <div class="entry-section">
            <div class="entry-section-title">About Me</div>
            <p style="font-size:0.85rem;color:#4b5563;line-height:1.7;margin:0;">${personalInfo.summary}</p>
          </div>
        ` : ''}

        ${education.length > 0 ? `
          <div class="entry-section">
            <div class="entry-section-title">Education</div>
            ${education.map(edu => `
              <div class="entry-edu-item">
                <div>
                  <div class="entry-degree">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</div>
                  <div class="entry-school">${edu.institution}</div>
                  ${edu.honors ? `<div class="entry-edu-detail">${edu.honors}</div>` : ''}
                  ${edu.gpa ? `<div class="entry-edu-detail">GPA: ${edu.gpa}</div>` : ''}
                </div>
                <div class="entry-date">${edu.endDate ? formatDate(edu.endDate) : ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${projects.length > 0 ? `
          <div class="entry-section">
            <div class="entry-section-title">Projects</div>
            ${projects.map(proj => `
              <div class="proj-card">
                <div class="proj-card-name">${proj.name}${proj.url ? ` <span style="font-size:0.72rem;font-weight:400;color:#9ca3af;">· ${proj.url}</span>` : ''}</div>
                ${proj.description ? `<div class="proj-card-desc">${proj.description}</div>` : ''}
                ${proj.technologies.length > 0 ? `
                  <div class="proj-card-tags">
                    ${proj.technologies.map(t => `<span class="proj-tag">${t}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div class="entry-section">
            <div class="entry-section-title">Skills</div>
            <div class="skills-grid">
              ${skills.map(s => `<span class="skill-pill">${s.name}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${experience.length > 0 ? `
          <div class="entry-section">
            <div class="entry-section-title">Experience</div>
            ${experience.map(exp => `
              <div class="entry-exp-item">
                <div class="entry-exp-header">
                  <div class="entry-exp-title">${exp.position}</div>
                  <div class="entry-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
                </div>
                <div class="entry-exp-company">${exp.company}</div>
                ${exp.description ? `<div class="entry-exp-desc">${exp.description}</div>` : ''}
                ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                  <ul class="entry-bullets">
                    ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return { html, css };
}

function renderSalesTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-sales {
      font-family: 'Montserrat', 'Raleway', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #1f2937;
    }
    .sales-header {
      background: ${config.accentColor};
      color: white;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sales-name { font-size: 2rem; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
    .sales-role { font-size: 0.85rem; opacity: 0.85; letter-spacing: 2px; text-transform: uppercase; margin-top: 0.2rem; }
    .sales-contact-block { text-align: right; font-size: 0.78rem; opacity: 0.9; line-height: 1.8; }
    .sales-body { padding: 1.5rem 2rem; }
    .sales-section { margin-bottom: 1.75rem; }
    .sales-section-title {
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: ${config.accentColor};
      margin-bottom: 0.75rem;
      padding-bottom: 0.35rem;
      border-bottom: 2px solid ${config.accentColor};
    }
    .sales-exp-item { margin-bottom: 1.25rem; }
    .sales-exp-header { display: flex; justify-content: space-between; align-items: baseline; }
    .sales-exp-title { font-weight: 800; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .sales-exp-date { font-size: 0.75rem; color: #9ca3af; }
    .sales-exp-company { color: ${config.accentColor}; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
    .sales-exp-desc { font-size: 0.82rem; color: #4b5563; }
    .sales-bullets { list-style: none; padding: 0; margin: 0.35rem 0 0; }
    .sales-bullets li {
      font-size: 0.82rem;
      color: #374151;
      padding-left: 1.2rem;
      position: relative;
      margin-bottom: 0.25rem;
      line-height: 1.4;
    }
    .sales-bullets li::before { content: '▶'; position: absolute; left: 0; color: ${config.accentColor}; font-size: 0.5rem; line-height: 2; }
    .metric-highlight {
      display: inline-block;
      background: ${config.accentColor};
      color: white;
      border-radius: 4px;
      padding: 0.1rem 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      margin: 0 0.1rem;
    }
    .sales-skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .sales-skill { background: ${config.accentColor}15; color: ${config.accentColor}; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .sales-edu-item { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem; }
    .sales-edu-left .deg { font-weight: 700; }
    .sales-edu-left .inst { color: ${config.accentColor}; font-size: 0.8rem; }
  `;

  const html = `
    <div class="resume-sales">
      <div class="sales-header">
        <div>
          <div class="sales-name">${personalInfo.fullName || 'Your Name'}</div>
          ${experience[0]?.position ? `<div class="sales-role">${experience[0].position}</div>` : ''}
        </div>
        <div class="sales-contact-block">
          ${personalInfo.email ? `<div>${personalInfo.email}</div>` : ''}
          ${personalInfo.phone ? `<div>${personalInfo.phone}</div>` : ''}
          ${personalInfo.location ? `<div>${personalInfo.location}</div>` : ''}
          ${personalInfo.linkedin ? `<div>${personalInfo.linkedin}</div>` : ''}
        </div>
      </div>

      <div class="sales-body">
        ${personalInfo.summary ? `
          <div class="sales-section">
            <div class="sales-section-title">Value Proposition</div>
            <p style="font-size:0.85rem;color:#4b5563;line-height:1.7;margin:0;font-style:italic;">${personalInfo.summary}</p>
          </div>
        ` : ''}

        ${experience.length > 0 ? `
          <div class="sales-section">
            <div class="sales-section-title">Track Record</div>
            ${experience.map(exp => `
              <div class="sales-exp-item">
                <div class="sales-exp-header">
                  <div class="sales-exp-title">${exp.position}</div>
                  <div class="sales-exp-date">${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</div>
                </div>
                <div class="sales-exp-company">${exp.company}</div>
                ${exp.description ? `<div class="sales-exp-desc">${exp.description}</div>` : ''}
                ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                  <ul class="sales-bullets">
                    ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${skills.length > 0 ? `
          <div class="sales-section">
            <div class="sales-section-title">Core Competencies</div>
            <div class="sales-skills">
              ${skills.map(s => `<span class="sales-skill">${s.name}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${education.length > 0 ? `
          <div class="sales-section">
            <div class="sales-section-title">Education</div>
            ${education.map(edu => `
              <div class="sales-edu-item">
                <div class="sales-edu-left">
                  <div class="deg">${edu.degree}${edu.field ? ` · ${edu.field}` : ''}</div>
                  <div class="inst">${edu.institution}</div>
                </div>
                <div style="font-size:0.8rem;color:#9ca3af;">${edu.endDate ? formatDate(edu.endDate) : ''}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return { html, css };
}

function renderFederalTemplate(resume: Resume, template: Template, config: TemplateCustomization) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const css = `
    .resume-federal {
      font-family: 'Arial', 'Calibri', sans-serif;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      color: #000;
      padding: 1in;
      box-sizing: border-box;
      font-size: 10pt;
      line-height: 1.5;
    }
    .fed-header { margin-bottom: 1.5rem; border-bottom: 2px solid ${config.accentColor}; padding-bottom: 0.75rem; }
    .fed-name { font-size: 14pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${config.accentColor}; }
    .fed-contact { font-size: 9pt; color: #333; margin-top: 0.3rem; }
    .fed-contact span { margin-right: 1.5rem; }
    .fed-section { margin-bottom: 1.25rem; }
    .fed-section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      background: ${config.accentColor}15;
      color: ${config.accentColor};
      padding: 0.25rem 0.5rem;
      margin-bottom: 0.75rem;
      border-left: 3px solid ${config.accentColor};
    }
    .fed-exp-item { margin-bottom: 1.25rem; border-bottom: 1px dotted #ccc; padding-bottom: 1rem; }
    .fed-exp-item:last-child { border-bottom: none; }
    .fed-exp-title { font-weight: 700; font-size: 10.5pt; }
    .fed-exp-meta { display: flex; justify-content: space-between; font-size: 9pt; color: #555; margin: 0.2rem 0 0.4rem; }
    .fed-exp-org { font-weight: 600; color: ${config.accentColor}; }
    .fed-exp-desc { font-size: 9.5pt; color: #333; line-height: 1.6; }
    .fed-bullets { list-style: disc; padding-left: 1.2rem; margin: 0.3rem 0 0; }
    .fed-bullets li { font-size: 9.5pt; color: #333; margin-bottom: 0.25rem; line-height: 1.5; }
    .fed-edu-item { display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 0.5rem; }
    .fed-edu-left .deg { font-weight: 700; }
    .fed-edu-left .field { color: #555; }
    .fed-edu-left .inst { color: ${config.accentColor}; }
    .fed-skills-list { font-size: 9.5pt; color: #333; columns: 2; column-gap: 2rem; }
    .fed-skill-item { margin-bottom: 0.2rem; page-break-inside: avoid; }
    .fed-skill-item::before { content: '■ '; color: ${config.accentColor}; font-size: 7pt; }
  `;

  const html = `
    <div class="resume-federal">
      <div class="fed-header">
        <div class="fed-name">${personalInfo.fullName || 'YOUR NAME'}</div>
        <div class="fed-contact">
          ${personalInfo.location ? `<span>Address: ${personalInfo.location}</span>` : ''}
          ${personalInfo.phone ? `<span>Phone: ${personalInfo.phone}</span>` : ''}
          ${personalInfo.email ? `<span>Email: ${personalInfo.email}</span>` : ''}
        </div>
        ${personalInfo.linkedin ? `<div style="font-size:9pt;color:#555;margin-top:0.2rem;">LinkedIn: ${personalInfo.linkedin}</div>` : ''}
      </div>

      ${personalInfo.summary ? `
        <div class="fed-section">
          <div class="fed-section-title">Professional Summary</div>
          <p style="font-size:9.5pt;color:#333;line-height:1.6;margin:0;">${personalInfo.summary}</p>
        </div>
      ` : ''}

      ${experience.length > 0 ? `
        <div class="fed-section">
          <div class="fed-section-title">Work Experience</div>
          ${experience.map(exp => `
            <div class="fed-exp-item">
              <div class="fed-exp-title">${exp.position}</div>
              <div class="fed-exp-meta">
                <span class="fed-exp-org">${exp.company}</span>
                <span>${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              ${exp.description ? `<div class="fed-exp-desc">${exp.description}</div>` : ''}
              ${exp.achievements.filter(a => a.trim()).length > 0 ? `
                <ul class="fed-bullets">
                  ${exp.achievements.filter(a => a.trim()).map(a => `<li>${a}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${education.length > 0 ? `
        <div class="fed-section">
          <div class="fed-section-title">Education</div>
          ${education.map(edu => `
            <div class="fed-edu-item">
              <div class="fed-edu-left">
                <div class="deg">${edu.degree}</div>
                ${edu.field ? `<div class="field">${edu.field}</div>` : ''}
                <div class="inst">${edu.institution}</div>
                ${edu.honors ? `<div style="font-size:9pt;color:#777;font-style:italic;">${edu.honors}</div>` : ''}
              </div>
              <div style="font-size:9pt;color:#555;text-align:right;">
                ${edu.endDate ? formatDate(edu.endDate) : ''}
                ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${skills.length > 0 ? `
        <div class="fed-section">
          <div class="fed-section-title">Knowledge, Skills & Abilities</div>
          <div class="fed-skills-list">
            ${skills.map(s => `<div class="fed-skill-item">${s.name} (${s.level})</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  return { html, css };
}import { Resume } from '../types/resume';
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

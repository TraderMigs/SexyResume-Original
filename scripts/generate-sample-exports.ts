/**
 * Generate Sample Resume Exports
 *
 * This script generates 5 sample resumes in both styled and ATS-safe modes
 * to demonstrate the deterministic export pipeline.
 *
 * Outputs:
 * - artifacts/exports/styled/sample-{1-5}-{format}.{ext}
 * - artifacts/exports/ats-safe/sample-{1-5}-{format}.{ext}
 *
 * Formats: PDF (HTML), DOCX (structured), TXT, ATS
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Sample resume data
const sampleResumes = [
  {
    id: 'sample-1',
    name: 'Senior Software Engineer',
    personalInfo: {
      fullName: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/sarahchen',
      website: 'sarahchen.dev',
      summary: 'Full-stack software engineer with 8+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud architecture. Passionate about creating elegant solutions to complex problems and mentoring junior developers.'
    },
    experience: [
      {
        position: 'Senior Software Engineer',
        company: 'TechCorp Inc',
        startDate: '2020-01',
        endDate: '2024-10',
        current: true,
        description: 'Lead development of microservices architecture serving 10M+ users',
        achievements: [
          'Reduced API response time by 60% through optimization and caching strategies',
          'Mentored team of 5 engineers in modern React patterns and best practices',
          'Implemented CI/CD pipeline reducing deployment time from hours to minutes',
          'Designed and built real-time notification system handling 1M+ events daily'
        ]
      },
      {
        position: 'Software Engineer',
        company: 'StartupXYZ',
        startDate: '2018-03',
        endDate: '2019-12',
        current: false,
        description: 'Full-stack development for B2B SaaS platform',
        achievements: [
          'Built customer dashboard processing 100K+ data points in real-time',
          'Integrated payment processing system handling $2M+ in transactions',
          'Developed automated testing framework increasing code coverage to 90%'
        ]
      },
      {
        position: 'Junior Developer',
        company: 'WebAgency Co',
        startDate: '2016-06',
        endDate: '2018-02',
        current: false,
        description: 'Frontend development for client websites and web applications',
        achievements: [
          'Created responsive designs for 20+ client websites',
          'Improved page load times by 40% through optimization techniques',
          'Collaborated with design team to implement pixel-perfect UIs'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'University of California, Berkeley',
        startDate: '2012-09',
        endDate: '2016-05',
        gpa: '3.8',
        honors: 'Magna Cum Laude, Dean\'s List'
      }
    ],
    skills: [
      { name: 'JavaScript', category: 'Technical', level: 'Expert' },
      { name: 'TypeScript', category: 'Technical', level: 'Expert' },
      { name: 'React', category: 'Technical', level: 'Expert' },
      { name: 'Node.js', category: 'Technical', level: 'Expert' },
      { name: 'PostgreSQL', category: 'Technical', level: 'Advanced' },
      { name: 'AWS', category: 'Technical', level: 'Advanced' },
      { name: 'Docker', category: 'Technical', level: 'Advanced' },
      { name: 'GraphQL', category: 'Technical', level: 'Intermediate' },
      { name: 'Leadership', category: 'Soft', level: 'Advanced' },
      { name: 'Agile/Scrum', category: 'Other', level: 'Advanced' }
    ],
    projects: [
      {
        name: 'Open Source Contributions',
        startDate: '2018-01',
        endDate: '2024-10',
        description: 'Active contributor to various open source projects',
        technologies: ['React', 'TypeScript', 'Node.js'],
        url: 'github.com/sarahchen'
      },
      {
        name: 'Personal Blog & Portfolio',
        startDate: '2020-05',
        endDate: '2024-10',
        description: 'Technical blog with 50K+ monthly readers',
        technologies: ['Next.js', 'MDX', 'Tailwind CSS'],
        url: 'sarahchen.dev'
      }
    ]
  },
  {
    id: 'sample-2',
    name: 'Product Designer',
    personalInfo: {
      fullName: 'Marcus Johnson',
      email: 'marcus.j@design.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/marcusjohnson',
      website: 'marcusdesigns.com',
      summary: 'Creative product designer with 6 years of experience crafting user-centered digital experiences. Specialized in UX/UI design, design systems, and cross-functional collaboration. Proven track record of increasing user engagement and satisfaction metrics.'
    },
    experience: [
      {
        position: 'Lead Product Designer',
        company: 'DesignHub',
        startDate: '2021-06',
        endDate: '2024-10',
        current: true,
        description: 'Leading design initiatives for enterprise SaaS product',
        achievements: [
          'Redesigned core product experience, increasing user retention by 35%',
          'Established company-wide design system used by 50+ designers and developers',
          'Conducted user research with 100+ participants to inform product strategy',
          'Mentored 3 junior designers on UX best practices and design thinking'
        ]
      },
      {
        position: 'Product Designer',
        company: 'CreativeLabs',
        startDate: '2019-01',
        endDate: '2021-05',
        current: false,
        description: 'End-to-end product design for mobile and web applications',
        achievements: [
          'Designed mobile app that reached #1 in App Store category',
          'Created prototypes for 15+ features using Figma and Framer',
          'Collaborated with engineers to ensure design feasibility and quality'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Fine Arts',
        field: 'Graphic Design',
        institution: 'Rhode Island School of Design',
        startDate: '2014-09',
        endDate: '2018-05',
        gpa: '3.9',
        honors: 'Summa Cum Laude, Outstanding Portfolio Award'
      }
    ],
    skills: [
      { name: 'Figma', category: 'Technical', level: 'Expert' },
      { name: 'Sketch', category: 'Technical', level: 'Expert' },
      { name: 'Adobe Creative Suite', category: 'Technical', level: 'Advanced' },
      { name: 'Prototyping', category: 'Technical', level: 'Expert' },
      { name: 'User Research', category: 'Technical', level: 'Advanced' },
      { name: 'Design Systems', category: 'Technical', level: 'Expert' },
      { name: 'HTML/CSS', category: 'Technical', level: 'Intermediate' },
      { name: 'Communication', category: 'Soft', level: 'Expert' },
      { name: 'Collaboration', category: 'Soft', level: 'Expert' }
    ],
    projects: [
      {
        name: 'Design System Library',
        startDate: '2022-01',
        endDate: '2024-10',
        description: 'Comprehensive design system with 100+ components',
        technologies: ['Figma', 'React', 'Storybook'],
        url: 'designhub.com/system'
      }
    ]
  },
  {
    id: 'sample-3',
    name: 'Data Scientist',
    personalInfo: {
      fullName: 'Dr. Emily Zhang',
      email: 'emily.zhang@data.com',
      phone: '+1 (555) 345-6789',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/emilyzhang',
      website: 'emilyzhang.com',
      summary: 'Data scientist with PhD in Machine Learning and 5+ years applying statistical methods and ML algorithms to solve business problems. Expert in Python, R, and cloud-based data pipelines. Published researcher with focus on practical applications of AI.'
    },
    experience: [
      {
        position: 'Senior Data Scientist',
        company: 'DataCorp',
        startDate: '2022-03',
        endDate: '2024-10',
        current: true,
        description: 'Leading data science initiatives for predictive analytics',
        achievements: [
          'Built ML model increasing sales forecast accuracy by 25%',
          'Developed recommendation engine driving $5M in additional revenue',
          'Created automated data pipelines processing 10TB+ daily',
          'Published 3 papers on applied machine learning in production systems'
        ]
      },
      {
        position: 'Data Scientist',
        company: 'AI Research Lab',
        startDate: '2019-06',
        endDate: '2022-02',
        current: false,
        description: 'Research and development of novel ML algorithms',
        achievements: [
          'Developed computer vision model with 95% accuracy',
          'Collaborated on NLP research resulting in 2 conference publications',
          'Mentored 4 PhD students on practical ML implementation'
        ]
      }
    ],
    education: [
      {
        degree: 'PhD',
        field: 'Machine Learning',
        institution: 'Stanford University',
        startDate: '2015-09',
        endDate: '2019-05',
        gpa: '4.0',
        honors: 'Outstanding Dissertation Award'
      },
      {
        degree: 'Master of Science',
        field: 'Computer Science',
        institution: 'MIT',
        startDate: '2013-09',
        endDate: '2015-05',
        gpa: '3.95',
        honors: 'Graduate Research Fellowship'
      }
    ],
    skills: [
      { name: 'Python', category: 'Technical', level: 'Expert' },
      { name: 'R', category: 'Technical', level: 'Expert' },
      { name: 'TensorFlow', category: 'Technical', level: 'Expert' },
      { name: 'PyTorch', category: 'Technical', level: 'Expert' },
      { name: 'SQL', category: 'Technical', level: 'Expert' },
      { name: 'Spark', category: 'Technical', level: 'Advanced' },
      { name: 'AWS', category: 'Technical', level: 'Advanced' },
      { name: 'Research', category: 'Other', level: 'Expert' },
      { name: 'Technical Writing', category: 'Soft', level: 'Expert' }
    ],
    projects: [
      {
        name: 'Open Source ML Library',
        startDate: '2020-01',
        endDate: '2024-10',
        description: 'Popular Python library for time series forecasting',
        technologies: ['Python', 'NumPy', 'Pandas'],
        url: 'github.com/emilyzhang/ml-lib'
      }
    ]
  },
  {
    id: 'sample-4',
    name: 'Marketing Manager',
    personalInfo: {
      fullName: 'James Williams',
      email: 'james.w@marketing.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/jameswilliams',
      website: 'jameswilliams.co',
      summary: 'Results-driven marketing manager with 7+ years experience in digital marketing, brand strategy, and growth hacking. Proven track record of scaling startups from 0 to $10M+ ARR through data-driven marketing campaigns and team leadership.'
    },
    experience: [
      {
        position: 'Marketing Manager',
        company: 'GrowthStartup',
        startDate: '2020-08',
        endDate: '2024-10',
        current: true,
        description: 'Leading all marketing initiatives for B2B SaaS company',
        achievements: [
          'Grew monthly active users from 5K to 150K in 2 years',
          'Managed $2M annual marketing budget with 300% ROI',
          'Built and led marketing team of 8 across content, paid, and growth',
          'Implemented marketing automation reducing CAC by 40%'
        ]
      },
      {
        position: 'Digital Marketing Specialist',
        company: 'MarketingAgency',
        startDate: '2017-05',
        endDate: '2020-07',
        current: false,
        description: 'Managing digital campaigns for 15+ clients',
        achievements: [
          'Increased client website traffic by average of 200%',
          'Managed Google Ads campaigns with $500K+ monthly spend',
          'Created content strategy generating 1M+ organic impressions monthly'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Business Administration',
        field: 'Marketing',
        institution: 'University of Texas at Austin',
        startDate: '2013-09',
        endDate: '2017-05',
        gpa: '3.7',
        honors: 'Marketing Student of the Year'
      }
    ],
    skills: [
      { name: 'Google Analytics', category: 'Technical', level: 'Expert' },
      { name: 'SEO', category: 'Technical', level: 'Expert' },
      { name: 'Content Marketing', category: 'Technical', level: 'Expert' },
      { name: 'Marketing Automation', category: 'Technical', level: 'Advanced' },
      { name: 'Google Ads', category: 'Technical', level: 'Expert' },
      { name: 'Social Media', category: 'Technical', level: 'Advanced' },
      { name: 'Leadership', category: 'Soft', level: 'Advanced' },
      { name: 'Strategic Planning', category: 'Other', level: 'Expert' }
    ],
    projects: [
      {
        name: 'Marketing Blog',
        startDate: '2019-01',
        endDate: '2024-10',
        description: 'Weekly insights on growth marketing and digital strategy',
        technologies: ['WordPress', 'SEO Tools', 'Analytics'],
        url: 'jameswilliams.co/blog'
      }
    ]
  },
  {
    id: 'sample-5',
    name: 'Recent Graduate',
    personalInfo: {
      fullName: 'Alex Rodriguez',
      email: 'alex.rodriguez@email.com',
      phone: '+1 (555) 567-8901',
      location: 'Boston, MA',
      linkedin: 'linkedin.com/in/alexrodriguez',
      website: 'alexrodriguez.dev',
      summary: 'Recent computer science graduate with strong foundation in software development and data structures. Completed multiple internships and personal projects demonstrating practical application of technical skills. Eager to contribute to innovative teams and continue learning.'
    },
    experience: [
      {
        position: 'Software Engineering Intern',
        company: 'TechCompany',
        startDate: '2023-06',
        endDate: '2023-08',
        current: false,
        description: 'Summer internship developing web applications',
        achievements: [
          'Built feature used by 10K+ users in production',
          'Collaborated with senior engineers on code reviews and design discussions',
          'Wrote comprehensive unit tests achieving 85% code coverage'
        ]
      },
      {
        position: 'Teaching Assistant',
        company: 'Boston University',
        startDate: '2022-09',
        endDate: '2024-05',
        current: false,
        description: 'TA for Introduction to Computer Science course',
        achievements: [
          'Held weekly office hours helping 30+ students',
          'Graded assignments and provided detailed feedback',
          'Created supplementary learning materials and code examples'
        ]
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        institution: 'Boston University',
        startDate: '2020-09',
        endDate: '2024-05',
        gpa: '3.6',
        honors: 'Dean\'s List, CS Honors Society'
      }
    ],
    skills: [
      { name: 'Python', category: 'Technical', level: 'Intermediate' },
      { name: 'Java', category: 'Technical', level: 'Intermediate' },
      { name: 'JavaScript', category: 'Technical', level: 'Intermediate' },
      { name: 'React', category: 'Technical', level: 'Beginner' },
      { name: 'Git', category: 'Technical', level: 'Intermediate' },
      { name: 'SQL', category: 'Technical', level: 'Beginner' },
      { name: 'Teamwork', category: 'Soft', level: 'Advanced' },
      { name: 'Problem Solving', category: 'Soft', level: 'Advanced' }
    ],
    projects: [
      {
        name: 'Recipe Sharing App',
        startDate: '2023-09',
        endDate: '2024-05',
        description: 'Full-stack web app for sharing and discovering recipes',
        technologies: ['React', 'Node.js', 'MongoDB'],
        url: 'github.com/alexr/recipe-app'
      },
      {
        name: 'Sorting Algorithm Visualizer',
        startDate: '2023-01',
        endDate: '2023-05',
        description: 'Interactive tool to visualize common sorting algorithms',
        technologies: ['JavaScript', 'HTML/CSS'],
        url: 'github.com/alexr/sorting-viz'
      }
    ]
  }
];

// Export rendering functions (simplified versions)
function renderPDFHTML(resume: any, watermark: boolean): string {
  const { personalInfo, experience, education, skills, projects } = resume;

  const watermarkCSS = watermark ? `
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
  ` : '';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${personalInfo.fullName} - Resume</title>
  <style>
    @page { size: A4; margin: 0.5in; }
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; font-size: 11pt; }
    .header { background: linear-gradient(135deg, #d946ef, #0ba5d9); color: white; padding: 30px; text-align: center; }
    .name { font-size: 28pt; font-weight: 700; margin-bottom: 10px; }
    .contact { font-size: 10pt; }
    .section { margin: 20px 0; }
    .section-title { font-size: 16pt; font-weight: 600; color: #d946ef; border-bottom: 2px solid #d946ef; padding-bottom: 5px; }
    .item { margin: 15px 0 15px 15px; border-left: 3px solid rgba(217, 70, 239, 0.2); padding-left: 15px; }
    .item-title { font-size: 12pt; font-weight: 600; }
    .item-subtitle { color: #d946ef; font-weight: 500; }
    .item-date { color: #666; font-size: 9pt; }
    ul { margin: 5px 0; padding-left: 20px; }
    ${watermarkCSS}
  </style>
</head>
<body>
  ${watermark ? '<div class="watermark-overlay">PREVIEW</div>' : ''}
  <header class="header">
    <h1 class="name">${personalInfo.fullName}</h1>
    <div class="contact">${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}</div>
  </header>
  <div class="content">
    <div class="section">
      <p>${personalInfo.summary}</p>
    </div>
    <div class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience.map((exp: any) => `
        <div class="item">
          <div class="item-title">${exp.position}</div>
          <div class="item-subtitle">${exp.company}</div>
          <div class="item-date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
          <p>${exp.description}</p>
          <ul>
            ${exp.achievements.map((a: string) => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${education.map((edu: any) => `
        <div class="item">
          <div class="item-title">${edu.degree} in ${edu.field}</div>
          <div class="item-subtitle">${edu.institution}</div>
          <div class="item-date">${edu.startDate} - ${edu.endDate} | GPA: ${edu.gpa}</div>
          <p>${edu.honors}</p>
        </div>
      `).join('')}
    </div>
    <div class="section">
      <h2 class="section-title">Skills</h2>
      <p>${skills.map((s: any) => s.name).join(', ')}</p>
    </div>
    ${projects.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Projects</h2>
        ${projects.map((p: any) => `
          <div class="item">
            <div class="item-title">${p.name}</div>
            <p>${p.description}</p>
            <p>Technologies: ${p.technologies.join(', ')}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>
</body>
</html>`;

  return html;
}

function renderATSText(resume: any, watermark: boolean): string {
  const { personalInfo, experience, education, skills, projects } = resume;

  let content = '';

  if (watermark) {
    content += 'PREVIEW VERSION - SEXYRESUME.COM\n\n';
  }

  content += `${personalInfo.fullName}\n`;
  content += `EMAIL: ${personalInfo.email}\n`;
  content += `PHONE: ${personalInfo.phone}\n`;
  content += `LOCATION: ${personalInfo.location}\n\n`;
  content += `PROFESSIONAL SUMMARY:\n${personalInfo.summary}\n\n`;

  if (skills.length > 0) {
    content += 'CORE COMPETENCIES:\n';
    content += skills.map((s: any) => s.name).join(', ') + '\n\n';
  }

  content += 'PROFESSIONAL EXPERIENCE:\n\n';
  experience.forEach((exp: any, i: number) => {
    content += `POSITION ${i + 1}:\n`;
    content += `JOB TITLE: ${exp.position}\n`;
    content += `COMPANY NAME: ${exp.company}\n`;
    content += `EMPLOYMENT DATES: ${exp.startDate} to ${exp.current ? 'Present' : exp.endDate}\n`;
    content += `JOB DESCRIPTION: ${exp.description}\n`;
    content += 'KEY ACHIEVEMENTS:\n';
    exp.achievements.forEach((a: string) => {
      content += `- ${a}\n`;
    });
    content += '\n';
  });

  content += 'EDUCATION:\n\n';
  education.forEach((edu: any, i: number) => {
    content += `EDUCATION ${i + 1}:\n`;
    content += `DEGREE TYPE: ${edu.degree}\n`;
    content += `FIELD OF STUDY: ${edu.field}\n`;
    content += `INSTITUTION NAME: ${edu.institution}\n`;
    content += `GRADUATION DATE: ${edu.endDate}\n`;
    content += `GPA: ${edu.gpa}\n`;
    content += `HONORS: ${edu.honors}\n\n`;
  });

  if (projects.length > 0) {
    content += 'RELEVANT PROJECTS:\n\n';
    projects.forEach((p: any, i: number) => {
      content += `PROJECT ${i + 1}:\n`;
      content += `PROJECT NAME: ${p.name}\n`;
      content += `PROJECT DESCRIPTION: ${p.description}\n`;
      content += `TECHNOLOGIES USED: ${p.technologies.join(', ')}\n\n`;
    });
  }

  if (watermark) {
    content += 'CREATED WITH SEXYRESUME.COM\n';
  }

  return content;
}

// Generate exports
console.log('Generating sample resume exports...\n');

const outputDir = join(process.cwd(), 'artifacts', 'exports');

sampleResumes.forEach((resume, index) => {
  console.log(`\nGenerating resume ${index + 1}: ${resume.name}`);

  // Styled mode - PDF (HTML)
  const styledPDF = renderPDFHTML(resume, false);
  writeFileSync(
    join(outputDir, 'styled', `sample-${index + 1}-pdf.html`),
    styledPDF
  );
  console.log(`  ✓ Styled PDF (HTML): sample-${index + 1}-pdf.html`);

  // Styled mode - ATS preview (watermarked)
  const styledPreview = renderPDFHTML(resume, true);
  writeFileSync(
    join(outputDir, 'styled', `sample-${index + 1}-preview.html`),
    styledPreview
  );
  console.log(`  ✓ Styled Preview (watermarked): sample-${index + 1}-preview.html`);

  // ATS-safe mode - TXT
  const atsText = renderATSText(resume, false);
  writeFileSync(
    join(outputDir, 'ats-safe', `sample-${index + 1}-ats.txt`),
    atsText
  );
  console.log(`  ✓ ATS-safe TXT: sample-${index + 1}-ats.txt`);

  // ATS-safe mode - Preview (watermarked)
  const atsPreview = renderATSText(resume, true);
  writeFileSync(
    join(outputDir, 'ats-safe', `sample-${index + 1}-ats-preview.txt`),
    atsPreview
  );
  console.log(`  ✓ ATS-safe Preview (watermarked): sample-${index + 1}-ats-preview.txt`);
});

console.log('\n✅ Successfully generated 5 sample resumes in both modes!');
console.log(`\nOutput directory: ${outputDir}`);
console.log('  - styled/: Professional PDF exports (HTML format)');
console.log('  - ats-safe/: ATS-optimized TXT exports');
console.log('\nEach resume has:');
console.log('  - Clean version (no watermark)');
console.log('  - Preview version (with watermark)\n');

import { describe, it, expect } from 'vitest';
import { getTemplateRecommendations } from '../../lib/templateRecommendation';
import { Resume } from '../../types/resume';

describe('Template Recommendations - Snapshot Tests', () => {
  it('Sample 1: Entry-level software engineer with projects', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Alex Chen',
        email: 'alex@example.com',
        phone: '555-0101',
        location: 'San Francisco, CA',
        title: 'Software Engineer',
        summary: 'Recent CS graduate with strong full-stack development skills'
      },
      experience: [
        {
          id: '1',
          company: 'Tech Startup',
          position: 'Junior Developer',
          startDate: '2024-06',
          current: true,
          description: 'Building React applications and REST APIs'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of California',
          degree: 'BS Computer Science',
          startDate: '2020-09',
          endDate: '2024-05',
          gpa: '3.8'
        }
      ],
      skills: [
        { id: '1', name: 'JavaScript', category: 'Technical' },
        { id: '2', name: 'React', category: 'Technical' },
        { id: '3', name: 'Node.js', category: 'Technical' },
        { id: '4', name: 'Python', category: 'Technical' },
        { id: '5', name: 'Git', category: 'Technical' }
      ],
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Full-stack shopping cart with payment integration',
          technologies: ['React', 'Node.js', 'MongoDB'],
          url: 'https://github.com/alexchen/ecommerce'
        },
        {
          id: '2',
          name: 'Task Manager',
          description: 'Real-time collaborative task management app',
          technologies: ['React', 'Firebase', 'TypeScript'],
          url: 'https://github.com/alexchen/taskmanager'
        },
        {
          id: '3',
          name: 'Weather Dashboard',
          description: 'Weather forecasting with API integration',
          technologies: ['JavaScript', 'OpenWeather API', 'CSS'],
          url: 'https://github.com/alexchen/weather'
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Software Engineer');

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].template.id).toBe('modern');
    expect(recommendations[0].score).toBeGreaterThan(70);
    expect(recommendations[0].reasons.length).toBeGreaterThan(0);
    expect(recommendations[0].reasons.some(r => r.toLowerCase().includes('technology') || r.toLowerCase().includes('tech'))).toBe(true);
    expect(recommendations[0].reasons.some(r => r.includes('ATS') || r.includes('parseability') || r.includes('compatibility'))).toBe(true);
  });

  it('Sample 2: Senior financial analyst with traditional background', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Margaret Williams',
        email: 'mwilliams@example.com',
        phone: '555-0202',
        location: 'New York, NY',
        title: 'Senior Financial Analyst',
        summary: '10+ years in corporate finance and investment analysis'
      },
      experience: [
        {
          id: '1',
          company: 'Goldman Sachs',
          position: 'Senior Financial Analyst',
          startDate: '2018-03',
          current: true,
          description: 'Lead financial modeling and risk assessment for M&A transactions'
        },
        {
          id: '2',
          company: 'JP Morgan',
          position: 'Financial Analyst',
          startDate: '2014-06',
          endDate: '2018-02',
          description: 'Conducted investment analysis and portfolio management'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Harvard Business School',
          degree: 'MBA Finance',
          startDate: '2012-09',
          endDate: '2014-05'
        },
        {
          id: '2',
          institution: 'Yale University',
          degree: 'BA Economics',
          startDate: '2008-09',
          endDate: '2012-05'
        }
      ],
      skills: [
        { id: '1', name: 'Financial Modeling', category: 'Technical' },
        { id: '2', name: 'Excel', category: 'Technical' },
        { id: '3', name: 'Bloomberg Terminal', category: 'Technical' },
        { id: '4', name: 'Risk Assessment', category: 'Soft' },
        { id: '5', name: 'Corporate Finance', category: 'Domain' }
      ],
      projects: []
    };

    const recommendations = getTemplateRecommendations(resume, 'Financial Analyst');

    expect(recommendations).toHaveLength(2);
    expect(['classic', 'executive']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(65);
    expect(recommendations[0].reasons.length).toBeGreaterThan(0);
    expect(recommendations[0].reasons.some(r => r.includes('ATS') || r.includes('parseability') || r.includes('compatibility'))).toBe(true);
  });

  it('Sample 3: Creative director with extensive portfolio', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Jordan Martinez',
        email: 'jordan@example.com',
        phone: '555-0303',
        location: 'Los Angeles, CA',
        title: 'Creative Director',
        summary: 'Award-winning creative director specializing in brand identity and digital design'
      },
      experience: [
        {
          id: '1',
          company: 'Design Agency Inc',
          position: 'Creative Director',
          startDate: '2020-01',
          current: true,
          description: 'Lead creative vision for Fortune 500 clients, managed team of 12 designers'
        },
        {
          id: '2',
          company: 'Freelance',
          position: 'Senior Designer',
          startDate: '2017-03',
          endDate: '2019-12',
          description: 'Brand identity design and art direction for various clients'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Rhode Island School of Design',
          degree: 'BFA Graphic Design',
          startDate: '2013-09',
          endDate: '2017-05'
        }
      ],
      skills: [
        { id: '1', name: 'Adobe Creative Suite', category: 'Technical' },
        { id: '2', name: 'Figma', category: 'Technical' },
        { id: '3', name: 'Brand Strategy', category: 'Domain' },
        { id: '4', name: 'Art Direction', category: 'Domain' },
        { id: '5', name: 'UI/UX Design', category: 'Technical' }
      ],
      projects: [
        {
          id: '1',
          name: 'Nike Rebrand Campaign',
          description: 'Complete visual identity redesign for regional campaign',
          technologies: ['Photoshop', 'Illustrator', 'After Effects'],
          url: 'https://behance.net/jordan/nike'
        },
        {
          id: '2',
          name: 'Startup Logo Collection',
          description: 'Brand identity for 20+ tech startups',
          technologies: ['Figma', 'Illustrator'],
          url: 'https://behance.net/jordan/startups'
        },
        {
          id: '3',
          name: 'Award-winning App Design',
          description: 'Mobile app UI/UX that won Red Dot Award',
          technologies: ['Sketch', 'Principle', 'Figma'],
          url: 'https://behance.net/jordan/app'
        },
        {
          id: '4',
          name: 'Magazine Editorial Design',
          description: 'Art direction and layout design for fashion magazine',
          technologies: ['InDesign', 'Photoshop'],
          url: 'https://behance.net/jordan/magazine'
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Creative Director');

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].template.id).toBe('creative');
    expect(recommendations[0].score).toBeGreaterThan(75);
    expect(recommendations[0].reasons.some(r => r.includes('project') || r.includes('portfolio'))).toBe(true);
  });

  it('Sample 4: Research scientist with publications', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Dr. Sarah Kim',
        email: 'skim@example.com',
        phone: '555-0404',
        location: 'Boston, MA',
        title: 'Research Scientist',
        summary: 'PhD in Machine Learning with 15+ publications in top-tier conferences'
      },
      experience: [
        {
          id: '1',
          company: 'MIT Research Lab',
          position: 'Senior Research Scientist',
          startDate: '2019-08',
          current: true,
          description: 'Lead research in deep learning and computer vision'
        },
        {
          id: '2',
          company: 'Google Research',
          position: 'Research Intern',
          startDate: '2018-06',
          endDate: '2018-08',
          description: 'Worked on neural architecture search projects'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Stanford University',
          degree: 'PhD Computer Science',
          startDate: '2015-09',
          endDate: '2019-06'
        },
        {
          id: '2',
          institution: 'Seoul National University',
          degree: 'MS Computer Science',
          startDate: '2013-09',
          endDate: '2015-05'
        }
      ],
      skills: [
        { id: '1', name: 'Python', category: 'Technical' },
        { id: '2', name: 'TensorFlow', category: 'Technical' },
        { id: '3', name: 'PyTorch', category: 'Technical' },
        { id: '4', name: 'Machine Learning', category: 'Domain' },
        { id: '5', name: 'Deep Learning', category: 'Domain' },
        { id: '6', name: 'Computer Vision', category: 'Domain' },
        { id: '7', name: 'Research', category: 'Soft' }
      ],
      projects: [
        {
          id: '1',
          name: 'Neural Architecture Search',
          description: 'Published at NeurIPS 2023',
          technologies: ['Python', 'TensorFlow', 'CUDA'],
          url: 'https://arxiv.org/skim2023'
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Research Scientist');

    expect(recommendations).toHaveLength(2);
    expect(['minimal', 'classic']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(60);
  });

  it('Sample 5: Executive VP of Operations', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Robert Thompson',
        email: 'rthompson@example.com',
        phone: '555-0505',
        location: 'Chicago, IL',
        title: 'VP Operations',
        summary: '20+ years executive leadership in operations and supply chain management'
      },
      experience: [
        {
          id: '1',
          company: 'Fortune 500 Manufacturing',
          position: 'VP Operations',
          startDate: '2016-01',
          current: true,
          description: 'Oversee $500M operations budget, manage 300+ employees, drove 40% efficiency gains'
        },
        {
          id: '2',
          company: 'Global Logistics Corp',
          position: 'Director of Operations',
          startDate: '2010-03',
          endDate: '2015-12',
          description: 'Managed multi-site operations across 3 continents'
        },
        {
          id: '3',
          company: 'Supply Chain Solutions',
          position: 'Operations Manager',
          startDate: '2005-06',
          endDate: '2010-02',
          description: 'Led process optimization and team development initiatives'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Northwestern Kellogg',
          degree: 'MBA Operations',
          startDate: '2003-09',
          endDate: '2005-05'
        },
        {
          id: '2',
          institution: 'University of Michigan',
          degree: 'BS Industrial Engineering',
          startDate: '1999-09',
          endDate: '2003-05'
        }
      ],
      skills: [
        { id: '1', name: 'Operations Management', category: 'Domain' },
        { id: '2', name: 'Supply Chain', category: 'Domain' },
        { id: '3', name: 'Strategic Planning', category: 'Soft' },
        { id: '4', name: 'P&L Management', category: 'Domain' },
        { id: '5', name: 'Lean Six Sigma', category: 'Technical' }
      ],
      projects: []
    };

    const recommendations = getTemplateRecommendations(resume);

    expect(recommendations).toHaveLength(2);
    expect(['executive', 'classic']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(60);
    expect(recommendations[0].reasons.some(r => r.includes('executive') || r.includes('senior') || r.includes('10+') || r.includes('experience'))).toBe(true);
  });

  it('Sample 6: Mid-level product manager in tech', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Emily Rodriguez',
        email: 'emily@example.com',
        phone: '555-0606',
        location: 'Seattle, WA',
        title: 'Product Manager',
        summary: 'Product leader with 6 years building SaaS products'
      },
      experience: [
        {
          id: '1',
          company: 'Amazon',
          position: 'Product Manager',
          startDate: '2020-03',
          current: true,
          description: 'Lead product strategy for AWS console features'
        },
        {
          id: '2',
          company: 'Microsoft',
          position: 'Associate Product Manager',
          startDate: '2018-06',
          endDate: '2020-02',
          description: 'Managed Azure portal improvements'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Carnegie Mellon',
          degree: 'BS Computer Science',
          startDate: '2014-09',
          endDate: '2018-05'
        }
      ],
      skills: [
        { id: '1', name: 'Product Strategy', category: 'Domain' },
        { id: '2', name: 'Agile', category: 'Technical' },
        { id: '3', name: 'User Research', category: 'Domain' },
        { id: '4', name: 'SQL', category: 'Technical' },
        { id: '5', name: 'Analytics', category: 'Technical' }
      ],
      projects: [
        {
          id: '1',
          name: 'AWS Feature Launch',
          description: 'Launched new monitoring dashboard used by 100k+ customers',
          technologies: ['Product Management', 'User Research'],
          url: ''
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Product Manager');

    expect(recommendations).toHaveLength(2);
    expect(['modern', 'classic']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(60);
  });

  it('Sample 7: Entry-level marketing coordinator', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Taylor Johnson',
        email: 'taylor@example.com',
        phone: '555-0707',
        location: 'Austin, TX',
        title: 'Marketing Coordinator',
        summary: 'Recent graduate passionate about digital marketing and social media'
      },
      experience: [
        {
          id: '1',
          company: 'Digital Agency',
          position: 'Marketing Intern',
          startDate: '2024-01',
          endDate: '2024-08',
          description: 'Managed social media campaigns and content creation'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of Texas',
          degree: 'BA Marketing',
          startDate: '2020-09',
          endDate: '2024-05',
          gpa: '3.6'
        }
      ],
      skills: [
        { id: '1', name: 'Social Media Marketing', category: 'Domain' },
        { id: '2', name: 'Content Creation', category: 'Domain' },
        { id: '3', name: 'Google Analytics', category: 'Technical' },
        { id: '4', name: 'SEO', category: 'Technical' },
        { id: '5', name: 'Canva', category: 'Technical' }
      ],
      projects: [
        {
          id: '1',
          name: 'Campus Campaign',
          description: 'Led successful student recruitment campaign',
          technologies: ['Instagram', 'TikTok', 'Canva'],
          url: ''
        },
        {
          id: '2',
          name: 'Blog Growth',
          description: 'Grew blog traffic by 200% in 3 months',
          technologies: ['WordPress', 'SEO', 'Google Analytics'],
          url: 'https://example.com/blog'
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Marketing Coordinator');

    expect(recommendations).toHaveLength(2);
    expect(['modern', 'creative']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(60);
  });

  it('Sample 8: Healthcare administrator with traditional background', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Dr. Michael Brown',
        email: 'mbrown@example.com',
        phone: '555-0808',
        location: 'Philadelphia, PA',
        title: 'Healthcare Administrator',
        summary: '15 years in hospital administration and healthcare management'
      },
      experience: [
        {
          id: '1',
          company: 'University Hospital',
          position: 'Healthcare Administrator',
          startDate: '2015-01',
          current: true,
          description: 'Oversee hospital operations, budget management, and regulatory compliance'
        },
        {
          id: '2',
          company: 'Regional Medical Center',
          position: 'Assistant Administrator',
          startDate: '2010-03',
          endDate: '2014-12',
          description: 'Managed clinical operations and quality improvement initiatives'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Johns Hopkins',
          degree: 'MHA Healthcare Administration',
          startDate: '2008-09',
          endDate: '2010-05'
        },
        {
          id: '2',
          institution: 'Penn State',
          degree: 'BS Healthcare Management',
          startDate: '2004-09',
          endDate: '2008-05'
        }
      ],
      skills: [
        { id: '1', name: 'Healthcare Administration', category: 'Domain' },
        { id: '2', name: 'HIPAA Compliance', category: 'Domain' },
        { id: '3', name: 'Budget Management', category: 'Domain' },
        { id: '4', name: 'Quality Improvement', category: 'Domain' },
        { id: '5', name: 'Strategic Planning', category: 'Soft' }
      ],
      projects: []
    };

    const recommendations = getTemplateRecommendations(resume);

    expect(recommendations).toHaveLength(2);
    expect(['classic', 'executive']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(65);
  });

  it('Sample 9: Full-stack developer with balanced experience and projects', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Chris Anderson',
        email: 'chris@example.com',
        phone: '555-0909',
        location: 'Portland, OR',
        title: 'Full Stack Developer',
        summary: 'Passionate developer with 4 years experience building scalable web applications'
      },
      experience: [
        {
          id: '1',
          company: 'SaaS Startup',
          position: 'Full Stack Developer',
          startDate: '2022-01',
          current: true,
          description: 'Built and maintained customer-facing React/Node.js applications'
        },
        {
          id: '2',
          company: 'Web Agency',
          position: 'Junior Developer',
          startDate: '2020-06',
          endDate: '2021-12',
          description: 'Developed websites for small business clients'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Oregon State',
          degree: 'BS Computer Science',
          startDate: '2016-09',
          endDate: '2020-05'
        }
      ],
      skills: [
        { id: '1', name: 'JavaScript', category: 'Technical' },
        { id: '2', name: 'React', category: 'Technical' },
        { id: '3', name: 'Node.js', category: 'Technical' },
        { id: '4', name: 'PostgreSQL', category: 'Technical' },
        { id: '5', name: 'AWS', category: 'Technical' },
        { id: '6', name: 'Docker', category: 'Technical' }
      ],
      projects: [
        {
          id: '1',
          name: 'Open Source CMS',
          description: 'Contributed to popular content management system',
          technologies: ['React', 'Node.js', 'MongoDB'],
          url: 'https://github.com/chris/cms'
        },
        {
          id: '2',
          name: 'Task Automation Tool',
          description: 'CLI tool for automating development workflows',
          technologies: ['Node.js', 'TypeScript'],
          url: 'https://github.com/chris/tasks'
        }
      ]
    };

    const recommendations = getTemplateRecommendations(resume, 'Software Developer');

    expect(recommendations).toHaveLength(2);
    expect(['modern', 'minimal']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(60);
  });

  it('Sample 10: Consultant with minimal project focus', () => {
    const resume: Resume = {
      personalInfo: {
        fullName: 'Patricia Davis',
        email: 'pdavis@example.com',
        phone: '555-1010',
        location: 'Washington, DC',
        title: 'Management Consultant',
        summary: '8 years advising Fortune 500 clients on strategy and operations'
      },
      experience: [
        {
          id: '1',
          company: 'McKinsey & Company',
          position: 'Senior Consultant',
          startDate: '2019-07',
          current: true,
          description: 'Lead strategic initiatives for financial services clients'
        },
        {
          id: '2',
          company: 'Deloitte Consulting',
          position: 'Consultant',
          startDate: '2016-08',
          endDate: '2019-06',
          description: 'Delivered operational excellence programs for healthcare clients'
        }
      ],
      education: [
        {
          id: '1',
          institution: 'Wharton School',
          degree: 'MBA',
          startDate: '2014-09',
          endDate: '2016-05'
        },
        {
          id: '2',
          institution: 'Georgetown University',
          degree: 'BA Economics',
          startDate: '2010-09',
          endDate: '2014-05'
        }
      ],
      skills: [
        { id: '1', name: 'Strategy Consulting', category: 'Domain' },
        { id: '2', name: 'Business Analysis', category: 'Domain' },
        { id: '3', name: 'Financial Modeling', category: 'Technical' },
        { id: '4', name: 'Stakeholder Management', category: 'Soft' },
        { id: '5', name: 'PowerPoint', category: 'Technical' }
      ],
      projects: []
    };

    const recommendations = getTemplateRecommendations(resume, 'Management Consultant');

    expect(recommendations).toHaveLength(2);
    expect(['classic', 'minimal']).toContain(recommendations[0].template.id);
    expect(recommendations[0].score).toBeGreaterThan(65);
    expect(recommendations[0].reasons.length).toBeGreaterThan(0);
  });
});

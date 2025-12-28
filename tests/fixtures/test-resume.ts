/**
 * Test resume data fixtures for E2E tests
 */

export interface TestResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    location: string;
    graduationDate: string;
    gpa: string;
  }>;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url: string;
    startDate: string;
    endDate: string;
  }>;
}

/**
 * Generate realistic test resume data
 */
export function generateTestResume(userEmail: string): TestResumeData {
  return {
    personalInfo: {
      fullName: 'Jane Smith',
      email: userEmail,
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/janesmith',
      website: 'janesmith.dev',
      summary: 'Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code, testing, and user experience.',
    },
    experience: [
      {
        company: 'TechCorp Inc',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2021-01',
        endDate: '2024-10',
        current: true,
        description: 'Lead development of customer-facing web applications serving 1M+ users. Implemented microservices architecture reducing response time by 40%. Mentored junior engineers and conducted code reviews.',
      },
      {
        company: 'StartupXYZ',
        position: 'Full Stack Developer',
        location: 'Remote',
        startDate: '2019-03',
        endDate: '2020-12',
        current: false,
        description: 'Built MVP from scratch using React and Node.js. Integrated payment systems and analytics. Collaborated with design team to implement responsive UI.',
      },
    ],
    education: [
      {
        institution: 'University of California',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Berkeley, CA',
        graduationDate: '2019-05',
        gpa: '3.8',
      },
    ],
    skills: [
      { name: 'TypeScript', level: 'expert' },
      { name: 'React', level: 'expert' },
      { name: 'Node.js', level: 'advanced' },
      { name: 'PostgreSQL', level: 'advanced' },
      { name: 'AWS', level: 'intermediate' },
      { name: 'Docker', level: 'intermediate' },
    ],
    projects: [
      {
        name: 'Open Source E2E Testing Library',
        description: 'Created a lightweight E2E testing framework with 10k+ downloads. Features include automatic retries, parallel execution, and visual regression testing.',
        technologies: ['TypeScript', 'Playwright', 'Node.js'],
        url: 'github.com/janesmith/e2e-lib',
        startDate: '2023-01',
        endDate: '2024-10',
      },
    ],
  };
}

/**
 * Minimal resume data for quick tests
 */
export function generateMinimalResume(userEmail: string): TestResumeData {
  return {
    personalInfo: {
      fullName: 'John Doe',
      email: userEmail,
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      summary: 'Software engineer with experience in web development.',
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
  };
}

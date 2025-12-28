import { describe, it, expect } from 'vitest';
import { getTemplateRecommendations } from '../templateRecommendation';
import { Resume } from '../../types/resume';

const mockTechResume: Resume = {
  id: '1',
  personalInfo: {
    fullName: 'Jane Developer',
    email: 'jane@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    summary: 'Full-stack software engineer with React and Node.js experience',
  },
  experience: [
    {
      id: '1',
      company: 'Tech Startup',
      position: 'Senior Software Engineer',
      startDate: '2020-01',
      endDate: '2023-12',
      current: false,
      description: 'Led development of React applications',
      achievements: ['Built scalable microservices', 'Improved performance by 40%'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2016-09',
      endDate: '2020-05',
    },
  ],
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      level: 'Advanced',
      category: 'Technical',
    },
    {
      id: '2',
      name: 'React',
      level: 'Expert',
      category: 'Technical',
    },
    {
      id: '3',
      name: 'Node.js',
      level: 'Advanced',
      category: 'Technical',
    },
  ],
  projects: [
    {
      id: '1',
      name: 'E-commerce Platform',
      description: 'Built full-stack e-commerce solution',
      technologies: ['React', 'Node.js', 'MongoDB'],
      startDate: '2022-01',
      endDate: '2022-06',
    },
  ],
  template: 'modern',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

describe('Template Recommendation Engine', () => {
  it('recommends modern template for tech professionals', () => {
    const recommendations = getTemplateRecommendations(mockTechResume);
    
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].template.id).toBe('modern');
    expect(recommendations[0].score).toBeGreaterThan(70);
  });

  it('provides meaningful reasons for recommendations', () => {
    const recommendations = getTemplateRecommendations(mockTechResume, 'Software Engineer');
    
    const topRecommendation = recommendations[0];
    expect(topRecommendation.reasons).toContain('Modern design appeals to tech companies');
    expect(topRecommendation.matchedCriteria).toContain('technical');
  });

  it('considers target role in recommendations', () => {
    const recommendations = getTemplateRecommendations(mockTechResume, 'Creative Director');
    
    // Should still recommend modern for tech background, but consider creative role
    expect(recommendations.some(r => r.template.id === 'creative')).toBe(true);
  });

  it('handles empty resume gracefully', () => {
    const emptyResume: Resume = {
      id: '1',
      personalInfo: { fullName: '', email: '', phone: '', location: '', summary: '' },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      template: 'modern',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    const recommendations = getTemplateRecommendations(emptyResume);
    
    expect(recommendations).toHaveLength(3);
    expect(recommendations.every(r => r.score >= 0)).toBe(true);
  });

  it('calculates experience level correctly', () => {
    const seniorResume = {
      ...mockTechResume,
      experience: [
        {
          id: '1',
          company: 'Company A',
          position: 'Senior Engineer',
          startDate: '2015-01',
          endDate: '2020-01',
          current: false,
          description: 'Senior role',
          achievements: [],
        },
        {
          id: '2',
          company: 'Company B',
          position: 'Lead Engineer',
          startDate: '2020-01',
          endDate: '2023-12',
          current: false,
          description: 'Lead role',
          achievements: [],
        },
      ],
    };

    const recommendations = getTemplateRecommendations(seniorResume);
    
    // Should recommend executive template for senior professionals
    expect(recommendations.some(r => r.template.id === 'executive')).toBe(true);
  });
});
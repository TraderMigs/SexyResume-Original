import { getTemplateRecommendations } from '../src/lib/templateRecommendation';
import { Resume } from '../src/types/resume';

const testResume: Resume = {
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

console.log('Testing recommendations for entry-level software engineer with 3 projects...\n');

const recommendations = getTemplateRecommendations(testResume, 'Software Engineer');

console.log(`Got ${recommendations.length} recommendations:\n`);

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.template.name} (${rec.template.id})`);
  console.log(`   Score: ${rec.score}`);
  console.log(`   Reasons:`);
  rec.reasons.forEach(reason => console.log(`     - ${reason}`));
  console.log(`   Matched Criteria: ${rec.matchedCriteria.join(', ')}`);
  console.log();
});

export {};

import { Resume } from '../types/resume';
import { Template, TemplateRecommendation } from '../types/template';
import { TEMPLATE_REGISTRY } from './templateRegistry';
import registryData from '../../templates/registry.json';

interface RecommendationCriteria {
  industry?: string;
  role?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skillCount: number;
  projectCount: number;
  experienceCount: number;
  educationCount: number;
  hasPortfolio: boolean;
  isCreative: boolean;
  isTechnical: boolean;
}

export function getTemplateRecommendations(resume: Resume, targetRole?: string): TemplateRecommendation[] {
  const criteria = analyzeCriteria(resume, targetRole);
  const templates = Object.values(TEMPLATE_REGISTRY);

  const recommendations = templates.map(template => ({
    template,
    score: calculateTemplateScore(template, criteria),
    reasons: generateReasons(template, criteria),
    matchedCriteria: getMatchedCriteria(template, criteria)
  }));

  // Sort by score and return top 2 recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function analyzeCriteria(resume: Resume, targetRole?: string): RecommendationCriteria {
  const { personalInfo, experience, education, skills, projects } = resume;
  
  // Determine experience level
  const experienceYears = calculateExperienceYears(experience);
  let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  
  if (experienceYears < 2) experienceLevel = 'entry';
  else if (experienceYears < 5) experienceLevel = 'mid';
  else if (experienceYears < 10) experienceLevel = 'senior';
  else experienceLevel = 'executive';

  // Detect industry and role patterns
  const industry = detectIndustry(experience, skills, targetRole);
  const role = targetRole || detectRole(experience, skills);

  // Analyze content characteristics
  const isCreative = detectCreativeRole(experience, skills, projects);
  const isTechnical = detectTechnicalRole(skills, projects);
  const hasPortfolio = projects.length > 2 || projects.some(p => p.url);

  return {
    industry,
    role,
    experienceLevel,
    skillCount: skills.length,
    projectCount: projects.length,
    experienceCount: experience.length,
    educationCount: education.length,
    hasPortfolio,
    isCreative,
    isTechnical
  };
}

function calculateTemplateScore(template: Template, criteria: RecommendationCriteria): number {
  let score = 0;
  const registryTemplate = registryData.templates[template.id as keyof typeof registryData.templates];

  // Industry match (30 points)
  if (criteria.industry && registryTemplate &&
      registryTemplate.suitability.industries.some((ind: string) =>
        ind.toLowerCase().includes(criteria.industry!.toLowerCase()) ||
        criteria.industry!.toLowerCase().includes(ind.toLowerCase())
      )) {
    score += 30;
  }

  // Role match (25 points)
  if (criteria.role && registryTemplate &&
      registryTemplate.suitability.roles.some((role: string) =>
        role.toLowerCase().includes(criteria.role!.toLowerCase()) ||
        criteria.role!.toLowerCase().includes(role.toLowerCase())
      )) {
    score += 25;
  }

  // Experience level match using registry seniority (20 points)
  if (registryTemplate && registryTemplate.suitability.seniority.includes(criteria.experienceLevel)) {
    score += 20;
  }

  // Content type match (15 points)
  if (template.category === 'creative' && criteria.isCreative) score += 15;
  if (template.category === 'modern' && criteria.isTechnical) score += 12;
  if (template.category === 'classic' && !criteria.isCreative && !criteria.isTechnical) score += 10;

  // Content shape: projects vs experience (15 points)
  const isProjectHeavy = criteria.projectCount >= criteria.experienceCount;
  if (isProjectHeavy && template.constraints.recommendedSections.includes('projects')) {
    score += 15;
  } else if (!isProjectHeavy && template.constraints.recommendedSections[0] === 'experience') {
    score += 10;
  }

  // Portfolio/project focus (10 points)
  if (criteria.hasPortfolio && template.constraints.recommendedSections.includes('projects')) score += 10;
  if (criteria.projectCount > 4 && template.constraints.maxProjects! >= criteria.projectCount) score += 5;

  // ATS safety bonus (5 points)
  if (registryTemplate && registryTemplate.atsMetadata.parseability >= 95) score += 5;

  // Content volume compatibility
  if (criteria.experienceCount <= (template.constraints.maxExperience || 10)) score += 5;
  if (criteria.skillCount <= (template.constraints.maxSkills || 20)) score += 3;

  return Math.min(score, 100);
}

function generateReasons(template: Template, criteria: RecommendationCriteria): string[] {
  const reasons: string[] = [];
  const registryTemplate = registryData.templates[template.id as keyof typeof registryData.templates];

  // Industry match
  if (criteria.industry && registryTemplate &&
      registryTemplate.suitability.industries.some((ind: string) =>
        ind.toLowerCase().includes(criteria.industry!.toLowerCase()))) {
    reasons.push(`Optimized for ${criteria.industry} professionals with ${registryTemplate.atsMetadata.parseability}% ATS compatibility`);
  }

  // Role match
  if (criteria.role && registryTemplate &&
      registryTemplate.suitability.roles.some((role: string) =>
        role.toLowerCase().includes(criteria.role!.toLowerCase()))) {
    reasons.push(`Specifically designed for ${criteria.role} roles in ${registryTemplate.suitability.industries.slice(0, 2).join(' and ')}`);
  }

  // Content shape rationale
  const isProjectHeavy = criteria.projectCount >= criteria.experienceCount;
  if (isProjectHeavy && template.constraints.recommendedSections.includes('projects')) {
    reasons.push(`Project-focused layout showcases your ${criteria.projectCount} projects effectively (max: ${template.constraints.maxProjects})`);
  } else if (!isProjectHeavy && criteria.experienceCount > 0) {
    reasons.push(`Experience-first structure emphasizes your ${criteria.experienceCount} roles with ${registryTemplate?.density || 'optimal'} information density`);
  }

  // Seniority match
  if (registryTemplate && registryTemplate.suitability.seniority.includes(criteria.experienceLevel)) {
    const seniorityMap = { entry: '0-2 years', mid: '2-5 years', senior: '5-10 years', executive: '10+ years' };
    reasons.push(`Tailored for ${criteria.experienceLevel}-level candidates (${seniorityMap[criteria.experienceLevel]})`);
  }

  // Creative/technical rationale
  if (template.category === 'creative' && criteria.isCreative) {
    reasons.push(`Visual portfolio layout with ${registryTemplate?.layoutConfig.type} design highlights creative work`);
  } else if (template.category === 'modern' && criteria.isTechnical) {
    reasons.push(`Clean modern aesthetic appeals to tech recruiters with ${registryTemplate?.atsMetadata.safety} ATS safety rating`);
  } else if (template.category === 'classic' && !criteria.isCreative) {
    reasons.push(`Traditional ${registryTemplate?.atsMetadata.parseability}% parseable format ideal for corporate environments`);
  }

  // ATS safety highlight
  if (registryTemplate && registryTemplate.atsMetadata.parseability >= 95) {
    reasons.push(`Excellent ATS compatibility (${registryTemplate.atsMetadata.parseability}% parseability) ensures your resume gets through applicant tracking systems`);
  }

  // Content capacity
  if (criteria.skillCount > 15 && (template.constraints.maxSkills || 20) >= criteria.skillCount) {
    reasons.push(`Spacious ${registryTemplate?.layoutConfig.type} layout accommodates ${criteria.skillCount} skills without crowding`);
  }

  return reasons.slice(0, 4);
}

function getMatchedCriteria(template: Template, criteria: RecommendationCriteria): string[] {
  const matches: string[] = [];

  if (criteria.industry && template.industries.includes(criteria.industry)) {
    matches.push('industry');
  }

  if (criteria.role && template.suitedFor.some(role => role.toLowerCase().includes(criteria.role!.toLowerCase()))) {
    matches.push('role');
  }

  if (criteria.isCreative && template.category === 'creative') {
    matches.push('creative');
  }

  if (criteria.isTechnical && template.category === 'modern') {
    matches.push('technical');
  }

  if (criteria.experienceLevel === 'executive' && template.category === 'executive') {
    matches.push('experience-level');
  }

  return matches;
}

// Helper functions
function calculateExperienceYears(experience: any[]): number {
  if (!experience.length) return 0;
  
  let totalMonths = 0;
  experience.forEach(exp => {
    const start = new Date(exp.startDate + '-01');
    const end = exp.current ? new Date() : new Date(exp.endDate + '-01');
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(months, 0);
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

function detectIndustry(experience: any[], skills: any[], targetRole?: string): string | undefined {
  const industryKeywords = {
    'Technology': ['software', 'developer', 'engineer', 'tech', 'programming', 'coding', 'javascript', 'python', 'react'],
    'Finance': ['finance', 'banking', 'investment', 'accounting', 'financial', 'analyst', 'trader'],
    'Healthcare': ['healthcare', 'medical', 'hospital', 'clinical', 'nurse', 'doctor', 'pharmaceutical'],
    'Design': ['design', 'creative', 'ui', 'ux', 'graphic', 'visual', 'artist', 'photoshop', 'figma'],
    'Marketing': ['marketing', 'advertising', 'brand', 'social media', 'campaign', 'seo', 'content'],
    'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'business analyst'],
    'Education': ['education', 'teacher', 'professor', 'academic', 'research', 'university']
  };

  const allText = [
    ...experience.map(exp => `${exp.company} ${exp.position} ${exp.description}`),
    ...skills.map(skill => skill.name),
    targetRole || ''
  ].join(' ').toLowerCase();

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return industry;
    }
  }

  return undefined;
}

function detectRole(experience: any[], skills: any[]): string | undefined {
  const roleKeywords = {
    'Software Engineer': ['software engineer', 'developer', 'programmer', 'full stack', 'frontend', 'backend'],
    'Product Manager': ['product manager', 'product owner', 'pm'],
    'Designer': ['designer', 'ui designer', 'ux designer', 'graphic designer'],
    'Marketing Professional': ['marketing', 'marketer', 'marketing manager', 'digital marketing'],
    'Business Analyst': ['business analyst', 'analyst', 'ba'],
    'Manager': ['manager', 'director', 'lead', 'supervisor'],
    'Consultant': ['consultant', 'consulting', 'advisor']
  };

  const allText = experience.map(exp => exp.position).join(' ').toLowerCase();

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return role;
    }
  }

  return undefined;
}

function detectCreativeRole(experience: any[], skills: any[], projects: any[]): boolean {
  const creativeKeywords = ['design', 'creative', 'art', 'visual', 'graphic', 'ui', 'ux', 'photoshop', 'illustrator', 'figma', 'sketch', 'creative director', 'artist', 'photographer'];
  
  const allText = [
    ...experience.map(exp => `${exp.position} ${exp.description}`),
    ...skills.map(skill => skill.name),
    ...projects.map(proj => `${proj.name} ${proj.description}`)
  ].join(' ').toLowerCase();

  return creativeKeywords.some(keyword => allText.includes(keyword));
}

function detectTechnicalRole(skills: any[], projects: any[]): boolean {
  const techKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'api', 'database', 'programming', 'coding', 'software', 'development'];
  
  const allText = [
    ...skills.map(skill => skill.name),
    ...projects.map(proj => proj.technologies.join(' '))
  ].join(' ').toLowerCase();

  return techKeywords.some(keyword => allText.includes(keyword));
}
import mammoth from 'mammoth';
import { Resume, PersonalInfo, Experience, Education, Skill } from '../types/resume';

export async function parseResume(file: File): Promise<Partial<Resume>> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  let extractedText = '';

  if (fileExtension === 'pdf') {
    extractedText = await extractTextFromPDF(file);
  } else if (fileExtension === 'docx' || fileExtension === 'doc') {
    extractedText = await extractTextFromDOCX(file);
  } else if (fileExtension === 'txt') {
    extractedText = await file.text();
  } else {
    throw new Error('Unsupported file type');
  }

  return parseResumeText(extractedText);
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  let text = '';
  const decoder = new TextDecoder('utf-8');
  
  for (let i = 0; i < uint8Array.length; i++) {
    if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
      text += decoder.decode(new Uint8Array([uint8Array[i]]));
    } else if (uint8Array[i] === 10 || uint8Array[i] === 13) {
      text += '\n';
    }
  }
  
  return text;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to extract text from DOCX file');
  }
}

function parseResumeText(text: string): Partial<Resume> {
  const lines = text.split('\n').filter(line => line.trim());
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const urlRegex = /(https?:\/\/[^\s]+)/;
  
  const personalInfo: Partial<PersonalInfo> = {};
  const experience: Experience[] = [];
  const education: Education[] = [];
  const skills: Skill[] = [];
  
  let currentSection: 'personal' | 'experience' | 'education' | 'skills' | 'summary' | null = 'personal';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('experience') || lowerLine.includes('employment') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    }
    if (lowerLine.includes('education') || lowerLine.includes('academic')) {
      currentSection = 'education';
      continue;
    }
    if (lowerLine.includes('skills') || lowerLine.includes('competencies') || lowerLine.includes('expertise')) {
      currentSection = 'skills';
      continue;
    }
    if (lowerLine.includes('summary') || lowerLine.includes('objective') || lowerLine.includes('profile')) {
      currentSection = 'summary';
      continue;
    }
    
    if (currentSection === 'personal') {
      if (!personalInfo.email && emailRegex.test(line)) {
        personalInfo.email = line.match(emailRegex)![0];
      }
      if (!personalInfo.phone && phoneRegex.test(line)) {
        personalInfo.phone = line.match(phoneRegex)![0];
      }
      if (!personalInfo.linkedin && (lowerLine.includes('linkedin') || lowerLine.includes('linkedin.com'))) {
        const match = line.match(urlRegex);
        if (match) personalInfo.linkedin = match[0];
      }
      if (!personalInfo.website && urlRegex.test(line) && !lowerLine.includes('linkedin')) {
        personalInfo.website = line.match(urlRegex)![0];
      }
      if (!personalInfo.fullName && i === 0 && line.length > 2 && line.length < 50) {
        personalInfo.fullName = line;
      }
    }
    
    if (currentSection === 'summary') {
      if (!personalInfo.summary) {
        personalInfo.summary = line;
      } else {
        personalInfo.summary += ' ' + line;
      }
    }
    
    if (currentSection === 'skills') {
      const skillsText = line.split(/[,;•·]/).map(s => s.trim()).filter(s => s);
      skillsText.forEach(skillName => {
        if (skillName && skillName.length > 1 && skillName.length < 50) {
          skills.push({
            name: skillName,
            level: 'intermediate' as const
          });
        }
      });
    }
  }
  
  return {
    personalInfo: personalInfo as PersonalInfo,
    experience,
    education,
    skills
  };
}

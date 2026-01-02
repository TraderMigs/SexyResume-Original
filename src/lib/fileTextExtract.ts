import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Resume, PersonalInfo, Experience, Education, Skill } from '../types/resume';

// Configure PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export async function parseResume(file: File): Promise<Partial<Resume>> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  let extractedText = '';

  try {
    if (fileExtension === 'pdf') {
      extractedText = await extractTextFromPDF(file);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      extractedText = await extractTextFromDOCX(file);
    } else if (fileExtension === 'txt') {
      extractedText = await file.text();
    } else {
      throw new Error('Unsupported file type. Please upload PDF, Word, or text files.');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Unable to extract sufficient text from file.');
    }

    return parseResumeText(extractedText);
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error instanceof Error ? error : new Error('Failed to parse resume file');
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('PDF appears to be empty');
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value.trim()) {
      throw new Error('Document appears to be empty');
    }
    
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

function parseResumeText(text: string): Partial<Resume> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const personalInfo = extractPersonalInfo(lines, text);
  const sections = identifySections(lines);
  
  const experience = parseExperience(lines, sections.experience);
  const education = parseEducation(lines, sections.education);
  const skills = parseSkills(lines, sections.skills);
  const summary = parseSummary(lines, sections.summary);
  
  if (summary) {
    personalInfo.summary = summary;
  }
  
  return {
    personalInfo: Object.keys(personalInfo).length > 0 ? personalInfo as PersonalInfo : undefined,
    experience: experience.length > 0 ? experience : [],
    education: education.length > 0 ? education : [],
    skills: skills.length > 0 ? skills : []
  };
}

function extractPersonalInfo(lines: string[], fullText: string): Partial<PersonalInfo> {
  const info: Partial<PersonalInfo> = {};
  
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /(linkedin\.com\/in\/[^\s]+)/i;
  const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)/;
  
  const emailMatch = fullText.match(emailRegex);
  if (emailMatch) info.email = emailMatch[0];
  
  const phoneMatch = fullText.match(phoneRegex);
  if (phoneMatch) info.phone = phoneMatch[0];
  
  const linkedinMatch = fullText.match(linkedinRegex);
  if (linkedinMatch) {
    info.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }
  
  const locationMatch = fullText.match(locationRegex);
  if (locationMatch) info.location = locationMatch[0];
  
  if (lines.length > 0) {
    const firstLine = lines[0];
    const cleanedName = firstLine
      .replace(emailRegex, '')
      .replace(phoneRegex, '')
      .replace(/\d{5}/g, '')
      .replace(/\b(FL|CA|NY|TX|PA|IL|OH|GA|NC|MI|AZ|MA|WA|TN|IN|MO)\b/gi, '')
      .trim();
    
    const segments = cleanedName.split(/\s{2,}|\||\//).map(s => s.trim());
    const jobTitleKeywords = /\b(manager|director|engineer|developer|designer|analyst|specialist|coordinator|assistant|supervisor|consultant|executive|administrator|operator|technician|representative|agent|officer|lead|senior|junior|intern|president|ceo|cfo|cto|vp|vice|chief|head|inventory|production|sales|marketing|finance|human|resources|hr|it|software|hardware|data|business|project|product|quality|customer|service|driver|clerk)\b/i;
    
    for (const segment of segments) {
      const words = segment.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && 
          /^[A-Za-z\s\-'\.]+$/.test(segment) &&
          !jobTitleKeywords.test(segment)) {
        info.fullName = segment;
        break;
      }
    }
    
    if (!info.fullName && segments.length > 0) {
      info.fullName = segments[0];
    }
  }
  
  return info;
}

function identifySections(lines: string[]): {
  experience: { start: number; end: number } | null;
  education: { start: number; end: number } | null;
  skills: { start: number; end: number } | null;
  summary: { start: number; end: number } | null;
} {
  const sections = {
    experience: null as { start: number; end: number } | null,
    education: null as { start: number; end: number } | null,
    skills: null as { start: number; end: number } | null,
    summary: null as { start: number; end: number } | null
  };
  
  const sectionHeaders = {
    experience: /^(work\s+)?experience|employment|work\s+history|professional\s+experience|career\s+history/i,
    education: /^education|academic|qualifications|academic\s+background/i,
    skills: /^skills|competencies|expertise|technical\s+skills|core\s+competencies|key\s+skills/i,
    summary: /^(professional\s+)?summary|objective|profile|about(\s+me)?|overview|q-bio/i
  };
  
  const sectionStarts: Array<{ type: keyof typeof sections; index: number }> = [];
  
  lines.forEach((line, index) => {
    Object.entries(sectionHeaders).forEach(([sectionType, pattern]) => {
      if (pattern.test(line.toLowerCase())) {
        sectionStarts.push({ type: sectionType as keyof typeof sections, index });
      }
    });
  });
  
  sectionStarts.sort((a, b) => a.index - b.index);
  
  sectionStarts.forEach((section, i) => {
    const nextSectionIndex = i < sectionStarts.length - 1 ? sectionStarts[i + 1].index : lines.length;
    sections[section.type] = { start: section.index + 1, end: nextSectionIndex };
  });
  
  return sections;
}

function parseExperience(lines: string[], section: { start: number; end: number } | null): Experience[] {
  if (!section) return [];
  
  const experiences: Experience[] = [];
  const sectionLines = lines.slice(section.start, section.end);
  
  let i = 0;
  while (i < sectionLines.length) {
    const line = sectionLines[i];
    const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:19|20)\d{2}\s+to\s+(?:Present|(?:19|20)\d{2})/i;
    
    if (line.length > 3 && line.length < 100 && !datePattern.test(line) && !line.match(/^[•\-\*]/)) {
      const position = line;
      let company = '';
      let startDate = '';
      let endDate = '';
      let current = false;
      let description: string[] = [];
      
      i++;
      if (i < sectionLines.length) {
        const companyLine = sectionLines[i];
        const companyParts = companyLine.split(' - ');
        company = companyParts[0].trim();
        
        i++;
        if (i < sectionLines.length) {
          const dateLine = sectionLines[i];
          if (datePattern.test(dateLine)) {
            const dateMatch = dateLine.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/gi);
            if (dateMatch) {
              startDate = dateMatch[0];
              if (dateMatch.length > 1) {
                endDate = dateMatch[1];
              } else if (dateLine.match(/present|current/i)) {
                endDate = 'Present';
                current = true;
              }
            }
            i++;
          }
        }
        
        while (i < sectionLines.length) {
          const descLine = sectionLines[i];
          
          if (descLine.length > 3 && descLine.length < 100 && 
              !descLine.match(/^[•\-\*]/) && 
              !datePattern.test(descLine) &&
              i + 1 < sectionLines.length && 
              sectionLines[i + 1].includes(' - ')) {
            break;
          }
          
          const cleanDesc = descLine.replace(/^[•\-\*]\s*/, '').trim();
          if (cleanDesc.length > 5) {
            description.push(cleanDesc);
          }
          
          i++;
        }
      }
      
      if (position) {
        experiences.push({
          id: Date.now().toString() + Math.random(),
          position,
          company: company || 'Company',
          startDate: startDate || '',
          endDate: endDate || '',
          current,
          description: description.join(' '),
          achievements: description
        });
      }
    } else {
      i++;
    }
  }
  
  return experiences;
}

function parseEducation(lines: string[], section: { start: number; end: number } | null): Education[] {
  if (!section) return [];
  
  const education: Education[] = [];
  const sectionLines = lines.slice(section.start, section.end);
  
  let i = 0;
  while (i < sectionLines.length) {
    const line = sectionLines[i];
    const degreePattern = /(certificate|bachelor|master|phd|doctorate|associate|diploma|b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?|b\.?a\.?|a\.?s\.?)/i;
    
    if (degreePattern.test(line)) {
      const degree = line;
      let institution = '';
      let field = '';
      let startDate = '';
      let endDate = '';
      
      i++;
      if (i < sectionLines.length) {
        const instLine = sectionLines[i];
        institution = instLine.split(' - ')[0].trim();
        
        i++;
        if (i < sectionLines.length) {
          const dateLine = sectionLines[i];
          const dateMatch = dateLine.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:19|20)\d{2}/gi);
          if (dateMatch) {
            startDate = dateMatch[0] || '';
            endDate = dateMatch[1] || dateMatch[0] || '';
            i++;
          }
        }
      }
      
      const fieldMatch = degree.match(/in\s+([A-Za-z\s]+)/i);
      if (fieldMatch) {
        field = fieldMatch[1].trim();
      }
      
      education.push({
        id: Date.now().toString() + Math.random(),
        degree,
        institution: institution || 'Institution',
        field: field || '',
        startDate: startDate || '',
        endDate: endDate || '',
        gpa: ''
      });
    } else {
      i++;
    }
  }
  
  return education;
}

function parseSkills(lines: string[], section: { start: number; end: number } | null): Skill[] {
  if (!section) return [];
  
  const skills: Skill[] = [];
  const sectionLines = lines.slice(section.start, section.end);
  
  sectionLines.forEach(line => {
    const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
    const skillsInLine = cleaned.split(/[,;|]/).map(s => s.trim());
    
    skillsInLine.forEach(skill => {
      if (skill.length > 1 && skill.length < 50 && !skill.match(/^\d+$/) && !skill.match(/^skills?$/i)) {
        skills.push({
          id: Date.now().toString() + Math.random(),
          name: skill,
          level: 'Intermediate' as const,
          category: 'Technical' as const
        });
      }
    });
  });
  
  return skills;
}

function parseSummary(lines: string[], section: { start: number; end: number } | null): string {
  if (!section) return '';
  const sectionLines = lines.slice(section.start, section.end);
  return sectionLines.join(' ').trim();
}

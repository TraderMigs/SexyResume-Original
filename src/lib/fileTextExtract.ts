import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Resume, PersonalInfo, Experience, Education, Skill } from '../types/resume';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ParsedData {
  personalInfo?: Partial<PersonalInfo>;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  rawText?: string;
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
      throw new Error('Unable to extract sufficient text from file. Please ensure the file contains text content.');
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
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenate all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Word document appears to be empty or contains no extractable text');
    }
    
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from Word document. The file may be corrupted.');
  }
}

function parseResumeText(text: string): Partial<Resume> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const linkedinRegex = /(linkedin\.com\/in\/[^\s]+)/i;
  
  const personalInfo: Partial<PersonalInfo> = {};
  const experience: Experience[] = [];
  const education: Education[] = [];
  const skills: Skill[] = [];
  
  let currentSection: 'personal' | 'experience' | 'education' | 'skills' | 'summary' | null = 'personal';
  let summaryText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.match(/^(work\s+)?experience|employment|work\s+history|professional\s+experience/)) {
      currentSection = 'experience';
      continue;
    }
    if (lowerLine.match(/^education|academic|qualifications/)) {
      currentSection = 'education';
      continue;
    }
    if (lowerLine.match(/^skills|competencies|expertise|technical\s+skills|core\s+competencies/)) {
      currentSection = 'skills';
      continue;
    }
    if (lowerLine.match(/^(professional\s+)?summary|objective|profile|about(\s+me)?/)) {
      currentSection = 'summary';
      continue;
    }
    
    if (currentSection === 'personal') {
      if (!personalInfo.fullName && i < 5 && line.length > 2 && line.length < 60 && !line.includes('@') && !line.includes('http')) {
        const wordCount = line.split(/\s+/).length;
        if (wordCount >= 2 && wordCount <= 4) {
          personalInfo.fullName = line;
          continue;
        }
      }
      
      if (!personalInfo.email && emailRegex.test(line)) {
        const match = line.match(emailRegex);
        if (match) personalInfo.email = match[0];
      }
      
      if (!personalInfo.phone && phoneRegex.test(line)) {
        const match = line.match(phoneRegex);
        if (match) personalInfo.phone = match[0];
      }
      
      if (!personalInfo.linkedin && linkedinRegex.test(line)) {
        const match = line.match(linkedinRegex);
        if (match) {
          personalInfo.linkedin = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        }
      }
      
      if (!personalInfo.website && urlRegex.test(line) && !linkedinRegex.test(line)) {
        const match = line.match(urlRegex);
        if (match) personalInfo.website = match[0];
      }
      
      if (!personalInfo.location && i < 10) {
        const locationPatterns = [
          /([A-Z][a-z]+,\s*[A-Z]{2})/,
          /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
          /([A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5})/
        ];
        
        for (const pattern of locationPatterns) {
          const match = line.match(pattern);
          if (match) {
            personalInfo.location = match[0];
            break;
          }
        }
      }
    }
    
    if (currentSection === 'summary') {
      summaryText += (summaryText ? ' ' : '') + line;
    }
    
    if (currentSection === 'skills') {
      const skillSeparators = /[,;•·|]/;
      const skillsInLine = line.split(skillSeparators).map(s => s.trim()).filter(s => s.length > 0);
      
      skillsInLine.forEach(skillText => {
        if (skillText.length > 1 && skillText.length < 50 && !skillText.match(/^\d+$/)) {
          skills.push({
            name: skillText,
            level: 'intermediate' as const
          });
        }
      });
    }
    
    if (currentSection === 'experience') {
      const yearPattern = /\b(19|20)\d{2}\b/;
      const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(19|20)\d{2}/i;
      
      if (yearPattern.test(line) || datePattern.test(line) || line.match(/present|current/i)) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.length > 5) {
          experience.push({
            company: nextLine,
            position: '',
            startDate: '',
            endDate: '',
            current: false,
            description: []
          });
        }
      }
    }
    
    if (currentSection === 'education') {
      const degreePattern = /(bachelor|master|phd|doctorate|associate|diploma|certificate|b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?|b\.?a\.?)/i;
      
      if (degreePattern.test(line)) {
        education.push({
          institution: '',
          degree: line,
          field: '',
          graduationDate: '',
          gpa: ''
        });
      }
    }
  }
  
  if (summaryText.trim()) {
    personalInfo.summary = summaryText.trim();
  }
  
  if (!personalInfo.fullName && lines.length > 0) {
    personalInfo.fullName = lines[0];
  }
  
  return {
    personalInfo: Object.keys(personalInfo).length > 0 ? personalInfo as PersonalInfo : undefined,
    experience: experience.length > 0 ? experience : [],
    education: education.length > 0 ? education : [],
    skills: skills.length > 0 ? skills : []
  };
}

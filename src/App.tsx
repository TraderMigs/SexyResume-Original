import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { SecurityProvider } from './components/SecurityProvider';
import SEOHead from './components/SEOHead';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PersonalInfoForm from './components/PersonalInfoForm';
import ExperienceForm from './components/ExperienceForm';
import EducationForm from './components/EducationForm';
import SkillsForm from './components/SkillsForm';
import ProjectsForm from './components/ProjectsForm';
import TemplateSelector from './components/TemplateSelector';
import ResumePreview from './components/ResumePreview';
import ExportOptions from './components/ExportOptions';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import ResumeUpload from './components/ResumeUpload';
import SystemHealthWidget from './components/SystemHealthWidget';
import CookieConsent, { ConsentPreferences } from './components/CookieConsent';
import FraudDetection from './components/FraudDetection';
import { useResume } from './hooks/useResume';
import { useAuth } from './contexts/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import { initAnalytics, updateAnalyticsConsent } from './lib/analytics';
import { SEO_PAGES } from './lib/seo';
import { Resume, PersonalInfo, Experience, Education, Skill, Project } from './types/resume';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Zap, 
  FolderOpen, 
  Palette, 
  Eye, 
  Download,
  FileText,
  Upload,
  BarChart3
} from 'lucide-react';

type ActiveTab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'template' | 'preview' | 'export' | 'cover-letter';

export default function App() {
  const { user } = useAuth();
  const { resume, saveResume, updateResumeState } = useResume();
  const { trackPage, track } = useAnalytics();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  // Initialize resume state if empty
  const [resumeData, setResumeData] = useState<Resume>({
    id: '',
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    template: 'modern',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Sync with resume hook
  useEffect(() => {
    if (resume) {
      setResumeData(resume);
    }
  }, [resume]);

  // Track page view
  useEffect(() => {
    trackPage('/', 'Resume Builder');
  }, [trackPage]);

  // Handle consent changes
  const handleConsentChange = (consents: ConsentPreferences) => {
    setHasConsent(consents.analytics);
    updateAnalyticsConsent(consents.analytics);
  };

  // Initialize analytics with consent
  useEffect(() => {
    initAnalytics(hasConsent);
  }, [hasConsent]);

  const updatePersonalInfo = (data: PersonalInfo) => {
    const updated = { ...resumeData, personalInfo: data };
    setResumeData(updated);
    updateResumeState(updated);
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const updateExperience = (data: Experience[]) => {
    const updated = { ...resumeData, experience: data };
    setResumeData(updated);
    updateResumeState(updated);
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const updateEducation = (data: Education[]) => {
    const updated = { ...resumeData, education: data };
    setResumeData(updated);
    updateResumeState(updated);
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const updateSkills = (data: Skill[]) => {
    const updated = { ...resumeData, skills: data };
    setResumeData(updated);
    updateResumeState(updated);
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const updateProjects = (data: Project[]) => {
    const updated = { ...resumeData, projects: data };
    setResumeData(updated);
    updateResumeState(updated);
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const updateTemplate = (templateId: string, customizations?: any) => {
    const updated = { ...resumeData, template: templateId };
    setResumeData(updated);
    updateResumeState(updated);
    
    track('template_selected', { template_id: templateId });
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
  };

  const handleParsedResume = (parsedData: Partial<Resume>) => {
    const updated = { ...resumeData, ...parsedData };
    setResumeData(updated);
    updateResumeState(updated);
    
    track('parse_completed', { 
      confidence: 0.85, 
      sections_found: Object.keys(parsedData).length,
      duration_ms: 2000 
    });
    
    if (user) {
      saveResume(updated);
    } else {
      localStorage.setItem('resume-draft', JSON.stringify(updated));
    }
    
    setShowUploadModal(false);
    setActiveTab('personal');
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!user) {
      const draft = localStorage.getItem('resume-draft');
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setResumeData(parsedDraft);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [user]);

  const tabs = [
    { id: 'personal' as const, label: 'Personal Info', icon: User, completed: !!resumeData.personalInfo.fullName },
    { id: 'experience' as const, label: 'Work Experience', icon: Briefcase, completed: resumeData.experience.length > 0 },
    { id: 'education' as const, label: 'Education', icon: GraduationCap, completed: resumeData.education.length > 0 },
    { id: 'skills' as const, label: 'Skills', icon: Zap, completed: resumeData.skills.length > 0 },
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen, completed: resumeData.projects.length > 0 },
    { id: 'template' as const, label: 'Template', icon: Palette, completed: !!resumeData.template },
    { id: 'preview' as const, label: 'Preview', icon: Eye, completed: false },
    { id: 'export' as const, label: 'Export', icon: Download, completed: false },
    { id: 'cover-letter' as const, label: 'Cover Letters', icon: FileText, completed: false }
  ];

  const completedTabs = tabs.filter(tab => tab.completed).length;
  const completionPercentage = Math.round((completedTabs / (tabs.length - 3)) * 100); // Exclude template, preview, export from completion

  return (
    <SecurityProvider>
      <AccessibilityProvider>
          <SEOHead
            title={SEO_PAGES.home.title}
            description={SEO_PAGES.home.description}
            keywords={SEO_PAGES.home.keywords}
            canonical="https://sexyresume.com/"
            structuredData={SEO_PAGES.home.structuredData}
          />

          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header onAuthClick={() => setShowAuthModal(true)} />

            <main id="main-content" className="flex-1">
              <Routes>
                <Route path="/" element={
                  <MainApp
                    resumeData={resumeData}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabs={tabs}
                    completionPercentage={completionPercentage}
                    updatePersonalInfo={updatePersonalInfo}
                    updateExperience={updateExperience}
                    updateEducation={updateEducation}
                    updateSkills={updateSkills}
                    updateProjects={updateProjects}
                    updateTemplate={updateTemplate}
                    setShowUploadModal={setShowUploadModal}
                    setShowCoverLetterGenerator={setShowCoverLetterGenerator}
                  />
                } />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Routes>
            </main>

            <Footer />

            {/* Modals */}
            <AuthModal 
              isOpen={showAuthModal} 
              onClose={() => setShowAuthModal(false)} 
            />
            
            <ResumeUpload
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              onParsedResume={handleParsedResume}
            />

            {showCoverLetterGenerator && (
              <CoverLetterGenerator
                resume={resumeData}
                onClose={() => setShowCoverLetterGenerator(false)}
              />
            )}

            {/* System Widgets */}
            <SystemHealthWidget />
            <CookieConsent onConsentChange={handleConsentChange} />
            <FraudDetection />
          </div>
      </AccessibilityProvider>
    </SecurityProvider>
  );
}

// Main application component
interface MainAppProps {
  resumeData: Resume;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tabs: Array<{ id: ActiveTab; label: string; icon: any; completed: boolean }>;
  completionPercentage: number;
  updatePersonalInfo: (data: PersonalInfo) => void;
  updateExperience: (data: Experience[]) => void;
  updateEducation: (data: Education[]) => void;
  updateSkills: (data: Skill[]) => void;
  updateProjects: (data: Project[]) => void;
  updateTemplate: (templateId: string, customizations?: any) => void;
  setShowUploadModal: (show: boolean) => void;
  setShowCoverLetterGenerator: (show: boolean) => void;
}

function MainApp({
  resumeData,
  activeTab,
  setActiveTab,
  tabs,
  completionPercentage,
  updatePersonalInfo,
  updateExperience,
  updateEducation,
  updateSkills,
  updateProjects,
  updateTemplate,
  setShowUploadModal,
  setShowCoverLetterGenerator
}: MainAppProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Working Offline Banner */}
      {!user && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">Working Offline</span>
            </div>
            <p className="text-sm text-blue-800">
              Your resume is being saved locally. Sign in to save your work permanently and access it from any device.
            </p>
          </div>
          <div className="flex space-x-3 mt-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Sign In Now
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors text-sm font-medium"
            >
              Upload Resume
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Resume Completion</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-3">{completionPercentage}% complete</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-sexy-pink-600 to-sexy-cyan-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-sexy-pink-100 text-sexy-pink-700 border border-sexy-pink-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.completed && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-sexy-pink-600" />
              <h3 className="font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Work Experience</span>
                <span className="font-medium">{resumeData.experience.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education</span>
                <span className="font-medium">{resumeData.education.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills</span>
                <span className="font-medium">{resumeData.skills.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projects</span>
                <span className="font-medium">{resumeData.projects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cover Letters</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium text-sexy-pink-600">{completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Privacy First</h4>
            <p className="text-sm text-green-800 mb-3">
              Your data is stored locally in your browser. Sign in to save permanently and sync across devices.
            </p>
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'personal' && (
            <PersonalInfoForm data={resumeData.personalInfo} onChange={updatePersonalInfo} />
          )}
          
          {activeTab === 'experience' && (
            <ExperienceForm data={resumeData.experience} onChange={updateExperience} />
          )}
          
          {activeTab === 'education' && (
            <EducationForm data={resumeData.education} onChange={updateEducation} />
          )}
          
          {activeTab === 'skills' && (
            <SkillsForm data={resumeData.skills} onChange={updateSkills} />
          )}
          
          {activeTab === 'projects' && (
            <ProjectsForm data={resumeData.projects} onChange={updateProjects} />
          )}
          
          {activeTab === 'template' && (
            <TemplateSelector 
              resume={resumeData}
              selectedTemplate={resumeData.template}
              onTemplateChange={updateTemplate}
            />
          )}
          
          {activeTab === 'preview' && (
            <ResumePreview resume={resumeData} />
          )}
          
          {activeTab === 'export' && (
            <ExportOptions resume={resumeData} />
          )}
          
          {activeTab === 'cover-letter' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Cover Letter Generator</h3>
                <p className="text-gray-600 mb-6">
                  Generate personalized cover letters that match your resume template and target specific roles.
                </p>
                <button
                  onClick={() => setShowCoverLetterGenerator(true)}
                  className="px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors font-medium"
                >
                  Generate Cover Letter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="w-5 h-5 text-sexy-pink-600" />
                <h3 className="font-semibold text-gray-900">Live Preview</h3>
              </div>
              
              <div className="bg-gradient-to-br from-sexy-pink-600 to-sexy-cyan-600 text-white p-6 rounded-lg text-center">
                <h4 className="text-lg font-bold mb-2">
                  {resumeData.personalInfo.fullName || 'Your Name'}
                </h4>
                <div className="text-sm opacity-90 space-y-1">
                  {resumeData.personalInfo.email && (
                    <div>{resumeData.personalInfo.email}</div>
                  )}
                  {resumeData.personalInfo.phone && (
                    <div>{resumeData.personalInfo.phone}</div>
                  )}
                  {resumeData.personalInfo.location && (
                    <div>{resumeData.personalInfo.location}</div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {resumeData.personalInfo.summary && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Summary</h5>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {resumeData.personalInfo.summary.substring(0, 100)}
                      {resumeData.personalInfo.summary.length > 100 && '...'}
                    </p>
                  </div>
                )}

                {resumeData.experience.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Latest Role</h5>
                    <p className="text-gray-600 text-xs">
                      {resumeData.experience[0].position} at {resumeData.experience[0].company}
                    </p>
                  </div>
                )}

                {resumeData.skills.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Top Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {resumeData.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill.id}
                          className="px-2 py-1 bg-sexy-pink-100 text-sexy-pink-800 rounded-full text-xs"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {resumeData.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{resumeData.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('preview')}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                View Full Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
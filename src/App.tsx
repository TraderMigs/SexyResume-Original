import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import { SecurityProvider } from './components/SecurityProvider';
import ErrorBoundary from './components/ErrorBoundary';
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

  useEffect(() => {
    if (resume) {
      setResumeData(resume);
    }
  }, [resume]);

  useEffect(() => {
    trackPage('/', 'Resume Builder');
  }, [trackPage]);

  const handleConsentChange = (consents: ConsentPreferences) => {
    setHasConsent(consents.analytics);
    updateAnalyticsConsent(consents.analytics);
  };

  useEffect(() => {
    initAnalytics(hasConsent);
  }, [hasConsent]);

  const handleOpenUploadModal = useCallback(() => {
    console.log('Opening upload modal...');
    setShowUploadModal(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    console.log('Closing upload modal...');
    setShowUploadModal(false);
  }, []);

  const updatePersonalInfo = (info: PersonalInfo) => {
    const updatedResume = {
      ...resumeData,
      personalInfo: info,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const updateExperience = (experience: Experience[]) => {
    const updatedResume = {
      ...resumeData,
      experience,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const updateEducation = (education: Education[]) => {
    const updatedResume = {
      ...resumeData,
      education,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const updateSkills = (skills: Skill[]) => {
    const updatedResume = {
      ...resumeData,
      skills,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const updateProjects = (projects: Project[]) => {
    const updatedResume = {
      ...resumeData,
      projects,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const updateTemplate = (template: string) => {
    const updatedResume = {
      ...resumeData,
      template,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
  };

  const handleResumeUpload = useCallback((uploadedData: Partial<Resume>) => {
    const updatedResume = {
      ...resumeData,
      ...uploadedData,
      updatedAt: new Date().toISOString()
    };
    setResumeData(updatedResume);
    saveResume(updatedResume);
    track('resume_uploaded', { hasData: !!uploadedData });
  }, [resumeData, saveResume, track]);

  const tabs = [
    { id: 'personal' as const, label: 'Personal Info', icon: User },
    { id: 'experience' as const, label: 'Work Experience', icon: Briefcase },
    { id: 'education' as const, label: 'Education', icon: GraduationCap },
    { id: 'skills' as const, label: 'Skills', icon: Zap },
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen },
    { id: 'template' as const, label: 'Template', icon: Palette },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'export' as const, label: 'Export', icon: Download }
  ];

  console.log('App render - showUploadModal:', showUploadModal);

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <SecurityProvider>
          <FraudDetection />
          <SEOHead page={SEO_PAGES.home} />
          
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={
              <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
                <Header onAuthClick={() => setShowAuthModal(true)} />
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {!user && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <p className="text-blue-800">
                          <strong>Working Offline</strong> Your resume is being saved locally. Sign in to save your work permanently and access it from any device.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}

                  <div className="mb-8 flex flex-wrap items-center gap-4">
                    <button
                      onClick={handleOpenUploadModal}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload Resume</span>
                    </button>
                    
                    <button
                      onClick={() => setShowCoverLetterGenerator(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Generate Cover Letter</span>
                    </button>

                    <SystemHealthWidget />
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                      {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setActiveTab(id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            activeTab === id
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-6">
                      {activeTab === 'personal' && (
                        <PersonalInfoForm
                          initialData={resumeData.personalInfo}
                          onSave={updatePersonalInfo}
                        />
                      )}
                      {activeTab === 'experience' && (
                        <ExperienceForm
                          initialData={resumeData.experience}
                          onSave={updateExperience}
                        />
                      )}
                      {activeTab === 'education' && (
                        <EducationForm
                          initialData={resumeData.education}
                          onSave={updateEducation}
                        />
                      )}
                      {activeTab === 'skills' && (
                        <SkillsForm
                          initialData={resumeData.skills}
                          onSave={updateSkills}
                        />
                      )}
                      {activeTab === 'projects' && (
                        <ProjectsForm
                          initialData={resumeData.projects}
                          onSave={updateProjects}
                        />
                      )}
                      {activeTab === 'template' && (
                        <TemplateSelector
                          currentTemplate={resumeData.template}
                          onTemplateSelect={updateTemplate}
                          resumeData={resumeData}
                        />
                      )}
                      {activeTab === 'preview' && (
                        <ResumePreview resume={resumeData} />
                      )}
                      {activeTab === 'export' && (
                        <ExportOptions resume={resumeData} />
                      )}
                    </div>
                  </div>
                </main>

                <Footer />

                {showAuthModal && (
                  <AuthModal onClose={() => setShowAuthModal(false)} />
                )}

                {showUploadModal && (
                  <ResumeUpload
                    onResumeLoaded={handleResumeUpload}
                    onClose={handleCloseUploadModal}
                  />
                )}

                {showCoverLetterGenerator && (
                  <CoverLetterGenerator
                    resume={resumeData}
                    onClose={() => setShowCoverLetterGenerator(false)}
                  />
                )}

                <CookieConsent onConsentChange={handleConsentChange} />
              </div>
            } />
          </Routes>
        </SecurityProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

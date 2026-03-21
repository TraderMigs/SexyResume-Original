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
  CheckCircle,
  X
} from 'lucide-react';

type ActiveTab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'template' | 'preview' | 'export';

export default function App() {
  const { user } = useAuth();
  const { resume, saveResume, updateResumeState } = useResume();
  const { trackPage, track } = useAnalytics();

  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [saveToast, setSaveToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

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

  const showSaveConfirmation = (message = 'Changes saved!') => {
    setSaveToast({ visible: true, message });
    setTimeout(() => setSaveToast({ visible: false, message: '' }), 2500);
  };

  const updatePersonalInfo = async (info: PersonalInfo) => {
    const updatedResume = { ...resumeData, personalInfo: info, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Personal info saved!');
  };

  const updateExperience = async (experience: Experience[]) => {
    const updatedResume = { ...resumeData, experience, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Work experience saved!');
  };

  const updateEducation = async (education: Education[]) => {
    const updatedResume = { ...resumeData, education, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Education saved!');
  };

  const updateSkills = async (skills: Skill[]) => {
    const updatedResume = { ...resumeData, skills, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Skills saved!');
  };

  const updateProjects = async (projects: Project[]) => {
    const updatedResume = { ...resumeData, projects, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Projects saved!');
  };

  const updateTemplate = async (template: string) => {
    const updatedResume = { ...resumeData, template, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    await saveResume(updatedResume);
    showSaveConfirmation('Template selected!');
  };

  const handleResumeUpload = useCallback((uploadedData: Partial<Resume>) => {
    const updatedResume = { ...resumeData, ...uploadedData, updatedAt: new Date().toISOString() };
    setResumeData(updatedResume);
    saveResume(updatedResume);
    track('resume_uploaded', { hasData: !!uploadedData });
    showSaveConfirmation('Resume loaded successfully!');
  }, [resumeData, saveResume, track]);

  const handleCoverLetterClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowCoverLetterGenerator(true);
    }
  };

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

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <SecurityProvider>
          <FraudDetection />
          <SEOHead page={SEO_PAGES.home} />

          {/* Save Toast Notification */}
          {saveToast.visible && (
            <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{saveToast.message}</span>
            </div>
          )}

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
                        <p className="text-blue-800 text-sm">
                          <strong>Working Offline</strong> — Your resume is being saved locally. Sign in to save permanently and unlock AI features.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm font-medium"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}

                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Resume</span>
                    </button>

                    <button
                      onClick={handleCoverLetterClick}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generate Cover Letter</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-1 p-3 bg-gray-50 border-b border-gray-200">
                      {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setActiveTab(id)}
                          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
                            activeTab === id
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-6">
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
                    onClose={() => setShowUploadModal(false)}
                  />
                )}

                {showCoverLetterGenerator && user && (
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

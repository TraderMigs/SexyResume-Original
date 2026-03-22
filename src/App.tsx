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
import LandingPage from './pages/LandingPage';
import ResumeHookPreview from './components/ResumeHookPreview';
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
  User, Briefcase, GraduationCap, Zap, FolderOpen,
  Palette, Eye, Download, CheckCircle, Lock,
} from 'lucide-react';

type ActiveTab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'template' | 'preview' | 'export';
type PostAuthAction = 'goTemplate' | 'goPersonal' | 'goTab' | 'export' | null;

// Three app states for logged-out users
type AnonState = 'landing' | 'hook'; // 'hook' = after upload, showing teaser preview

export default function App() {
  const { user } = useAuth();
  const { resume, saveResume } = useResume();
  const { trackPage, track } = useAnalytics();

  const [activeTab, setActiveTab] = useState<ActiveTab>('template');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState<PostAuthAction>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [saveToast, setSaveToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [anonState, setAnonState] = useState<AnonState>('landing');

  const [resumeData, setResumeData] = useState<Resume>({
    id: '',
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '', summary: '' },
    experience: [], education: [], skills: [], projects: [],
    template: 'modern',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useEffect(() => { if (resume) setResumeData(resume); }, [resume]);
  useEffect(() => { trackPage('/', 'Resume Builder'); }, [trackPage]);

  // After sign-in, execute pending action + scroll to top
  useEffect(() => {
    if (user && postAuthAction) {
      if (postAuthAction === 'goTemplate') setActiveTab('template');
      if (postAuthAction === 'goPersonal') setActiveTab('personal');
      if (postAuthAction === 'export') setActiveTab('export');
      if (postAuthAction === 'goTab') { /* tab already set */ }
      setPostAuthAction(null);
      setAuthModalMessage(undefined);
      // Always scroll to top when transitioning into builder
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [user, postAuthAction]);

  // Also scroll to top whenever user first signs in (even without postAuthAction)
  useEffect(() => {
    if (user) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [user]);

  const handleConsentChange = (consents: ConsentPreferences) => {
    setHasConsent(consents.analytics);
    updateAnalyticsConsent(consents.analytics);
  };
  useEffect(() => { initAnalytics(hasConsent); }, [hasConsent]);

  const showSaveConfirmation = (message = 'Changes saved!') => {
    setSaveToast({ visible: true, message });
    setTimeout(() => setSaveToast({ visible: false, message: '' }), 2500);
  };

  const updatePersonalInfo = async (info: PersonalInfo) => {
    const u = { ...resumeData, personalInfo: info, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Personal info saved!');
  };
  const updateExperience = async (experience: Experience[]) => {
    const u = { ...resumeData, experience, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Work experience saved!');
  };
  const updateEducation = async (education: Education[]) => {
    const u = { ...resumeData, education, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Education saved!');
  };
  const updateSkills = async (skills: Skill[]) => {
    const u = { ...resumeData, skills, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Skills saved!');
  };
  const updateProjects = async (projects: Project[]) => {
    const u = { ...resumeData, projects, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Projects saved!');
  };
  const updateTemplate = async (template: string) => {
    const u = { ...resumeData, template, updatedAt: new Date().toISOString() };
    setResumeData(u); await saveResume(u); showSaveConfirmation('Template selected!');
  };

  // Upload completes → show hook preview on the landing
  const handleResumeUpload = useCallback((uploadedData: Partial<Resume>) => {
    const u = { ...resumeData, ...uploadedData, updatedAt: new Date().toISOString() };
    setResumeData(u);
    saveResume(u);
    track('resume_uploaded', { hasData: !!uploadedData });
    showSaveConfirmation('Resume loaded!');
    // Stay on landing but switch to hook state — don't go to builder yet
    setAnonState('hook');
  }, [resumeData, saveResume, track]);

  // Upload CTA on landing — no auth gate, open modal directly
  const handleLandingUpload = () => setShowUploadModal(true);

  // Build from scratch — gate behind sign-in with custom copy
  const handleLandingBuild = () => {
    setPostAuthAction('goPersonal');
    setAuthModalMessage('Log in to get all the free tools to build your sexy resume with.');
    setShowAuthModal(true);
  };

  // Hook preview sign-in → land on Template tab
  const handleHookSignIn = () => {
    setPostAuthAction('goTemplate');
    setShowAuthModal(true);
  };

  const handleUnlockClick = () => {
    if (!user) { setPostAuthAction('export'); setShowAuthModal(true); }
    else setActiveTab('export');
  };

  const handleCoverLetterClick = () => {
    if (user) setShowCoverLetterGenerator(true);
  };

  // Locked tabs require auth
  const handleTabClick = (tab: ActiveTab) => {
    if (!user && tab !== 'preview' && tab !== 'template') {
      setPostAuthAction('goTab');
      setActiveTab(tab); // will be applied after sign-in
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const tabs = [
    { id: 'personal' as const, label: 'Personal Info', icon: User, requiresAuth: true },
    { id: 'experience' as const, label: 'Work Experience', icon: Briefcase, requiresAuth: true },
    { id: 'education' as const, label: 'Education', icon: GraduationCap, requiresAuth: true },
    { id: 'skills' as const, label: 'Skills', icon: Zap, requiresAuth: true },
    { id: 'projects' as const, label: 'Projects', icon: FolderOpen, requiresAuth: true },
    { id: 'template' as const, label: 'Template', icon: Palette, requiresAuth: false },
    { id: 'preview' as const, label: 'Preview', icon: Eye, requiresAuth: false },
    { id: 'export' as const, label: 'Export', icon: Download, requiresAuth: true },
  ];

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <SecurityProvider>
          <FraudDetection />
          <SEOHead page={SEO_PAGES.home} />

          {saveToast.visible && (
            <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{saveToast.message}</span>
            </div>
          )}

          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={

              !user ? (
                // ── LOGGED OUT ─────────────────────────────────────────────
                <div className="flex flex-col min-h-screen">
                  {/* Minimal landing header */}
                  <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                      <img src="/New Header Logo copy copy.png" alt="SexyResume" className="h-12 w-auto" />
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
                      >
                        Sign In
                      </button>
                    </div>
                  </header>

                  <main className="flex-1">
                    {anonState === 'landing' ? (
                      // ── LANDING ──────────────────────────────────────────
                      <LandingPage
                        onSignIn={handleLandingBuild}
                        onUpload={handleLandingUpload}
                      />
                    ) : (
                      // ── HOOK PREVIEW (after upload, still on landing) ────
                      <div
                        className="min-h-screen py-16"
                        style={{ background: 'linear-gradient(135deg,#fdf4ff,#f5f3ff,#eff6ff)' }}
                      >
                        <ResumeHookPreview
                          resume={resumeData}
                          onSignIn={handleHookSignIn}
                        />
                      </div>
                    )}
                  </main>

                  <footer className="bg-gray-900 text-gray-400 py-10 px-6">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                      <p>© {new Date().getFullYear()} SexyResume.com · All rights reserved</p>
                      <div className="flex gap-6">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Support</span>
                      </div>
                    </div>
                  </footer>

                  {/* Upload modal opens on top of landing — no redirect */}
                  {showUploadModal && (
                    <ResumeUpload
                      onResumeLoaded={handleResumeUpload}
                      onClose={() => setShowUploadModal(false)}
                    />
                  )}

                  <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => { setShowAuthModal(false); setAuthModalMessage(undefined); }}
                    customMessage={authModalMessage}
                  />
                  <CookieConsent onConsentChange={handleConsentChange} />
                </div>

              ) : (
                // ── LOGGED IN → BUILDER ────────────────────────────────────
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen flex flex-col overflow-x-hidden">
                  <Header onAuthClick={() => setShowAuthModal(true)} />

                  <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="mb-6">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg,#d946ef,#7c3aed)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Upload Resume</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div
                        className="flex overflow-x-auto gap-1 p-3 bg-gray-50 border-b border-gray-200"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {tabs.map(({ id, label, icon: Icon, requiresAuth }) => {
                          const locked = requiresAuth && !user;
                          const isActive = activeTab === id;
                          return (
                            <button
                              key={id}
                              onClick={() => handleTabClick(id)}
                              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium whitespace-nowrap ${
                                isActive
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : locked
                                    ? 'text-gray-400 hover:bg-gray-100'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              {locked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-4 h-4" />}
                              <span className="text-xs sm:text-sm">{label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-6">
                        {activeTab === 'personal' && <PersonalInfoForm initialData={resumeData.personalInfo} onSave={updatePersonalInfo} />}
                        {activeTab === 'experience' && <ExperienceForm initialData={resumeData.experience} onSave={updateExperience} />}
                        {activeTab === 'education' && <EducationForm initialData={resumeData.education} onSave={updateEducation} />}
                        {activeTab === 'skills' && <SkillsForm initialData={resumeData.skills} onSave={updateSkills} />}
                        {activeTab === 'projects' && <ProjectsForm initialData={resumeData.projects} onSave={updateProjects} />}
                        {activeTab === 'template' && (
                          <TemplateSelector
                            resume={resumeData}
                            selectedTemplate={resumeData.template}
                            onTemplateChange={updateTemplate}
                            requiresAuthForMore={false}
                          />
                        )}
                        {activeTab === 'preview' && (
                          <ResumePreview resume={resumeData} onUnlockClick={handleUnlockClick} />
                        )}
                        {activeTab === 'export' && (
                          <ExportOptions resume={resumeData} onGenerateCoverLetter={handleCoverLetterClick} />
                        )}
                      </div>
                    </div>
                  </main>

                  <Footer />

                  <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

                  {showUploadModal && (
                    <ResumeUpload
                      onResumeLoaded={(data) => {
                        handleResumeUpload(data);
                        setActiveTab('template');
                      }}
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
              )
            } />
          </Routes>
        </SecurityProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

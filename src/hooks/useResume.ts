import { useState, useEffect } from 'react';
import { Resume } from '../types/resume';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UseResumeReturn {
  resume: Resume | null;
  resumes: Resume[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveResume: (resumeData: Partial<Resume>) => Promise<void>;
  saveResumeToCloud: (resumeData: Partial<Resume>) => Promise<void>;
  loadResume: (resumeId: string) => Promise<void>;
  createResume: (resumeData: Partial<Resume>) => Promise<string>;
  deleteResume: (resumeId: string) => Promise<void>;
  loadUserResumes: () => Promise<void>;
  updateResumeState: (resumeData: Resume) => void;
}

const LOCAL_STORAGE_KEY = 'sexyresume_draft';

export function useResume(): UseResumeReturn {
  const { user, session } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setResume(parsed);
      } catch (err) {
        console.error('Failed to load draft from localStorage:', err);
        // Initialize with empty resume on error
        initializeEmptyResume();
      }
    } else {
      // Initialize with empty resume if no saved draft
      initializeEmptyResume();
    }
  }, []);

  const initializeEmptyResume = () => {
    const emptyResume: Resume = {
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
    };
    setResume(emptyResume);
  };

  // Load user's resumes when authenticated
  useEffect(() => {
    if (user && session) {
      loadUserResumes();
    } else {
      setResumes([]);
      // Don't clear local resume when not authenticated
    }
  }, [user, session]);

  const loadUserResumes = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setResumes(data || []);

      // If no current resume is selected, select the most recent one
      if (!resume && data && data.length > 0) {
        setResume(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadResume = async (resumeId: string) => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setResume(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createResume = async (resumeData: Partial<Resume>): Promise<string> => {
    if (!session || !user) throw new Error('Not authenticated');

    try {
      setSaving(true);
      setError(null);

      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: resumeData.personalInfo?.fullName ? `${resumeData.personalInfo.fullName}'s Resume` : 'My Resume',
          data: resumeData,
          template: resumeData.template || 'modern'
        })
        .select()
        .single();

      if (error) throw error;

      setResume(data);
      await loadUserResumes(); // Refresh the list
      
      // Clear localStorage draft after successful cloud save
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      return data.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // NEW: Local-only save (doesn't require authentication)
  const saveResume = async (resumeData: Partial<Resume>) => {
    try {
      setSaving(true);
      setError(null);

      // Merge with existing resume data to preserve all fields
      const mergedResume: Resume = {
        id: resume?.id || '',
        personalInfo: resumeData.personalInfo || resume?.personalInfo || {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          website: '',
          summary: ''
        },
        experience: resumeData.experience || resume?.experience || [],
        education: resumeData.education || resume?.education || [],
        skills: resumeData.skills || resume?.skills || [],
        projects: resumeData.projects || resume?.projects || [],
        template: resumeData.template || resume?.template || 'modern',
        createdAt: resume?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage immediately (works offline)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedResume));
      
      // Update local state
      setResume(mergedResume);

      // If user is authenticated, also save to cloud
      if (session && user) {
        await saveResumeToCloud(mergedResume);
      }
    } catch (err: any) {
      setError(err.message);
      // Don't throw - local save succeeded even if cloud failed
    } finally {
      setSaving(false);
    }
  };

  // Cloud save (requires authentication)
  const saveResumeToCloud = async (resumeData: Partial<Resume>) => {
    if (!session || !user) throw new Error('Not authenticated');

    try {
      setSaving(true);
      setError(null);

      if (!resume?.id) {
        // Create new resume
        await createResume(resumeData);
        return;
      }

      const { data, error } = await supabase
        .from('resumes')
        .update({
          title: resumeData.personalInfo?.fullName ? `${resumeData.personalInfo.fullName}'s Resume` : 'My Resume',
          data: resumeData,
          template: resumeData.template || 'modern'
        })
        .eq('id', resume.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setResume(data);
      await loadUserResumes(); // Refresh the list
      
      // Clear localStorage draft after successful cloud save
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateResumeState = (resumeData: Resume) => {
    setResume(resumeData);
    // Also save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resumeData));
  };

  const deleteResume = async (resumeId: string) => {
    if (!session || !user) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (error) throw error;

      // If we deleted the current resume, clear it
      if (resume?.id === resumeId) {
        setResume(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      await loadUserResumes(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    resume,
    resumes,
    loading,
    saving,
    error,
    saveResume,
    saveResumeToCloud,
    loadResume,
    createResume,
    deleteResume,
    loadUserResumes,
    updateResumeState,
  };
}

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

// The resumes table stores resume data in a JSONB 'data' column.
// DB row shape: { id, user_id, title, data: {...resumeFields}, template, ... }
// This helper extracts the Resume object from the DB row.
function dbRowToResume(row: any): Resume {
  const inner = row?.data ?? {};
  return {
    id: row.id || inner.id || '',
    personalInfo: inner.personalInfo || {
      fullName: '', email: '', phone: '', location: '',
      linkedin: '', website: '', summary: '',
    },
    experience: inner.experience || [],
    education: inner.education || [],
    skills: inner.skills || [],
    projects: inner.projects || [],
    template: row.template || inner.template || 'modern',
    createdAt: inner.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: inner.updatedAt || row.updated_at || new Date().toISOString(),
  };
}

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
        initializeEmptyResume();
      }
    } else {
      initializeEmptyResume();
    }
  }, []);

  const initializeEmptyResume = () => {
    const emptyResume: Resume = {
      id: '',
      personalInfo: {
        fullName: '', email: '', phone: '', location: '',
        linkedin: '', website: '', summary: '',
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      template: 'modern',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setResume(emptyResume);
  };

  // Load user's resumes from cloud when authenticated
  useEffect(() => {
    if (user && session) {
      loadUserResumes();
    } else {
      setResumes([]);
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

      const parsed = (data || []).map(dbRowToResume);
      setResumes(parsed);

      // Load most recent resume if none currently selected or current has no id
      if ((!resume || !resume.id) && parsed.length > 0) {
        setResume(parsed[0]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed[0]));
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

      const parsed = dbRowToResume(data);
      setResume(parsed);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
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
          title: resumeData.personalInfo?.fullName
            ? `${resumeData.personalInfo.fullName}'s Resume`
            : 'My Resume',
          data: resumeData,
          template: resumeData.template || 'modern',
        })
        .select()
        .single();

      if (error) throw error;

      const parsed = dbRowToResume(data);
      // Preserve the new DB id in the resume object
      const withId = { ...parsed, id: data.id };
      setResume(withId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(withId));
      await loadUserResumes();
      return data.id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Save locally + optionally to cloud
  const saveResume = async (resumeData: Partial<Resume>) => {
    try {
      setSaving(true);
      setError(null);

      const mergedResume: Resume = {
        id: resume?.id || resumeData.id || '',
        personalInfo: resumeData.personalInfo ?? resume?.personalInfo ?? {
          fullName: '', email: '', phone: '', location: '',
          linkedin: '', website: '', summary: '',
        },
        experience: resumeData.experience ?? resume?.experience ?? [],
        education: resumeData.education ?? resume?.education ?? [],
        skills: resumeData.skills ?? resume?.skills ?? [],
        projects: resumeData.projects ?? resume?.projects ?? [],
        template: resumeData.template ?? resume?.template ?? 'modern',
        createdAt: resume?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Always save to localStorage first
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedResume));
      setResume(mergedResume);

      // Also save to cloud if authenticated
      if (session && user) {
        await saveResumeToCloud(mergedResume);
      }
    } catch (err: any) {
      setError(err.message);
      // Don't throw — localStorage save succeeded
    } finally {
      setSaving(false);
    }
  };

  // Cloud-only save
  const saveResumeToCloud = async (resumeData: Partial<Resume>) => {
    if (!session || !user) throw new Error('Not authenticated');
    try {
      setSaving(true);
      setError(null);

      if (!resume?.id) {
        // No existing DB record — create one
        await createResume(resumeData);
        return;
      }

      const { data, error } = await supabase
        .from('resumes')
        .update({
          title: resumeData.personalInfo?.fullName
            ? `${resumeData.personalInfo.fullName}'s Resume`
            : 'My Resume',
          data: resumeData,
          template: resumeData.template || 'modern',
          updated_at: new Date().toISOString(),
        })
        .eq('id', resume.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Keep the id from the update, merge data back
      const parsed = dbRowToResume(data);
      const withId = { ...parsed, id: data.id };
      setResume(withId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(withId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateResumeState = (resumeData: Resume) => {
    setResume(resumeData);
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

      if (resume?.id === resumeId) {
        setResume(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      await loadUserResumes();
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

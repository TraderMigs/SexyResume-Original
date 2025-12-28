import { useState, useEffect } from 'react';
import { CoverLetter, CoverLetterRequest } from '../types/coverLetter';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UseCoverLetterReturn {
  coverLetters: CoverLetter[];
  currentCoverLetter: CoverLetter | null;
  loading: boolean;
  generating: boolean;
  saving: boolean;
  error: string | null;
  generateCoverLetter: (request: CoverLetterRequest) => Promise<CoverLetter>;
  loadCoverLetters: () => Promise<void>;
  loadCoverLetter: (id: string) => Promise<void>;
  updateCoverLetter: (id: string, updates: Partial<CoverLetter>) => Promise<void>;
  deleteCoverLetter: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useCoverLetter(): UseCoverLetterReturn {
  const { user, session } = useAuth();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [currentCoverLetter, setCurrentCoverLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's cover letters when authenticated
  useEffect(() => {
    if (user && session) {
      loadCoverLetters();
    } else {
      setCoverLetters([]);
      setCurrentCoverLetter(null);
    }
  }, [user, session]);

  const loadCoverLetters = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cover-letter`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load cover letters');
      }

      const data = await response.json();
      setCoverLetters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverLetter = async (id: string) => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cover-letter/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load cover letter');
      }

      const data = await response.json();
      setCurrentCoverLetter(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCoverLetter = async (request: CoverLetterRequest): Promise<CoverLetter> => {
    if (!session) throw new Error('Not authenticated');

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cover-letter/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const coverLetter = await response.json();
      setCurrentCoverLetter(coverLetter);
      
      // Refresh the list
      await loadCoverLetters();
      
      return coverLetter;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const updateCoverLetter = async (id: string, updates: Partial<CoverLetter>) => {
    if (!session) throw new Error('Not authenticated');

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cover-letter/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update cover letter');
      }

      const updatedCoverLetter = await response.json();
      setCurrentCoverLetter(updatedCoverLetter);
      
      // Update in the list
      setCoverLetters(prev => 
        prev.map(cl => cl.id === id ? updatedCoverLetter : cl)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteCoverLetter = async (id: string) => {
    if (!session) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cover-letter/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cover letter');
      }

      // Remove from current state
      if (currentCoverLetter?.id === id) {
        setCurrentCoverLetter(null);
      }
      
      setCoverLetters(prev => prev.filter(cl => cl.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    coverLetters,
    currentCoverLetter,
    loading,
    generating,
    saving,
    error,
    generateCoverLetter,
    loadCoverLetters,
    loadCoverLetter,
    updateCoverLetter,
    deleteCoverLetter,
    clearError,
  };
}
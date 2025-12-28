import { useState, useEffect } from 'react';
import {
  ParseReviewData,
  ValidationRequest,
  ValidationResponse,
} from '../types/parseReview';
import { useAuth } from '../contexts/AuthContext';
import { extractTextFromFile } from '../lib/fileTextExtract';

interface UseParseReviewReturn {
  parseReviews: ParseReviewData[];
  currentReview: ParseReviewData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  createParseReview: (file: File) => Promise<ParseReviewData>;
  loadParseReview: (id: string) => Promise<void>;
  validateCorrections: (request: ValidationRequest) => Promise<ValidationResponse>;
  saveParseReview: (id: string, data: Partial<ParseReviewData>) => Promise<void>;
  deleteParseReview: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useParseReview(): UseParseReviewReturn {
  const { user, session } = useAuth();
  const [parseReviews, setParseReviews] = useState<ParseReviewData[]>([]);
  const [currentReview, setCurrentReview] = useState<ParseReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && session) {
      loadParseReviews();
    } else {
      setParseReviews([]);
      setCurrentReview(null);
    }
  }, [user, session]);

  const loadParseReviews = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load parse reviews');
      }

      setParseReviews(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createParseReview = async (file: File): Promise<ParseReviewData> => {
    if (!session) throw new Error('Not authenticated');

    try {
      setLoading(true);
      setError(null);

      const extractedText = await extractTextFromFile(file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review/create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            extractedText,
            originalFileName: file.name,
            originalFileType: file.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create parse review');
      }

      const review = await response.json();
      setCurrentReview(review);
      await loadParseReviews();
      return review;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadParseReview = async (id: string) => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review/${id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load parse review');
      }

      setCurrentReview(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateCorrections = async (
    request: ValidationRequest
  ): Promise<ValidationResponse> => {
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review/validate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to validate corrections');
    }

    return response.json();
  };

  const saveParseReview = async (
    id: string,
    data: Partial<ParseReviewData>
  ) => {
    if (!session) throw new Error('Not authenticated');

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review/${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save parse review');
      }

      const updated = await response.json();
      setCurrentReview(updated);
      setParseReviews(prev =>
        prev.map(r => (r.id === id ? updated : r))
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteParseReview = async (id: string) => {
    if (!session) throw new Error('Not authenticated');

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-review/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    setParseReviews(prev => prev.filter(r => r.id !== id));
    if (currentReview?.id === id) setCurrentReview(null);
  };

  const clearError = () => setError(null);

  return {
    parseReviews,
    currentReview,
    loading,
    saving,
    error,
    createParseReview,
    loadParseReview,
    validateCorrections,
    saveParseReview,
    deleteParseReview,
    clearError,
  };
}

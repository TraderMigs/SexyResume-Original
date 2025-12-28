import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RetentionPolicy {
  id: string;
  tableName: string;
  retentionDays: number;
  softDelete: boolean;
  archiveBeforeDelete: boolean;
  archiveStorageBucket?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PurgeStatus {
  tableName: string;
  retentionDays: number;
  recordsToProcess: number;
  cutoffDate: string;
  softDelete: boolean;
  archiveBeforeDelete: boolean;
}

interface PurgeJob {
  id: string;
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  targetTable: string;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsArchived: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface UseDataRetentionReturn {
  policies: RetentionPolicy[];
  purgeStatus: PurgeStatus[];
  recentJobs: PurgeJob[];
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  runPurgeJob: (tableNames?: string[], dryRun?: boolean) => Promise<void>;
  forcePurge: (tableName: string, recordIds: string[], reason: string) => Promise<void>;
  clearError: () => void;
}

export function useDataRetention(): UseDataRetentionReturn {
  const { session } = useAuth();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [purgeStatus, setPurgeStatus] = useState<PurgeStatus[]>([]);
  const [recentJobs, setRecentJobs] = useState<PurgeJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load status on mount
  useEffect(() => {
    if (session) {
      refreshStatus();
    }
  }, [session]);

  const refreshStatus = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-purge/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load purge status');
      }

      const data = await response.json();
      setPolicies(data.policies || []);
      setPurgeStatus(data.purgeStatus || []);
      setRecentJobs(data.recentJobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runPurgeJob = async (tableNames?: string[], dryRun: boolean = false) => {
    if (!session) throw new Error('Not authenticated');

    try {
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-purge/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableNames,
          dryRun,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run purge job');
      }

      // Refresh status after purge
      await refreshStatus();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const forcePurge = async (tableName: string, recordIds: string[], reason: string) => {
    if (!session) throw new Error('Not authenticated');

    try {
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-purge/force`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          recordIds,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to force purge');
      }

      // Refresh status after purge
      await refreshStatus();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return {
    policies,
    purgeStatus,
    recentJobs,
    loading,
    error,
    refreshStatus,
    runPurgeJob,
    forcePurge,
    clearError,
  };
}
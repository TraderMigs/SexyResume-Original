import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseSecurityReturn {
  hasPermission: (permission: string) => boolean;
  userRole: string | null;
  loading: boolean;
  error: string | null;
}

export function useSecurity(): UseSecurityReturn {
  const { user, session } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && session) {
      loadUserPermissions();
    } else {
      setUserRole(null);
      setPermissions([]);
    }
  }, [user, session]);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check user permissions from backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin/permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // User is not an admin or request failed
        setUserRole(null);
        setPermissions([]);
        return;
      }

      const data = await response.json();
      setUserRole(data.role || null);
      setPermissions(data.permissions || []);
    } catch (err: any) {
      // On error, deny all permissions
      setError(err.message);
      setUserRole(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return {
    hasPermission,
    userRole,
    loading,
    error,
  };
}
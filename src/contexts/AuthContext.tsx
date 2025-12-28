import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { logSecurityEvent } from '../lib/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionRotationTimer, setSessionRotationTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Set up session rotation for authenticated users
      if (session?.user) {
        setupSessionRotation(session);
      } else {
        clearSessionRotation();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setupSessionRotation = (session: Session) => {
    clearSessionRotation();
    
    // Rotate session every 30 minutes
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session rotation failed:', error);
          await signOut();
        }
      } catch (error) {
        console.error('Session rotation error:', error);
        await signOut();
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    setSessionRotationTimer(timer);
  };

  const clearSessionRotation = () => {
    if (sessionRotationTimer) {
      clearTimeout(sessionRotationTimer);
      setSessionRotationTimer(null);
    }
  };
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);

      // Validate password strength on client side
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Note: User will need to confirm email before they can sign in
      if (data.user && !data.session) {
        setError('Please check your email and click the confirmation link to complete your registration.');
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      // Log sign-in attempt
      logSecurityEvent({
        type: 'auth_attempt',
        details: `Sign-in attempt for email: ${email}`,
        ip: 'unknown'
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
      
      // Set up session rotation
      if (data.session) {
        setupSessionRotation(data.session);
      }
    } catch (error: any) {
      logSecurityEvent({
        type: 'auth_failure',
        details: `Sign-in failed for email: ${email} - ${error.message}`,
        ip: 'unknown'
      });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      clearSessionRotation();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const clearError = () => setError(null);

  const validatePasswordStrength = (password: string): { isValid: boolean; error?: string } => {
    if (password.length < 12) {
      return { isValid: false, error: 'Password must be at least 12 characters long' };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
      return { 
        isValid: false, 
        error: 'Password must include uppercase, lowercase, numbers, and special characters' 
      };
    }
    
    return { isValid: true };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
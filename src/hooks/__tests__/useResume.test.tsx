import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResume } from '../useResume';
import { AuthProvider } from '../../contexts/AuthContext';
import { Resume } from '../../types/resume';

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'mock-token' },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockResume: Resume = {
  id: '1',
  personalInfo: {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+1 (555) 123-4567',
    location: 'Test City',
    summary: 'Test summary',
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  template: 'modern',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

describe('useResume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null resume', () => {
    const { result } = renderHook(() => useResume());
    
    expect(result.current.resume).toBeNull();
    expect(result.current.resumes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('provides all required methods', () => {
    const { result } = renderHook(() => useResume());
    
    expect(typeof result.current.saveResume).toBe('function');
    expect(typeof result.current.loadResume).toBe('function');
    expect(typeof result.current.createResume).toBe('function');
    expect(typeof result.current.deleteResume).toBe('function');
    expect(typeof result.current.loadUserResumes).toBe('function');
    expect(typeof result.current.updateResumeState).toBe('function');
  });

  it('updates resume state correctly', () => {
    const { result } = renderHook(() => useResume());
    
    act(() => {
      result.current.updateResumeState(mockResume);
    });
    
    expect(result.current.resume).toEqual(mockResume);
  });

  it('handles errors gracefully', async () => {
    // Mock fetch to return error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' }),
      })
    ) as any;

    const { result } = renderHook(() => useResume());
    
    await act(async () => {
      try {
        await result.current.saveResume(mockResume);
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toBeTruthy();
  });
});
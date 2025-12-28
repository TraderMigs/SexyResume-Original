import { describe, it, expect, vi } from 'vitest';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Parse Resume API', () => {
  const mockFile = new File(['test content'], 'test-resume.pdf', { type: 'application/pdf' });
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('successfully parses a resume file', async () => {
    const mockResponse = {
      parsedResume: {
        personalInfo: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          summary: 'Software engineer',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
      },
      confidence: 0.85,
      message: 'Resume parsed successfully',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const formData = new FormData();
    formData.append('resume', mockFile);

    const response = await fetch('/functions/v1/parse-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    expect(mockFetch).toHaveBeenCalledWith('/functions/v1/parse-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: formData,
    });

    expect(result.confidence).toBe(0.85);
    expect(result.parsedResume.personalInfo.fullName).toBe('John Doe');
  });

  it('handles file validation errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid file type' }),
    });

    const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });
    const formData = new FormData();
    formData.append('resume', invalidFile);

    const response = await fetch('/functions/v1/parse-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toBe('Invalid file type');
  });

  it('handles large file rejection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'File size exceeds 10MB limit' }),
    });

    // Mock large file
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('resume', largeFile);

    const response = await fetch('/functions/v1/parse-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('requires authentication', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'No authorization header' }),
    });

    const formData = new FormData();
    formData.append('resume', mockFile);

    const response = await fetch('/functions/v1/parse-resume', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toBe('No authorization header');
  });
});
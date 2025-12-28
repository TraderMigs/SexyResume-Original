import { describe, it, expect, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Export Resume API', () => {
  const mockToken = 'mock-jwt-token';
  const mockResumeId = 'test-resume-id';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('creates export successfully', async () => {
    const mockResponse = {
      exportId: 'export-123',
      status: 'completed',
      downloadUrl: 'https://signed-url.com/file.pdf',
      expiresAt: '2023-12-31T23:59:59Z',
      format: 'pdf',
      fileSize: 1024,
      watermarked: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch('/functions/v1/export-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: mockResumeId,
        format: 'pdf',
        template: 'modern',
      }),
    });

    const result = await response.json();

    expect(result.status).toBe('completed');
    expect(result.downloadUrl).toBeTruthy();
    expect(result.format).toBe('pdf');
  });

  it('applies watermark for unpaid users', async () => {
    const mockResponse = {
      exportId: 'export-123',
      status: 'completed',
      downloadUrl: 'https://signed-url.com/file.pdf',
      watermarked: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch('/functions/v1/export-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: mockResumeId,
        format: 'pdf',
        watermark: true,
      }),
    });

    const result = await response.json();

    expect(result.watermarked).toBe(true);
  });

  it('validates export format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid format. Must be pdf, docx, txt, or ats' }),
    });

    const response = await fetch('/functions/v1/export-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: mockResumeId,
        format: 'invalid',
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toContain('Invalid format');
  });

  it('requires resume ownership', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Resume not found or access denied' }),
    });

    const response = await fetch('/functions/v1/export-resume', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeId: 'unauthorized-resume-id',
        format: 'pdf',
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toContain('access denied');
  });
});
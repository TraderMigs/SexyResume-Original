import { describe, it, expect, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Payments API', () => {
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('creates checkout session successfully', async () => {
    const mockResponse = {
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      expiresAt: '2023-12-31T23:59:59Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch('/functions/v1/stripe-checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: 'price_1RntxwRrIlnVe6VQGCrp5lxU',
        success_url: 'https://app.com/success',
        cancel_url: 'https://app.com/cancel',
        mode: 'payment',
      }),
    });

    const result = await response.json();

    expect(result.sessionId).toBeTruthy();
    expect(result.url).toContain('checkout.stripe.com');
  });

  it('gets user entitlement', async () => {
    const mockEntitlement = {
      user_id: 'test-user',
      export_unlocked: true,
      export_unlocked_at: '2023-12-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEntitlement),
    });

    const response = await fetch('/functions/v1/payments/entitlement', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    expect(result.export_unlocked).toBe(true);
    expect(result.user_id).toBe('test-user');
  });

  it('handles payment failures gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment processing failed' }),
    });

    const response = await fetch('/functions/v1/stripe-checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: 'invalid-price',
        success_url: 'https://app.com/success',
        cancel_url: 'https://app.com/cancel',
        mode: 'payment',
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
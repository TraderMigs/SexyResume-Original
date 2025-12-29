import { rateLimiter } from './security';

interface FetchOptions extends RequestInit {
  skipRateLimit?: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private getRateLimitKey(url: string, userId?: string): string {
    return userId ? `${userId}:${url}` : url;
  }

  async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { skipRateLimit = false, ...fetchOptions } = options;

    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    if (!skipRateLimit) {
      const rateLimitKey = this.getRateLimitKey(fullURL);
      
      if (!rateLimiter.isAllowed(rateLimitKey)) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
    }

    try {
      const response = await fetch(fullURL, fetchOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async get(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'GET'
    });
  }

  async post(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete(url: string, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'DELETE'
    });
  }

  async patch(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }
}

export const apiClient = new APIClient();

export async function rateLimitedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  return apiClient.fetch(url, options);
}

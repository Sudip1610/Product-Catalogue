import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from './client.js';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes request to /api/v1 with correct default headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'ok' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await apiClient<{ data: string }>('/featured');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/featured',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual({ data: 'ok' });
  });

  it('sets Content-Type to application/json when body is passed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'sent' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await apiClient('/enquiries', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice' }),
    });

    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs?.[1]?.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('throws ApiError with error contract fields on non-200 responses', async () => {
    const errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: [{ field: 'email' }],
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse,
      }),
    );

    try {
      await apiClient('/enquiries', { method: 'POST' });
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.message).toBe('Invalid input');
      expect(apiErr.details).toEqual([{ field: 'email' }]);
    }
  });

  it('throws ApiError with NETWORK_ERROR when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch')),
    );

    try {
      await apiClient('/featured');
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe('NETWORK_ERROR');
      expect(apiErr.status).toBe(0);
      expect(apiErr.message).toBe('Failed to fetch');
    }
  });
});

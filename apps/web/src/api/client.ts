import type { ApiErrorResponse } from './types.js';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, errorData: ApiErrorResponse['error']) {
    super(errorData.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = errorData.code;
    this.details = errorData.details;
  }
}

const API_BASE = '/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network connection failed',
    });
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse['error'];
    try {
      const json = (await response.json()) as ApiErrorResponse;
      if (json && json.error && typeof json.error.code === 'string') {
        errorData = json.error;
      } else {
        errorData = {
          code: 'UNKNOWN_ERROR',
          message: response.statusText || 'Request failed',
        };
      }
    } catch {
      errorData = {
        code: 'PARSE_ERROR',
        message: response.statusText || `Request failed with status ${response.status}`,
      };
    }
    throw new ApiError(response.status, errorData);
  }

  return response.json() as Promise<T>;
}

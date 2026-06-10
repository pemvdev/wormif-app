import { getAuthToken } from './authToken';

const API_BASE_URL = '/api';

interface RequestOptions {
  allowErrorBody?: boolean;
}

function buildHeaders(includeJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T>(response: Response, options?: RequestOptions): Promise<T> {
  const body = (await response.json()) as T;
  if (!response.ok && !options?.allowErrorBody) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return body;
}

export class ApiClient {
  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: buildHeaders()
    });
    return parseResponse<T>(response);
  }

  static async post<T>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(data)
    });
    return parseResponse<T>(response, options);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });
    return parseResponse<T>(response);
  }
}

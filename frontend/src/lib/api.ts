import { CreateLogInput, DailyLog, PaginatedLogsResponse, AnalyticsSummary, ScoreTrend, CategoryBreakdown, StreakInfo } from '@/types';
import { API_TIMEOUT, API_RETRY_COUNT, API_RETRY_DELAY } from './constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
}

async function fetchWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  retries = API_RETRY_COUNT
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }, API_TIMEOUT);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(response.status, error.error || error.message || 'Request failed');
    }

    return response.json();
  } catch (error) {
    if (retries > 0 && !(error instanceof ApiError && error.status === 400)) {
      // Wait with exponential backoff before retry
      await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY * (API_RETRY_COUNT - retries + 1)));
      return fetchWithRetry(endpoint, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  // Logs
  createLog: (data: CreateLogInput) =>
    fetchWithRetry<{ success: boolean; data: DailyLog }>('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => res.data),

  getLogs: (page = 1, limit = 20) =>
    fetchWithRetry<{ success: boolean; data: DailyLog[]; pagination: PaginatedLogsResponse['pagination'] }>(
      `/logs?page=${page}&limit=${limit}`
    ).then(res => ({ data: res.data, pagination: res.pagination })),

  getLogByDate: (date: string) =>
    fetchWithRetry<{ success: boolean; data: DailyLog }>(`/logs/${date}`)
      .then(res => res.data)
      .catch(() => null),

  updateLog: (date: string, data: Partial<CreateLogInput>) =>
    fetchWithRetry<{ success: boolean; data: DailyLog }>(`/logs/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(res => res.data),

  deleteLog: (date: string) =>
    fetchWithRetry<{ success: boolean; message: string }>(`/logs/${date}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: () =>
    fetchWithRetry<{ success: boolean; data: AnalyticsSummary }>('/analytics')
      .then(res => res.data),

  getScoreTrend: (days = 30) =>
    fetchWithRetry<{ success: boolean; data: ScoreTrend[] }>(`/analytics/trend?days=${days}`)
      .then(res => res.data),

  getCategories: () =>
    fetchWithRetry<{ success: boolean; data: CategoryBreakdown[] }>('/analytics/categories')
      .then(res => res.data),

  // Streak
  getStreak: () =>
    fetchWithRetry<{ success: boolean; data: StreakInfo }>('/streak')
      .then(res => res.data),
};

export { ApiError };

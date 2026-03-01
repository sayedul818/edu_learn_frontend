// ============ EXAM RESULTS API ============
export const examResultsAPI = {
  submit: (data: any) => fetchAPI('/exam-results', { method: 'POST', body: data }),
  getMine: () => fetchAPI('/exam-results/mine'),
  getByExam: (examId: string) => fetchAPI(`/exam-results/exam/${examId}`),
};
// Resolve API base URL:
// - If `VITE_API_URL` is provided (e.g., in production on Vercel), use it.
// - If running in Vite dev mode, default to local backend `http://localhost:5000/api`.
// - Otherwise (production build without VITE_API_URL), fall back to the deployed backend URL.
const API_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl;
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  return 'https://learn-edu-backend.vercel.app/api';
})();

interface FetchOptions extends RequestInit {
  body?: any;
}

const GET_CACHE_TTL_MS = 60 * 1000;
const responseCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

const cacheablePrefixes = [
  '/classes',
  '/groups',
  '/subjects',
  '/chapters',
  '/topics',
  '/questions',
  '/exam-types',
  '/exams',
  '/leaderboard',
];

const nonCacheablePrefixes = [
  '/auth',
  '/users',
  '/exam-results',
];

function shouldCacheRequest(endpoint: string, method: string) {
  if (method !== 'GET') return false;
  if (nonCacheablePrefixes.some((prefix) => endpoint.startsWith(prefix))) return false;
  return cacheablePrefixes.some((prefix) => endpoint.startsWith(prefix));
}

function buildCacheKey(baseUrl: string, endpoint: string, authToken: string | null) {
  return `${baseUrl}${endpoint}::${authToken || 'anon'}`;
}

async function parseJsonSafely(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return response.json();
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const method = (config.method || 'GET').toString().toUpperCase();
  let token: string | null = null;

  // attach auth token if available
  try {
    token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  } catch (e) {
    // ignore when running server-side
  }

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const cacheKey = buildCacheKey(API_URL, endpoint, token);
  const canUseCache = shouldCacheRequest(endpoint, method);

  if (canUseCache) {
    const cachedEntry = responseCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return cachedEntry.data;
    }

    const pendingRequest = inFlightRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }
  }

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await parseJsonSafely(response);
        throw new Error(error?.error || `API Error: ${response.status}`);
      }

      const data = await parseJsonSafely(response);

      if (canUseCache) {
        responseCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + GET_CACHE_TTL_MS,
        });
      }

      return data;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      if (canUseCache) inFlightRequests.delete(cacheKey);
    }
  })();

  if (canUseCache) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  const data = await requestPromise;

  if (method !== 'GET') {
    responseCache.clear();
    inFlightRequests.clear();
  }

  return data;
}

// ============ CLASSES API ============
export const classesAPI = {
  getAll: () => fetchAPI('/classes'),
  get: (id: string) => fetchAPI(`/classes/${id}`),
  create: (data: any) => fetchAPI('/classes', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/classes/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/classes/${id}`, { method: 'DELETE' }),
};

// ============ GROUPS API ============
export const groupsAPI = {
  getAll: (classId?: string) =>
    fetchAPI(classId ? `/groups?classId=${classId}` : '/groups'),
  get: (id: string) => fetchAPI(`/groups/${id}`),
  create: (data: any) => fetchAPI('/groups', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/groups/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/groups/${id}`, { method: 'DELETE' }),
};

// ============ SUBJECTS API ============
export const subjectsAPI = {
  getAll: (groupId?: string) =>
    fetchAPI(groupId ? `/subjects?groupId=${groupId}` : '/subjects'),
  get: (id: string) => fetchAPI(`/subjects/${id}`),
  create: (data: any) => fetchAPI('/subjects', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/subjects/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/subjects/${id}`, { method: 'DELETE' }),
};

// ============ CHAPTERS API ============
export const chaptersAPI = {
  getAll: (subjectId?: string) =>
    fetchAPI(subjectId ? `/chapters?subjectId=${subjectId}` : '/chapters'),
  get: (id: string) => fetchAPI(`/chapters/${id}`),
  create: (data: any) => fetchAPI('/chapters', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/chapters/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/chapters/${id}`, { method: 'DELETE' }),
};

// ============ TOPICS API ============
export const topicsAPI = {
  getAll: (chapterId?: string) =>
    fetchAPI(chapterId ? `/topics?chapterId=${chapterId}` : '/topics'),
  get: (id: string) => fetchAPI(`/topics/${id}`),
  create: (data: any) => fetchAPI('/topics', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/topics/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/topics/${id}`, { method: 'DELETE' }),
};

// ============ QUESTIONS API ============
export const questionsAPI = {
  getAll: () => fetchAPI('/questions'),
  get: (id: string) => fetchAPI(`/questions/${id}`),
  create: (data: any) => fetchAPI('/questions', { method: 'POST', body: data }),
  bulkImport: (questions: any[]) =>
    fetchAPI('/questions/bulk', { method: 'POST', body: { questions } }),
  search: (search: string, filters?: any) => {
    const params = new URLSearchParams({ search, ...filters });
    return fetchAPI(`/questions?${params.toString()}`);
  },
  update: (id: string, data: any) => fetchAPI(`/questions/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/questions/${id}`, { method: 'DELETE' }),
};

// ============ EXAMS API ============
export const examsAPI = {
  getAll: () => fetchAPI('/exams'),
  getMine: () => fetchAPI('/exams/mine'),
  get: (id: string) => fetchAPI(`/exams/${id}`),
  create: (data: any) => fetchAPI('/exams', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/exams/${id}`, { method: 'PUT', body: data }),
  publish: (id: string) => fetchAPI(`/exams/${id}/publish`, { method: 'PATCH' }),
  unpublish: (id: string) => fetchAPI(`/exams/${id}/unpublish`, { method: 'PATCH' }),
  delete: (id: string) => fetchAPI(`/exams/${id}`, { method: 'DELETE' }),
};

// ============ LEADERBOARD API ============
export const leaderboardAPI = {
  get: (period?: string) => fetchAPI(`/leaderboard${period ? `?period=${period}` : ''}`),
};

// ============ EXAM TYPES API ============
export const examTypesAPI = {
  getAll: () => fetchAPI('/exam-types'),
  get: (id: string) => fetchAPI(`/exam-types/${id}`),
  create: (data: any) => fetchAPI('/exam-types', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/exam-types/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/exam-types/${id}`, { method: 'DELETE' }),
};

// ============ AUTH API ============
export const authAPI = {
  login: (data: { email: string; password: string }) => fetchAPI('/auth/login', { method: 'POST', body: data }),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    fetchAPI('/auth/register', { method: 'POST', body: data }),
  me: () => fetchAPI('/auth/me'),
};

// ============ USERS API ============
export const usersAPI = {
  list: (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc, [k,v]) => { if (v !== undefined && v !== null) acc[k]=String(v); return acc; }, {} as Record<string,string>)).toString()}` : '';
    return fetchAPI(`/users${qs}`);
  },
  get: (id: string) => fetchAPI(`/users/${id}`),
  create: (data: any) => fetchAPI('/users', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/users/${id}`, { method: 'PUT', body: data }),
  changeRole: (id: string, role: string) => fetchAPI(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  changeStatus: (id: string, status: string) => fetchAPI(`/users/${id}/status`, { method: 'PATCH', body: { status } }),
  resetPassword: (id: string, password: string) => fetchAPI(`/users/${id}/reset-password`, { method: 'PATCH', body: { password } }),
  delete: (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};

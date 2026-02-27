// ============ EXAM RESULTS API ============
export const examResultsAPI = {
  submit: (data: any) => fetchAPI('/exam-results', { method: 'POST', body: data }),
  getMine: () => fetchAPI('/exam-results/mine'),
  getByExam: (examId: string) => fetchAPI(`/exam-results/exam/${examId}`),
};
const API_URL = 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  body?: any;
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

  // attach auth token if available
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  } catch (e) {
    // ignore when running server-side
  }

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
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

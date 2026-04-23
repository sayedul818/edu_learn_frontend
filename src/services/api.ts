// ============ EXAM RESULTS API ============
export const examResultsAPI = {
  submit: (data: any) => fetchAPI('/exam-results', { method: 'POST', body: data }),
  getMine: () => fetchAPI('/exam-results/mine'),
  getByExam: (examId: string) => fetchAPI(`/exam-results/exam/${examId}`),
  grade: (resultId: string, data: any) => fetchAPI(`/exam-results/${resultId}/grade`, { method: 'PUT', body: data }),
  regrade: (resultId: string) => fetchAPI(`/exam-results/${resultId}/regrade`, { method: 'PUT' }),
  regradeExam: (examId: string) => fetchAPI(`/exam-results/exam/${examId}/regrade`, { method: 'POST' }),
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
  '/courses',
  '/enrollments',
  '/teacher',
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

function buildQueryString(params: Record<string, unknown>) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    queryParams.set(key, String(value));
  });
  const query = queryParams.toString();
  return query ? `?${query}` : '';
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
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

  if (options.body !== undefined) {
    config.body = isFormData ? options.body : JSON.stringify(options.body);
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
  bulkImport: (questions: any[], options?: { dryRun?: boolean; continueOnError?: boolean; source?: string }) =>
    fetchAPI('/questions/bulk', { method: 'POST', body: { questions, ...(options || {}) } }),
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
  get: (period?: string, month?: string) => {
    return fetchAPI(`/leaderboard${buildQueryString({ period, month })}`);
  },
  getWithRange: (options: { period?: string; month?: string; start?: string; end?: string }) => {
    return fetchAPI(`/leaderboard${buildQueryString(options)}`);
  },
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
  getProfile: () => fetchAPI('/auth/profile'),
  updateProfile: (data: { name?: string; email?: string; phone?: string; class?: string; group?: string; avatar?: string }) =>
    fetchAPI('/auth/profile', { method: 'PATCH', body: data }),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchAPI('/auth/password', { method: 'PATCH', body: data }),
  updatePreferences: (data: {
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      examReminders?: boolean;
      resultAlerts?: boolean;
      leaderboardUpdates?: boolean;
    };
  }) => fetchAPI('/auth/preferences', { method: 'PATCH', body: data }),
};

// ============ USERS API ============
export const usersAPI = {
  list: (params?: Record<string, any>) => {
    const qs = params ? buildQueryString(params) : '';
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

// ============ COURSES API ============
export const coursesAPI = {
  getAll: (params?: Record<string, any>) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/courses${qs}`);
  },
  get: (id: string) => fetchAPI(`/courses/${id}`),
  create: (data: any) => fetchAPI('/courses', { method: 'POST', body: data }),
  update: (id: string, data: any) => fetchAPI(`/courses/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/courses/${id}`, { method: 'DELETE' }),
  getStudents: (courseId: string) => fetchAPI(`/courses/${courseId}/students`),
  addStudent: (courseId: string, data: { studentId: string; enrollmentDate?: string; status?: 'active' | 'pending' | 'hold' }) =>
    fetchAPI(`/courses/${courseId}/students`, { method: 'POST', body: data }),
  updateStudentStatus: (courseId: string, studentId: string, status: 'active' | 'pending' | 'hold') =>
    fetchAPI(`/courses/${courseId}/students/${studentId}/status`, { method: 'PATCH', body: { status } }),
  removeStudent: (courseId: string, studentId: string) => fetchAPI(`/courses/${courseId}/students/${studentId}`, { method: 'DELETE' }),
  linkExam: (courseId: string, examId: string) => fetchAPI(`/courses/${courseId}/exams`, { method: 'POST', body: { examId } }),
  unlinkExam: (courseId: string, examId: string) => fetchAPI(`/courses/${courseId}/exams/${examId}`, { method: 'DELETE' }),
  addMaterial: (courseId: string, data: { title: string; url: string; type?: 'link' | 'pdf' | 'video' | 'doc'; category?: string; description?: string }) =>
    fetchAPI(`/courses/${courseId}/materials`, { method: 'POST', body: data }),
  updateMaterial: (courseId: string, materialId: string, data: { title: string; url: string; type?: 'link' | 'pdf' | 'video' | 'doc'; category?: string; description?: string }) =>
    fetchAPI(`/courses/${courseId}/materials/${materialId}`, { method: 'PUT', body: data }),
  removeMaterial: (courseId: string, materialId: string) => fetchAPI(`/courses/${courseId}/materials/${materialId}`, { method: 'DELETE' }),
  addAnnouncement: (courseId: string, data: any) => fetchAPI(`/courses/${courseId}/announcements`, { method: 'POST', body: data }),
  updateAnnouncement: (courseId: string, announcementId: string, data: any) =>
    fetchAPI(`/courses/${courseId}/announcements/${announcementId}`, { method: 'PUT', body: data }),
  duplicateAnnouncement: (courseId: string, announcementId: string) =>
    fetchAPI(`/courses/${courseId}/announcements/${announcementId}/duplicate`, { method: 'POST' }),
  removeAnnouncement: (courseId: string, announcementId: string) =>
    fetchAPI(`/courses/${courseId}/announcements/${announcementId}`, { method: 'DELETE' }),
  generateInviteLink: (courseId: string) => fetchAPI(`/courses/${courseId}/invite-link`, { method: 'POST' }),
  joinByInviteToken: (token: string) => fetchAPI(`/courses/join/${token}`, { method: 'POST' }),
  listMyMaterials: () => fetchAPI('/courses/my/materials'),
  listMyEnrolled: () => fetchAPI('/courses/my/enrolled'),
  getCourseLeaderboard: (courseId: string, params?: { timeRange?: 'weekly' | 'monthly' | 'all'; type?: 'overall' | 'exams' | 'assignments' }) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/courses/${courseId}/leaderboard${qs}`);
  },
  listMyAnnouncements: () => fetchAPI('/courses/my/announcements'),
  markMyAnnouncementSeen: (courseId: string, announcementId: string) =>
    fetchAPI(`/courses/my/announcements/${courseId}/${announcementId}/seen`, { method: 'POST' }),
  toggleMyAnnouncementLike: (courseId: string, announcementId: string) =>
    fetchAPI(`/courses/my/announcements/${courseId}/${announcementId}/like`, { method: 'POST' }),
  getStudentPerformance: (courseId: string, studentId: string) => fetchAPI(`/courses/${courseId}/students/${studentId}/performance`),
  listMyAssignments: (params?: { search?: string; status?: 'all' | 'active' | 'closed' }) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/courses/my/assignments${qs}`);
  },
  getMyAssignment: (assignmentId: string) => fetchAPI(`/courses/my/assignments/${assignmentId}`),
  listAssignments: (courseId: string, params?: { search?: string; status?: 'draft' | 'active' | 'closed' | 'all' }) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/courses/${courseId}/assignments${qs}`);
  },
  createAssignment: (courseId: string, data: any) => fetchAPI(`/courses/${courseId}/assignments`, { method: 'POST', body: data }),
  uploadAssignmentAttachments: (courseId: string, assignmentId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/attachments`, { method: 'POST', body: formData });
  },
  submitAssignment: (courseId: string, assignmentId: string, data: { writtenAnswer?: string; attachments?: any[] }) =>
    fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/submit`, { method: 'POST', body: data }),
  updateAssignment: (courseId: string, assignmentId: string, data: any) =>
    fetchAPI(`/courses/${courseId}/assignments/${assignmentId}`, { method: 'PUT', body: data }),
  publishAssignment: (courseId: string, assignmentId: string) => fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/publish`, { method: 'PATCH' }),
  closeAssignment: (courseId: string, assignmentId: string) => fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/close`, { method: 'PATCH' }),
  deleteAssignment: (courseId: string, assignmentId: string) => fetchAPI(`/courses/${courseId}/assignments/${assignmentId}`, { method: 'DELETE' }),
  getAssignmentSubmissions: (courseId: string, assignmentId: string) => fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/submissions`),
  getStudentSubmission: (courseId: string, assignmentId: string, studentId: string) =>
    fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}`),
  gradeStudentSubmission: (courseId: string, assignmentId: string, studentId: string, data: { marks?: number; feedback?: string; returnToStudent?: boolean }) =>
    fetchAPI(`/courses/${courseId}/assignments/${assignmentId}/submissions/${studentId}/grade`, { method: 'PUT', body: data }),
};

// ============ ENROLLMENTS API ============
export const enrollmentsAPI = {
  getAll: (params?: Record<string, any>) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/enrollments${qs}`);
  },
  update: (id: string, data: { status?: 'active' | 'pending'; enrollmentDate?: string }) =>
    fetchAPI(`/enrollments/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => fetchAPI(`/enrollments/${id}`, { method: 'DELETE' }),
};

// ============ TEACHER API ============
export const teacherAPI = {
  getStudents: (params?: Record<string, any>) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/teacher/students${qs}`);
  },
  createStudent: (data: any) => fetchAPI('/teacher/students', { method: 'POST', body: data }),
  updateStudent: (id: string, data: any) => fetchAPI(`/teacher/students/${id}`, { method: 'PUT', body: data }),
  changeStudentStatus: (id: string, status: 'active' | 'inactive') =>
    fetchAPI(`/teacher/students/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteStudent: (id: string) => fetchAPI(`/teacher/students/${id}`, { method: 'DELETE' }),
};

// ============ MESSAGES API ============
export const messagesAPI = {
  listCourseMembers: (courseId: string) =>
    fetchAPI(`/messages/course-members${buildQueryString({ courseId })}`),
  listConversations: (params?: { search?: string }) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/messages/conversations${qs}`);
  },
  createConversation: (data: { studentId?: string; courseId?: string; text?: string; attachments?: any[] }) =>
    fetchAPI('/messages/conversations', { method: 'POST', body: data }),
  getMessages: (conversationId: string, params?: { limit?: number }) => {
    const qs = params ? buildQueryString(params) : '';
    return fetchAPI(`/messages/conversations/${conversationId}/messages${qs}`);
  },
  sendMessage: (conversationId: string, data: { text?: string; attachments?: any[] }) =>
    fetchAPI(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: data }),
  editMessage: (conversationId: string, messageId: string, data: { text: string }) =>
    fetchAPI(`/messages/conversations/${conversationId}/messages/${messageId}`, { method: 'PATCH', body: data }),
  deleteMessage: (conversationId: string, messageId: string, scope: 'me' | 'everyone') =>
    fetchAPI(`/messages/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE', body: { scope } }),
  markRead: (conversationId: string) =>
    fetchAPI(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),
  setTyping: (conversationId: string, isTyping: boolean) =>
    fetchAPI(`/messages/conversations/${conversationId}/typing`, { method: 'POST', body: { isTyping } }),
  setMute: (conversationId: string, muted: boolean) =>
    fetchAPI(`/messages/conversations/${conversationId}/mute`, { method: 'POST', body: { muted } }),
};

import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { clearToken, getToken } from './storage';

export type ApiError = { message: string; details?: unknown; status?: number };

let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

const client = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const message = error.response?.data?.message || 'Không thể kết nối tới máy chủ';
    const details = error.response?.data?.details || null;
    if (error.response?.status === 401) {
      await clearToken();
      unauthorizedHandler?.();
    }
    return Promise.reject({ message, details, status: error.response?.status } as ApiError);
  }
);

export const authApi = {
  login: (payload: { email: string; password: string }) => client.post('/auth/login', payload),
  register: (payload: Record<string, unknown>) => client.post('/auth/register', payload),
  me: () => client.get('/auth/me'),
  forgotPassword: (email: string) => client.post('/auth/forgot-password', { email }),
  resetPassword: (payload: { resetToken: string; newPassword: string }) =>
    client.post('/auth/reset-password', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    client.post('/auth/change-password', payload),
  logout: () => client.post('/auth/logout'),
};

export const userApi = {
  updateProfile: (payload: Record<string, unknown>) => client.patch('/users/me', payload),
  updateAvatar: (formData: FormData) =>
    client.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  searchStudents: (params?: Record<string, unknown>) => client.get('/users/students', { params }),
  publicProfile: (id: string) => client.get(`/users/students/${id}`),
  list: (params?: Record<string, unknown>) => client.get('/users', { params }),
  create: (payload: Record<string, unknown>) => client.post('/users', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/users/${id}`, payload),
  remove: (id: string) => client.delete(`/users/${id}`),
  registerPushToken: (token: string) => client.post('/users/me/push-token', { token }),
  removePushToken: (token: string) => client.delete('/users/me/push-token', { data: { token } }),
};

export const postApi = {
  list: (params?: Record<string, unknown>) => client.get('/posts', { params }),
  create: (payload: Record<string, unknown>) => client.post('/posts', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/posts/${id}`, payload),
  remove: (id: string) => client.delete(`/posts/${id}`),
  react: (id: string, payload: { type: string }) => client.post(`/posts/${id}/react`, payload),
  comments: (id: string, params?: Record<string, unknown>) =>
    client.get(`/posts/${id}/comments`, { params }),
  addComment: (id: string, content: string) => client.post(`/posts/${id}/comments`, { content }),
  removeComment: (id: string, commentId: string) =>
    client.delete(`/posts/${id}/comments/${commentId}`),
};

export const teamApi = {
  list: (params?: Record<string, unknown>) => client.get('/teams', { params }),
  mine: () => client.get('/teams/mine'),
  recommended: (params?: Record<string, unknown>) => client.get('/teams/recommended', { params }),
  recommendedTeammates: (id: string) => client.get(`/teams/${id}/recommended-teammates`),
  get: (id: string) => client.get(`/teams/${id}`),
  create: (payload: Record<string, unknown>) => client.post('/teams', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/teams/${id}`, payload),
  remove: (id: string) => client.delete(`/teams/${id}`),
  requestJoin: (id: string, payload: { message?: string }) =>
    client.post(`/teams/${id}/join-requests`, payload),
  leave: (id: string) => client.post(`/teams/${id}/leave`),
  removeMember: (id: string, userId: string) => client.delete(`/teams/${id}/members/${userId}`),
  teamRequests: (id: string, params?: Record<string, unknown>) =>
    client.get(`/teams/${id}/join-requests`, { params }),
  decideRequest: (requestId: string, payload: { decision: string }) =>
    client.patch(`/teams/join-requests/${requestId}`, payload),
  invite: (id: string, inviteeId: string) => client.post(`/teams/${id}/invitations`, { inviteeId }),
  messages: (id: string, params?: Record<string, unknown>) =>
    client.get(`/teams/${id}/messages`, { params }),
  sendMessage: (id: string, content: string) => client.post(`/teams/${id}/messages`, { content }),
  resources: (id: string) => client.get(`/teams/${id}/resources`),
  uploadFile: (id: string, formData: FormData) =>
    client.post(`/teams/${id}/resources/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addLink: (id: string, payload: { title: string; linkUrl: string }) =>
    client.post(`/teams/${id}/resources/links`, payload),
  removeResource: (id: string, resourceId: string) =>
    client.delete(`/teams/${id}/resources/${resourceId}`),
};

export const materialApi = {
  list: (params?: Record<string, unknown>) => client.get('/materials', { params }),
  upload: (formData: FormData) =>
    client.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id: string) => client.post(`/materials/${id}/download`),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/materials/${id}`, payload),
  remove: (id: string) => client.delete(`/materials/${id}`),
};

export const courseApi = {
  list: (params?: Record<string, unknown>) => client.get('/courses', { params }),
  get: (id: string) => client.get(`/courses/${id}`),
  create: (payload: Record<string, unknown>) => client.post('/courses', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/courses/${id}`, payload),
  remove: (id: string) => client.delete(`/courses/${id}`),
  enroll: (id: string) => client.post(`/courses/${id}/enroll`),
  unenroll: (id: string) => client.delete(`/courses/${id}/enroll`),
  roster: (id: string) => client.get(`/courses/${id}/roster`),
  gradebook: (id: string) => client.get(`/courses/${id}/gradebook`),
  analytics: (id: string) => client.get(`/courses/${id}/analytics`),
};

export const lessonApi = {
  list: (courseId: string) => client.get('/lessons', { params: { course: courseId } }),
  create: (payload: Record<string, unknown>) => client.post('/lessons', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/lessons/${id}`, payload),
  remove: (id: string) => client.delete(`/lessons/${id}`),
  complete: (id: string) => client.post(`/lessons/${id}/complete`),
  uncomplete: (id: string) => client.delete(`/lessons/${id}/complete`),
};

export const calendarApi = {
  upcoming: () => client.get('/calendar/upcoming'),
};

export const gamificationApi = {
  leaderboard: () => client.get('/gamification/leaderboard'),
};

export const searchApi = {
  global: (q: string) => client.get('/search', { params: { q } }),
};

export const eventApi = {
  get: (id: string) => client.get(`/posts/${id}`),
  register: (id: string) => client.post(`/posts/${id}/registrations`),
  cancel: (id: string) => client.delete(`/posts/${id}/registrations/me`),
  participants: (id: string, params?: Record<string, unknown>) =>
    client.get(`/posts/${id}/participants`, { params }),
  removeParticipant: (id: string, userId: string) => client.delete(`/posts/${id}/participants/${userId}`),
};

export const assignmentApi = {
  list: (params?: Record<string, unknown>) => client.get('/assignments', { params }),
  get: (id: string) => client.get(`/assignments/${id}`),
  create: (payload: Record<string, unknown>) => client.post('/assignments', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/assignments/${id}`, payload),
  remove: (id: string) => client.delete(`/assignments/${id}`),
  submit: (id: string, formData: FormData) =>
    client.post(`/assignments/${id}/submissions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submissions: (id: string) => client.get(`/assignments/${id}/submissions`),
  grade: (id: string, submissionId: string, payload: { score: number; feedback?: string }) =>
    client.post(`/assignments/${id}/submissions/${submissionId}/grade`, payload),
  myGradebook: () => client.get('/assignments/gradebook/mine'),
};

export const announcementApi = {
  list: (params?: Record<string, unknown>) => client.get('/announcements', { params }),
  create: (payload: Record<string, unknown>) => client.post('/announcements', payload),
  broadcast: (payload: Record<string, unknown>) => client.post('/announcements/broadcast', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/announcements/${id}`, payload),
  remove: (id: string) => client.delete(`/announcements/${id}`),
};

export const quizApi = {
  list: (params?: Record<string, unknown>) => client.get('/quizzes', { params }),
  get: (id: string) => client.get(`/quizzes/${id}`),
  create: (payload: Record<string, unknown>) => client.post('/quizzes', payload),
  update: (id: string, payload: Record<string, unknown>) => client.patch(`/quizzes/${id}`, payload),
  remove: (id: string) => client.delete(`/quizzes/${id}`),
  submit: (id: string, payload: { answers: number[][] }) => client.post(`/quizzes/${id}/attempts`, payload),
  myAttempts: (params?: Record<string, unknown>) => client.get('/quizzes/attempts/mine', { params }),
  import: (formData: FormData) => client.post('/quizzes/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  template: () => client.get('/quizzes/import-template', { responseType: 'arraybuffer' }),
  sample: () => client.get('/quizzes/import-sample', { responseType: 'arraybuffer' }),
};

export const notificationApi = {
  list: (params?: Record<string, unknown>) => client.get('/notifications', { params }),
  send: (payload: Record<string, unknown>) => client.post('/notifications/send', payload),
  markAllRead: () => client.post('/notifications/read-all'),
  markRead: (id: string) => client.post(`/notifications/${id}/read`),
};

export const invitationApi = {
  mine: (params?: Record<string, unknown>) => client.get('/team-invitations/mine', { params }),
  accept: (id: string) => client.post(`/team-invitations/${id}/accept`),
  reject: (id: string) => client.post(`/team-invitations/${id}/reject`),
};

export const joinRequestApi = {
  mine: (params?: Record<string, unknown>) => client.get('/join-requests/mine', { params }),
  cancel: (requestId: string) => client.post(`/join-requests/${requestId}/cancel`),
};

export const adminApi = {
  stats: () => client.get('/admin/stats'),
  activity: () => client.get('/admin/activity'),
  reports: (params?: Record<string, unknown>) => client.get('/admin/reports', { params }),
  settings: () => client.get('/admin/settings'),
  updateSettings: (payload: Record<string, unknown>) => client.patch('/admin/settings', payload),
  clubs: (params?: Record<string, unknown>) => client.get('/admin/clubs', { params }),
  createClub: (payload: Record<string, unknown>) => client.post('/admin/clubs', payload),
  updateClub: (id: string, payload: Record<string, unknown>) => client.patch(`/admin/clubs/${id}`, payload),
  removeClub: (id: string) => client.delete(`/admin/clubs/${id}`),
  clubRegistrations: (params?: Record<string, unknown>) => client.get('/admin/club-registrations', { params }),
  approveClubRegistration: (id: string) => client.post(`/admin/club-registrations/${id}/approve`),
  rejectClubRegistration: (id: string, rejectionReason: string) =>
    client.post(`/admin/club-registrations/${id}/reject`, { rejectionReason }),
  taxonomies: (params?: Record<string, unknown>) => client.get('/admin/taxonomies', { params }),
  createTaxonomy: (payload: Record<string, unknown>) => client.post('/admin/taxonomies', payload),
  updateTaxonomy: (id: string, payload: Record<string, unknown>) => client.patch(`/admin/taxonomies/${id}`, payload),
  removeTaxonomy: (id: string) => client.delete(`/admin/taxonomies/${id}`),
};

export default client;

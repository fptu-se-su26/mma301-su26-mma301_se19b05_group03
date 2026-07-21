import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? extra.apiBaseUrl ?? 'http://localhost:5000/api';

export const UPLOADS_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return '';
  if (/^https?:\/\//.test(fileUrl)) return fileUrl;
  return `${UPLOADS_ORIGIN}${fileUrl}`;
};

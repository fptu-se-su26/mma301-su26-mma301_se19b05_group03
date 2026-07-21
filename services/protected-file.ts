import * as WebBrowser from 'expo-web-browser';

import { resolveFileUrl } from '@/constants/config';

import { getToken } from './storage';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return globalThis.btoa(binary);
};

export const openProtectedFile = async (fileUrl?: string | null) => {
  const url = resolveFileUrl(fileUrl);
  if (!url) return;

  const token = await getToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Không thể mở tệp (${response.status}).`);

  const contentType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
  const base64 = arrayBufferToBase64(await response.arrayBuffer());
  await WebBrowser.openBrowserAsync(`data:${contentType};base64,${base64}`);
};

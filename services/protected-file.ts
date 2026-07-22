import { Directory, File, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';

import { resolveFileUrl } from '@/constants/config';

import { getToken } from './storage';

const extensionFor = (contentType: string) => {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
  };
  return extensions[contentType] || '';
};

const fileNameFromResponse = (contentDisposition: string | null, fallbackName: string, contentType: string) => {
  const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const regular = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  const headerName = encoded ? decodeURIComponent(encoded) : regular;
  const safeName = (headerName || fallbackName || `tai-lieu${extensionFor(contentType)}`)
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
  return /\.[a-z0-9]{2,5}$/i.test(safeName) ? safeName : `${safeName}${extensionFor(contentType)}`;
};

export const openProtectedFile = async (fileUrl?: string | null, fallbackName = 'tai-lieu') => {
  const url = resolveFileUrl(fileUrl);
  if (!url) return;

  const token = await getToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Không thể mở tệp (${response.status}).`);

  const contentType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
  const downloads = new Directory(Paths.cache, 'downloads');
  downloads.create({ idempotent: true, intermediates: true });
  const file = new File(
    downloads,
    fileNameFromResponse(response.headers.get('content-disposition'), fallbackName, contentType)
  );
  file.create({ overwrite: true, intermediates: true });
  file.write(await response.bytes());

  if (!(await Sharing.isAvailableAsync())) throw new Error('Thiết bị không hỗ trợ mở tệp.');
  await Sharing.shareAsync(file.uri, { mimeType: contentType, dialogTitle: 'Mở tài liệu bằng' });
};

import { getAccessToken } from '../auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

async function driveFetch<T>(endpoint: string): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${DRIVE_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API do Drive: ${response.status}`);
  }

  return response.json();
}

export async function listFolders(parentId?: string): Promise<DriveFolder[]> {
  let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const data = await driveFetch<{
    files: DriveFolder[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&orderBy=name`);

  return data.files;
}

export async function listMp3Files(folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and (mimeType='audio/mpeg' or name contains '.mp3') and trashed=false`;

  const data = await driveFetch<{
    files: DriveFile[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&orderBy=name`);

  return data.files;
}

export function getAudioUrl(fileId: string): string {
  return `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
}

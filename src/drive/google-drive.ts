import { getAccessToken } from '../auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}

export interface TrackMetadata {
  artist?: string;
  album?: string;
  title?: string;
  trackNumber?: number;
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
  } else {
    query += " and 'root' in parents";
  }

  const data = await driveFetch<{
    files: DriveFolder[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=name&pageSize=100`);

  return data.files || [];
}

export async function listMp3Files(folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and (mimeType='audio/mpeg' or name contains '.mp3') and trashed=false`;

  const data = await driveFetch<{
    files: DriveFile[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name`);

  return data.files || [];
}

export interface FolderContents {
  folders: DriveFolder[];
  files: DriveFile[];
}

export async function listFolderContents(folderId: string): Promise<FolderContents> {
  const query = `'${folderId}' in parents and trashed=false`;

  const data = await driveFetch<{
    files: (DriveFolder | DriveFile)[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name&pageSize=1000`);

  const allFiles = data.files || [];
  const folders: DriveFolder[] = [];
  const files: DriveFile[] = [];

  for (const item of allFiles) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      folders.push(item as DriveFolder);
    } else if (item.mimeType === 'audio/mpeg' || item.name.toLowerCase().endsWith('.mp3')) {
      files.push(item as DriveFile);
    }
  }

  return { folders, files };
}

export async function listRootFolderContents(): Promise<FolderContents> {
  const query = "'root' in parents and trashed=false";

  const data = await driveFetch<{
    files: (DriveFolder | DriveFile)[];
  }>(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name&pageSize=1000`);

  const allFiles = data.files || [];
  const folders: DriveFolder[] = [];
  const files: DriveFile[] = [];

  for (const item of allFiles) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      folders.push(item as DriveFolder);
    } else if (item.mimeType === 'audio/mpeg' || item.name.toLowerCase().endsWith('.mp3')) {
      files.push(item as DriveFile);
    }
  }

  return { folders, files };
}

export function getAudioUrl(fileId: string): string {
  return `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
}

export function extractMetadata(filename: string): TrackMetadata {
  const nameWithoutExt = filename.replace(/\.(mp3|MP3|wav|flac)$/i, '');
  
  let artist: string | undefined;
  let album: string | undefined;
  let title: string | undefined;
  let trackNumber: number | undefined;

  const trackNumberMatch = nameWithoutExt.match(/^(\d{1,3})\s*[-.\s]\s*/);
  if (trackNumberMatch) {
    trackNumber = parseInt(trackNumberMatch[1], 10);
  }

  let nameWithoutTrack = nameWithoutExt;
  if (trackNumberMatch) {
    nameWithoutTrack = nameWithoutExt.substring(trackNumberMatch[0].length);
  }

  const bracketMatch = nameWithoutTrack.match(/^\[(.*?)\]\s*/);
  if (bracketMatch) {
    album = bracketMatch[1];
    const afterBracket = nameWithoutTrack.substring(bracketMatch[0].length);
    const bracketParts = afterBracket.split(' - ').map(p => p.trim());
    if (bracketParts.length >= 2) {
      artist = bracketParts[0];
      title = bracketParts.slice(1).join(' - ');
    } else {
      title = bracketParts[0];
    }
  } else {
    const parts = nameWithoutTrack.split(' - ').map(p => p.trim());
    
    if (parts.length >= 3) {
      artist = parts[0];
      album = parts[1];
      title = parts.slice(2).join(' - ');
    } else if (parts.length === 2) {
      artist = parts[0];
      title = parts[1];
    } else {
      title = parts[0];
    }
  }

  return {
    artist: artist || undefined,
    album: album || undefined,
    title: title || nameWithoutExt,
    trackNumber: trackNumber || undefined,
  };
}

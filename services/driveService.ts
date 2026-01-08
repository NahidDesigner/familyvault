
import { StorageConfig } from '../types';

export async function uploadFileToDrive(file: File, config: StorageConfig): Promise<string> {
  if (!config.folderId || !config.apiKey) {
    throw new Error("Google Drive configuration missing (Folder ID or API Key).");
  }

  const metadata = {
    name: file.name,
    parents: [config.folderId],
    mimeType: file.type,
  };

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', file);

  // Note: API Keys have limited write capabilities. 
  // For production-grade apps, OAuth2 or a Service Account proxy is required.
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${config.apiKey}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication failed. Drive uploads usually require OAuth2. Please check your API Key permissions.");
    }
    throw new Error(error.error?.message || "Drive upload failed");
  }

  const result = await response.json();
  return result.id;
}

export function getDrivePreviewUrl(fileId: string): string {
  if (!fileId) return '';
  // thumbnail endpoint is generally more reliable for public previewing
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

export function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

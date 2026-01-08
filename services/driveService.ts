
import { StorageConfig } from '../types';

export async function uploadFileToDrive(file: File, config: StorageConfig): Promise<string> {
  if (!config.folderId || !config.apiKey) {
    throw new Error("Google Drive configuration missing (Folder ID or API Key). Check Configuration tab.");
  }

  const metadata = {
    name: file.name,
    parents: [config.folderId],
    mimeType: file.type,
  };

  // Constructing a manual multipart body to ensure strict compatibility with Google Drive API v3
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const reader = new FileReader();
  const fileContentPromise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      // Get base64 string
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
  reader.readAsDataURL(file);
  const base64Data = await fileContentPromise;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + file.type + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    console.error("Google Drive API Error:", error);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error("Access Denied: Google Drive API Keys can usually only READ public data. For UPLOADS, ensure your API Key has the correct permissions or the folder is set to 'Anyone with link can EDIT'.");
    }
    throw new Error(error.error?.message || `Upload failed (${response.status})`);
  }

  const result = await response.json();
  return result.id;
}

export function getDrivePreviewUrl(fileId: string): string {
  if (!fileId) return '';
  // Use the thumbnail endpoint which works better for public links
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

export function getDriveDownloadUrl(fileId: string): string {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

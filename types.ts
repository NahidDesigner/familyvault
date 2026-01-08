
export interface CloudUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'admin' | 'user';
  pin: string;
}

export interface StorageConfig {
  provider: 'google';
  email?: string;
  apiKey?: string;
  folderId?: string;
}

export interface DatabaseConfig {
  provider: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface CloudConfig {
  brandName: string;
  storage: StorageConfig;
  database: DatabaseConfig;
  isActive: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  fileName: string;
  userId: string;
  userName: string;
  timestamp: number;
  size: number;
  aiDescription?: string;
  tags?: string[];
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
}

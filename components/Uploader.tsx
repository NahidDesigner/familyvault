
import React, { useState, useRef } from 'react';
import { CloudUser, MediaItem, UploadProgress, CloudConfig } from '../types';
import { analyzeMedia } from '../services/geminiService';
import { uploadFileToDrive } from '../services/driveService';

interface UploaderProps {
  user: CloudUser;
  config: CloudConfig;
  onUploadComplete: (item: MediaItem) => void;
}

const Uploader: React.FC<UploaderProps> = ({ user, config, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check config
    if (!config.storage.folderId || !config.storage.apiKey) {
      alert("Please set Google Drive Folder ID and API Key in Admin Settings first!");
      return;
    }

    setIsUploading(true);
    setCurrentUpload({
      fileName: file.name,
      progress: 5,
      status: 'uploading'
    });

    try {
      // 1. Upload to Google Drive
      setCurrentUpload(prev => prev ? { ...prev, progress: 20 } : null);
      const fileId = await uploadFileToDrive(file, config.storage);
      
      // 2. Prepare for AI Analysis
      setCurrentUpload(prev => prev ? { ...prev, progress: 60, status: 'analyzing' } : null);
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      let aiMetadata = { 
        description: file.name, 
        tags: file.type.startsWith('video/') ? ['Video'] : ['Gallery'] 
      };
      
      if (file.type.startsWith('image/')) {
        try {
          aiMetadata = await analyzeMedia(base64Data, file.type);
        } catch (aiErr) {
          console.error("AI analysis step failed", aiErr);
        }
      }

      setCurrentUpload(prev => prev ? { ...prev, progress: 95, status: 'completed' } : null);

      const newItem: MediaItem = {
        id: fileId, // Use the Drive File ID as the primary ID
        url: fileId, // Store just the ID, Gallery will format it
        type: file.type.startsWith('video/') ? 'video' : 'image',
        fileName: file.name,
        userId: user.id,
        userName: user.name,
        timestamp: Date.now(),
        size: file.size,
        aiDescription: aiMetadata.description,
        tags: aiMetadata.tags
      };

      onUploadComplete(newItem);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setTimeout(() => {
        setIsUploading(false);
        setCurrentUpload(null);
      }, 500);

    } catch (error: any) {
      console.error("Upload failed", error);
      alert(`Upload Failed: ${error.message}`);
      setCurrentUpload(prev => prev ? { ...prev, status: 'error', progress: 0 } : null);
      setTimeout(() => {
        setIsUploading(false);
        setCurrentUpload(null);
      }, 2000);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative rounded-[22px] p-10 flex flex-col items-center justify-center gap-5 transition-all ios-shadow ios-border bg-white
          ${isUploading ? '' : 'ios-active'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/*, video/*"
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {isUploading ? (
          <div className="w-full max-w-xs text-center">
            <div className="mb-4">
              <div className="flex justify-between text-[13px] font-semibold text-[#8E8E93] mb-2 tracking-tight">
                <span>
                  {currentUpload?.status === 'uploading' ? 'Sending to Cloud...' : 
                   currentUpload?.status === 'analyzing' ? 'AI Analyzing...' : 'Finishing...'}
                </span>
                <span className="text-[#007AFF]">{currentUpload?.progress}%</span>
              </div>
              <div className="w-full bg-[#E3E3E8] rounded-full h-[6px] overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${currentUpload?.status === 'error' ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}`} 
                  style={{ width: `${currentUpload?.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg shadow-[#007AFF]/25 text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-black font-bold text-[19px] tracking-tight">Upload Media</p>
              <p className="text-[#8E8E93] text-[15px] font-medium mt-0.5 tracking-tight">Photos and videos</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Uploader;

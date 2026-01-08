
import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import { getDrivePreviewUrl, getDriveDownloadUrl } from '../services/driveService';

interface GalleryProps {
  items: MediaItem[];
  onDelete: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ items, onDelete }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = getDriveDownloadUrl(item.url); // item.url stores the Drive ID
    link.download = item.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextItem = () => {
    if (selectedIdx !== null) setSelectedIdx((selectedIdx + 1) % items.length);
  };

  const prevItem = () => {
    if (selectedIdx !== null) setSelectedIdx((selectedIdx - 1 + items.length) % items.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft') prevItem();
      if (e.key === 'Escape') setSelectedIdx(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx]);

  if (items.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-[#8E8E93]">
        <svg className="w-16 h-16 mb-4 opacity-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-semibold text-black/30 tracking-tight">Empty Library</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 px-0.5">
        {items.map((item, index) => {
          const previewUrl = getDrivePreviewUrl(item.url);
          return (
            <div 
              key={item.id} 
              className="relative aspect-square overflow-hidden ios-border bg-black/5 cursor-pointer ios-active" 
              onClick={() => setSelectedIdx(index)}
            >
              {item.type === 'image' ? (
                <img src={previewUrl} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full relative">
                  <video src={previewUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <div className="w-8 h-8 flex items-center justify-center text-white/90">
                      <svg className="w-full h-full fill-current drop-shadow-md" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                    </div>
                  </div>
                </div>
              )}
              
              {item.type === 'video' && (
                <div className="absolute top-1.5 right-1.5 text-white/80">
                  <svg className="w-3.5 h-3.5 fill-current drop-shadow-sm" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-300">
          <div className="ios-blur bg-white/75 border-b border-black/10 h-11 flex items-center justify-between px-4 sticky top-0 z-10 safe-top">
            <button onClick={() => setSelectedIdx(null)} className="text-[#007AFF] text-[17px] font-normal ios-active">Done</button>
            <div className="flex flex-col items-center">
              <p className="text-[13px] font-bold text-black leading-tight tracking-tight">{items[selectedIdx].userName}</p>
              <p className="text-[11px] text-[#8E8E93] font-medium tracking-tight">
                {new Date(items[selectedIdx].timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => handleDownload(items[selectedIdx])} className="text-[#007AFF] ios-active">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button onClick={() => onDelete(items[selectedIdx].id)} className="text-[#FF3B30] ios-active">
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-white relative overflow-hidden">
            <button onClick={prevItem} className="absolute left-4 z-20 text-black/10 hover:text-[#007AFF] transition-colors hidden md:block">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            {items[selectedIdx].type === 'image' ? (
              <img src={getDrivePreviewUrl(items[selectedIdx].url)} className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-500" />
            ) : (
              <video src={getDrivePreviewUrl(items[selectedIdx].url)} className="max-w-full max-h-full" controls autoPlay />
            )}

            <button onClick={nextItem} className="absolute right-4 z-20 text-black/10 hover:text-[#007AFF] transition-colors hidden md:block">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <div className="p-8 bg-white safe-bottom border-t border-black/5 text-center">
             <h4 className="font-bold text-[17px] text-black mb-1 tracking-tight">{items[selectedIdx].aiDescription || items[selectedIdx].fileName}</h4>
             <div className="flex justify-center flex-wrap gap-2 mt-2">
                {items[selectedIdx].tags?.map(t => (
                  <span key={t} className="text-[#007AFF] text-[13px] font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;

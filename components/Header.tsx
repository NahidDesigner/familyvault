
import React from 'react';
import { CloudUser } from '../types';

interface HeaderProps {
  user: CloudUser;
  onLogout: () => void;
  brandName: string;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, brandName }) => {
  return (
    <header className="sticky top-0 z-40 ios-blur bg-white/70 border-b border-black/10">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <button 
          onClick={onLogout}
          className="text-[#007AFF] text-[17px] font-normal flex items-center gap-1 active:opacity-50 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Profiles
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-[17px] text-black truncate max-w-[150px]">
          {brandName}
        </h1>

        <div className="flex items-center gap-2">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-7 h-7 rounded-full object-cover border border-black/5" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

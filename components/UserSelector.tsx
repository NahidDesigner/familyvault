
import React, { useState } from 'react';
import { CloudUser } from '../types';

interface UserSelectorProps {
  users: CloudUser[];
  onSelect: (user: CloudUser) => void;
  brandName: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ users, onSelect, brandName }) => {
  const [selectedUser, setSelectedUser] = useState<CloudUser | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      onSelect(selectedUser);
    } else {
      setError('ভুল পিন দিয়েছেন!');
      setPin('');
    }
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center p-8 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 rounded-[22.5%] overflow-hidden ios-shadow ios-border mb-6 bg-white">
          <img src={selectedUser.avatar} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-[28px] font-bold text-black mb-1 tracking-tight">{selectedUser.name}</h2>
        <p className="text-[#8E8E93] text-[16px] font-medium mb-12 tracking-tight">Enter Passcode</p>

        <form onSubmit={handleLogin} className="w-full max-w-[280px] space-y-8">
          <div className="relative">
            <input 
              type="password"
              maxLength={4}
              autoFocus
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-[40px] tracking-[1em] font-medium bg-transparent outline-none caret-transparent"
              placeholder="••••"
            />
            {error && <p className="text-[#FF3B30] text-center text-[14px] font-semibold mt-4">{error}</p>}
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              type="submit"
              className="w-full bg-[#007AFF] text-white text-[17px] font-bold py-4 rounded-[14px] ios-active shadow-xl shadow-[#007AFF]/20"
            >
              Unlock Vault
            </button>
            <button 
              type="button"
              onClick={() => { setSelectedUser(null); setError(''); }}
              className="text-[#007AFF] text-[17px] font-medium py-2 ios-active"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 pt-20 animate-in fade-in duration-700">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center bg-[#007AFF] w-[84px] h-[84px] rounded-[22.5%] ios-shadow mb-6 ios-border shadow-2xl shadow-[#007AFF]/20">
             <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-[34px] font-extrabold text-black tracking-tight leading-tight truncate px-4">
            {brandName}
          </h1>
          <p className="text-[#8E8E93] mt-1 text-[17px] font-medium tracking-tight">Select profile</p>
        </div>

        <div className="grid grid-cols-2 gap-10 px-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="flex flex-col items-center group ios-active"
            >
              <div className="w-[88px] h-[88px] rounded-[22.5%] overflow-hidden mb-4 bg-white ios-border ios-shadow group-hover:scale-105 transition-transform duration-300">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[17px] font-bold text-black tracking-tight">{user.name}</span>
              <span className="text-[12px] text-[#8E8E93] font-bold uppercase tracking-[0.05em] mt-0.5">{user.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserSelector;

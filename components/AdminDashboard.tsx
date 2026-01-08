
import React, { useState, useRef } from 'react';
import { CloudUser, CloudConfig } from '../types';
import { ROOT_ADMIN_ID } from '../constants';
import { uploadFileToDrive, getDrivePreviewUrl } from '../services/driveService';

interface AdminDashboardProps {
  users: CloudUser[];
  config: CloudConfig;
  onAddUser: (user: CloudUser) => void;
  onDeleteUser: (userId: string) => void;
  onSaveConfig: (config: CloudConfig) => void;
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, config, onAddUser, onDeleteUser, onSaveConfig, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'cloud'>('users');
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'drive' | 'supabase'>('drive');
  const [copied, setCopied] = useState(false);
  
  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<CloudConfig>(config);

  const sqlCode = `CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  color TEXT,
  role TEXT,
  pin TEXT
);

CREATE TABLE media_items (
  id TEXT PRIMARY KEY,
  url TEXT,
  type TEXT,
  fileName TEXT,
  userId TEXT,
  userName TEXT,
  timestamp BIGINT,
  size BIGINT,
  aiDescription TEXT,
  tags TEXT[]
);`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEditUser = (user: CloudUser) => {
    setEditingUserId(user.id);
    setName(user.name);
    setPin(user.pin);
    setAvatar(user.avatar);
    setActiveTab('users');
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setName('');
    setPin('');
    setAvatar('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!settings.storage.folderId || !settings.storage.apiKey) {
      alert("Please go to the 'Configuration' tab and set your Google Drive Folder ID and API Key first.");
      setActiveTab('cloud');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setIsAvatarUploading(true);
    try {
      const fileId = await uploadFileToDrive(file, settings.storage);
      const previewUrl = getDrivePreviewUrl(fileId);
      setAvatar(previewUrl);
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      alert(error.message);
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length < 4) return;
    
    onAddUser({
      id: editingUserId || crypto.randomUUID(),
      name, 
      pin, 
      role: editingUserId === ROOT_ADMIN_ID ? 'admin' : 'user',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      color: 'bg-slate-500'
    });
    resetUserForm();
  };

  const handleSave = () => {
    onSaveConfig({ ...settings, isActive: true });
    onClose();
  };

  const inputClasses = "flex-1 bg-transparent outline-none text-[17px] text-black placeholder:text-[#C7C7CC] appearance-none py-1";
  const labelClasses = "w-32 text-[17px] font-normal text-black";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <div className="bg-[#F2F2F7] w-full max-w-lg rounded-t-[30px] sm:rounded-[30px] ios-shadow flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-black/5 bg-white/50 ios-blur sticky top-0 z-10">
          <button onClick={onClose} className="text-[#007AFF] text-[17px] active:opacity-50">Cancel</button>
          <h2 className="font-bold text-[17px]">Settings</h2>
          <button onClick={handleSave} className="text-[#007AFF] font-bold text-[17px] active:opacity-50">Done</button>
        </div>

        <div className="p-4 flex bg-white/50 border-b border-black/5">
          <div className="bg-[#E3E3E8] p-1 rounded-[10px] flex w-full">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
            >
              Accounts
            </button>
            <button 
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all ${activeTab === 'cloud' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
            >
              Configuration
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-12">
          {activeTab === 'users' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl overflow-hidden border border-black/5">
                <div className="px-4 py-2 bg-[#F2F2F7]/50 border-b border-black/5">
                    <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        {editingUserId ? 'Edit Profile' : 'Add New Member'}
                    </p>
                </div>
                <form onSubmit={handleSubmitUser} className="divide-y divide-black/5">
                  <div className="px-4 py-3 flex items-center">
                    <span className={labelClasses}>Name</span>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Required" />
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className={labelClasses}>PIN / Password</span>
                    <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} className={inputClasses} placeholder="4 Digits Only" />
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4">
                    <span className={labelClasses}>Avatar</span>
                    <div className="flex-1 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#F2F2F7] border border-black/5 overflow-hidden flex-shrink-0 relative">
                            {avatar ? (
                                <img src={avatar} className="w-full h-full object-cover" key={avatar} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                            )}
                            {isAvatarUploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <button 
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="text-[#007AFF] text-[15px] font-semibold text-left active:opacity-50"
                                disabled={isAvatarUploading}
                            >
                                {isAvatarUploading ? 'Uploading...' : avatar ? 'Change Image' : 'Upload Image'}
                            </button>
                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                onChange={handleAvatarFileChange} 
                                className="hidden" 
                                accept="image/*"
                            />
                            <p className="text-[11px] text-[#8E8E93] leading-tight max-w-[150px] truncate">
                              {avatar ? 'Upload successful' : 'Using default avatar'}
                            </p>
                        </div>
                    </div>
                  </div>
                  <div className="flex divide-x divide-black/5">
                      <button 
                        type="submit" 
                        disabled={isAvatarUploading}
                        className="flex-1 text-center py-3 text-[#007AFF] font-semibold text-[17px] active:bg-[#F2F2F7] disabled:opacity-50"
                      >
                          {editingUserId ? 'Update User' : 'Add Member'}
                      </button>
                      {editingUserId && (
                          <button type="button" onClick={resetUserForm} className="px-6 text-center py-3 text-[#8E8E93] font-medium text-[15px] active:bg-[#F2F2F7]">
                              Cancel
                          </button>
                      )}
                  </div>
                </form>
              </div>

              <div className="space-y-2">
                <p className="px-4 text-[13px] text-[#8E8E93] uppercase font-medium">Family Members</p>
                <div className="bg-white rounded-2xl overflow-hidden border border-black/5 divide-y divide-black/5">
                  {users.map(u => (
                    <div key={u.id} className="px-4 py-3 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-10 h-10 rounded-lg bg-[#F2F2F7] border border-black/5 object-cover" />
                        <div>
                            <p className="font-semibold text-[17px] leading-tight">{u.name}</p>
                            <p className="text-[12px] text-[#8E8E93] uppercase font-bold tracking-tight">{u.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleEditUser(u)} className="text-[#007AFF] text-sm font-medium active:opacity-50">Edit</button>
                        {u.id !== ROOT_ADMIN_ID && (
                            <button onClick={() => onDeleteUser(u.id)} className="text-[#FF3B30] text-sm active:opacity-50">Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
               {/* Branding Section */}
               <div className="space-y-2">
                 <p className="px-4 text-[13px] text-[#8E8E93] uppercase font-medium">Appearance Settings</p>
                 <div className="bg-white rounded-2xl overflow-hidden border border-black/5">
                    <div className="px-4 py-3 flex items-center">
                      <span className={labelClasses}>App Name</span>
                      <input 
                        type="text" 
                        value={settings.brandName} 
                        onChange={e => setSettings({...settings, brandName: e.target.value})} 
                        className={inputClasses} 
                        placeholder="e.g. Shared Cloud" 
                      />
                    </div>
                 </div>
               </div>

               {/* Storage Section */}
               <div className="space-y-2">
                 <p className="px-4 text-[13px] text-[#8E8E93] uppercase font-medium">Cloud Storage (Google Drive)</p>
                 <div className="bg-white rounded-2xl overflow-hidden border border-black/5 divide-y divide-black/5">
                    <div className="px-4 py-3 flex items-center">
                      <span className={labelClasses}>Folder ID</span>
                      <input 
                        type="text" 
                        value={settings.storage.folderId} 
                        onChange={e => setSettings({...settings, storage: {...settings.storage, folderId: e.target.value}})} 
                        className={inputClasses} 
                        placeholder="ID from URL" 
                      />
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <span className={labelClasses}>API Key</span>
                      <input 
                        type="password" 
                        value={settings.storage.apiKey} 
                        onChange={e => setSettings({...settings, storage: {...settings.storage, apiKey: e.target.value}})} 
                        className={inputClasses} 
                        placeholder="GCP API Key" 
                      />
                    </div>
                 </div>
               </div>

               {/* Database Section */}
               <div className="space-y-2">
                 <div className="flex justify-between items-center px-4">
                    <p className="text-[13px] text-[#8E8E93] uppercase font-medium">Metadata Sync (Supabase)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#8E8E93]">ENABLE</span>
                      <input 
                        type="checkbox" 
                        checked={settings.database.provider === 'supabase'} 
                        onChange={e => setSettings({...settings, database: {...settings.database, provider: e.target.checked ? 'supabase' : 'local'}})}
                        className="w-5 h-5 accent-[#007AFF]"
                      />
                    </div>
                 </div>
                 
                 {settings.database.provider === 'supabase' && (
                    <div className="bg-white rounded-2xl overflow-hidden border border-black/5 divide-y divide-black/5 animate-in slide-in-from-top-2">
                      <div className="px-4 py-3 flex items-center">
                        <span className={labelClasses}>Project URL</span>
                        <input 
                          type="text" 
                          value={settings.database.supabaseUrl} 
                          onChange={e => setSettings({...settings, database: {...settings.database, supabaseUrl: e.target.value}})} 
                          className={inputClasses} 
                          placeholder="https://xyz.supabase.co" 
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center">
                        <span className={labelClasses}>Anon Key</span>
                        <input 
                          type="password" 
                          value={settings.database.supabaseAnonKey} 
                          onChange={e => setSettings({...settings, database: {...settings.database, supabaseAnonKey: e.target.value}})} 
                          className={inputClasses} 
                          placeholder="Required" 
                        />
                      </div>
                    </div>
                 )}
               </div>
               
               <div className="space-y-4 pt-4">
                  <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full text-center text-[#007AFF] text-[17px] font-medium ios-active"
                  >
                    {showGuide ? 'Hide Help' : 'Cloud Setup Instructions'}
                  </button>

                  {showGuide && (
                    <div className="space-y-6 animate-in slide-in-from-top-2">
                      {/* Help Tabs */}
                      <div className="bg-[#E3E3E8] p-0.5 rounded-[8px] flex text-[11px] font-bold">
                        <button 
                          onClick={() => setActiveGuideTab('drive')}
                          className={`flex-1 py-1 rounded-[6px] transition-all ${activeGuideTab === 'drive' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                        >
                          GOOGLE DRIVE
                        </button>
                        <button 
                          onClick={() => setActiveGuideTab('supabase')}
                          className={`flex-1 py-1 rounded-[6px] transition-all ${activeGuideTab === 'supabase' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                        >
                          SUPABASE
                        </button>
                      </div>

                      <div className="bg-white rounded-2xl p-5 border border-black/5 text-[14px] text-[#3A3A3C] leading-relaxed shadow-sm">
                        {activeGuideTab === 'drive' ? (
                          <div className="space-y-4">
                            <h4 className="font-bold text-[16px] text-black">Google Drive Setup</h4>
                            <div className="space-y-3">
                              <p className="flex gap-3">
                                <span className="bg-[#007AFF] text-white w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                                <span>Go to <b>Google Cloud Console</b> and enable <b>Google Drive API</b>.</span>
                              </p>
                              <p className="flex gap-3">
                                <span className="bg-[#007AFF] text-white w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                                <span>Generate an <b>API Key</b> under Credentials.</span>
                              </p>
                              <p className="flex gap-3">
                                <span className="bg-[#007AFF] text-white w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                                <span>Create a Drive Folder & Share it as <b>"Anyone with the link can EDIT"</b>.</span>
                              </p>
                              <p className="flex gap-3">
                                <span className="bg-[#007AFF] text-white w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                                <span>Copy the Folder ID from the URL (the string after <code>/folders/</code>).</span>
                              </p>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[12px] text-blue-700">
                              <b>Note:</b> API Keys usually only allow <i>authenticated</i> writes. Make sure the target folder's sharing settings allow public editing if you aren't using OAuth.
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="font-bold text-[16px] text-black">Supabase Setup</h4>
                            <div className="space-y-3">
                              <p>1. Open <b>SQL Editor</b> in Supabase.</p>
                              <p>2. Paste the SQL code below and click <b>Run</b>:</p>
                              
                              <div className="relative group">
                                <button 
                                  onClick={handleCopySQL}
                                  className={`absolute top-2 right-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all z-10 shadow-sm
                                    ${copied ? 'bg-[#34C759] text-white' : 'bg-[#007AFF] text-white active:scale-95'}`}
                                >
                                  {copied ? 'COPIED!' : 'COPY SQL'}
                                </button>
                                <pre className="bg-[#1C1C1E] text-[#D1D1D6] p-4 pt-10 rounded-xl text-[10px] font-mono whitespace-pre overflow-x-auto shadow-inner">
{sqlCode}
                                </pre>
                              </div>

                              <p>3. Go to <b>Auth &rarr; Policies</b> and enable Public Access for both tables.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

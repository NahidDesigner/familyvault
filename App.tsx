
import React, { useState, useEffect } from 'react';
import { CloudUser, MediaItem, CloudConfig } from './types.ts';
import { INITIAL_USERS, STORAGE_KEY, USERS_KEY, CONFIG_KEY, ROOT_ADMIN_ID } from './constants.ts';
import Header from './components/Header.tsx';
import Gallery from './components/Gallery.tsx';
import Uploader from './components/Uploader.tsx';
import UserSelector from './components/UserSelector.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import { 
  initSupabase, 
  getSupabaseUsers, 
  getSupabaseMedia, 
  saveSupabaseUser, 
  saveSupabaseMedia,
  deleteSupabaseUser,
  deleteSupabaseMedia 
} from './services/supabaseService.ts';

type ViewType = 'home' | 'gallery';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CloudUser | null>(null);
  const [users, setUsers] = useState<CloudUser[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ 
    brandName: 'FamilyVault',
    storage: { provider: 'google', email: '', apiKey: '', folderId: '' },
    database: { 
      provider: 'supabase', 
      supabaseUrl: 'https://hqjbexdjpyslxrzzaevm.supabase.co', 
      supabaseAnonKey: 'sb_publishable_jxx9vOKPbAH_nQYbUrfeKA_X88JrZAA' 
    },
    isActive: true 
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [dbError, setDbError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const loadData = async (config: CloudConfig) => {
    try {
      setDbError(null);
      const isSupabase = initSupabase(config);
      
      if (isSupabase) {
        const userRes = await getSupabaseUsers();
        const mediaRes = await getSupabaseMedia();
        
        if (userRes.errorType === 'missing_tables') {
          setDbError("Supabase Tables Missing! Falling back to Local Storage.");
          loadLocalData();
          return;
        }

        if (userRes.data && userRes.data.length > 0) {
          setUsers(userRes.data);
        } else {
          setUsers(INITIAL_USERS);
          try {
            for (const u of INITIAL_USERS) {
              await saveSupabaseUser(u);
            }
          } catch (e) {
            console.warn("Could not sync initial users to Supabase.");
          }
        }
        
        if (mediaRes.data) setMediaItems(mediaRes.data);
      } else {
        loadLocalData();
      }
    } catch (err: any) {
      console.error("Critical error in loadData:", err);
      setInitError("Failed to load cloud data. Check your internet or configuration.");
      loadLocalData(); // Fallback
    }
  };

  const loadLocalData = () => {
    try {
      const savedMedia = localStorage.getItem(STORAGE_KEY);
      if (savedMedia) setMediaItems(JSON.parse(savedMedia));

      const savedUsers = localStorage.getItem(USERS_KEY);
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        setUsers(INITIAL_USERS);
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      }
    } catch (e) {
      console.error("Local storage error:", e);
      setUsers(INITIAL_USERS);
    }
  };

  useEffect(() => {
    const startApp = async () => {
      try {
        const savedConfig = localStorage.getItem(CONFIG_KEY);
        let currentConf = cloudConfig;
        if (savedConfig) {
          try {
            currentConf = JSON.parse(savedConfig);
            setCloudConfig(currentConf);
          } catch (e) {
            console.warn("Corrupted config in local storage, using defaults.");
          }
        }

        await loadData(currentConf);
        
        const savedSession = localStorage.getItem('active_session_user');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setCurrentUser(parsed);
          } catch (e) {}
        }
      } catch (err: any) {
        setInitError(err.message || "Initialization failed");
      } finally {
        setIsInitializing(false);
      }
    };

    startApp();
  }, []);

  useEffect(() => {
    if (!isInitializing && cloudConfig.database.provider === 'local') {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }, [users, isInitializing, cloudConfig.database.provider]);

  useEffect(() => {
    if (!isInitializing && cloudConfig.database.provider === 'local') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mediaItems));
    }
  }, [mediaItems, isInitializing, cloudConfig.database.provider]);

  useEffect(() => {
    if (!isInitializing) {
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cloudConfig));
      } catch (e) {}
    }
  }, [cloudConfig, isInitializing]);

  const handleUserSelect = (user: CloudUser) => {
    setCurrentUser(user);
    localStorage.setItem('active_session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('active_session_user');
    setIsAdminOpen(false);
    setActiveView('home');
  };

  const handleAddUser = async (user: CloudUser) => {
    setUsers(prev => {
        const existingIdx = prev.findIndex(u => u.id === user.id);
        if (existingIdx >= 0) {
            const newUsers = [...prev];
            newUsers[existingIdx] = user;
            return newUsers;
        }
        return [...prev, user];
    });
    
    if (cloudConfig.database.provider === 'supabase' && !dbError) {
      try { await saveSupabaseUser(user); } catch (e) {}
    }

    if (currentUser && currentUser.id === user.id) {
        setCurrentUser(user);
        localStorage.setItem('active_session_user', JSON.stringify(user));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === ROOT_ADMIN_ID) return;
    if (window.confirm('Delete this account?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (cloudConfig.database.provider === 'supabase' && !dbError) {
        await deleteSupabaseUser(userId);
      }
    }
  };

  const handleSaveConfig = (config: CloudConfig) => {
    setCloudConfig(config);
    loadData(config);
  };

  const addMediaItem = async (item: MediaItem) => {
    setMediaItems(prev => [item, ...prev]);
    if (cloudConfig.database.provider === 'supabase' && !dbError) {
      try { await saveSupabaseMedia(item); } catch (e) {}
    }
  };

  const deleteMediaItem = async (id: string) => {
    if (window.confirm('Delete this file?')) {
      setMediaItems(prev => prev.filter(item => item.id !== id));
      if (cloudConfig.database.provider === 'supabase' && !dbError) {
        await deleteSupabaseMedia(id);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[13px] text-[#8E8E93] font-medium animate-pulse">Initializing Vault...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] p-8 text-center">
        <div className="max-w-sm">
          <div className="w-16 h-16 bg-[#FF3B30] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-[24px] font-bold mb-2">Startup Error</h2>
          <p className="text-[#8E8E93] mb-8">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-bold ios-active"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UserSelector onSelect={handleUserSelect} users={users} brandName={cloudConfig.brandName} />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col pb-24">
      <Header user={currentUser} onLogout={handleLogout} brandName={cloudConfig.brandName} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 pt-6">
        {activeView === 'home' ? (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-[13px] font-semibold uppercase tracking-tight mb-0.5 ${dbError ? 'text-[#FF3B30]' : 'text-[#8E8E93]'}`}>
                  {dbError || (cloudConfig.database.provider === 'supabase' ? 'Cloud Database Active' : 'Local Storage Only')}
                </p>
                <h2 className="text-[34px] font-bold text-black tracking-tight leading-none">Library</h2>
              </div>
              
              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setIsAdminOpen(true)}
                  className={`bg-white p-2 rounded-full ios-shadow ios-active ios-border ${dbError ? 'border-[#FF3B30] animate-pulse' : ''}`}
                >
                  <svg className={`w-6 h-6 ${dbError ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>

            <Uploader user={currentUser} config={cloudConfig} onUploadComplete={addMediaItem} />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[20px] font-bold text-black tracking-tight">Recent Activity</h3>
                <button onClick={() => setActiveView('gallery')} className="text-[#007AFF] text-[15px] font-medium ios-active">See All</button>
              </div>
              <Gallery items={mediaItems.slice(0, 6)} onDelete={deleteMediaItem} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div>
              <h2 className="text-[34px] font-bold text-black tracking-tight leading-none mb-6 px-1">All Media</h2>
              <div className="bg-[#E3E3E8] p-0.5 rounded-[10px] w-full max-w-sm mx-auto flex ios-border">
                <button 
                  onClick={() => setFilter('all')}
                  className={`flex-1 py-1 rounded-[8px] text-[13px] font-semibold transition-all ${filter === 'all' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('mine')}
                  className={`flex-1 py-1 rounded-[8px] text-[13px] font-semibold transition-all ${filter === 'mine' ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                >
                  My Files
                </button>
              </div>
            </div>

            <Gallery items={filter === 'all' ? mediaItems : mediaItems.filter(i => i.userId === currentUser?.id)} onDelete={deleteMediaItem} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 ios-blur bg-white/85 border-t border-black/10 px-6 py-2 flex justify-around items-center z-40 safe-bottom">
        <button 
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'home' ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
        >
          <svg className="w-[26px] h-[26px]" fill={activeView === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>
        <button 
          onClick={() => setActiveView('gallery')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'gallery' ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
        >
          <svg className="w-[26px] h-[26px]" fill={activeView === 'gallery' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[10px] font-medium tracking-tight">Library</span>
        </button>
      </nav>

      {isAdminOpen && (
        <AdminDashboard 
          users={users} 
          config={cloudConfig}
          onAddUser={handleAddUser} 
          onDeleteUser={handleDeleteUser}
          onSaveConfig={handleSaveConfig}
          onClose={() => setIsAdminOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;

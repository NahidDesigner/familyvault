
import { CloudUser } from './types';

export const ROOT_ADMIN_ID = 'root-admin-raju';

export const INITIAL_USERS: CloudUser[] = [
  { 
    id: ROOT_ADMIN_ID, 
    name: 'Raju', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raju', 
    color: 'bg-blue-600', 
    role: 'admin',
    pin: '1122' 
  },
];

export const STORAGE_KEY = 'shared_cloud_data_v2';
export const USERS_KEY = 'shared_cloud_users_v2';
export const CONFIG_KEY = 'shared_cloud_config_v2';

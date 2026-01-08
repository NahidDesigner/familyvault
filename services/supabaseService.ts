
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { CloudUser, MediaItem, CloudConfig } from '../types';

let supabase: any = null;

export const initSupabase = (config: CloudConfig) => {
  if (
    config.database.provider === 'supabase' && 
    config.database.supabaseUrl && 
    config.database.supabaseUrl.startsWith('http') &&
    config.database.supabaseAnonKey
  ) {
    try {
      supabase = createClient(config.database.supabaseUrl, config.database.supabaseAnonKey);
      return true;
    } catch (e) {
      console.error('Supabase Initialization Error:', e);
      supabase = null;
      return false;
    }
  }
  supabase = null;
  return false;
};

// Helper to check if the error is "Table not found"
const isTableMissingError = (error: any) => {
  return error?.code === 'PGRST116' || error?.message?.includes('cache') || error?.message?.includes('not find');
};

export const getSupabaseUsers = async (): Promise<{ data: CloudUser[] | null, errorType?: 'missing_tables' | 'other' }> => {
  if (!supabase) return { data: null };
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error.message);
      return { data: null, errorType: isTableMissingError(error) ? 'missing_tables' : 'other' };
    }
    return { data };
  } catch (e) {
    return { data: null, errorType: 'other' };
  }
};

export const saveSupabaseUser = async (user: CloudUser) => {
  if (!supabase) return;
  const { error } = await supabase.from('users').upsert(user);
  if (error) {
    console.error('Error saving user:', error.message);
    throw error;
  }
};

export const deleteSupabaseUser = async (userId: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) console.error('Error deleting user:', error.message);
};

export const getSupabaseMedia = async (): Promise<{ data: MediaItem[] | null, errorType?: 'missing_tables' | 'other' }> => {
  if (!supabase) return { data: null };
  try {
    const { data, error } = await supabase.from('media_items').select('*').order('timestamp', { ascending: false });
    if (error) {
      console.error('Error fetching media:', error.message);
      return { data: null, errorType: isTableMissingError(error) ? 'missing_tables' : 'other' };
    }
    return { data };
  } catch (e) {
    return { data: null, errorType: 'other' };
  }
};

export const saveSupabaseMedia = async (item: MediaItem) => {
  if (!supabase) return;
  const { error } = await supabase.from('media_items').insert(item);
  if (error) {
    console.error('Error saving media:', error.message);
    throw error;
  }
};

export const deleteSupabaseMedia = async (itemId: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('media_items').delete().eq('id', itemId);
  if (error) console.error('Error deleting media:', error.message);
};

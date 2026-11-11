import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://vljphjdpaflahytyszaq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_DxeRJ0_RVfVNciDMmffPgw_8b3KrYF_';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseClientConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

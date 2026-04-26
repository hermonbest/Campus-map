import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  logger.error('SUPABASE_INIT', 'EXPO_PUBLIC_SUPABASE_URL is required', new Error('Missing EXPO_PUBLIC_SUPABASE_URL'));
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  logger.error('SUPABASE_INIT', 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required', new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY'));
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Log Supabase configuration (with masked key)
logger.info('SUPABASE_INIT', 'Initializing Supabase client for mobile app', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey.length,
});

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

logger.success('SUPABASE_INIT', 'Supabase client initialized successfully');

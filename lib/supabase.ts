import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (client) return client;
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Missing Supabase environment variables. Please check your EAS secrets or .env file.');
    // Provide placeholders/fail silently instead of crashing the entire app
    return {} as ReturnType<typeof createClient>;
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return client;
}

// Lazy-loaded supabase client - won't crash on app startup
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

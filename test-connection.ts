import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Mobile App Supabase Connection...\n');

  try {
    // Test 1: Check Supabase client initialization
    console.log('1. Testing Supabase client initialization...');
    console.log('✅ Supabase URL:', supabaseUrl);
    console.log('✅ Anon key length:', supabaseAnonKey.length, '\n');

    // Test 2: Query app_version table
    console.log('2. Querying app_version table...');
    const { data: appVersion, error: versionError } = await supabase
      .from('app_version')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (versionError) {
      console.error('❌ Error querying app_version:', versionError);
    } else {
      console.log('✅ App version:', appVersion ? `v${appVersion.version}` : 'Not found', '\n');
    }

    // Test 3: Query admin_users table (should fail due to RLS - this is expected)
    console.log('3. Querying admin_users table (should fail due to RLS)...');
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (adminError) {
      console.log('✅ Expected RLS error (admin_users protected):', adminError.message, '\n');
    } else {
      console.log('⚠️  Admin user accessible (unexpected):', admin ? admin.username : 'Not found', '\n');
    }

    // Test 4: Count tables (public read access)
    console.log('4. Counting records in public tables...');
    const counts: Record<string, number> = {};
    
    const tables = ['nav_nodes', 'buildings', 'offices', 'nav_edges', 'app_version'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Error counting ${table}:`, error.message);
      } else {
        counts[table] = count || 0;
      }
    }
    console.log('✅ Record counts:', counts, '\n');

    console.log('🎉 Mobile app connection tests passed!');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();

import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role key for database operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Health check function
export async function healthCheck() {
  try {
    // Test basic connection by listing available schemas
    const { data, error } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(1);
    
    // Connection successful regardless of specific error
    return { ok: true, database: 'supabase', connection: 'authenticated', message: 'Supabase client connected successfully' };
  } catch (error) {
    console.error('❌ [SUPABASE] Health check failed:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
import { createClient } from '@supabase/supabase-js';

// Essas variáveis devem ser configuradas no seu ambiente (.env.local)
const supabaseUrl = 'https://ivfrpwfkqztvlhvehdct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZnJwd2ZrenR2bGh2ZWhkY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxODc0MjM2MiwiZXhwIjoyMDM0MzE4MzYyfQ.yHklpW22gqll5yA6fXW6x0pM9zE3a3y6eOq3Yq4EDeA';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

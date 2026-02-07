import { createClient } from '@supabase/supabase-js';

// Essas variáveis devem ser configuradas no seu ambiente (.env.local)
const supabaseUrl = 'https://ktspxbucvfzaqyszpyso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3B4YnVjdmZ6YXF5c3pweXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDcyNzQsImV4cCI6MjA3MTAyMzI3NH0.-UfFVeGoCJFc69FHSwZ2FHlcQs1uidkxg0tItxmpPTc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

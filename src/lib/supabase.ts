import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqqzrppoqgnrinavvolz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xcXpycHBvcWducmluYXZ2b2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTM2ODUsImV4cCI6MjA1ODgyOTY4NX0.O-hdv4Op8-eg6hzBmIaUSKjl0XQdIgH2lilRPahJPrA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

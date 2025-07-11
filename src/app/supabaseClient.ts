import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgtctfmndsqounskejk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ3RjdGZtbmRzcW91bnNrZWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMDk2OTksImV4cCI6MjA2Nzc4NTY5OX0.H-ijKsBtaSZ9qJdO5vglRbzYM6vunzlK-KNwBtAJDeY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
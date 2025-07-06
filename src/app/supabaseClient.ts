import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gjbmtkebhmvxzpvmotiu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqYm10a2ViaG12eHpwdm1vdGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjU5NjAsImV4cCI6MjA2NzIwMTk2MH0.3SDw3qi1xHB32uAjLSb1pFbSLpkPfoW36LG5fVzRpkU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
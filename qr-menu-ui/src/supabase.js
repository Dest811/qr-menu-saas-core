import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhmtpdnslrbsafwkkvsu.supabase.co';
// Lütfen buraya Supabase panelinden kopyaladığınız 'sb_publishable_...' ile başlayan upuzun şifrenin tamamını yapıştırın:
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

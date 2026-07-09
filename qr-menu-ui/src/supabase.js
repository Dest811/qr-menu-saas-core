import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhmtpdnslrbsafwkkvsu.supabase.co';
// Lütfen buraya Supabase panelinden kopyaladığınız 'sb_publishable_...' ile başlayan upuzun şifrenin tamamını yapıştırın:
const supabaseAnonKey = 'sb_publishable_nSO6Jk1zAWg_nXkUfj7nRw_TPzz0yxJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

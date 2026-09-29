import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pvxgbrjzjrnwkocggqen.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Ktw2XK5d8x7wUMYs-E38UQ_0tvSWTUV';

export const supabase = createClient(supabaseUrl, supabaseKey);

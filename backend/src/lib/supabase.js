import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Service Key must be defined in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase }; 
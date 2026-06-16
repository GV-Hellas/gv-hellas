import {createClient} from '@supabase/supabase-js';
import {PUBLIC_SUPABASE_URL} from '$env/static/public';
import {env} from '$env/dynamic/private';

if (!PUBLIC_SUPABASE_URL) {
    throw new Error('PUBLIC_SUPABASE_URL is not set');
}

if (!env.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is not set');
}

export const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY
);
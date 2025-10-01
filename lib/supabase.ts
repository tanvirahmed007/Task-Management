// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

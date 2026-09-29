import { createClient } from '@supabase/supabase-js';

const supabaseUrl = https://luznainkmcogcqbuprzw.supabase.co/rest/v1/;
const supabaseAnonKey = sb_publishable_6psZleJBdhdZFhUTutZqnw_Rr4Y2SI6;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

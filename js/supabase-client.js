/* ============================================================
   Supabase configuration — replace both values below.
   Supabase Dashboard → Project Settings → API
   ============================================================ */
const SUPABASE_URL = "https://hyguvjwyejcsaphmglsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mDRK7rCB2ZrE91bFFzEYlw_1mdde58h";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

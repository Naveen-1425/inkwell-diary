/* ============================================================
   Supabase configuration — replace both values below.
   Supabase Dashboard → Project Settings → API
   ============================================================ */

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

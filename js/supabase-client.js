/* ============================================================
   Supabase configuration
   ============================================================ */

const SUPABASE_URL = "https://fmlltfpfzappyhzzrfcm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QSiyG_cUenaEDs7say6drw_HWaaOwQh";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

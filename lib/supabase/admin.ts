import { createClient } from "@supabase/supabase-js";
// Service-role client. Bypasses RLS — only ever import this into server-side
// code (API routes), never into anything that ships to the browser.
export const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

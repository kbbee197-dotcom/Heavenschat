import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key.
// NEVER import this file into a "use client" component — it must only run in
// API routes (app/api/**/route.js), which execute on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function verifyAdmin(token) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseAuthClient = createClient(supabaseUrl, anonKey);

  const { data: userData, error: userError } =
    await supabaseAuthClient.auth.getUser(token);

  if (userError || !userData?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  return profile?.is_admin ? userData.user : null;
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const admin = await verifyAdmin(token);
  if (!admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { action, contentType, contentId, flagId } = body;

  if (action === "delete_content") {
    const table = contentType === "photo" ? "memorial_photos" : "tributes";
    const { error } = await supabaseAdmin.from(table).delete().eq("id", contentId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Also resolve any flags pointing at this content
    await supabaseAdmin
      .from("content_flags")
      .update({ resolved: true })
      .eq("content_id", contentId);
    return NextResponse.json({ success: true });
  }

  if (action === "dismiss_flag") {
    const { error } = await supabaseAdmin
      .from("content_flags")
      .update({ resolved: true })
      .eq("id", flagId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

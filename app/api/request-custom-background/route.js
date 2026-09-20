import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseAuthClient = createClient(supabaseUrl, anonKey);

  const { data: userData, error: userError } =
    await supabaseAuthClient.auth.getUser(token);

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await request.json();
  const { memorialId, description } = body;

  if (!memorialId || !description || !description.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: memorial, error: memorialError } = await supabaseAdmin
    .from("memorials")
    .select("id, owner_id, full_name")
    .eq("id", memorialId)
    .single();

  if (memorialError || !memorial || memorial.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Not authorized for this memorial" }, { status: 403 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("token_balance")
    .eq("id", userData.user.id)
    .single();

  if (!profile || (profile.token_balance || 0) < 2000) {
    return NextResponse.json({ error: "You need 2000 tokens for a custom background request." }, { status: 400 });
  }

  const newBalance = profile.token_balance - 2000;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ token_balance: newBalance })
    .eq("id", userData.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabaseAdmin.from("token_transactions").insert({
    user_id: userData.user.id,
    amount: -2000,
    type: "custom_background_request",
    description: `Requested custom background for ${memorial.full_name}`,
  });

  const { data: reqData, error: reqError } = await supabaseAdmin
    .from("custom_background_requests")
    .insert({
      memorial_id: memorialId,
      requester_id: userData.user.id,
      description: description.trim(),
    })
    .select()
    .single();

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, request: reqData, newBalance });
}

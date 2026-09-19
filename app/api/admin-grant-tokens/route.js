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

  // Verify the requester is actually an admin
  const { data: requesterProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  if (!requesterProfile?.is_admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { targetEmail, amount, reason } = body;

  if (!targetEmail || !amount || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  // Find the target user by email
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, token_balance, email")
    .eq("email", targetEmail)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newBalance = (targetProfile.token_balance || 0) + Number(amount);

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ token_balance: newBalance })
    .eq("id", targetProfile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabaseAdmin.from("token_transactions").insert({
    user_id: targetProfile.id,
    amount: Number(amount),
    type: "admin_grant",
    description: reason || `Granted by admin`,
  });

  return NextResponse.json({ success: true, newBalance });
}

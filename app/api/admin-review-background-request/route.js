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
  const { requestId, action, adminNotes, backgroundOptionId } = body;

  const { data: reqRow, error: reqError } = await supabaseAdmin
    .from("custom_background_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqError || !reqRow) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "reject") {
    // Refund the 2000 tokens
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", reqRow.requester_id)
      .single();

    const newBalance = (profile?.token_balance || 0) + 2000;

    await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", reqRow.requester_id);

    await supabaseAdmin.from("token_transactions").insert({
      user_id: reqRow.requester_id,
      amount: 2000,
      type: "custom_background_refund",
      description: "Custom background request rejected — refunded",
    });

    await supabaseAdmin
      .from("custom_background_requests")
      .update({ status: "rejected", admin_notes: adminNotes || null })
      .eq("id", requestId);

    return NextResponse.json({ success: true });
  }

  if (action === "in_progress") {
    await supabaseAdmin
      .from("custom_background_requests")
      .update({ status: "in_progress", admin_notes: adminNotes || null })
      .eq("id", requestId);

    return NextResponse.json({ success: true });
  }

  if (action === "complete") {
    if (!backgroundOptionId) {
      return NextResponse.json({ error: "Missing backgroundOptionId" }, { status: 400 });
    }

    await supabaseAdmin
      .from("custom_background_requests")
      .update({
        status: "completed",
        background_id: backgroundOptionId,
        admin_notes: adminNotes || null,
      })
      .eq("id", requestId);

    // Auto-unlock this background for the memorial since they already paid
    await supabaseAdmin.from("memorial_background_unlocks").insert({
      memorial_id: reqRow.memorial_id,
      background_id: backgroundOptionId,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

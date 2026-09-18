import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

const EVENT_LABELS = {
  tributes: "left a tribute on",
  candles: "lit a candle on",
  flowers: "sent flowers on",
};

export async function POST(request) {
  const body = await request.json();

  // Called directly from our own app code after an insert.
  // Expected shape: { table: "tributes"|"candles"|"flowers", record: {...} }
  const { table, record } = body;

  if (!table || !record || !EVENT_LABELS[table]) {
    return NextResponse.json({ error: "Unsupported table" }, { status: 400 });
  }

  const memorialId = record.memorial_id;
  if (!memorialId) {
    return NextResponse.json({ error: "Missing memorial_id" }, { status: 400 });
  }

  // Look up the memorial and its owner
  const { data: memorial, error: memorialError } = await supabaseAdmin
    .from("memorials")
    .select("id, full_name, owner_id")
    .eq("id", memorialId)
    .single();

  if (memorialError || !memorial) {
    return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
  }

  // Look up the owner's email + notification preference
  const preferenceColumn = table === "tributes" ? "notify_on_tribute" : "notify_on_gift";

  const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(
    memorial.owner_id
  );

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(preferenceColumn)
    .eq("id", memorial.owner_id)
    .single();

  if (!ownerAuth?.user?.email || !profile || !profile[preferenceColumn]) {
    // Owner has no email on file, or has this notification type turned off
    return NextResponse.json({ skipped: true });
  }

  const actorName = record.author_name || record.lit_by_name || record.sent_by_name || "Someone";
  const actionLabel = EVENT_LABELS[table];
  const messageBody = table === "tributes" ? record.message : "";

  try {
    await resend.emails.send({
      from: "Heavens Chat <onboarding@resend.dev>",
      to: ownerAuth.user.email,
      subject: `${actorName} ${actionLabel} ${memorial.full_name}'s memorial`,
      html: `
        <p><strong>${actorName}</strong> ${actionLabel} <strong>${memorial.full_name}</strong>'s memorial.</p>
        ${messageBody ? `<p style="padding:12px;background:#f5f0e6;border-radius:8px;">"${messageBody}"</p>` : ""}
        <p><a href="https://heavenschat.vercel.app/memorial/${memorialId}">View the memorial</a></p>
      `,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

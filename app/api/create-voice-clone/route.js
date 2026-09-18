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
  const { memorialId, sampleUrl, consentName, consentText, voiceName } = body;

  if (!memorialId || !sampleUrl || !consentName || !consentText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify the requester actually owns this memorial
  const { data: memorial, error: memorialError } = await supabaseAdmin
    .from("memorials")
    .select("id, owner_id")
    .eq("id", memorialId)
    .single();

  if (memorialError || !memorial || memorial.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Not authorized for this memorial" }, { status: 403 });
  }

  // Download the sample audio so we can forward it to ElevenLabs
  const sampleRes = await fetch(sampleUrl);
  if (!sampleRes.ok) {
    return NextResponse.json({ error: "Could not fetch voice sample" }, { status: 400 });
  }
  const sampleBlob = await sampleRes.blob();

  const elevenForm = new FormData();
  elevenForm.append("name", voiceName || "Memorial Voice");
  elevenForm.append("files", sampleBlob, "sample.mp3");

  const elevenRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: elevenForm,
  });

  if (!elevenRes.ok) {
    const errText = await elevenRes.text();
    return NextResponse.json({ error: `ElevenLabs error: ${errText}` }, { status: 500 });
  }

  const elevenData = await elevenRes.json();
  const voiceId = elevenData.voice_id;

  const { error: upsertError } = await supabaseAdmin
    .from("memorial_voices")
    .upsert(
      {
        memorial_id: memorialId,
        elevenlabs_voice_id: voiceId,
        sample_url: sampleUrl,
        consent_confirmed: true,
        consent_text: consentText,
        consent_name: consentName,
      },
      { onConflict: "memorial_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, voiceId });
}

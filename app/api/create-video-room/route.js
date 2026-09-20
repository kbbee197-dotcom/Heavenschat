import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // room expires in 2 hours
      },
    }),
  });

  if (!dailyRes.ok) {
    const errText = await dailyRes.text();
    return NextResponse.json({ error: `Daily.co error: ${errText}` }, { status: 500 });
  }

  const roomData = await dailyRes.json();

  return NextResponse.json({ url: roomData.url });
}

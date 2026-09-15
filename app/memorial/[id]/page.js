"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MemorialPage() {
  const params = useParams();
  const [memorial, setMemorial] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [candleCount, setCandleCount] = useState(0);
  const [lighting, setLighting] = useState(false);
  const [candleMessage, setCandleMessage] = useState("");
  const [flowerCount, setFlowerCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [flowerMessage, setFlowerMessage] = useState("");

  useEffect(() => {
    const loadMemorial = async () => {
      const { data: memorialData } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", params.id)
        .single();

      setMemorial(memorialData);

      const { data: photosData } = await supabase
        .from("memorial_photos")
        .select("photo_url, caption")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: true });

      setPhotos(photosData || []);

      const { data: tributeData } = await supabase
        .from("tributes")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: false });

      setTributes(tributeData || []);

      const { count } = await supabase
        .from("candles")
        .select("*", { count: "exact", head: true })
        .eq("memorial_id", params.id);

      setCandleCount(count || 0);

      const { count: flowerCountResult } = await supabase
        .from("flowers")
        .select("*", { count: "exact", head: true })
        .eq("memorial_id", params.id);

      setFlowerCount(flowerCountResult || 0);
      setLoading(false);
    };

    if (params.id) loadMemorial();
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;

    const fetchLatestTributes = async () => {
      const { data } = await supabase
        .from("tributes")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: false });
      if (data) setTributes(data);
    };

    const interval = setInterval(fetchLatestTributes, 4000);

    return () => clearInterval(interval);
  }, [params.id]);

  const handleLightCandle = async () => {
    setLighting(true);
    setCandleMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setCandleMessage("Please log in to light a candle.");
      setLighting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", userData.user.id)
      .single();

    if (!profile || (profile.token_balance || 0) < 20) {
      setCandleMessage("Not enough tokens. You need 20 tokens to light a candle.");
      setLighting(false);
      return;
    }

    const newBalance = profile.token_balance - 20;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", userData.user.id);

    if (updateError) {
      setCandleMessage("Something went wrong. Please try again.");
      setLighting(false);
      return;
    }

    await supabase.from("token_transactions").insert({
      user_id: userData.user.id,
      amount: -20,
      type: "candle",
      description: `Lit a candle for ${memorial.full_name}`,
    });

    await supabase.from("candles").insert({
      memorial_id: params.id,
      lit_by: userData.user.id,
      lit_by_name: userData.user.email,
    });

    setCandleCount((c) => c + 1);
    setCandleMessage("A candle has been lit. 🕯️");
    setLighting(false);
  };

  const handleSendFlower = async () => {
    setSending(true);
    setFlowerMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setFlowerMessage("Please log in to send flowers.");
      setSending(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", userData.user.id)
      .single();

    if (!profile || (profile.token_balance || 0) < 20) {
      setFlowerMessage("Not enough tokens. You need 20 tokens to send flowers.");
      setSending(false);
      return;
    }

    const newBalance = profile.token_balance - 20;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", userData.user.id);

    if (updateError) {
      setFlowerMessage("Something went wrong. Please try again.");
      setSending(false);
      return;
    }

    await supabase.from("token_transactions").insert({
      user_id: userData.user.id,
      amount: -20,
      type: "flower",
      description: `Sent flowers for ${memorial.full_name}`,
    });

    await supabase.from("flowers").insert({
      memorial_id: params.id,
      sent_by: userData.user.id,
      sent_by_name: userData.user.email,
    });

    setFlowerCount((c) => c + 1);
    setFlowerMessage("Flowers have been sent. 🌸");
    setSending(false);
  };

  const handleAddTribute = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("tributes")
      .insert({
        memorial_id: params.id,
        author_name: authorName,
        message: message,
      })
      .select()
      .single();

    if (error) {
      alert("Tribute submit failed: " + error.message);
    } else {
      setTributes([data, ...tributes]);
      setAuthorName("");
      setMessage("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading memorial...</p>
      </main>
    );
  }

  if (!memorial) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <p className="text-amber-50/70 text-sm text-center">
          This memorial could not be found.
        </p>
      </main>
    );
  }

  const bgVideo =
    memorial.type === "pet"
      ? "/videos/pets-memorial.mp4"
      : "/videos/loved-ones-memorial.mp4";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      <video
        src={bgVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full object-cover"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      <div className="relative z-10 flex flex-col items-center px-6 py-16 max-w-md mx-auto">
        <p className="text-amber-700/70 text-xs tracking-widest uppercase font-light mb-3">
          {memorial.type === "pet" ? "In Loving Memory" : "In Loving Memory"}
        </p>

        {photos.length > 0 && (
          <img
            src={photos[0].photo_url}
            alt={memorial.full_name}
            className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-amber-200/30 shadow-lg"
          />
        )}

        <h1 className="text-white text-3xl font-serif mb-1 text-center">
          {memorial.full_name}
        </h1>
        {memorial.nicknames && (
          <p className="text-amber-50/60 text-sm mb-2 text-center">
            &ldquo;{memorial.nicknames}&rdquo;
          </p>
        )}
        <p className="text-amber-50/80 text-sm mb-1 text-center">
          {memorial.date_born && memorial.date_passed
            ? `${memorial.date_born} — ${memorial.date_passed}`
            : ""}
        </p>
        {(memorial.location_city || memorial.location_state) && (
          <p className="text-amber-50/60 text-xs mb-6 text-center">
            {[memorial.location_city, memorial.location_state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        {memorial.story && (
          <div className="w-full bg-black/30 backdrop-blur-md backdrop-blur-sm border border-amber-200/30 rounded-2xl p-6 mb-8 shadow-sm">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {memorial.story}
            </p>
          </div>
        )}

        {photos.length > 1 && (
          <div className="w-full grid grid-cols-3 gap-2 mb-8">
            {photos.slice(1).map((p, i) => (
              <img
                key={i}
                src={p.photo_url}
                alt={p.caption || `Photo ${i + 2}`}
                className="w-full aspect-square object-cover rounded-xl border border-amber-200/30"
              />
            ))}
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <div className="bg-black/30 backdrop-blur-md border border-amber-200/30 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-amber-100 text-2xl mb-1">🕯️</p>
            <p className="text-white text-xs mb-2 text-center">
              {candleCount} {candleCount === 1 ? "candle" : "candles"} lit
            </p>
            <button
              onClick={handleLightCandle}
              disabled={lighting}
              className="px-4 py-2 rounded-full font-serif text-xs tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-50"
            >
              {lighting ? "Lighting..." : "Light Candle (20)"}
            </button>
            {candleMessage && (
              <p className="text-amber-100/80 text-xs mt-2 text-center">
                {candleMessage}
              </p>
            )}
          </div>

          <div className="bg-black/30 backdrop-blur-md border border-amber-200/30 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-amber-100 text-2xl mb-1">🌸</p>
            <p className="text-white text-xs mb-2 text-center">
              {flowerCount} {flowerCount === 1 ? "flower" : "flowers"} sent
            </p>
            <button
              onClick={handleSendFlower}
              disabled={sending}
              className="px-4 py-2 rounded-full font-serif text-xs tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Flowers (20)"}
            </button>
            {flowerMessage && (
              <p className="text-amber-100/80 text-xs mt-2 text-center">
                {flowerMessage}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-white font-serif text-lg mb-1 self-start">
          Tributes
        </h2>

        <form
          onSubmit={handleAddTribute}
          className="w-full bg-black/30 backdrop-blur-md backdrop-blur-sm border border-amber-200/30 rounded-xl p-4 mb-6 shadow-sm"
        >
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-amber-200/30 text-sm text-white"
          />
          <textarea
            placeholder="Leave a message..."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-amber-200/30 text-sm text-white resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Leave a Tribute"}
          </button>
        </form>

        <div className="w-full space-y-3">
          {tributes.length === 0 && (
            <p className="text-amber-50/60 text-sm text-center">
              Be the first to leave a tribute.
            </p>
          )}
          {tributes.map((t) => (
            <div
              key={t.id}
              className="bg-black/30 backdrop-blur-md backdrop-blur-sm border border-amber-200/30 rounded-xl px-4 py-3 shadow-sm"
            >
              <p className="text-amber-700 text-xs font-medium mb-1">
                {t.author_name}
              </p>
              <p className="text-white/90 text-sm">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

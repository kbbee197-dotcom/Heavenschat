"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateConversation } from "@/lib/conversations";

export default function MemorialPage() {
  const params = useParams();
  const router = useRouter();
  const [memorial, setMemorial] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showVoiceClips, setShowVoiceClips] = useState(false);
  const [voiceClips, setVoiceClips] = useState([]);
  const [customBackground, setCustomBackground] = useState(null);
  const bgAudioRef = useRef(null);

  useEffect(() => {
    const audioUrl = memorial?.custom_audio_url || customBackground?.audio_url;
    const globalAudio = document.getElementById("site-ambient-audio");

    if (audioUrl) {
      const wasGlobalMuted = globalAudio ? globalAudio.muted : true;

      if (globalAudio) {
        globalAudio.pause();
      }

      const bgAudio = new Audio(audioUrl);
      bgAudio.loop = true;
      bgAudio.volume = 0.5;
      bgAudio.muted = wasGlobalMuted;
      bgAudio.play().catch(() => {});
      bgAudioRef.current = bgAudio;
      window.__activeBgAudio = bgAudio;

      return () => {
        bgAudio.pause();
        bgAudioRef.current = null;
        window.__activeBgAudio = null;
        if (globalAudio && !wasGlobalMuted) {
          globalAudio.play().catch(() => {});
        }
      };
    }
  }, [customBackground, memorial?.custom_audio_url]);
  const [giverName, setGiverName] = useState("");
  const [showTributeForm, setShowTributeForm] = useState(false);
  const [candleCount, setCandleCount] = useState(0);
  const [lighting, setLighting] = useState(false);
  const [candleMessage, setCandleMessage] = useState("");
  const [flowerCount, setFlowerCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [flowerMessage, setFlowerMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadMemorial = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUser(userData?.user || null);

      const { data: memorialData } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", params.id)
        .single();

      setMemorial(memorialData);

      if (memorialData?.active_background_id) {
        const { data: bgOption } = await supabase
          .from("background_options")
          .select("media_url, media_type, audio_url")
          .eq("id", memorialData.active_background_id)
          .single();

        if (bgOption) {
          setCustomBackground(bgOption);
        }
      }

      const { data: photosData } = await supabase
        .from("memorial_photos")
        .select("id, photo_url, caption")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: true });

      setPhotos(photosData || []);

      const { data: clipsData } = await supabase
        .from("voice_clips")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: true });

      setVoiceClips(clipsData || []);

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

    const displayName = giverName.trim() || userData.user.email;

    const { data: candleData } = await supabase
      .from("candles")
      .insert({
        memorial_id: params.id,
        lit_by: userData.user.id,
        lit_by_name: displayName,
      })
      .select()
      .single();

    const { data: candleTribute } = await supabase
      .from("tributes")
      .insert({
        memorial_id: params.id,
        author_id: userData.user.id,
        author_name: displayName,
        message: "🕯️ Lit a candle",
      })
      .select()
      .single();

    if (candleTribute) {
      fetch("/api/notify-memorial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "tributes", record: candleTribute }),
      }).catch(() => {});
    }

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

    const displayName = giverName.trim() || userData.user.email;

    const { data: flowerData } = await supabase
      .from("flowers")
      .insert({
        memorial_id: params.id,
        sent_by: userData.user.id,
        sent_by_name: displayName,
      })
      .select()
      .single();

    const { data: flowerTribute } = await supabase
      .from("tributes")
      .insert({
        memorial_id: params.id,
        author_id: userData.user.id,
        author_name: displayName,
        message: "🌸 Sent flowers",
      })
      .select()
      .single();

    if (flowerTribute) {
      fetch("/api/notify-memorial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "tributes", record: flowerTribute }),
      }).catch(() => {});
    }

    setFlowerCount((c) => c + 1);
    setFlowerMessage("Flowers have been sent. 🌸");
    setSending(false);
  };

  const handleAddTribute = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!message.trim()) return;
    setSubmitting(true);

    const displayName = authorName.trim() || currentUser.email;

    const { data, error } = await supabase
      .from("tributes")
      .insert({
        memorial_id: params.id,
        author_id: currentUser.id,
        author_name: displayName,
        message: message,
      })
      .select()
      .single();

    if (error) {
      alert("Tribute submit failed: " + error.message);
    } else {
      fetch("/api/notify-memorial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "tributes", record: data }),
      }).catch(() => {});

      setTributes([data, ...tributes]);
      setAuthorName("");
      setMessage("");
    }
    setSubmitting(false);
  };

  const handleMessageAuthor = async (authorId) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (authorId === currentUser.id) return;

    const conversationId = await getOrCreateConversation(currentUser.id, authorId);
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    }
  };

  const handleFlag = async (contentType, contentId) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const reason = window.prompt("Why are you flagging this? (optional)") || "";

    const { error } = await supabase.from("content_flags").insert({
      content_type: contentType,
      content_id: contentId,
      memorial_id: params.id,
      reason: reason.trim() || null,
      reported_by: currentUser.id,
    });

    if (!error) {
      alert("Thanks — this has been reported for review.");
    }
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
    (customBackground?.media_url && customBackground.media_url !== "DEFAULT"
      ? customBackground.media_url
      : null) ||
    (memorial.type === "pet"
      ? "/videos/pets-memorial.mp4"
      : "/videos/loved-ones-memorial.mp4");

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

      <button
        onClick={() => router.push(currentUser ? "/settings" : "/login")}
        className="fixed top-4 left-4 z-[90] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-amber-200/30 flex items-center justify-center text-lg hover:bg-black/40 transition"
        aria-label="Settings"
      >
        ⚙️
      </button>

      <button
        onClick={() => setShowStore(true)}
        className="fixed top-16 right-4 z-[90] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-amber-200/30 flex items-center justify-center text-lg hover:bg-black/40 transition"
        aria-label="Open gift store"
      >
        🎁
      </button>

      <button
        onClick={() => setShowGallery(true)}
        className="fixed top-28 right-4 z-[90] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-amber-200/30 flex items-center justify-center text-lg hover:bg-black/40 transition"
        aria-label="Open photo gallery"
      >
        🖼️
      </button>

      {voiceClips.length > 0 && (
        <button
          onClick={() => setShowVoiceClips(true)}
          className="fixed top-40 right-4 z-[90] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-amber-200/30 flex items-center justify-center text-lg hover:bg-black/40 transition"
          aria-label="Hear from them"
        >
          🎙️
        </button>
      )}

      {showVoiceClips && (
        <div
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowVoiceClips(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-black/70 backdrop-blur-md border border-amber-200/30 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-serif text-lg">
                Hear from {memorial?.full_name}
              </h3>
              <button
                onClick={() => setShowVoiceClips(false)}
                className="text-white/60 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {voiceClips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-white/5 border border-amber-200/20 rounded-xl p-3"
                >
                  <audio controls src={clip.clip_url} className="w-full mb-1" />
                  {clip.caption && (
                    <p className="text-white/50 text-xs">{clip.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showGallery && (
        <div
          className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowGallery(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-black/70 backdrop-blur-md border border-amber-200/30 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-serif text-lg">Photo Gallery</h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-white/60 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {photos.length === 0 ? (
              <p className="text-amber-50/60 text-sm text-center">
                No photos yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((p, i) => (
                  <div key={p.id || i} className="relative">
                    <img
                      src={p.photo_url}
                      alt={p.caption || `Photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-xl border border-amber-200/30"
                    />
                    <button
                      onClick={() => handleFlag("photo", p.id)}
                      className="absolute bottom-1 right-1 text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full hover:bg-black/70"
                    >
                      Flag
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showStore && (
        <div
          className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowStore(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-black/70 backdrop-blur-md border border-amber-200/30 rounded-2xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-serif text-lg">Gift Store</h3>
              <button
                onClick={() => setShowStore(false)}
                className="text-white/60 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={giverName}
                onChange={(e) => setGiverName(e.target.value)}
                placeholder="Your name (for the tribute wall)"
                className="w-full bg-white/10 border border-amber-200/30 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-300/60"
              />
            </div>

            <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 mb-3">
              <div>
                <p className="text-white text-sm">🕯️ Candle</p>
                <p className="text-amber-50/60 text-xs">{candleCount} lit so far</p>
              </div>
              <button
                onClick={handleLightCandle}
                disabled={lighting}
                className="px-4 py-2 rounded-full text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition disabled:opacity-50"
              >
                {lighting ? "..." : "20 tokens"}
              </button>
            </div>

            <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 mb-3">
              <div>
                <p className="text-white text-sm">🌸 Flowers</p>
                <p className="text-amber-50/60 text-xs">{flowerCount} sent so far</p>
              </div>
              <button
                onClick={handleSendFlower}
                disabled={sending}
                className="px-4 py-2 rounded-full text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition disabled:opacity-50"
              >
                {sending ? "..." : "20 tokens"}
              </button>
            </div>

            {(candleMessage || flowerMessage) && (
              <p className="text-amber-100/80 text-xs text-center mt-2">
                {candleMessage || flowerMessage}
              </p>
            )}

            <p className="text-amber-50/40 text-xs text-center mt-4">
              More gifts coming soon.
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-6 py-16 max-w-md mx-auto">
        <p className="text-gray-900 text-xs tracking-widest uppercase font-semibold mb-3 drop-shadow-[0_1px_3px_rgba(255,255,255,0.6)]">
          In Loving Memory
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

        <button
          onClick={() => setShowTributeForm(!showTributeForm)}
          className="w-full flex items-center justify-between mb-3"
        >
          <h2 className="text-white font-serif text-lg">Tributes</h2>
          <span className="text-white/60 text-sm">
            {showTributeForm ? "▲ Close" : "▼ Leave a message"}
          </span>
        </button>

        {showTributeForm && (
          currentUser ? (
            <form
              onSubmit={handleAddTribute}
              className="w-full bg-black/30 backdrop-blur-md backdrop-blur-sm border border-amber-200/30 rounded-xl p-4 mb-6 shadow-sm"
            >
              <input
                type="text"
                placeholder="Your name (optional)"
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
          ) : (
            <div className="w-full bg-black/30 backdrop-blur-md backdrop-blur-sm border border-amber-200/30 rounded-xl p-4 mb-6 shadow-sm text-center">
              <p className="text-white/80 text-sm mb-3">
                Please log in to leave a tribute.
              </p>
              <a
                href="/login"
                className="inline-block px-6 py-2 rounded-full text-sm text-amber-50 bg-amber-600 hover:bg-amber-700 transition"
              >
                Log In
              </a>
            </div>
          )
        )}

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
              <div className="flex items-center justify-between mb-1">
                <p className="text-amber-700 text-xs font-medium">
                  {t.author_name}
                </p>
                <div className="flex items-center gap-3">
                  {t.author_id && currentUser && t.author_id !== currentUser.id && (
                    <button
                      onClick={() => handleMessageAuthor(t.author_id)}
                      className="text-amber-200/70 text-xs underline hover:text-amber-200"
                    >
                      Message
                    </button>
                  )}
                  <button
                    onClick={() => handleFlag("tribute", t.id)}
                    className="text-white/30 text-xs underline hover:text-white/60"
                  >
                    Flag
                  </button>
                </div>
              </div>
              <p className="text-white/90 text-sm">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

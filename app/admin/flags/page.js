"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminFlags() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [flags, setFlags] = useState([]);
  const [recentTributes, setRecentTributes] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [tab, setTab] = useState("flags");
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userData.user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);

      const { data: flagsData } = await supabase
        .from("content_flags")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      setFlags(flagsData || []);

      const { data: tributesData } = await supabase
        .from("tributes")
        .select("id, memorial_id, author_name, message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      setRecentTributes(tributesData || []);

      const { data: photosData } = await supabase
        .from("memorial_photos")
        .select("id, memorial_id, photo_url, caption, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      setRecentPhotos(photosData || []);
      setChecking(false);
    };
    load();
  }, [router]);

  const callModerate = async (payload) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch("/api/admin-moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        return { error: `Non-JSON response (status ${res.status}): ${text.slice(0, 200)}` };
      }

      if (!res.ok && !result.error) {
        return { error: `Request failed with status ${res.status}` };
      }

      return result;
    } catch (err) {
      return { error: `Network error: ${err.message}` };
    }
  };

  const handleDeleteContent = async (contentType, contentId) => {
    setProcessingId(contentId);
    setError("");

    const result = await callModerate({
      action: "delete_content",
      contentType,
      contentId,
    });

    setProcessingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setFlags((prev) => prev.filter((f) => f.content_id !== contentId));
    setRecentTributes((prev) => prev.filter((t) => t.id !== contentId));
    setRecentPhotos((prev) => prev.filter((p) => p.id !== contentId));
  };

  const handleDismissFlag = async (flagId) => {
    setProcessingId(flagId);
    setError("");

    const result = await callModerate({ action: "dismiss_flag", flagId });

    setProcessingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setFlags((prev) => prev.filter((f) => f.id !== flagId));
  };

  if (checking || !isAdmin) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.push("/admin")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Admin
        </button>

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Moderation
        </h1>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("flags")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              tab === "flags" ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"
            }`}
          >
            Flags ({flags.length})
          </button>
          <button
            onClick={() => setTab("tributes")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              tab === "tributes" ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"
            }`}
          >
            Tributes
          </button>
          <button
            onClick={() => setTab("photos")}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
              tab === "photos" ? "bg-amber-500 text-white" : "bg-white/10 text-white/60"
            }`}
          >
            Photos
          </button>
        </div>

        {tab === "flags" && (
          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-amber-50/60 text-sm text-center">
                No open flags.
              </p>
            ) : (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-white/5 border border-amber-200/20 rounded-xl p-3"
                >
                  <p className="text-white text-xs mb-1">
                    {flag.content_type.toUpperCase()} · {flag.content_id.slice(0, 8)}
                  </p>
                  {flag.reason && (
                    <p className="text-white/50 text-xs mb-2">"{flag.reason}"</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteContent(flag.content_type, flag.content_id)}
                      disabled={processingId === flag.content_id}
                      className="flex-1 px-3 py-2 rounded-full text-xs text-white bg-red-500/80 hover:bg-red-500 transition disabled:opacity-50"
                    >
                      Delete Content
                    </button>
                    <button
                      onClick={() => handleDismissFlag(flag.id)}
                      disabled={processingId === flag.id}
                      className="flex-1 px-3 py-2 rounded-full text-xs text-white/70 border border-white/20 hover:bg-white/10 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "tributes" && (
          <div className="space-y-2">
            {recentTributes.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-3 py-2"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-amber-700 text-xs font-medium truncate">
                    {t.author_name}
                  </p>
                  <p className="text-white/70 text-xs truncate">{t.message}</p>
                </div>
                <button
                  onClick={() => handleDeleteContent("tribute", t.id)}
                  disabled={processingId === t.id}
                  className="text-red-300/80 text-xs hover:text-red-300 shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "photos" && (
          <div className="grid grid-cols-2 gap-3">
            {recentPhotos.map((p) => (
              <div key={p.id} className="relative">
                <img
                  src={p.photo_url}
                  alt={p.caption || "Photo"}
                  className="w-full aspect-square object-cover rounded-xl border border-amber-200/30"
                />
                <button
                  onClick={() => handleDeleteContent("photo", p.id)}
                  disabled={processingId === p.id}
                  className="absolute bottom-1 right-1 text-[10px] text-white bg-red-500/80 px-2 py-0.5 rounded-full hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

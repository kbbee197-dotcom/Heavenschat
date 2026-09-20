"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateConversation } from "@/lib/conversations";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const userId = userData.user.id;
      setCurrentUserId(userId);

      const { data: convos } = await supabase
        .from("conversations")
        .select("id, user_one, user_two, last_message_at")
        .or(`user_one.eq.${userId},user_two.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const otherIds = convos.map((c) =>
        c.user_one === userId ? c.user_two : c.user_one
      );

      const { data: profiles } = await supabase.rpc("get_profile_emails", {
        user_ids: otherIds,
      });

      const emailMap = {};
      (profiles || []).forEach((p) => {
        emailMap[p.id] = p.email;
      });

      const enriched = convos.map((c) => {
        const otherId = c.user_one === userId ? c.user_two : c.user_one;
        return {
          ...c,
          otherEmail: emailMap[otherId] || "Unknown",
        };
      });

      setConversations(enriched);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleStartNewConversation = async (e) => {
    e.preventDefault();
    setSearchError("");

    if (!searchEmail.trim()) {
      setSearchError("Please enter an email.");
      return;
    }

    setSearching(true);

    const { data: profiles, error } = await supabase.rpc("get_profile_by_email", {
      lookup_email: searchEmail.trim(),
    });

    if (error || !profiles || profiles.length === 0) {
      setSearchError("No user found with that email.");
      setSearching(false);
      return;
    }

    const otherUser = profiles[0];

    if (otherUser.id === currentUserId) {
      setSearchError("You can't message yourself.");
      setSearching(false);
      return;
    }

    const conversationId = await getOrCreateConversation(currentUserId, otherUser.id);
    setSearching(false);

    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    } else {
      setSearchError("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-6 py-16">
      <video
        src="/videos/ambient-clouds.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-serif text-center mb-4 text-white">
          Messages
        </h1>

        {!showNewMessage ? (
          <button
            onClick={() => setShowNewMessage(true)}
            className="w-full mb-6 px-4 py-3 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition"
          >
            + New Message
          </button>
        ) : (
          <form onSubmit={handleStartNewConversation} className="mb-6">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter their email"
              className="w-full px-4 py-2 mb-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
            {searchError && (
              <p className="text-red-300 text-xs mb-2">{searchError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(false);
                  setSearchEmail("");
                  setSearchError("");
                }}
                className="flex-1 px-4 py-2 rounded-full text-xs text-white/70 border border-white/20 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={searching}
                className="flex-1 px-4 py-2 rounded-full text-xs text-amber-50 bg-amber-500/80 hover:bg-amber-500 transition disabled:opacity-50"
              >
                {searching ? "..." : "Start Chat"}
              </button>
            </div>
          </form>
        )}

        {conversations.length === 0 ? (
          <p className="text-amber-50/60 text-sm text-center">
            No conversations yet.
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className="w-full text-left bg-white/5 border border-amber-200/20 rounded-xl px-4 py-3 hover:bg-white/10 transition"
              >
                <p className="text-white text-sm">{c.otherEmail}</p>
                <p className="text-white/40 text-xs">
                  {new Date(c.last_message_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

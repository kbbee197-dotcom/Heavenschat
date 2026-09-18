"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const userId = userData.user.id;

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

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, email")
        .in("id", otherIds);

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

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Messages
        </h1>

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

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MessageThread() {
  const router = useRouter();
  const params = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [otherEmail, setOtherEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setCurrentUser(userData.user);

      const { data: convo } = await supabase
        .from("conversations")
        .select("user_one, user_two")
        .eq("id", params.id)
        .single();

      if (convo) {
        const otherId =
          convo.user_one === userData.user.id ? convo.user_two : convo.user_one;

        const { data: profiles } = await supabase.rpc("get_profile_emails", {
          user_ids: [otherId],
        });

        setOtherEmail(profiles?.[0]?.email || "Unknown");
      }

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  useEffect(() => {
    if (!params.id) return;
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    const interval = setInterval(fetchLatest, 4000);
    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || !currentUser) return;
    setSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: params.id,
        sender_id: currentUser.id,
        body: body.trim(),
      })
      .select()
      .single();

    if (!error) {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", params.id);

      fetch("/api/notify-memorial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "messages",
          record: { ...data, conversation_id: params.id },
        }),
      }).catch(() => {});

      setMessages((prev) => [...prev, data]);
      setBody("");
    }
    setSending(false);
  };

  const handleStartVideoCall = async () => {
    if (!currentUser) return;
    setStartingCall(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/create-video-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    setStartingCall(false);

    if (!res.ok || !result.url) {
      alert(result.error || "Could not start a video call. Please try again.");
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: params.id,
        sender_id: currentUser.id,
        body: `📹 Video call started: ${result.url}`,
      })
      .select()
      .single();

    if (!error) {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", params.id);

      fetch("/api/notify-memorial-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "messages",
          record: { ...data, conversation_id: params.id },
        }),
      }).catch(() => {});

      setMessages((prev) => [...prev, data]);
      window.open(result.url, "_blank");
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
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col px-4 py-6">
      <video
        src="/videos/ambient-clouds.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col h-full max-w-sm mx-auto w-full">
        <button
          onClick={() => router.push("/messages")}
          className="text-white/60 text-sm mb-3"
        >
          ← Back to Messages
        </button>

        <h1 className="text-white font-serif text-lg mb-2 text-center">
          {otherEmail}
        </h1>

        <button
          onClick={handleStartVideoCall}
          disabled={startingCall}
          className="w-full mb-4 px-4 py-2 rounded-full text-xs text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
        >
          {startingCall ? "Starting call..." : "📹 Start Video Call"}
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
          {messages.length === 0 ? (
            <p className="text-amber-50/50 text-sm text-center mt-8">
              No messages yet. Say hello.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  m.sender_id === currentUser.id
                    ? "bg-amber-500/80 text-white ml-auto"
                    : "bg-white/10 text-white border border-amber-200/20"
                }`}
              >
                {m.body.startsWith("📹 Video call started: ") ? (
                  <a
                    href={m.body.replace("📹 Video call started: ", "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    📹 Join Video Call
                  </a>
                ) : (
                  m.body
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full bg-white/90 text-gray-900 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="px-5 py-2 rounded-full bg-amber-500/90 text-white text-sm hover:bg-amber-500 transition disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

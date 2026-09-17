"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MemorialsSettings() {
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("memorials")
        .select("id, full_name, type, date_born, date_passed, created_at")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setMemorials(data);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from("memorials").delete().eq("id", id);
    setDeletingId(null);
    setConfirmId(null);

    if (!error) {
      setMemorials((prev) => prev.filter((m) => m.id !== id));
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
          onClick={() => router.push("/settings")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Settings
        </button>

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          My Memorials
        </h1>

        {memorials.length === 0 ? (
          <p className="text-amber-50/60 text-sm text-center">
            You haven't created any memorials yet.
          </p>
        ) : (
          <div className="space-y-3">
            {memorials.map((m) => (
              <div
                key={m.id}
                className="bg-white/5 border border-amber-200/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white text-sm">{m.full_name}</p>
                    <p className="text-white/40 text-xs">
                      {m.type === "pet" ? "Pet" : "Loved One"}
                    </p>
                  </div>
                  <span className="text-white/40 text-xs">
                    {m.date_born || "?"} — {m.date_passed || "?"}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/memorial/${m.id}`)}
                    className="flex-1 px-3 py-2 rounded-full text-xs text-white/80 border border-white/20 hover:bg-white/10 transition"
                  >
                    View
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/settings/memorials/${m.id}/edit`)
                    }
                    className="flex-1 px-3 py-2 rounded-full text-xs text-amber-200 border border-amber-300/30 hover:bg-amber-500/10 transition"
                  >
                    Edit
                  </button>
                  {confirmId === m.id ? (
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="flex-1 px-3 py-2 rounded-full text-xs text-white bg-red-500/80 hover:bg-red-500 transition disabled:opacity-50"
                    >
                      {deletingId === m.id ? "..." : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmId(m.id)}
                      className="flex-1 px-3 py-2 rounded-full text-xs text-red-300/80 border border-red-300/30 hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

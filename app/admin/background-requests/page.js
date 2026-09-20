"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminBackgroundRequests() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState([]);
  const [backgroundOptions, setBackgroundOptions] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [selectedBg, setSelectedBg] = useState({});
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

      const { data: reqData } = await supabase
        .from("custom_background_requests")
        .select("*, memorials(full_name)")
        .order("created_at", { ascending: false });

      setRequests(reqData || []);

      const { data: options } = await supabase
        .from("background_options")
        .select("id, name")
        .order("sort_order", { ascending: true });

      setBackgroundOptions(options || []);
      setChecking(false);
    };
    load();
  }, [router]);

  const callReview = async (payload) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/admin-review-background-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return res.json();
  };

  const handleAction = async (requestId, action) => {
    setError("");
    setProcessingId(requestId);

    const result = await callReview({
      requestId,
      action,
      adminNotes: notesDraft[requestId] || "",
      backgroundOptionId: selectedBg[requestId] || null,
    });

    setProcessingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status:
                action === "reject"
                  ? "rejected"
                  : action === "in_progress"
                  ? "in_progress"
                  : "completed",
              admin_notes: notesDraft[requestId] || r.admin_notes,
            }
          : r
      )
    );
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
          Background Requests
        </h1>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        {requests.length === 0 ? (
          <p className="text-amber-50/60 text-sm text-center">
            No requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white/5 border border-amber-200/20 rounded-xl p-3"
              >
                <p className="text-white text-xs mb-1">
                  For: {r.memorials?.full_name || "Unknown"}
                </p>
                <p className="text-white/70 text-sm mb-2">{r.description}</p>
                <p className="text-amber-200 text-xs mb-2">
                  Status: {r.status}
                </p>

                {r.status === "pending" || r.status === "in_progress" ? (
                  <div>
                    <textarea
                      rows={2}
                      value={notesDraft[r.id] || ""}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      placeholder="Notes (optional)"
                      className="w-full px-2 py-1 mb-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-xs resize-none"
                    />

                    <select
                      value={selectedBg[r.id] || ""}
                      onChange={(e) =>
                        setSelectedBg((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      className="w-full px-2 py-2 mb-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-xs"
                    >
                      <option value="">Select background to link (for Complete)</option>
                      {backgroundOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => handleAction(r.id, "in_progress")}
                          disabled={processingId === r.id}
                          className="flex-1 px-2 py-2 rounded-full text-xs text-white bg-amber-500/80 hover:bg-amber-500 transition disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(r.id, "complete")}
                        disabled={processingId === r.id || !selectedBg[r.id]}
                        className="flex-1 px-2 py-2 rounded-full text-xs text-white bg-green-600/80 hover:bg-green-600 transition disabled:opacity-50"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={processingId === r.id}
                        className="flex-1 px-2 py-2 rounded-full text-xs text-white bg-red-500/80 hover:bg-red-500 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  r.admin_notes && (
                    <p className="text-white/40 text-xs">Note: {r.admin_notes}</p>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

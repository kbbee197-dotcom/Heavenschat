"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [targetEmail, setTargetEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
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
      setChecking(false);
    };
    checkAdmin();
  }, [router]);

  const handleGrant = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!targetEmail.trim() || !amount) {
      setError("Email and amount are required.");
      return;
    }

    setSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/admin-grant-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetEmail: targetEmail.trim(),
        amount: Number(amount),
        reason: reason.trim(),
      }),
    });

    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error || "Something went wrong.");
      return;
    }

    setMessage(`Granted ${amount} tokens to ${targetEmail}. New balance: ${result.newBalance}`);
    setTargetEmail("");
    setAmount("");
    setReason("");
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
          onClick={() => router.push("/dashboard")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Admin Dashboard
        </h1>

        <button
          onClick={() => router.push("/admin/flags")}
          className="w-full mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-sm hover:bg-amber-500/20 transition"
        >
          🚩 Moderation
        </button>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}
        {message && (
          <p className="text-amber-200 text-sm mb-4 text-center">{message}</p>
        )}

        <form onSubmit={handleGrant}>
          <p className="text-white text-sm mb-3">Grant Tokens</p>

          <label className="block text-sm text-amber-50/90 mb-1">
            User Email
          </label>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
          />

          <label className="block text-sm text-amber-50/90 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
          />

          <label className="block text-sm text-amber-50/90 mb-1">
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. customer support credit"
            className="w-full px-4 py-2 mb-4 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
          >
            {submitting ? "Granting..." : "Grant Tokens"}
          </button>
        </form>
      </div>
    </main>
  );
}

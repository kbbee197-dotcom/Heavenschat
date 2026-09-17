"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TYPE_LABELS = {
  daily_bonus: "Daily Login Bonus",
  candle: "Lit a Candle",
  flower: "Sent Flowers",
  purchase: "Token Purchase",
};

export default function BillingSettings() {
  const [tokenBalance, setTokenBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
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
        .select("token_balance")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setTokenBalance(profile.token_balance || 0);
      }

      const { data: txns } = await supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setTransactions(txns || []);
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
          onClick={() => router.push("/settings")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Settings
        </button>

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Billing & Tokens
        </h1>

        <div className="mb-6 bg-amber-500/10 border border-amber-300/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-amber-50/60 text-xs mb-1">Token Balance</p>
            <p className="text-amber-200 text-2xl font-serif">{tokenBalance}</p>
          </div>
          <button
            onClick={() => router.push("/tokens")}
            className="px-4 py-2 rounded-full text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition"
          >
            Buy Tokens
          </button>
        </div>

        <p className="text-white text-sm mb-3">Transaction History</p>

        {transactions.length === 0 ? (
          <p className="text-amber-50/60 text-sm text-center">
            No transactions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-white text-sm">
                    {TYPE_LABELS[t.type] || t.description || t.type}
                  </p>
                  <p className="text-white/40 text-xs">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    t.amount >= 0 ? "text-amber-200" : "text-white/60"
                  }`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

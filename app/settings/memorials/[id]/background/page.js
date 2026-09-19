"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BackgroundSettings() {
  const router = useRouter();
  const params = useParams();
  const [memorial, setMemorial] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [options, setOptions] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: memorialData, error: memorialError } = await supabase
        .from("memorials")
        .select("id, full_name, active_background_id")
        .eq("id", params.id)
        .eq("owner_id", userData.user.id)
        .single();

      if (memorialError || !memorialData) {
        setError("Memorial not found or you don't have access.");
        setLoading(false);
        return;
      }

      setMemorial(memorialData);

      const { data: profile } = await supabase
        .from("profiles")
        .select("token_balance")
        .eq("id", userData.user.id)
        .single();

      setTokenBalance(profile?.token_balance || 0);

      const { data: optionsData } = await supabase
        .from("background_options")
        .select("*")
        .order("sort_order", { ascending: true });

      setOptions(optionsData || []);

      const { data: unlocks } = await supabase
        .from("memorial_background_unlocks")
        .select("background_id")
        .eq("memorial_id", params.id);

      setUnlockedIds((unlocks || []).map((u) => u.background_id));
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const isUnlocked = (option) =>
    option.token_cost === 0 || unlockedIds.includes(option.id);

  const handleSelect = async (option) => {
    setError("");
    setProcessingId(option.id);

    const { data: userData } = await supabase.auth.getUser();

    if (!isUnlocked(option)) {
      if (tokenBalance < option.token_cost) {
        setError(`You need ${option.token_cost} tokens for this background.`);
        setProcessingId(null);
        return;
      }

      const newBalance = tokenBalance - option.token_cost;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ token_balance: newBalance })
        .eq("id", userData.user.id);

      if (updateError) {
        setError("Something went wrong. Please try again.");
        setProcessingId(null);
        return;
      }

      await supabase.from("token_transactions").insert({
        user_id: userData.user.id,
        amount: -option.token_cost,
        type: "background",
        description: `Unlocked "${option.name}" background for ${memorial.full_name}`,
      });

      const { error: unlockError } = await supabase
        .from("memorial_background_unlocks")
        .insert({
          memorial_id: params.id,
          background_id: option.id,
        });

      if (unlockError) {
        setError(unlockError.message);
        setProcessingId(null);
        return;
      }

      setUnlockedIds((prev) => [...prev, option.id]);
      setTokenBalance(newBalance);
    }

    const { error: activateError } = await supabase
      .from("memorials")
      .update({ active_background_id: option.id })
      .eq("id", params.id);

    setProcessingId(null);

    if (activateError) {
      setError(activateError.message);
      return;
    }

    setMemorial((prev) => ({ ...prev, active_background_id: option.id }));
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

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.push("/settings/memorials")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to My Memorials
        </button>

        <h1 className="text-2xl font-serif text-center mb-2 text-white">
          Background
        </h1>
        {memorial && (
          <p className="text-amber-50/70 text-sm text-center mb-1">
            For {memorial.full_name}
          </p>
        )}
        <p className="text-amber-200 text-sm text-center mb-6">
          Token Balance: {tokenBalance}
        </p>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="space-y-3">
          {options.map((option) => {
            const unlocked = isUnlocked(option);
            const active = memorial?.active_background_id === option.id;

            return (
              <div
                key={option.id}
                className={`flex items-center justify-between rounded-xl p-3 border ${
                  active
                    ? "bg-amber-500/10 border-amber-300/50"
                    : "bg-white/5 border-amber-200/20"
                }`}
              >
                <div>
                  <p className="text-white text-sm">{option.name}</p>
                  <p className="text-white/40 text-xs">
                    {option.token_cost === 0
                      ? "Free"
                      : unlocked
                      ? "Unlocked"
                      : `${option.token_cost} tokens`}
                  </p>
                </div>
                <button
                  onClick={() => handleSelect(option)}
                  disabled={processingId === option.id || active}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                    active
                      ? "bg-amber-500 text-white"
                      : "bg-white/10 text-amber-50 border border-amber-200/50 hover:bg-white/20"
                  }`}
                >
                  {processingId === option.id
                    ? "..."
                    : active
                    ? "Active"
                    : unlocked
                    ? "Use"
                    : "Unlock"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

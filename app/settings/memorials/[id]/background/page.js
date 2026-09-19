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
  const [audioFile, setAudioFile] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [unlockingAudio, setUnlockingAudio] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: memorialData, error: memorialError } = await supabase
        .from("memorials")
        .select("id, full_name, active_background_id, custom_audio_url, custom_audio_unlocked")
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

  const handleUnlockCustomAudio = async () => {
    setError("");

    if (tokenBalance < 2000) {
      setError("You need 2000 tokens to unlock custom audio.");
      return;
    }

    setUnlockingAudio(true);

    const { data: userData } = await supabase.auth.getUser();
    const newBalance = tokenBalance - 2000;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", userData.user.id);

    if (updateError) {
      setError("Something went wrong. Please try again.");
      setUnlockingAudio(false);
      return;
    }

    await supabase.from("token_transactions").insert({
      user_id: userData.user.id,
      amount: -2000,
      type: "custom_audio_unlock",
      description: `Unlocked custom audio for ${memorial.full_name}`,
    });

    const { error: unlockError } = await supabase
      .from("memorials")
      .update({ custom_audio_unlocked: true })
      .eq("id", params.id);

    setUnlockingAudio(false);

    if (unlockError) {
      setError(unlockError.message);
      return;
    }

    setTokenBalance(newBalance);
    setMemorial((prev) => ({ ...prev, custom_audio_unlocked: true }));
  };

  const handleUploadCustomAudio = async (e) => {
    e.preventDefault();
    setError("");

    if (!audioFile) {
      setError("Please select an audio file.");
      return;
    }

    setUploadingAudio(true);

    const fileExt = audioFile.name.split(".").pop();
    const fileName = `${params.id}-custom-audio-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-voices")
      .upload(fileName, audioFile);

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploadingAudio(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("memorial-voices")
      .getPublicUrl(fileName);

    const { error: saveError } = await supabase
      .from("memorials")
      .update({ custom_audio_url: urlData.publicUrl })
      .eq("id", params.id);

    setUploadingAudio(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setMemorial((prev) => ({ ...prev, custom_audio_url: urlData.publicUrl }));
    setAudioFile(null);
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

        <div className="border-t border-amber-200/20 pt-6 mt-6">
          <p className="text-white text-sm mb-1">Your Own Music</p>
          <p className="text-white/40 text-xs mb-3">
            Upload your own audio to play instead of the background's default
            sound. One-time unlock, upload as many times as you like after.
          </p>

          <a
            href="https://pixabay.com/music/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-amber-200/80 text-xs underline hover:text-amber-200 mb-4"
          >
            Browse free music on Pixabay →
          </a>

          {!memorial.custom_audio_unlocked ? (
            <button
              onClick={handleUnlockCustomAudio}
              disabled={unlockingAudio}
              className="w-full px-4 py-3 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
            >
              {unlockingAudio ? "Unlocking..." : "Unlock for 2000 tokens"}
            </button>
          ) : (
            <div>
              {memorial.custom_audio_url && (
                <div className="bg-white/5 border border-amber-200/20 rounded-xl p-3 mb-3">
                  <p className="text-white/60 text-xs mb-2">Current audio:</p>
                  <audio controls src={memorial.custom_audio_url} className="w-full" />
                </div>
              )}

              <form onSubmit={handleUploadCustomAudio}>
                <label className="flex items-center justify-center w-full px-4 py-3 mb-2 rounded-xl border border-dashed border-amber-200/50 text-amber-50/70 text-sm cursor-pointer hover:bg-white/10 transition">
                  {audioFile ? audioFile.name : "Tap to choose an audio file"}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  disabled={uploadingAudio}
                  className="w-full px-4 py-2 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
                >
                  {uploadingAudio ? "Uploading..." : "Upload Audio"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

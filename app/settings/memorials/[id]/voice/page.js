"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const CONSENT_STATEMENT =
  "I confirm that I have the legal right to use this voice recording, that I have obtained any necessary consent from the person whose voice this is (or their legal next of kin if deceased), and I authorize Heavens Chat to use this recording to generate synthetic speech for this memorial.";

export default function VoiceSettings() {
  const router = useRouter();
  const params = useParams();
  const [memorial, setMemorial] = useState(null);
  const [existingVoice, setExistingVoice] = useState(null);
  const [clips, setClips] = useState([]);
  const [clipFile, setClipFile] = useState(null);
  const [clipCaption, setClipCaption] = useState("");
  const [uploadingClip, setUploadingClip] = useState(false);
  const [clipError, setClipError] = useState("");
  const [file, setFile] = useState(null);
  const [consentName, setConsentName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: memorialData, error: memorialError } = await supabase
        .from("memorials")
        .select("id, full_name")
        .eq("id", params.id)
        .eq("owner_id", userData.user.id)
        .single();

      if (memorialError || !memorialData) {
        setError("Memorial not found or you don't have access.");
        setLoading(false);
        return;
      }

      setMemorial(memorialData);

      const { data: voiceData } = await supabase
        .from("memorial_voices")
        .select("*")
        .eq("memorial_id", params.id)
        .maybeSingle();

      setExistingVoice(voiceData || null);

      const { data: clipsData } = await supabase
        .from("voice_clips")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: false });

      setClips(clipsData || []);
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select an audio file.");
      return;
    }
    if (!consentName.trim()) {
      setError("Please type your full name to confirm consent.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the consent statement to continue.");
      return;
    }

    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();
    const fileExt = file.name.split(".").pop();
    const fileName = `${params.id}-sample-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-voices")
      .upload(fileName, file);

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("memorial-voices")
      .getPublicUrl(fileName);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/create-voice-clone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        memorialId: params.id,
        sampleUrl: urlData.publicUrl,
        consentName: consentName.trim(),
        consentText: CONSENT_STATEMENT,
        voiceName: memorial.full_name,
      }),
    });

    const result = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(result.error || "Something went wrong creating the voice.");
      return;
    }

    setExistingVoice({
      elevenlabs_voice_id: result.voiceId,
      consent_confirmed: true,
      consent_name: consentName.trim(),
    });
  };

  const handleClipUpload = async (e) => {
    e.preventDefault();
    setClipError("");

    if (!clipFile) {
      setClipError("Please select an audio file.");
      return;
    }

    setUploadingClip(true);

    const fileExt = clipFile.name.split(".").pop();
    const fileName = `${params.id}-clip-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-voices")
      .upload(fileName, clipFile);

    if (uploadError) {
      setClipError("Upload failed: " + uploadError.message);
      setUploadingClip(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("memorial-voices")
      .getPublicUrl(fileName);

    const { data, error: insertError } = await supabase
      .from("voice_clips")
      .insert({
        memorial_id: params.id,
        clip_url: urlData.publicUrl,
        caption: clipCaption.trim() || null,
      })
      .select()
      .single();

    setUploadingClip(false);

    if (insertError) {
      setClipError(insertError.message);
      return;
    }

    setClips((prev) => [data, ...prev]);
    setClipFile(null);
    setClipCaption("");
  };

  const handleDeleteClip = async (clipId) => {
    const { error } = await supabase.from("voice_clips").delete().eq("id", clipId);
    if (!error) {
      setClips((prev) => prev.filter((c) => c.id !== clipId));
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

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.push("/settings/memorials")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to My Memorials
        </button>

        <h1 className="text-2xl font-serif text-center mb-2 text-white">
          Voice
        </h1>
        {memorial && (
          <p className="text-amber-50/70 text-sm text-center mb-6">
            For {memorial.full_name}
          </p>
        )}

        <div className="mb-8">
          <p className="text-white text-sm mb-1">Voice Clips</p>
          <p className="text-white/40 text-xs mb-3">
            Upload real recordings (a voicemail, a hello, an "I love you") that
            visitors can play on the memorial page.
          </p>

          {clipError && (
            <p className="text-red-300 text-xs mb-3">{clipError}</p>
          )}

          {clips.length > 0 && (
            <div className="space-y-2 mb-4">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-white/5 border border-amber-200/20 rounded-xl p-3"
                >
                  <audio controls src={clip.clip_url} className="w-full mb-2" />
                  <div className="flex items-center justify-between">
                    <p className="text-white/60 text-xs">
                      {clip.caption || "Untitled clip"}
                    </p>
                    <button
                      onClick={() => handleDeleteClip(clip.id)}
                      className="text-red-300/70 text-xs hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleClipUpload}>
            <label className="flex items-center justify-center w-full px-4 py-3 mb-2 rounded-xl border border-dashed border-amber-200/50 text-amber-50/70 text-sm cursor-pointer hover:bg-white/10 transition">
              {clipFile ? clipFile.name : "Tap to choose an audio file"}
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setClipFile(e.target.files[0])}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={clipCaption}
              onChange={(e) => setClipCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full px-3 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
            <button
              type="submit"
              disabled={uploadingClip}
              className="w-full px-4 py-2 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
            >
              {uploadingClip ? "Uploading..." : "Add Clip"}
            </button>
          </form>
        </div>

        <div className="border-t border-amber-200/20 pt-6 mb-2">
          <p className="text-white text-sm mb-1">AI Voice (Coming Soon)</p>
          <p className="text-white/40 text-xs mb-4">
            Let visitors have a conversation and hear responses in{" "}
            {memorial?.full_name}'s voice. This feature is temporarily
            disabled while we finalize setup.
          </p>
        </div>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        {existingVoice?.elevenlabs_voice_id ? (
          <div className="bg-amber-500/10 border border-amber-300/30 rounded-xl p-4 mb-4">
            <p className="text-white text-sm mb-1">Voice is set up</p>
            <p className="text-white/50 text-xs">
              Consented by: {existingVoice.consent_name}
            </p>
            <p className="text-white/40 text-xs mt-2">
              Visitors can now hear from {memorial?.full_name} on the memorial page.
              Uploading a new file below will replace the current voice.
            </p>
          </div>
        ) : (
          <p className="text-amber-50/60 text-sm text-center mb-4">
            No voice set up yet. Upload a clear audio recording (at least 30
            seconds) to enable this feature.
          </p>
        )}

        <form onSubmit={handleUpload}>
          <label className="block text-sm text-amber-50/90 mb-1">
            Audio Sample
          </label>
          <label className="flex items-center justify-center w-full px-4 py-3 mb-4 rounded-xl border border-dashed border-amber-200/50 text-amber-50/70 text-sm cursor-pointer hover:bg-white/10 transition">
            {file ? file.name : "Tap to choose an audio file"}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>

          <div className="bg-black/30 border border-amber-200/20 rounded-xl p-4 mb-4">
            <p className="text-white/70 text-xs leading-relaxed mb-3">
              {CONSENT_STATEMENT}
            </p>

            <label className="block text-sm text-amber-50/90 mb-1">
              Type your full legal name to confirm
            </label>
            <input
              type="text"
              value={consentName}
              onChange={(e) => setConsentName(e.target.value)}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />

            <label className="flex items-start gap-2 text-xs text-amber-50/90">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5"
              />
              I have read and agree to the statement above.
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
          >
            {uploading ? "Processing..." : "Upload & Create Voice"}
          </button>
        </form>
      </div>
    </main>
  );
}

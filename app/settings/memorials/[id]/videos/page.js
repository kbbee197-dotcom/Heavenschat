"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function VideosSettings() {
  const router = useRouter();
  const params = useParams();
  const [memorial, setMemorial] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [videos, setVideos] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [caption, setCaption] = useState("");
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("token_balance")
        .eq("id", userData.user.id)
        .single();

      setTokenBalance(profile?.token_balance || 0);

      const { data: videosData } = await supabase
        .from("memorial_videos")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: true });

      setVideos(videosData || []);
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");

    if (!videoFile) {
      setError("Please select a video file.");
      return;
    }

    const isFirstVideo = videos.length === 0;
    const cost = isFirstVideo ? 0 : 100;

    if (!isFirstVideo && tokenBalance < cost) {
      setError(`You need ${cost} tokens to add another video.`);
      return;
    }

    setUploading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!isFirstVideo) {
      const newBalance = tokenBalance - cost;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ token_balance: newBalance })
        .eq("id", userData.user.id);

      if (updateError) {
        setError("Something went wrong. Please try again.");
        setUploading(false);
        return;
      }

      await supabase.from("token_transactions").insert({
        user_id: userData.user.id,
        amount: -cost,
        type: "memorial_video",
        description: `Added a video to ${memorial.full_name}`,
      });

      setTokenBalance(newBalance);
    }

    const fileExt = videoFile.name.split(".").pop();
    const fileName = `${params.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("memorial-videos")
      .upload(fileName, videoFile);

    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("memorial-videos")
      .getPublicUrl(fileName);

    const { data, error: insertError } = await supabase
      .from("memorial_videos")
      .insert({
        memorial_id: params.id,
        video_url: urlData.publicUrl,
        caption: caption.trim() || null,
      })
      .select()
      .single();

    setUploading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setVideos((prev) => [...prev, data]);
    setVideoFile(null);
    setCaption("");
  };

  const handleDelete = async (videoId) => {
    const { error } = await supabase.from("memorial_videos").delete().eq("id", videoId);
    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading...</p>
      </main>
    );
  }

  const nextCost = videos.length === 0 ? 0 : 100;

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
          Videos
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

        {videos.length > 0 && (
          <div className="space-y-3 mb-6">
            {videos.map((v) => (
              <div
                key={v.id}
                className="bg-white/5 border border-amber-200/20 rounded-xl p-3"
              >
                <video controls src={v.video_url} className="w-full rounded-lg mb-2" />
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs">
                    {v.caption || "Untitled video"}
                  </p>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-red-300/70 text-xs hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-300/30 rounded-xl p-3 mb-4">
          <p className="text-amber-200 text-xs">
            {videos.length === 0
              ? "Your first video is free."
              : `This video will cost ${nextCost} tokens.`}
          </p>
        </div>

        <form onSubmit={handleUpload}>
          <label className="flex items-center justify-center w-full px-4 py-3 mb-2 rounded-xl border border-dashed border-amber-200/50 text-amber-50/70 text-sm cursor-pointer hover:bg-white/10 transition">
            {videoFile ? videoFile.name : "Tap to choose a video file"}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-3 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Add Video"}
          </button>
        </form>
      </div>
    </main>
  );
}

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

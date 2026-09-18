"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NotificationSettings() {
  const [notifyOnTribute, setNotifyOnTribute] = useState(true);
  const [notifyOnGift, setNotifyOnGift] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
        .select("notify_on_tribute, notify_on_gift")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setNotifyOnTribute(profile.notify_on_tribute);
        setNotifyOnGift(profile.notify_on_gift);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const handleToggle = async (field, value, setter) => {
    setter(value);
    setSaved(false);
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", userData.user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
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
          Notifications
        </h1>

        <p className="text-amber-50/70 text-sm text-center mb-6">
          Choose which activity on your memorials sends you an email.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-4 py-4">
            <div className="pr-4">
              <p className="text-white text-sm">New Tributes</p>
              <p className="text-white/40 text-xs">
                Email me when someone leaves a message
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("notify_on_tribute", !notifyOnTribute, setNotifyOnTribute)
              }
              className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
                notifyOnTribute ? "bg-amber-500 justify-end" : "bg-white/20 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white block" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-4 py-4">
            <div className="pr-4">
              <p className="text-white text-sm">Candles & Flowers</p>
              <p className="text-white/40 text-xs">
                Email me when someone sends a gift
              </p>
            </div>
            <button
              onClick={() =>
                handleToggle("notify_on_gift", !notifyOnGift, setNotifyOnGift)
              }
              className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
                notifyOnGift ? "bg-amber-500 justify-end" : "bg-white/20 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white block" />
            </button>
          </div>
        </div>

        {saving && (
          <p className="text-white/40 text-xs text-center">Saving...</p>
        )}
        {saved && !saving && (
          <p className="text-amber-200 text-xs text-center">Preferences saved.</p>
        )}
      </div>
    </main>
  );
}

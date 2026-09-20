"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditMemorial() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", params.id)
        .eq("owner_id", userData.user.id)
        .single();

      if (fetchError || !data) {
        setError("Memorial not found or you don't have access to edit it.");
        setLoading(false);
        return;
      }

      setForm(data);
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("memorials")
      .update({
        full_name: form.full_name,
        nicknames: form.nicknames,
        date_born: form.date_born || null,
        date_passed: form.date_passed || null,
        location_city: form.location_city,
        location_state: form.location_state,
        relation_notes: form.relation_notes,
        story: form.story,
        is_public: form.is_public,
      })
      .eq("id", params.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
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

  if (error && !form) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <p className="text-red-300 text-sm text-center">{error}</p>
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

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Edit Memorial
        </h1>

        <button
          onClick={() => router.push(`/settings/memorials/${params.id}/voice`)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-sm hover:bg-amber-500/20 transition"
        >
          🎙️ Set Up Voice
        </button>

        <button
          onClick={() => router.push(`/settings/memorials/${params.id}/background`)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-sm hover:bg-amber-500/20 transition"
        >
          🖼️ Change Background
        </button>

        <button
          onClick={() => router.push(`/settings/memorials/${params.id}/videos`)}
          className="w-full mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-sm hover:bg-amber-500/20 transition"
        >
          🎬 Manage Videos
        </button>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}

        <label className="block text-sm text-amber-50/90 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={form.full_name || ""}
          onChange={(e) => updateField("full_name", e.target.value)}
          className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <label className="block text-sm text-amber-50/90 mb-1">
          Nicknames
        </label>
        <input
          type="text"
          value={form.nicknames || ""}
          onChange={(e) => updateField("nicknames", e.target.value)}
          className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm text-amber-50/90 mb-1">
              Born
            </label>
            <input
              type="date"
              value={form.date_born || ""}
              onChange={(e) => updateField("date_born", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-amber-50/90 mb-1">
              Passed
            </label>
            <input
              type="date"
              value={form.date_passed || ""}
              onChange={(e) => updateField("date_passed", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm text-amber-50/90 mb-1">
              City
            </label>
            <input
              type="text"
              value={form.location_city || ""}
              onChange={(e) => updateField("location_city", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-amber-50/90 mb-1">
              State
            </label>
            <input
              type="text"
              value={form.location_state || ""}
              onChange={(e) => updateField("location_state", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
            />
          </div>
        </div>

        <label className="block text-sm text-amber-50/90 mb-1">
          Relations
        </label>
        <input
          type="text"
          value={form.relation_notes || ""}
          onChange={(e) => updateField("relation_notes", e.target.value)}
          className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <label className="block text-sm text-amber-50/90 mb-1">
          Story
        </label>
        <textarea
          rows={6}
          value={form.story || ""}
          onChange={(e) => updateField("story", e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />

        <label className="flex items-center gap-2 mb-6 text-sm text-amber-50/90">
          <input
            type="checkbox"
            checked={form.is_public || false}
            onChange={(e) => updateField("is_public", e.target.checked)}
          />
          Make this memorial publicly searchable
        </label>

        {saved && (
          <p className="text-amber-200 text-sm text-center mb-3">
            Changes saved.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

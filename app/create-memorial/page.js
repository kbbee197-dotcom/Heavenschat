"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CreateMemorial() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    type: "person",
    full_name: "",
    nicknames: "",
    date_born: "",
    date_passed: "",
    location_city: "",
    location_state: "",
    relation_notes: "",
    story: "",
    is_public: true,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        setUserId(data.user.id);
      }
    };
    checkUser();
  }, [router]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { data: memorial, error: insertError } = await supabase
      .from("memorials")
      .insert({
        owner_id: userId,
        type: form.type,
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
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `${memorial.id}-main.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("memorial-photos")
        .upload(fileName, photoFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("memorial-photos")
          .getPublicUrl(fileName);

        await supabase.from("memorial_photos").insert({
          memorial_id: memorial.id,
          photo_url: urlData.publicUrl,
          caption: "Main photo",
        });
      }
    }

    setLoading(false);
    router.push("/dashboard");
  };

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
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full ${
                s <= step ? "bg-amber-300" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-300 text-sm mb-4 text-center">{error}</p>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-white text-xl font-serif text-center mb-1">
              Basic Information
            </h2>
            <p className="text-amber-50/70 text-sm text-center mb-6">
              Who are you creating this memorial for?
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => updateField("type", "person")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  form.type === "person"
                    ? "bg-amber-500 text-white"
                    : "bg-white/20 text-white/70"
                }`}
              >
                Person
              </button>
              <button
                onClick={() => updateField("type", "pet")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  form.type === "pet"
                    ? "bg-amber-500 text-white"
                    : "bg-white/20 text-white/70"
                }`}
              >
                Pet
              </button>
            </div>

            <label className="block text-sm text-amber-50/90 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <label className="block text-sm text-amber-50/90 mb-1">
              Nicknames (optional)
            </label>
            <input
              type="text"
              value={form.nicknames}
              onChange={(e) => updateField("nicknames", e.target.value)}
              className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-sm text-amber-50/90 mb-1">
                  Born
                </label>
                <input
                  type="date"
                  value={form.date_born}
                  onChange={(e) => updateField("date_born", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-amber-50/90 mb-1">
                  Passed
                </label>
                <input
                  type="date"
                  value={form.date_passed}
                  onChange={(e) => updateField("date_passed", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
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
                  value={form.location_city}
                  onChange={(e) => updateField("location_city", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-amber-50/90 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={form.location_state}
                  onChange={(e) => updateField("location_state", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
            </div>

            <label className="block text-sm text-amber-50/90 mb-1">
              Relations (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. spouse of Jane Doe, father of..."
              value={form.relation_notes}
              onChange={(e) => updateField("relation_notes", e.target.value)}
              className="w-full px-4 py-2 mb-4 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <button
              onClick={nextStep}
              disabled={!form.full_name}
              className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-white text-xl font-serif text-center mb-1">
              Their Story
            </h2>
            <p className="text-amber-50/70 text-sm text-center mb-6">
              Share who they were and what made them special.
            </p>

            <textarea
              rows={8}
              value={form.story}
              onChange={(e) => updateField("story", e.target.value)}
              placeholder="Tell their story..."
              className="w-full px-4 py-3 mb-4 rounded-lg bg-white/90 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />

            <label className="flex items-center gap-2 mb-6 text-sm text-amber-50/90">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => updateField("is_public", e.target.checked)}
              />
              Make this memorial publicly searchable
            </label>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-white text-xl font-serif text-center mb-1">
              Add a Photo
            </h2>
            <p className="text-amber-50/70 text-sm text-center mb-6">
              Choose a photo that captures their spirit.
            </p>

            <div className="flex flex-col items-center mb-6">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-xl mb-4 border border-amber-200/50"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl mb-4 border border-dashed border-amber-200/50 flex items-center justify-center text-amber-50/50 text-sm">
                  No photo yet
                </div>
              )}

              <label className="px-6 py-2 rounded-full text-sm font-medium bg-white/20 text-white cursor-pointer hover:bg-white/30 transition">
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
              >
                {loading ? "Creating..." : "Create Memorial"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

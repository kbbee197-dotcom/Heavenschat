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

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [checkingLimit, setCheckingLimit] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);

      const { count } = await supabase
        .from("memorials")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", data.user.id);

      if (count && count >= 1) {
        router.push("/dashboard?limit=free-plot-used");
        return;
      }

      setCheckingLimit(false);
    };
    checkUser();
  }, [router]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const combined = [...photoFiles, ...newFiles].slice(0, 3);
    setPhotoFiles(combined);
    setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (index) => {
    const updatedFiles = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(updatedFiles);
    setPhotoPreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
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

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${memorial.id}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("memorial-photos")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Photo upload failed:", uploadError.message);
        setError("Photo upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("memorial-photos")
        .getPublicUrl(fileName);

      await supabase.from("memorial_photos").insert({
        memorial_id: memorial.id,
        photo_url: urlData.publicUrl,
        caption: i === 0 ? "Main photo" : `Photo ${i + 1}`,
      });
    }

    setLoading(false);
    router.push("/dashboard");
  };

  if (checkingLimit) {
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
              className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <label className="block text-sm text-amber-50/90 mb-1">
              Nicknames (optional)
            </label>
            <input
              type="text"
              value={form.nicknames}
              onChange={(e) => updateField("nicknames", e.target.value)}
              className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <div className="mb-3">
              <label className="block text-sm text-amber-50/90 mb-1">Born</label>
              <div className="flex gap-2">
                <select
                  value={form.date_born ? form.date_born.split("-")[1] : ""}
                  onChange={(e) => {
                    const y = form.date_born ? form.date_born.split("-")[0] : "1990";
                    const d = form.date_born ? form.date_born.split("-")[2] : "01";
                    updateField("date_born", `${y}-${e.target.value}-${d}`);
                  }}
                  className="flex-1 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Month</option>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                    <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</option>
                  ))}
                </select>
                <select
                  value={form.date_born ? form.date_born.split("-")[2] : ""}
                  onChange={(e) => {
                    const y = form.date_born ? form.date_born.split("-")[0] : "1990";
                    const m = form.date_born ? form.date_born.split("-")[1] : "01";
                    updateField("date_born", `${y}-${m}-${e.target.value}`);
                  }}
                  className="w-20 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={form.date_born ? form.date_born.split("-")[0] : ""}
                  onChange={(e) => {
                    const m = form.date_born ? form.date_born.split("-")[1] : "01";
                    const d = form.date_born ? form.date_born.split("-")[2] : "01";
                    updateField("date_born", `${e.target.value}-${m}-${d}`);
                  }}
                  className="w-24 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 130 }, (_, i) => 2026 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-amber-50/90 mb-1">Passed</label>
              <div className="flex gap-2">
                <select
                  value={form.date_passed ? form.date_passed.split("-")[1] : ""}
                  onChange={(e) => {
                    const y = form.date_passed ? form.date_passed.split("-")[0] : "2026";
                    const d = form.date_passed ? form.date_passed.split("-")[2] : "01";
                    updateField("date_passed", `${y}-${e.target.value}-${d}`);
                  }}
                  className="flex-1 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Month</option>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                    <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</option>
                  ))}
                </select>
                <select
                  value={form.date_passed ? form.date_passed.split("-")[2] : ""}
                  onChange={(e) => {
                    const y = form.date_passed ? form.date_passed.split("-")[0] : "2026";
                    const m = form.date_passed ? form.date_passed.split("-")[1] : "01";
                    updateField("date_passed", `${y}-${m}-${e.target.value}`);
                  }}
                  className="w-20 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={form.date_passed ? form.date_passed.split("-")[0] : ""}
                  onChange={(e) => {
                    const m = form.date_passed ? form.date_passed.split("-")[1] : "01";
                    const d = form.date_passed ? form.date_passed.split("-")[2] : "01";
                    updateField("date_passed", `${e.target.value}-${m}-${d}`);
                  }}
                  className="w-24 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 130 }, (_, i) => 2026 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
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
                  className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
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
              className="w-full px-4 py-2 mb-4 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className="w-full px-4 py-3 mb-4 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
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
              Add Photos
            </h2>
            <p className="text-amber-50/70 text-sm text-center mb-2">
              Choose up to 3 photos that capture their spirit.
            </p>
            <p className="text-amber-200/60 text-xs text-center mb-6">
              {photoPreviews.length}/3 free photos used
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl border border-amber-200/50"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photoPreviews.length < 3 && (
                <label className="aspect-square rounded-xl border border-dashed border-amber-200/50 flex items-center justify-center text-amber-50/50 text-2xl cursor-pointer hover:bg-white/10 transition">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <p className="text-amber-50/40 text-xs text-center mb-6">
              Want more? Upgrade to add unlimited photos.
            </p>

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

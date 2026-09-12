"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MemorialPage() {
  const params = useParams();
  const [memorial, setMemorial] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [tributes, setTributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadMemorial = async () => {
      const { data: memorialData } = await supabase
        .from("memorials")
        .select("*")
        .eq("id", params.id)
        .single();

      setMemorial(memorialData);

      const { data: photoData } = await supabase
        .from("memorial_photos")
        .select("photo_url")
        .eq("memorial_id", params.id)
        .limit(1)
        .single();

      setPhoto(photoData);

      const { data: tributeData } = await supabase
        .from("tributes")
        .select("*")
        .eq("memorial_id", params.id)
        .order("created_at", { ascending: false });

      setTributes(tributeData || []);
      setLoading(false);
    };

    if (params.id) loadMemorial();
  }, [params.id]);

  const handleAddTribute = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("tributes")
      .insert({
        memorial_id: params.id,
        author_name: authorName,
        message: message,
      })
      .select()
      .single();

    if (!error) {
      setTributes([data, ...tributes]);
      setAuthorName("");
      setMessage("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading memorial...</p>
      </main>
    );
  }

  if (!memorial) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <p className="text-amber-50/70 text-sm text-center">
          This memorial could not be found.
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-amber-100 via-amber-50 to-white">
      <div className="relative z-10 flex flex-col items-center px-6 py-16 max-w-md mx-auto">
        <p className="text-amber-700/70 text-xs tracking-widest uppercase font-light mb-3">
          {memorial.type === "pet" ? "In Loving Memory" : "In Loving Memory"}
        </p>

        {photo && (
          <img
            src={photo.photo_url}
            alt={memorial.full_name}
            className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-amber-200 shadow-lg"
          />
        )}

        <h1 className="text-gray-900 text-3xl font-serif mb-1 text-center">
          {memorial.full_name}
        </h1>
        {memorial.nicknames && (
          <p className="text-gray-500 text-sm mb-2 text-center">
            &ldquo;{memorial.nicknames}&rdquo;
          </p>
        )}
        <p className="text-gray-600 text-sm mb-1 text-center">
          {memorial.date_born && memorial.date_passed
            ? `${memorial.date_born} — ${memorial.date_passed}`
            : ""}
        </p>
        {(memorial.location_city || memorial.location_state) && (
          <p className="text-gray-500 text-xs mb-6 text-center">
            {[memorial.location_city, memorial.location_state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        {memorial.story && (
          <div className="w-full bg-white/70 backdrop-blur-sm border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {memorial.story}
            </p>
          </div>
        )}

        <h2 className="text-gray-800 font-serif text-lg mb-4 self-start">
          Tributes
        </h2>

        <form
          onSubmit={handleAddTribute}
          className="w-full bg-white/70 backdrop-blur-sm border border-amber-200 rounded-xl p-4 mb-6 shadow-sm"
        >
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-amber-200 text-sm text-gray-900"
          />
          <textarea
            placeholder="Leave a message..."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 mb-2 rounded-lg border border-amber-200 text-sm text-gray-900 resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Leave a Tribute"}
          </button>
        </form>

        <div className="w-full space-y-3">
          {tributes.length === 0 && (
            <p className="text-gray-500 text-sm text-center">
              Be the first to leave a tribute.
            </p>
          )}
          {tributes.map((t) => (
            <div
              key={t.id}
              className="bg-white/70 backdrop-blur-sm border border-amber-200 rounded-xl px-4 py-3 shadow-sm"
            >
              <p className="text-amber-700 text-xs font-medium mb-1">
                {t.author_name}
              </p>
              <p className="text-gray-700 text-sm">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Search() {
  const [name, setName] = useState("");
  const [dateBorn, setDateBorn] = useState("");
  const [datePassed, setDatePassed] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearched(true);

    let query = supabase
      .from("memorials")
      .select("id, full_name, nicknames, type, date_born, date_passed, location_city, location_state")
      .eq("is_public", true);

    if (name.trim()) {
      query = query.or(`full_name.ilike.%${name.trim()}%,nicknames.ilike.%${name.trim()}%`);
    }
    if (dateBorn) {
      query = query.eq("date_born", dateBorn);
    }
    if (datePassed) {
      query = query.eq("date_passed", datePassed);
    }

    const { data, error } = await query.order("full_name", { ascending: true });

    setResults(error ? [] : data || []);
    setSearching(false);
  };

  if (checkingAuth) {
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
          onClick={() => router.push("/dashboard")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-serif text-center mb-2 text-white">
          Find a Memorial
        </h1>
        <p className="text-amber-50/70 text-sm text-center mb-6">
          Search by name, birth date, or date passed.
        </p>

        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-sm text-amber-50/90 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name or nickname"
            className="w-full px-4 py-2 mb-3 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-amber-50/90 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateBorn}
                onChange={(e) => setDateBorn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-amber-50/90 mb-1">
                Date Passed
              </label>
              <input
                type="date"
                value={datePassed}
                onChange={(e) => setDatePassed(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 disabled:opacity-40"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {searched && (
          <div>
            {results.length === 0 ? (
              <p className="text-amber-50/60 text-sm text-center">
                No memorials found.
              </p>
            ) : (
              <div className="space-y-3">
                {results.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/memorial/${m.id}`)}
                    className="w-full text-left bg-white/5 border border-amber-200/20 rounded-xl p-4 hover:bg-white/10 transition"
                  >
                    <p className="text-white text-sm">{m.full_name}</p>
                    {m.nicknames && (
                      <p className="text-white/50 text-xs">"{m.nicknames}"</p>
                    )}
                    <div className="flex justify-between mt-1">
                      <span className="text-white/40 text-xs">
                        {m.type === "pet" ? "Pet" : "Loved One"}
                      </span>
                      <span className="text-white/40 text-xs">
                        {m.date_born || "?"} — {m.date_passed || "?"}
                      </span>
                    </div>
                    {(m.location_city || m.location_state) && (
                      <p className="text-white/40 text-xs mt-1">
                        {m.location_city}
                        {m.location_city && m.location_state ? ", " : ""}
                        {m.location_state}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

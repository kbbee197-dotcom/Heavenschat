"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const YEARS = Array.from({ length: 130 }, (_, i) => 2026 - i);

export default function Search() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
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

  const updateDatePart = (which, part, value) => {
    const current = which === "born" ? dateBorn : datePassed;
    const setter = which === "born" ? setDateBorn : setDatePassed;
    const [y, m, d] = current ? current.split("-") : ["", "", ""];
    const parts = { y, m, d, [part]: value };
    if (parts.y && parts.m && parts.d) {
      setter(`${parts.y}-${parts.m}-${parts.d}`);
    } else {
      setter("");
    }
  };

  const getDatePart = (which, part) => {
    const current = which === "born" ? dateBorn : datePassed;
    if (!current) return "";
    const [y, m, d] = current.split("-");
    return { y, m, d }[part];
  };

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
    if (city.trim()) {
      query = query.ilike("location_city", `%${city.trim()}%`);
    }
    if (state.trim()) {
      query = query.ilike("location_state", `%${state.trim()}%`);
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

  const DateDropdowns = ({ which, label }) => (
    <div className="mb-4">
      <label className="block text-sm text-amber-50/90 mb-1">{label}</label>
      <div className="flex gap-2">
        <select
          value={getDatePart(which, "m")}
          onChange={(e) => updateDatePart(which, "m", e.target.value)}
          className="flex-1 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={m}>{MONTH_LABELS[i]}</option>
          ))}
        </select>
        <select
          value={getDatePart(which, "d")}
          onChange={(e) => updateDatePart(which, "d", e.target.value)}
          className="w-20 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
        >
          <option value="">Day</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={getDatePart(which, "y")}
          onChange={(e) => updateDatePart(which, "y", e.target.value)}
          className="w-24 px-2 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
        >
          <option value="">Year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );

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
          Search by name, location, or dates.
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
              <label className="block text-sm text-amber-50/90 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-amber-50/90 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
              />
            </div>
          </div>

          <DateDropdowns which="born" label="Date of Birth" />
          <DateDropdowns which="passed" label="Date Passed" />

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

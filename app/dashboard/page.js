"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const [memorials, setMemorials] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hitLimit = searchParams.get("limit") === "free-plot-used";

  useEffect(() => {
    const loadData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("memorials")
        .select("id, full_name, type, date_born, date_passed, created_at")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setMemorials(data);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("token_balance, last_login_bonus, is_admin")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setIsAdmin(profile.is_admin || false);
        const today = new Date().toISOString().split("T")[0];
        if (profile.last_login_bonus !== today) {
          const newBalance = (profile.token_balance || 0) + 5;
          await supabase
            .from("profiles")
            .update({ token_balance: newBalance, last_login_bonus: today })
            .eq("id", userData.user.id);

          await supabase.from("token_transactions").insert({
            user_id: userData.user.id,
            amount: 5,
            type: "daily_bonus",
            description: "Daily login bonus",
          });

          setTokenBalance(newBalance);
        } else {
          setTokenBalance(profile.token_balance || 0);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

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

      <div className="relative z-10 w-full max-w-md">
        {hitLimit && (
          <div className="bg-amber-500/20 border border-amber-300/50 rounded-xl px-4 py-3 mb-4 text-center">
            <p className="text-amber-50 text-sm">
              Your free plot is already in use. Upgrade to create additional memorials.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-4 mb-3">
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="text-amber-300 text-xs underline hover:text-amber-200"
            >
              Admin
            </button>
          )}
          <button
            onClick={() => router.push("/settings")}
            className="text-amber-50/70 text-xs underline hover:text-amber-50"
          >
            Settings
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-serif text-center mb-2 text-white">
            Your Memorials
          </h1>
          <p className="text-amber-50/70 text-sm text-center mb-6">
            Manage the memorials you&apos;ve created.
          </p>

          <button
            onClick={() => router.push("/create-memorial")}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300 mb-3"
          >
            Create a New Memorial
          </button>

          <button
            onClick={() => router.push("/search")}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 hover:bg-white/20 transition-all duration-300 mb-3"
          >
            Find a Memorial
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 hover:bg-white/20 transition-all duration-300"
          >
            Messages
          </button>
        </div>

        {loading && (
          <p className="text-center text-amber-50/70 text-sm">Loading...</p>
        )}

        {!loading && memorials.length === 0 && (
          <p className="text-center text-amber-50/70 text-sm">
            You haven&apos;t created any memorials yet.
          </p>
        )}

        {!loading &&
          memorials.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/memorial/${m.id}`)}
              className="w-full text-left bg-white/10 backdrop-blur-md border border-amber-200/20 rounded-xl px-4 py-3 mb-3 hover:bg-white/20 transition"
            >
              <p className="text-white font-serif text-lg">{m.full_name}</p>
              <p className="text-amber-50/60 text-xs">
                {m.type === "pet" ? "Pet" : "Person"}
                {m.date_born && ` · Born ${m.date_born}`}
                {m.date_passed && ` · Passed ${m.date_passed}`}
              </p>
            </button>
          ))}
      </div>
    </main>
  );
}

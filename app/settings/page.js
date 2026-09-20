"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Settings() {
  const [email, setEmail] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      setEmail(userData.user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("token_balance")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setTokenBalance(profile.token_balance || 0);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-amber-50/70 text-sm">Loading...</p>
      </main>
    );
  }

  const menuItems = [
    { label: "Account", href: "/settings/account", icon: "👤" },
    { label: "Friends", href: "/settings/friends", icon: "🤝" },
    { label: "My Memorials", href: "/settings/memorials", icon: "🕊️" },
    { label: "Billing & Tokens", href: "/settings/billing", icon: "💰" },
    { label: "Notifications", href: "/settings/notifications", icon: "🔔" },
    { label: "Sound", href: "/settings/sound", icon: "🔊" },
  ];

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
        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Settings
        </h1>

        <div className="mb-4">
          <p className="text-amber-50/60 text-xs mb-1">Email</p>
          <p className="text-white text-sm">{email}</p>
        </div>

        <div className="mb-6 bg-amber-500/10 border border-amber-300/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-amber-50/60 text-xs mb-1">Token Balance</p>
            <p className="text-amber-200 text-2xl font-serif">{tokenBalance}</p>
          </div>
          <button
            onClick={() => router.push("/settings/billing")}
            className="px-4 py-2 rounded-full text-xs font-medium bg-amber-500/80 text-white hover:bg-amber-500 transition"
          >
            Buy Tokens
          </button>
        </div>

        <div className="mb-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-amber-200/20 hover:bg-white/10 transition text-left"
            >
              <span className="flex items-center gap-3 text-white text-sm">
                <span>{item.icon}</span>
                {item.label}
              </span>
              <span className="text-white/40 text-sm">›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 hover:bg-white/20 transition-all duration-300 mb-3"
        >
          Back to Dashboard
        </button>

        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 rounded-full text-sm text-red-300/80 hover:text-red-300 transition"
        >
          Log Out
        </button>
      </div>
    </main>
  );
}

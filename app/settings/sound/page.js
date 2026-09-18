"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SoundSettings() {
  const [soundOn, setSoundOn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("heavenschat_sound_on");
    if (stored !== null) {
      setSoundOn(stored === "true");
    }
    setLoaded(true);
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    localStorage.setItem("heavenschat_sound_on", String(newState));
  };

  if (!loaded) {
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
          Sound
        </h1>

        <p className="text-amber-50/70 text-sm text-center mb-6">
          Control the ambient background music across Heavens Chat on this
          device.
        </p>

        <div className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-4 py-4">
          <div className="pr-4">
            <p className="text-white text-sm">Ambient Music</p>
            <p className="text-white/40 text-xs">
              {soundOn ? "Currently on" : "Currently off"}
            </p>
          </div>
          <button
            onClick={toggleSound}
            className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
              soundOn ? "bg-amber-500 justify-end" : "bg-white/20 justify-start"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white block" />
          </button>
        </div>

        <p className="text-white/30 text-xs text-center mt-4">
          This setting is saved on this device only.
        </p>
      </div>
    </main>
  );
}

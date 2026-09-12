"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-6">
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

      <div className="relative z-10 text-center max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-serif mb-4 text-white">Your Dashboard</h1>
        <p className="text-amber-50/80 mb-6">
          Create a memorial to honor someone you love.
        </p>
        <button
          onClick={() => router.push("/create-memorial")}
          className="px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300"
        >
          Create a New Memorial
        </button>
      </div>
    </main>
  );
}

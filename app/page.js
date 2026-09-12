"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Particles from "./components/Particles";

export default function Home() {
  const [stage, setStage] = useState("gate");
  const [showText, setShowText] = useState(true);
  const [fading, setFading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const gateVideoRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const v = gateVideoRef.current;
    if (!v) return;
    const showFirstFrame = () => {
      v.pause();
      v.currentTime = 0;
    };
    v.addEventListener("loadeddata", showFirstFrame);
    return () => v.removeEventListener("loadeddata", showFirstFrame);
  }, []);

  const startOpening = () => {
    setShowText(false);
    if (gateVideoRef.current) {
      gateVideoRef.current.play();
    }
  };

  const handleGateEnd = () => {
    setFading(true);
    setTimeout(() => {
      setStage("walkway");
      setTimeout(() => setFading(false), 50);
    }, 600);
  };

  const choosePath = (path) => {
    setNavigating(true);
    setTimeout(() => {
      router.push(path === "pets" ? "/memorial/pets" : "/memorial/loved-ones");
    }, 500);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* GATE STAGE (video) */}
      {stage === "gate" && (
        <div
          onClick={startOpening}
          className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <video
            ref={gateVideoRef}
            src="/videos/gate-opening.mp4"
            muted
            playsInline
            preload="auto"
            onEnded={handleGateEnd}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <Particles count={14} />

          {showText && (
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-end pb-20 text-center px-6">
              <h1 className="text-white text-3xl font-serif mb-2 drop-shadow-lg">
                Heavens Chat
              </h1>
              <p className="text-white/90 text-sm mb-8 drop-shadow-lg">
                Heaven is just a message away.
              </p>
              <span className="text-white/80 text-xs tracking-wide animate-pulse">
                Tap to enter
              </span>
            </div>
          )}
        </div>
      )}

      {/* WALKWAY / FORK STAGE (video, looping) */}
      {stage === "walkway" && (
        <div
          className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
            navigating ? "opacity-0" : fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <video
            src="/videos/walkway-fork.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <Particles count={16} />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-20" />

          <div className="absolute inset-0 z-30 flex items-end justify-between px-6 pb-16">
            <button
              onClick={() => choosePath("pets")}
              className="group relative px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 hover:shadow-[0_0_28px_rgba(255,223,150,0.4)] transition-all duration-300"
            >
              For Pets
            </button>
            <button
              onClick={() => choosePath("loved-ones")}
              className="group relative px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 hover:shadow-[0_0_28px_rgba(255,223,150,0.4)] transition-all duration-300"
            >
              For Loved Ones
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

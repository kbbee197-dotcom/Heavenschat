"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Particles from "./components/Particles";

export default function Home() {
  const [stage, setStage] = useState("gate");
  const [showText, setShowText] = useState(true);
  const videoRef = useRef(null);
  const router = useRouter();

  const startOpening = () => {
    setShowText(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    setStage("walkway");
  };

  const choosePath = (path) => {
    router.push(path === "pets" ? "/memorial/pets" : "/memorial/loved-ones");
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* GATE STAGE (video) */}
      {stage === "gate" && (
        <div
          onClick={startOpening}
          className="absolute inset-0 cursor-pointer"
        >
          <video
            ref={videoRef}
            src="/videos/gate-opening.mp4"
            muted
            playsInline
            onEnded={handleVideoEnd}
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

      {/* WALKWAY / FORK STAGE */}
      {stage === "walkway" && (
        <div className="absolute inset-0 animate-fadeIn overflow-hidden">
          <div className="absolute inset-0 animate-kenburns">
            <Image
              src="/images/path-fork.jpg"
              alt="The path divides"
              fill
              priority
              className="object-cover"
            />
          </div>

          <Particles count={20} />

          <div className="absolute inset-0 bg-black/10 flex items-end justify-between px-6 pb-16 z-30">
            <button
              onClick={() => choosePath("pets")}
              className="bg-white/90 hover:bg-white text-gray-900 px-5 py-3 rounded-full text-sm font-medium shadow-lg transition"
            >
              For Pets
            </button>
            <button
              onClick={() => choosePath("loved-ones")}
              className="bg-white/90 hover:bg-white text-gray-900 px-5 py-3 rounded-full text-sm font-medium shadow-lg transition"
            >
              For Loved Ones
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

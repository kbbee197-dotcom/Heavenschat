"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Particles from "./components/Particles";

export default function Home() {
  const [stage, setStage] = useState("gate");
  const [showText, setShowText] = useState(true);
  const router = useRouter();
  const gateVideoRef = useRef(null);
  const walkwayVideoRef = useRef(null);
  const petsVideoRef = useRef(null);
  const lovedOnesVideoRef = useRef(null);
  const userStartedRef = useRef(false);

  useEffect(() => {
    const v = gateVideoRef.current;
    if (!v) return;
    const forceFrameThenPause = () => {
      if (!userStartedRef.current) {
        v.pause();
        v.currentTime = 0;
      }
    };
    v.addEventListener("playing", forceFrameThenPause);
    v.play().catch(() => {});
    return () => v.removeEventListener("playing", forceFrameThenPause);
  }, []);


  const startOpening = () => {
    setShowText(false);
    userStartedRef.current = true;
    if (gateVideoRef.current) {
      gateVideoRef.current.currentTime = 0;
      gateVideoRef.current.play();
    }
  };

  const handleGateEnd = () => setStage("walkway");
  const choosePath = (path) => setStage(path);

  const layerClass = (name) =>
    `absolute inset-0 overflow-hidden transition-opacity duration-700 ${
      stage === name
        ? "opacity-100 z-10 pointer-events-auto"
        : "opacity-0 z-0 pointer-events-none"
    }`;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* GATE LAYER */}
      <div
        onClick={stage === "gate" ? startOpening : undefined}
        className={layerClass("gate") + (stage === "gate" ? " cursor-pointer" : "")}
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
        {stage === "gate" && showText && (
          <img
            src="/images/heavens-chat-logo.png"
            alt="Heavens Chat"
            className="absolute inset-0 w-full h-full object-contain bg-black z-20"
          />
        )}
        {stage === "gate" && showText && (
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

      {/* WALKWAY LAYER */}
      <div className={layerClass("walkway")}>
        <video
          ref={walkwayVideoRef}
          src="/videos/walkway-fork.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <Particles count={16} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 z-20" />
        <div className="absolute inset-0 z-30 flex items-end justify-between px-6 pb-16">
          <button
            onClick={() => choosePath("pets")}
            className="px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300"
          >
            For Pets
          </button>
          <button
            onClick={() => choosePath("loved-ones")}
            className="px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300"
          >
            For Loved Ones
          </button>
        </div>
      </div>

      {/* PETS MEMORIAL LAYER */}
      <div className={layerClass("pets")}>
        <video
          ref={petsVideoRef}
          src="/videos/pets-memorial.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
        <div className="relative z-10 flex flex-col items-center px-6 py-16 h-full overflow-y-auto">
          <p className="text-amber-100/80 text-xs tracking-widest uppercase font-light mb-3">
            A sample memorial
          </p>
          <h1 className="text-white text-4xl font-serif mb-2 text-center drop-shadow-lg">
            Bella
          </h1>
          <p className="text-amber-50/90 text-sm mb-10 text-center">
            2014 &ndash; 2026 &middot; Forever loved, forever missed
          </p>
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl p-6 mb-8">
            <p className="text-white/90 text-sm leading-relaxed text-center italic">
              &ldquo;Bella greeted every single person like they were the
              best part of her day. She taught us what unconditional love
              looks like.&rdquo;
            </p>
          </div>
          <div className="w-full max-w-md space-y-3 mb-10">
            <div className="bg-white/10 backdrop-blur-md border border-amber-200/20 rounded-xl px-4 py-3">
              <p className="text-amber-100/70 text-xs mb-1">Sarah &middot; 2 days ago</p>
              <p className="text-white/90 text-sm">
                Lit a candle for you today, girl. Miss your goofy smile. 🕯️
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-amber-200/20 rounded-xl px-4 py-3">
              <p className="text-amber-100/70 text-xs mb-1">Marcus &middot; 1 week ago</p>
              <p className="text-white/90 text-sm">
                Still can&apos;t believe how much joy one dog could hold. Love you always.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 mt-auto">
            <p className="text-white/70 text-xs text-center max-w-xs">
              This is a sample. Every pet deserves a place like this.
            </p>
            <button onClick={() => router.push("/signup")} className="px-8 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300">
              Create a Memorial Like This
            </button>
          </div>
        </div>
      </div>

      {/* LOVED ONES MEMORIAL LAYER */}
      <div className={layerClass("loved-ones")}>
        <video
          ref={lovedOnesVideoRef}
          src="/videos/loved-ones-memorial.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
        <div className="relative z-10 flex flex-col items-center px-6 py-16 h-full overflow-y-auto">
          <p className="text-amber-100/80 text-xs tracking-widest uppercase font-light mb-3">
            A sample memorial
          </p>
          <h1 className="text-white text-4xl font-serif mb-2 text-center drop-shadow-lg">
            James Robert Carter
          </h1>
          <p className="text-amber-50/90 text-sm mb-10 text-center">
            1952 &ndash; 2026 &middot; Beloved father, husband, and friend
          </p>
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl p-6 mb-8">
            <p className="text-white/90 text-sm leading-relaxed text-center italic">
              &ldquo;Dad had a way of making every room feel a little
              warmer. His laugh is something none of us will ever
              forget.&rdquo;
            </p>
          </div>
          <div className="w-full max-w-md space-y-3 mb-10">
            <div className="bg-white/10 backdrop-blur-md border border-amber-200/20 rounded-xl px-4 py-3">
              <p className="text-amber-100/70 text-xs mb-1">Linda &middot; 3 days ago</p>
              <p className="text-white/90 text-sm">
                Thinking of you today, honey. Forty wonderful years and I&apos;d do it all again. 🕯️
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-amber-200/20 rounded-xl px-4 py-3">
              <p className="text-amber-100/70 text-xs mb-1">Michael &middot; 1 week ago</p>
              <p className="text-white/90 text-sm">
                Miss our Sunday calls, Dad. Love you always.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 mt-auto">
            <p className="text-white/70 text-xs text-center max-w-xs">
              This is a sample. Your loved one deserves a place like this.
            </p>
            <button onClick={() => router.push("/signup")} className="px-8 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300">
              Create a Memorial Like This
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

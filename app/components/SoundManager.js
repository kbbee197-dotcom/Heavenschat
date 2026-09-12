"use client";

import { useState, useRef, useEffect } from "react";

export default function SoundManager() {
  const audioRef = useRef(null);
  const startedRef = useRef(false);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const tryStart = () => {
      if (!startedRef.current && audioRef.current) {
        startedRef.current = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("click", tryStart, { once: true });
    return () => document.removeEventListener("click", tryStart);
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    if (audioRef.current) {
      audioRef.current.muted = !newState;
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/ambient-music.m4a" loop />
      <button
        onClick={toggleSound}
        className="fixed top-4 right-4 z-[100] w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-amber-200/30 flex items-center justify-center transition-all duration-300 hover:bg-black/40"
        aria-label="Toggle sound"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 5L6 9H2V15H6L11 19V5Z"
            fill={soundOn ? "#fde68a" : "rgba(255,255,255,0.4)"}
          />
          {soundOn && (
            <path
              d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5"
              stroke="#fde68a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
          {!soundOn && (
            <path
              d="M16 9L21 14M21 9L16 14"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
    </>
  );
}

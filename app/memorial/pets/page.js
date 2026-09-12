"use client";

export default function PetsMemorial() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black animate-fadeIn">
      <video
        src="/videos/pets-memorial.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />

      <div className="relative z-10 flex flex-col items-center px-6 py-16 min-h-screen">
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
            &ldquo;Bella greeted every single person like they were the best
            part of her day. She taught us what unconditional love looks
            like.&rdquo;
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
          <button className="px-8 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 shadow-[0_0_20px_rgba(255,223,150,0.25)] hover:bg-white/20 hover:border-amber-200/80 transition-all duration-300">
            Create a Memorial Like This
          </button>
        </div>
      </div>
    </main>
  );
}

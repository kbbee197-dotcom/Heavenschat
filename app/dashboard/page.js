export default function Dashboard() {
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
        <p className="text-amber-50/80">
          This is where you&apos;ll manage your memorials. Coming soon.
        </p>
      </div>
    </main>
  );
}

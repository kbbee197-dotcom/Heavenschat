"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-serif text-center mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Log in to visit or manage your memorials.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <label className="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <label className="block text-sm text-gray-700 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-amber-700 underline">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}

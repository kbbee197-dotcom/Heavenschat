"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        account_type: "free",
      });
    }

    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-serif text-center mb-2">Create an Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Begin a memorial for someone you love.
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium transition"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-amber-700 underline">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AccountSettings() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setEmail(userData.user.email);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setDeleteError("Session expired. Please log in again.");
      setDeleting(false);
      return;
    }

    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) {
      setDeleteError(result.error || "Something went wrong. Please try again.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
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
          Account
        </h1>

        <div className="mb-6">
          <p className="text-amber-50/60 text-xs mb-1">Email</p>
          <p className="text-white text-sm">{email}</p>
        </div>

        <form onSubmit={handleChangePassword} className="mb-8">
          <p className="text-white text-sm mb-3">Change Password</p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-white/10 border border-amber-200/30 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-300/60 mb-3"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-white/10 border border-amber-200/30 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-300/60 mb-3"
          />
          {passwordMessage && (
            <p className="text-amber-200 text-xs mb-3">{passwordMessage}</p>
          )}
          <button
            type="submit"
            disabled={savingPassword}
            className="w-full px-6 py-3 rounded-full font-serif text-sm tracking-wide text-amber-50 backdrop-blur-md bg-white/10 border border-amber-200/50 hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
          >
            {savingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>

        <div className="border-t border-red-300/20 pt-6">
          <p className="text-red-300/80 text-sm mb-2">Danger Zone</p>
          <p className="text-white/50 text-xs mb-4">
            Deleting your account permanently removes your profile, memorials,
            tributes, and token history. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-6 py-3 rounded-full text-sm text-red-300/80 border border-red-300/30 hover:bg-red-500/10 transition"
            >
              Delete Account
            </button>
          ) : (
            <div>
              <p className="text-white/70 text-xs mb-2">
                Type DELETE to confirm:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full bg-white/10 border border-red-300/30 rounded-xl px-4 py-2 text-sm text-white mb-3 focus:outline-none"
              />
              {deleteError && (
                <p className="text-red-300 text-xs mb-3">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteText("");
                    setDeleteError("");
                  }}
                  className="flex-1 px-4 py-3 rounded-full text-sm text-white/70 border border-white/20 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== "DELETE" || deleting}
                  className="flex-1 px-4 py-3 rounded-full text-sm text-white bg-red-500/80 hover:bg-red-500 transition disabled:opacity-40"
                >
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

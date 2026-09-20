"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AccountSettings() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [messagePrivacy, setMessagePrivacy] = useState("anyone");
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, message_privacy")
        .eq("id", userData.user.id)
        .single();

      if (profile?.username) {
        setUsername(profile.username);
        setUsernameInput(profile.username);
      }

      if (profile?.message_privacy) {
        setMessagePrivacy(profile.message_privacy);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const handleChangePrivacy = async (value) => {
    setSavingPrivacy(true);
    setMessagePrivacy(value);

    const { data: userData } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .update({ message_privacy: value })
      .eq("id", userData.user.id);

    setSavingPrivacy(false);
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setUsernameMessage("");

    const trimmed = usernameInput.trim().toLowerCase();
    const validFormat = /^[a-z0-9_]{3,20}$/.test(trimmed);

    if (!validFormat) {
      setUsernameMessage("Username must be 3-20 characters: letters, numbers, underscores only.");
      return;
    }

    setSavingUsername(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", userData.user.id);

    setSavingUsername(false);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        setUsernameMessage("That username is already taken.");
      } else {
        setUsernameMessage(error.message);
      }
      return;
    }

    setUsername(trimmed);
    setUsernameInput(trimmed);
    setUsernameMessage("Username saved.");
  };

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

        <form onSubmit={handleSaveUsername} className="mb-8">
          <p className="text-white text-sm mb-1">Username</p>
          <p className="text-white/40 text-xs mb-3">
            Let others find and message you without your email.
          </p>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="e.g. jsmith_92"
            className="w-full bg-white/10 border border-amber-200/30 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-300/60 mb-2"
          />
          {usernameMessage && (
            <p className="text-amber-200 text-xs mb-2">{usernameMessage}</p>
          )}
          <button
            type="submit"
            disabled={savingUsername}
            className="w-full px-4 py-2 rounded-full text-sm text-amber-50 bg-white/10 border border-amber-200/50 hover:bg-white/20 transition disabled:opacity-40"
          >
            {savingUsername ? "Saving..." : "Save Username"}
          </button>
        </form>

        <div className="mb-8">
          <p className="text-white text-sm mb-1">Who Can Message You</p>
          <p className="text-white/40 text-xs mb-3">
            Control whether anyone can reach out, or only people you've added as friends.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleChangePrivacy("anyone")}
              disabled={savingPrivacy}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                messagePrivacy === "anyone"
                  ? "bg-amber-500 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              Anyone
            </button>
            <button
              onClick={() => handleChangePrivacy("friends_only")}
              disabled={savingPrivacy}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                messagePrivacy === "friends_only"
                  ? "bg-amber-500 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              Friends Only
            </button>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mb-8">
          <p className="text-white text-sm mb-3">Change Password</p>
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full bg-white/10 border border-amber-200/30 rounded-xl px-4 pr-16 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber-300/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white/80"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateConversation } from "@/lib/conversations";

export default function Friends() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadAll = async (userId) => {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const rows = friendships || [];

    const incomingRows = rows.filter(
      (f) => f.status === "pending" && f.addressee_id === userId
    );
    const outgoingRows = rows.filter(
      (f) => f.status === "pending" && f.requester_id === userId
    );
    const acceptedRows = rows.filter((f) => f.status === "accepted");

    const allOtherIds = [
      ...incomingRows.map((f) => f.requester_id),
      ...outgoingRows.map((f) => f.addressee_id),
      ...acceptedRows.map((f) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      ),
    ];

    let nameMap = {};
    if (allOtherIds.length > 0) {
      const { data: profiles } = await supabase.rpc("get_profile_emails", {
        user_ids: allOtherIds,
      });
      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.username || p.email;
      });
    }

    setIncoming(
      incomingRows.map((f) => ({ ...f, name: nameMap[f.requester_id] || "Unknown" }))
    );
    setOutgoing(
      outgoingRows.map((f) => ({ ...f, name: nameMap[f.addressee_id] || "Unknown" }))
    );
    setFriends(
      acceptedRows.map((f) => {
        const otherId = f.requester_id === userId ? f.addressee_id : f.requester_id;
        return { ...f, otherId, name: nameMap[otherId] || "Unknown" };
      })
    );
  };

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(userData.user.id);
      await loadAll(userData.user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setSearchError("");

    if (!searchInput.trim()) {
      setSearchError("Please enter a username or email.");
      return;
    }

    setSearching(true);

    const { data: profiles } = await supabase.rpc("get_profile_by_identifier", {
      identifier: searchInput.trim().toLowerCase(),
    });

    if (!profiles || profiles.length === 0) {
      setSearchError("No user found with that username or email.");
      setSearching(false);
      return;
    }

    const target = profiles[0];

    if (target.id === currentUserId) {
      setSearchError("You can't friend yourself.");
      setSearching(false);
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: target.id,
      status: "pending",
    });

    setSearching(false);

    if (error) {
      if (error.code === "23505") {
        setSearchError("You've already sent a request or are already friends.");
      } else {
        setSearchError(error.message);
      }
      return;
    }

    setSearchInput("");
    await loadAll(currentUserId);
  };

  const handleAccept = async (friendshipId) => {
    setProcessingId(friendshipId);
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    await loadAll(currentUserId);
    setProcessingId(null);
  };

  const handleDecline = async (friendshipId) => {
    setProcessingId(friendshipId);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await loadAll(currentUserId);
    setProcessingId(null);
  };

  const handleUnfriend = async (friendshipId) => {
    setProcessingId(friendshipId);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await loadAll(currentUserId);
    setProcessingId(null);
  };

  const handleMessage = async (otherId) => {
    const conversationId = await getOrCreateConversation(currentUserId, otherId);
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    }
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

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md border border-amber-200/30 rounded-2xl shadow-lg p-6">
        <button
          onClick={() => router.push("/settings")}
          className="text-white/60 text-sm mb-4"
        >
          ← Back to Settings
        </button>

        <h1 className="text-2xl font-serif text-center mb-6 text-white">
          Friends
        </h1>

        <form onSubmit={handleSendRequest} className="mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Add by username or email"
            className="w-full px-4 py-2 mb-2 rounded-lg bg-white/90 text-gray-900 border border-amber-200/50 text-sm"
          />
          {searchError && (
            <p className="text-red-300 text-xs mb-2">{searchError}</p>
          )}
          <button
            type="submit"
            disabled={searching}
            className="w-full px-4 py-2 rounded-full text-xs text-amber-50 bg-amber-500/80 hover:bg-amber-500 transition disabled:opacity-50"
          >
            {searching ? "Sending..." : "Send Friend Request"}
          </button>
        </form>

        {incoming.length > 0 && (
          <div className="mb-6">
            <p className="text-white text-sm mb-2">Friend Requests</p>
            <div className="space-y-2">
              {incoming.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-3 py-2"
                >
                  <p className="text-white text-sm">{f.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(f.id)}
                      disabled={processingId === f.id}
                      className="px-3 py-1 rounded-full text-xs text-white bg-amber-500/80 hover:bg-amber-500 transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(f.id)}
                      disabled={processingId === f.id}
                      className="px-3 py-1 rounded-full text-xs text-white/70 border border-white/20 hover:bg-white/10 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {outgoing.length > 0 && (
          <div className="mb-6">
            <p className="text-white text-sm mb-2">Pending Requests</p>
            <div className="space-y-2">
              {outgoing.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-3 py-2"
                >
                  <p className="text-white/70 text-sm">{f.name}</p>
                  <span className="text-white/40 text-xs">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-white text-sm mb-2">Your Friends</p>
          {friends.length === 0 ? (
            <p className="text-amber-50/60 text-sm text-center">
              No friends yet.
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-white/5 border border-amber-200/20 rounded-xl px-3 py-2"
                >
                  <p className="text-white text-sm">{f.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMessage(f.otherId)}
                      className="px-3 py-1 rounded-full text-xs text-amber-200 border border-amber-300/30 hover:bg-amber-500/10 transition"
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleUnfriend(f.id)}
                      disabled={processingId === f.id}
                      className="px-3 py-1 rounded-full text-xs text-red-300/70 hover:text-red-300 transition"
                    >
                      Unfriend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

import { supabase } from "@/lib/supabaseClient";

// Finds an existing conversation between two users, or creates one.
// Returns the conversation id.
export async function getOrCreateConversation(currentUserId, otherUserId) {
  if (currentUserId === otherUserId) return null;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user_one.eq.${currentUserId},user_two.eq.${otherUserId}),and(user_one.eq.${otherUserId},user_two.eq.${currentUserId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_one: currentUserId, user_two: otherUserId })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create conversation:", error.message);
    return null;
  }

  return created.id;
}

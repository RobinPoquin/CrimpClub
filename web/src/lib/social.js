import { supabase } from './supabase';

// Recherche des grimpeurs par pseudo
export async function searchUsers(query) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, bio, avatar_url')
    .ilike('display_name', `%${query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return data || [];
}

// Follow un grimpeur
export async function followUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw new Error(error.message);
}

// Unfollow un grimpeur
export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw new Error(error.message);
}

// Vérifie si on follow un grimpeur
export async function isFollowing(followerId, followingId) {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

// Récupère les followers d'un user
export async function getFollowers(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);
  if (error) throw new Error(error.message);
  return data || [];
}

// Récupère les grimpeurs que suit un user
export async function getFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw new Error(error.message);
  return data || [];
}
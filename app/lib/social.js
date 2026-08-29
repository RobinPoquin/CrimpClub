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

  // Supprime aussi la demande de follow si elle existe
  await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', followerId)
    .eq('requested_id', followingId);
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

// Retourne le status complet de la demande de follow
export async function getFollowStatus(followerId, followingId) {
  const { data: { user } } = await supabase.auth.getUser();
  // Vérifie si on suit déjà
  const { data: followData } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (followData) return 'following';

  // Vérifie si une demande est en attente
  const { data: requestData } = await supabase
    .from('follow_requests')
    .select('id')
    .eq('requester_id', followerId)
    .eq('requested_id', followingId)
    .eq('status', 'pending')
    .maybeSingle();
  
  if (requestData) return 'pending';
  
  return 'none';
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

// Envoie une demande de follow a un autre utilisateur
export async function requestFollow(followerId, followingId) {
  const { data, error } = await supabase
    .from('follow_requests')
    .insert({ requester_id: followerId, requested_id: followingId })
  if (error) throw new Error(error.message);
  return data || [];
}

// Annule une demande de follow a un autre utilisateur
export async function cancelFollowRequest(followerId, followingId) {
  const { data, error } = await supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', followerId)
    .eq('requested_id', followingId)
  if (error) throw new Error(error.message);
  return data || [];
}

// Récupère toutes les demandes de follow reçues avec status "pending"
export async function getFollowRequests(userId) {
  const { data, error } = await supabase
    .from('follow_requests')
    .select('*')
    .eq('requested_id', userId)
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
  return data || [];
}

// Récupère toutes les demandes de follow reçues avec status "pending"
export async function allowFollow(requestId, accept) {
  const { data, error } = await supabase
    .from('follow_requests')
    .update({ status: accept ? 'accepted' : 'refused' })
    .eq('id', requestId)
  if (error) throw new Error(error.message);
  return data || [];
}

// Défini si le profil est privé
export async function setProfilePrivate(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_private: true })
    .eq('id', userId)
  if (error) throw new Error(error.message);
  return data || [];
}

// Défini si le profil est public 
export async function setProfilePublic(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_private: false })
    .eq('id', userId)
  if (error) throw new Error(error.message);
  return data || [];
}
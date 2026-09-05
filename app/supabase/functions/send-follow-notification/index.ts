import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default {
  fetch: async (req: Request) => {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Récupère les paramètres
    const { followerId, followingId, type } = await req.json();

    // Le destinataire change selon le type
    const recipientId = type === 'accepted' ? followerId : followingId;
    const senderId    = type === 'accepted' ? followingId : followerId;

    // 2. Récupère le token du destinataire
    const { data: recipientData, error: recipientError } = await supabaseAdmin
      .from("profiles")
      .select('expo_push_token')
      .eq("id", recipientId)
      .single();
    if (recipientError) throw new Error(recipientError.message);

    // 3. Récupère le display_name de l'expéditeur
    const { data: senderData, error: senderError } = await supabaseAdmin
      .from("profiles")
      .select('display_name')
      .eq("id", senderId)
      .single();
    if (senderError) throw new Error(senderError.message);

    // 4. Envoie la notification push
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientData.expo_push_token,
        title: type === 'accepted' ? 'Demande acceptée 🎉' : 'Nouveau follower 🧗',
        body: `${senderData.display_name} ${type === 'accepted' ? 'a accepté ta demande de suivi' : 'a commencé à te suivre'}`,
      })
    });

    // 5. Insère la notification in-app
    // Vérifie si une notification similaire existe déjà dans les 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', recipientId)
      .eq('from_user_id', senderId)
      .eq('type', type === 'accepted' ? 'follow_accepted' : 'new_follower')
      .gte('created_at', since)
      .maybeSingle();

    // N'insère que si pas de notif récente
    if (!existing) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id:      recipientId,
          type:         type === 'accepted' ? 'follow_accepted' : 'new_follower',
          from_user_id: senderId,
        });
    }

    // 6. Retourne une réponse
    return Response.json({ message: { success: true } });
  },
};
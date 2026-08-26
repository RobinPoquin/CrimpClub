// Setup type definitions for built-in Supabase Runtime APIs
import { withSupabase, Context } from "https://esm.sh/@supabase/functions-js@2";

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req: Request, ctx: Context) => {
    // 1. Récupère followerId et followingId depuis la requête
    const { followerId, followingId } = await req.json();

    // 2. Récupère le token du following
    const { data: followingData, error : followingError } = await ctx.supabaseAdmin
      .from("profiles")
      .select('expo_push_token')
      .eq("id", followingId)
      .single()
    if (followingError) throw new Error(followingError.message);

    // 3. Récupère le display_name du follower
    const { data: followerData, error: display_nameError } = await ctx.supabaseAdmin
      .from("profiles")
      .select('display_name')
      .eq("id", followerId)
      .single()
    if (display_nameError) throw new Error(display_nameError.message);

    // 4. Envoie la notification
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: followingData.expo_push_token,
        title: 'Nouveau follower 🧗',
        body: `${followerData.display_name} a commencé à te suivre`,
      })
    })
    
    // 5. Retourne une réponse
    return Response.json({
      message: { success: true },
    });
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-follow-notification' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --data '{"name":"Functions"}'

*/

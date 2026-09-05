import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { getFollowRequests, getNotifications } from '../../lib/social';

const NotifContext = createContext({ notifCount: 0 });

export function NotifProvider({ userId, children }) {
  const [notifCount, setNotifCount] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    getFollowRequests(userId).then(data => setNotifCount(data.length));

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
        .channel(`notif_new_${userId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'follow_requests',
        }, (payload) => {
            getFollowRequests(userId).then(data => setNotifCount(data.length));
        })
        .subscribe((status) => {
        });

    const channel2 = supabase
        .channel(`notif_new_${userId}_notifs`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
            }, (payload) => {
              setNotifCount(prev => prev + 1);
            })
        .subscribe((status) => {
        });

    return () => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
        supabase.removeChannel(channel2);
    };
  }, [userId]);

  return (
    <NotifContext.Provider value={{ notifCount, setNotifCount }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotif = () => useContext(NotifContext);
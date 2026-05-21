import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const GUEST_ID_KEY = 'qimatnadz_guest_id';

export function useUserTracking() {
  useEffect(() => {
    let interval: any;

    const getOrCreateGuestId = async () => {
      let guestId = null;
      if (Platform.OS === 'web') {
        guestId = localStorage.getItem(GUEST_ID_KEY);
        if (!guestId) {
          guestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem(GUEST_ID_KEY, guestId);
        }
      } else {
        // Fallback pour mobile (simple session-based pour l'instant)
        guestId = 'mobile_' + Math.random().toString(36).substring(2, 10);
      }
      return guestId;
    };

    const trackActivity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await supabase.rpc('update_last_seen');
      } else {
        const guestId = await getOrCreateGuestId();
        if (guestId) {
          await supabase.rpc('track_guest_activity', { p_guest_id: guestId });
        }
      }
    };

    trackActivity();
    interval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

export async function getAdminStats() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      { count: userCount },
      { count: activeRegCount },
      { count: guestCount },
      { count: valCount },
      { count: listingsCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen', yesterday.toISOString()),
      supabase.from('guest_sessions').select('*', { count: 'exact', head: true }).gte('last_seen', yesterday.toISOString()),
      supabase.from('valuations').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalUsers: userCount || 0,
      activeToday: (activeRegCount || 0) + (guestCount || 0),
      guestCount: guestCount || 0,
      totalValuations: valCount || 0,
      totalListings: listingsCount || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return null;
  }
}

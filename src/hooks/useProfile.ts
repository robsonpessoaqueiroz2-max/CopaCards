import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Database['public']['Tables']['profiles']['Update']) => {
    if (!userId) return { error: new Error('Não autenticado') };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (!error && data) setProfile(data);
    return { data, error };
  };

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
}

export function useFollowStats(userId: string | null) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (currentUserId?: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact' }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact' }).eq('follower_id', userId),
      ]);
      setFollowers(followersRes.count ?? 0);
      setFollowing(followingRes.count ?? 0);

      if (currentUserId && currentUserId !== userId) {
        const { data } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('following_id', userId)
          .single();
        setIsFollowing(!!data);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const toggleFollow = async (currentUserId: string) => {
    if (!userId || !currentUserId) return;
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);
      setFollowers(f => f - 1);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
      setFollowers(f => f + 1);
      setIsFollowing(true);
    }
  };

  return { followers, following, isFollowing, loading, fetchStats, toggleFollow };
}

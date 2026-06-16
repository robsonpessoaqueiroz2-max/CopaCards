import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FigurinhaWithProfile {
  id: string;
  user_id: string;
  nome_atleta: string;
  selecao: string;
  posicao: string | null;
  numero_camisa: number | null;
  imagem_url: string | null;
  status: 'tenho' | 'quero' | 'repetida';
  descricao: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count?: number;
  user_liked?: boolean;
  comments_count?: number;
}

export function useFeed(currentUserId?: string | null) {
  const [figurinhas, setFigurinhas] = useState<FigurinhaWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('figurinhas')
        .select(`
          *,
          profiles (id, username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch likes and comments counts
      const ids = (data || []).map(f => f.id);
      if (ids.length === 0) {
        setFigurinhas([]);
        return;
      }

      const [likesRes, commentsRes, userLikesRes] = await Promise.all([
        supabase.from('likes').select('figurinha_id').in('figurinha_id', ids),
        supabase.from('comentarios').select('figurinha_id').in('figurinha_id', ids),
        currentUserId
          ? supabase.from('likes').select('figurinha_id').eq('user_id', currentUserId).in('figurinha_id', ids)
          : Promise.resolve({ data: [] }),
      ]);

      const likesCounts: Record<string, number> = {};
      const commentsCounts: Record<string, number> = {};
      const userLikedSet = new Set((userLikesRes.data || []).map(l => l.figurinha_id));

      (likesRes.data || []).forEach(l => {
        likesCounts[l.figurinha_id] = (likesCounts[l.figurinha_id] || 0) + 1;
      });
      (commentsRes.data || []).forEach(c => {
        commentsCounts[c.figurinha_id] = (commentsCounts[c.figurinha_id] || 0) + 1;
      });

      const enriched = (data || []).map(f => ({
        ...f,
        profiles: Array.isArray(f.profiles) ? f.profiles[0] : f.profiles,
        likes_count: likesCounts[f.id] || 0,
        user_liked: userLikedSet.has(f.id),
        comments_count: commentsCounts[f.id] || 0,
      })) as FigurinhaWithProfile[];

      setFigurinhas(enriched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feed');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const toggleLike = async (figurinhaId: string, userId: string) => {
    const fig = figurinhas.find(f => f.id === figurinhaId);
    if (!fig) return;

    if (fig.user_liked) {
      await supabase.from('likes').delete()
        .eq('user_id', userId)
        .eq('figurinha_id', figurinhaId);
      setFigurinhas(prev => prev.map(f =>
        f.id === figurinhaId
          ? { ...f, user_liked: false, likes_count: (f.likes_count || 0) - 1 }
          : f
      ));
    } else {
      await supabase.from('likes').insert({ user_id: userId, figurinha_id: figurinhaId });
      setFigurinhas(prev => prev.map(f =>
        f.id === figurinhaId
          ? { ...f, user_liked: true, likes_count: (f.likes_count || 0) + 1 }
          : f
      ));
    }
  };

  return { figurinhas, loading, error, refetch: fetchFeed, toggleLike };
}

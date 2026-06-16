import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FigurinhaWithProfile } from '../../hooks/useFeed';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
}

interface FeedPostProps {
  figurinha: FigurinhaWithProfile;
  currentUserId?: string | null;
  onLike: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (figurinha: FigurinhaWithProfile) => void;
}

const statusConfig = {
  tenho: { label: 'Tenho', bg: '#009739', color: '#fff' },
  quero: { label: 'Quero', bg: '#012169', color: '#fff' },
  repetida: { label: 'Repetida', bg: '#FEDD00', color: '#012169' },
};

export function FeedPost({ figurinha, currentUserId, onLike, onDelete, onEdit }: FeedPostProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const status = statusConfig[figurinha.status] || statusConfig.tenho;
  const isOwner = currentUserId === figurinha.user_id;
  const timeAgo = formatDistanceToNow(new Date(figurinha.created_at), { addSuffix: true, locale: ptBR });

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      // Step 1: Fetch comentarios
      const { data: comentariosData } = await supabase
        .from('comentarios')
        .select('*')
        .eq('figurinha_id', figurinha.id)
        .order('created_at', { ascending: true });

      if (!comentariosData || comentariosData.length === 0) {
        setComments([]);
        return;
      }

      // Step 2: Fetch profiles for comentarios
      const userIds = [...new Set(comentariosData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profilesMap: Record<string, any> = {};
      (profilesData || []).forEach(p => {
        profilesMap[p.id] = p;
      });

      // Step 3: Combine data
      const enrichedComments = (comentariosData || []).map(c => ({
        ...c,
        profiles: profilesMap[c.user_id] || null,
      })) as Comment[];

      setComments(enrichedComments);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) await fetchComments();
    setShowComments(prev => !prev);
  };

  const handleSubmitComment = async () => {
    if (!currentUserId || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('comentarios').insert({
        user_id: currentUserId,
        figurinha_id: figurinha.id,
        conteudo: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      await fetchComments();
    } catch {
      toast('Erro ao enviar comentário', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comentarios').delete().eq('id', commentId).eq('user_id', currentUserId ?? '');
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!isOwner) return;
    const { error } = await supabase.from('figurinhas').delete().eq('id', figurinha.id).eq('user_id', currentUserId ?? '');
    if (error) {
      toast('Erro ao deletar figurinha', 'error');
    } else {
      toast('Figurinha deletada!', 'success');
      onDelete?.(figurinha.id);
    }
    setMenuOpen(false);
  };

  return (
    <article
      className="rounded-2xl border border-[var(--border)] overflow-hidden fade-in"
      style={{ background: 'var(--bg-card)', boxShadow: '0 2px 16px var(--shadow)' }}
    >
      {/* Author header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/perfil/${figurinha.user_id}`)}
        >
          <Avatar
            src={figurinha.profiles?.avatar_url}
            name={figurinha.profiles?.username}
            size="sm"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {figurinha.profiles?.username || 'Usuário'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{timeAgo}</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>

          {/* Owner menu */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--text-secondary)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-xl shadow-xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                    <button
                      onClick={() => { setMenuOpen(false); onEdit?.(figurinha); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Deletar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Figurinha visual */}
      <div
        className="mx-4 mb-4 rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #012169, #003580)', border: '2px solid #FEDD00' }}
      >
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ background: 'rgba(254,221,0,0.15)', borderBottom: '1px solid rgba(254,221,0,0.3)' }}
        >
          <span className="text-[#FEDD00] font-black text-xs uppercase tracking-wider">CopaCards</span>
          {figurinha.numero_camisa && (
            <span className="text-white font-bold">#{figurinha.numero_camisa}</span>
          )}
        </div>

        <div className="flex gap-4 p-4">
          {/* Image */}
          <div
            className="w-24 h-32 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,151,57,0.2) 100%)' }}
          >
            {figurinha.imagem_url ? (
              <img src={figurinha.imagem_url} alt={figurinha.nome_atleta} className="w-full h-full object-cover" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="rgba(254,221,0,0.5)" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(254,221,0,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black text-xl uppercase leading-tight">{figurinha.nome_atleta}</h3>
            <p className="text-[#FEDD00] font-bold text-sm mt-1">{figurinha.selecao}</p>
            {figurinha.posicao && (
              <p className="text-white/70 text-sm mt-1">{figurinha.posicao}</p>
            )}
            {figurinha.descricao && (
              <p className="text-white/60 text-xs mt-2 line-clamp-2">{figurinha.descricao}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-3 border-t border-[var(--border)] pt-3">
        {/* Like */}
        <button
          onClick={() => currentUserId && onLike(figurinha.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
            figurinha.user_liked
              ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
              : 'text-[var(--text-secondary)] hover:bg-[var(--border)]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={figurinha.user_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {figurinha.likes_count || 0}
        </button>

        {/* Comment */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {figurinha.comments_count || 0}
        </button>

        {/* Message author */}
        {!isOwner && currentUserId && (
          <button
            onClick={() => navigate(`/mensagens?user=${figurinha.user_id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-all ml-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.96a16 16 0 006.13 6.13l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mensagem
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-[var(--border)] px-4 pb-4">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
                <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-3">
              {comments.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-2">Nenhum comentário ainda.</p>
              )}
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar src={comment.profiles?.avatar_url} name={comment.profiles?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div
                      className="rounded-xl px-3 py-2 text-sm"
                      style={{ background: 'var(--border)' }}
                    >
                      <span className="font-semibold text-[var(--text-primary)] mr-2">
                        {comment.profiles?.username || 'Usuário'}
                      </span>
                      <span className="text-[var(--text-secondary)]">{comment.conteudo}</span>
                    </div>
                    {comment.user_id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-400 hover:text-red-500 mt-1 ml-2"
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {currentUserId && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#009739]"
              />
              <Button
                onClick={handleSubmitComment}
                loading={submittingComment}
                size="sm"
                disabled={!newComment.trim()}
              >
                Enviar
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface PostResult {
  id: string;
  titulo: string;
  conteudo: string;
  usuario_id: string;
  criado_em: string;
}

export function Buscar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [usuarios, setUsuarios] = useState<UserResult[]>([]);
  const [publicacoes, setPublicacoes] = useState<PostResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setUsuarios([]);
      setPublicacoes([]);
      return;
    }

    const buscar = async () => {
      setLoading(true);
      try {
        // Buscar usuários
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio')
          .ilike('username', `%${searchQuery}%`)
          .limit(10);

        if (usersError) throw usersError;
        setUsuarios(usersData || []);

        // Buscar publicações
        const { data: postsData, error: postsError } = await supabase
          .from('feed')
          .select('id, titulo, conteudo, usuario_id, criado_em')
          .or(`titulo.ilike.%${searchQuery}%,conteudo.ilike.%${searchQuery}%`)
          .order('criado_em', { ascending: false })
          .limit(10);

        if (postsError) throw postsError;
        setPublicacoes(postsData || []);
      } catch (err) {
        console.error('Erro ao buscar:', err);
        toast('Erro ao buscar resultados', 'error');
      } finally {
        setLoading(false);
      }
    };

    const delayTimer = setTimeout(buscar, 300);
    return () => clearTimeout(delayTimer);
  }, [searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header com Input de Busca */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#009739" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Pesquisar</h1>
        </div>
        
        <Input
          placeholder="Buscar usuários ou publicações..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          leftIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
            <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!loading && searchQuery.trim() && (usuarios.length === 0 && publicacoes.length === 0) && (
        <div className="text-center py-12">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">
            Nenhum resultado encontrado para "{searchQuery}"
          </p>
        </div>
      )}

      {!loading && searchQuery.trim() && (usuarios.length > 0 || publicacoes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Usuários */}
          {usuarios.length > 0 && (
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Usuários ({usuarios.length})
                </h2>
              </div>
              <div className="space-y-3">
                {usuarios.map(user => (
                  <button
                    key={user.id}
                    onClick={() => navigate(`/perfil/${user.id}`)}
                    className="w-full p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--border)] transition-colors text-left"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                          {user.username}
                        </p>
                        {user.bio && (
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {user.bio}
                          </p>
                        )}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#009739" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coluna Publicações */}
          {publicacoes.length > 0 && (
            <div className={usuarios.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Publicações ({publicacoes.length})
                </h2>
              </div>
              <div className="space-y-4">
                {publicacoes.map(post => (
                  <div
                    key={post.id}
                    className="p-6 rounded-2xl border border-[var(--border)]"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2 line-clamp-2">
                      {post.titulo}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-3">
                      {post.conteudo}
                    </p>
                    <div className="flex items-center justify-between">
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {new Date(post.criado_em).toLocaleDateString('pt-BR')}
                      </small>
                      <button
                        onClick={() => navigate(`/feed`)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors"
                        style={{ background: '#009739' }}
                      >
                        Ver mais
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!searchQuery.trim() && (
        <div className="text-center py-24">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1" className="mx-auto mb-6 opacity-30">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Comece a buscar
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Digite um nome de usuário ou termo de busca para encontrar pessoas e publicações
          </p>
        </div>
      )}
    </div>
  );
}

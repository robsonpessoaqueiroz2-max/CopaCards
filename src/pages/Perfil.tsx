import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile, useFollowStats } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input, TextArea, Select } from '../components/ui/Input';
import { FigurinhaCard } from '../components/FigurinhaCard/FigurinhaCard';
import { FigurinhaForm } from '../components/FigurinhaCard/FigurinhaForm';
import { useToast } from '../components/ui/Toast';
import { Database } from '../lib/supabase';

type Figurinha = Database['public']['Tables']['figurinhas']['Row'];
type Tab = 'tenho' | 'quero' | 'repetida';

const SELECOES = ['Brasil', 'Argentina', 'França', 'Alemanha', 'Espanha', 'Portugal', 'Itália', 'Inglaterra', 'Outro'];

export function Perfil() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOwner = user?.id === id;

  const { profile, loading: profileLoading, refetch: refetchProfile, updateProfile } = useProfile(id ?? null);
  const { followers, following, isFollowing, fetchStats, toggleFollow } = useFollowStats(id ?? null);

  const [figurinhas, setFigurinhas] = useState<Figurinha[]>([]);
  const [figurinhasLoading, setFigurinhasLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tenho');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', selecao_favorita: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editFigurinhaData, setEditFigurinhaData] = useState<Figurinha | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fetchFigurinhas = useCallback(async () => {
    if (!id) return;
    setFigurinhasLoading(true);
    const { data } = await supabase
      .from('figurinhas')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    setFigurinhas(data || []);
    setFigurinhasLoading(false);
  }, [id]);

  useEffect(() => {
    fetchFigurinhas();
    if (user?.id) fetchStats(user.id);
  }, [fetchFigurinhas, fetchStats, user?.id]);

  useEffect(() => {
    if (profile && editMode) {
      setEditForm({
        username: profile.username || '',
        bio: profile.bio || '',
        selecao_favorita: profile.selecao_favorita || '',
      });
    }
  }, [profile, editMode]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }
    setAvatarLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('figurinhas').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('figurinhas').getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      toast('Avatar atualizado!', 'success');
      refetchProfile();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erro ao atualizar avatar', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      toast('Nome de usuário é obrigatório', 'warning');
      return;
    }
    setEditLoading(true);
    const { error } = await updateProfile({
      username: editForm.username.trim(),
      bio: editForm.bio.trim() || null,
      selecao_favorita: editForm.selecao_favorita || null,
    });
    setEditLoading(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Perfil atualizado!', 'success');
      setEditMode(false);
    }
  };

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    await toggleFollow(user.id);
  };

  const filteredFigurinhas = figurinhas.filter(f => f.status === activeTab);

  const tabs: { key: Tab; label: string; bg: string; color: string }[] = [
    { key: 'tenho', label: 'Tenho', bg: '#009739', color: '#fff' },
    { key: 'quero', label: 'Quero', bg: '#012169', color: '#fff' },
    { key: 'repetida', label: 'Repetida', bg: '#FEDD00', color: '#012169' },
  ];

  if (profileLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-8 border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full shimmer" />
            <div className="flex-1">
              <div className="h-5 w-40 rounded shimmer mb-2" />
              <div className="h-3 w-60 rounded shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-secondary)]">Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-16">
      {/* Profile header */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden mb-6"
        style={{ background: 'var(--bg-card)', boxShadow: '0 4px 24px var(--shadow)' }}
      >
        {/* Cover */}
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #012169 0%, #009739 100%)' }}>
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 60 + i * 20,
                  height: 60 + i * 20,
                  left: `${(i * 15) % 100}%`,
                  top: `${(i * 25) % 100}%`,
                  background: '#FEDD00',
                  opacity: 0.15,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full overflow-hidden"
                style={{ border: '4px solid #FEDD00', background: 'var(--bg-card)' }}
              >
                <Avatar src={profile.avatar_url} name={profile.username} size="xl" />
              </div>
              {isOwner && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ background: '#009739' }}
                  title="Alterar foto"
                >
                  {avatarLoading ? (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex gap-2">
              {isOwner ? (
                <Button
                  variant={editMode ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/mensagens?user=${id}`)}
                  >
                    Mensagem
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Name / bio */}
          {editMode && isOwner ? (
            <div className="flex flex-col gap-3">
              <Input
                label="Nome de usuário"
                value={editForm.username}
                onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                placeholder="@seunome"
              />
              <TextArea
                label="Bio"
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                rows={2}
              />
              <Select
                label="Seleção Favorita"
                value={editForm.selecao_favorita}
                onChange={e => setEditForm(f => ({ ...f, selecao_favorita: e.target.value }))}
                options={[{ value: '', label: 'Selecionar seleção' }, ...SELECOES.map(s => ({ value: s, label: s }))]}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} loading={editLoading}>Salvar</Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {profile.username || 'Usuário'}
              </h1>
              {profile.bio && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">{profile.bio}</p>
              )}
              {profile.selecao_favorita && (
                <div className="flex items-center gap-1 mt-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009739" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span className="text-sm text-[var(--text-secondary)]">
                    Torce para: <strong className="text-[var(--text-primary)]">{profile.selecao_favorita}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="text-center">
              <p className="text-xl font-black text-[var(--text-primary)]">{figurinhas.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Figurinhas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-[var(--text-primary)]">{followers}</p>
              <p className="text-xs text-[var(--text-secondary)]">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-[var(--text-primary)]">{following}</p>
              <p className="text-xs text-[var(--text-secondary)]">Seguindo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection */}
      <div>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab.key
                ? { background: tab.bg, color: tab.color }
                : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {tab.label}
              <span
                className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                  color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
                }}
              >
                {figurinhas.filter(f => f.status === tab.key).length}
              </span>
            </button>
          ))}
          {isOwner && (
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => { setEditFigurinhaData(null); setFormOpen(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Nova
            </Button>
          )}
        </div>

        {/* Cards grid */}
        {figurinhasLoading ? (
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-44 h-64 rounded-2xl shimmer" />
            ))}
          </div>
        ) : filteredFigurinhas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">
              {isOwner
                ? `Você não tem figurinhas com status "${tabs.find(t => t.key === activeTab)?.label}"`
                : `Nenhuma figurinha "${tabs.find(t => t.key === activeTab)?.label}" ainda`}
            </p>
            {isOwner && (
              <Button className="mt-4" size="sm" onClick={() => { setEditFigurinhaData(null); setFormOpen(true); }}>
                Adicionar figurinha
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            {filteredFigurinhas.map(fig => (
              <div key={fig.id} className="relative group">
                <FigurinhaCard figurinha={fig} />
                {isOwner && (
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditFigurinhaData(fig); setFormOpen(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: '#009739' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.from('figurinhas').delete().eq('id', fig.id).eq('user_id', user?.id ?? '');
                        fetchFigurinhas();
                        toast('Figurinha deletada!', 'success');
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-red-600"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M3 6h18M19 6l-1 14H6L5 6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Figurinha form */}
      {user && (
        <FigurinhaForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditFigurinhaData(null); }}
          userId={user.id}
          editData={editFigurinhaData}
          onSuccess={fetchFigurinhas}
        />
      )}
    </div>
  );
}

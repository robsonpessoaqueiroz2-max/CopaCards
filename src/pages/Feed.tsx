import { useState } from 'react';
import { useFeed, FigurinhaWithProfile } from '../hooks/useFeed';
import { useAuth } from '../hooks/useAuth';
import { FeedPost } from '../components/Feed/FeedPost';
import { FigurinhaForm } from '../components/FigurinhaCard/FigurinhaForm';
import { Button } from '../components/ui/Button';

export function Feed() {
  const { user } = useAuth();
  const { figurinhas, loading, error, refetch, toggleLike } = useFeed(user?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<FigurinhaWithProfile | null>(null);

  const handleDelete = (id: string) => {
    refetch();
    void id;
  };

  const handleEdit = (fig: FigurinhaWithProfile) => {
    setEditData(fig);
    setFormOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Create post button */}
      {user && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--border)] mb-6 cursor-pointer hover:border-[#009739] transition-all"
          style={{ background: 'var(--bg-card)', boxShadow: '0 2px 8px var(--shadow)' }}
          onClick={() => { setEditData(null); setFormOpen(true); }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#009739' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FEDD00" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[var(--text-secondary)] text-sm">
            Compartilhar uma nova figurinha...
          </span>
          <Button size="sm" className="ml-auto flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nova
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shimmer" />
                <div className="flex-1">
                  <div className="h-3 w-32 rounded shimmer mb-2" />
                  <div className="h-2 w-20 rounded shimmer" />
                </div>
              </div>
              <div className="mx-4 mb-4 rounded-xl shimmer" style={{ height: '140px' }} />
              <div className="px-4 pb-4 flex gap-4">
                <div className="h-8 w-16 rounded-xl shimmer" />
                <div className="h-8 w-16 rounded-xl shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Erro ao carregar feed</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && figurinhas.length === 0 && (
        <div className="text-center py-16">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#012169' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FEDD00" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Nenhuma figurinha ainda</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            Seja o primeiro a compartilhar uma figurinha!
          </p>
          {user && (
            <Button onClick={() => { setEditData(null); setFormOpen(true); }} size="lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Criar primeira figurinha
            </Button>
          )}
        </div>
      )}

      {/* Feed posts */}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {figurinhas.map(fig => (
            <FeedPost
              key={fig.id}
              figurinha={fig}
              currentUserId={user?.id}
              onLike={id => user && toggleLike(id, user.id)}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Figurinha form modal */}
      {user && (
        <FigurinhaForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditData(null); }}
          userId={user.id}
          editData={editData}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

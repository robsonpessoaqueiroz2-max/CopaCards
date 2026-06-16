import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { Avatar } from '../ui/Avatar';
import { ConfirmModal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { user, signOut, deleteAccount } = useAuth();
  const { profile } = useProfile(user?.id ?? null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const { error } = await deleteAccount();
    setDeletingAccount(false);
    if (error) {
      toast('Erro ao deletar conta. Tente novamente.', 'error');
    } else {
      await signOut();
      setDeleteModalOpen(false);
      navigate('/login');
      toast('Conta deletada com sucesso.', 'success');
    }
  };

  const navLinks = [
    {
      to: '/feed',
      label: 'Feed',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      to: `/perfil/${user?.id}`,
      label: 'Perfil',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      to: '/mensagens',
      label: 'Mensagens',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-16"
        style={{
          background: '#012169',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        }}
      >
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'transparent' }}>
              {/** Inline SVG to allow color switching by theme */}
              <svg
                viewBox="0 0 512 512"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                focusable="false"
                style={{ display: 'block' }}
              >
                <path
                  d="M69.191,0v96.863H27.674v41.514h41.516v89.946H27.674v41.513h41.516v89.946H27.674v41.513h41.516V512h415.135V0H69.191z M442.812,470.487H110.704v-69.191h332.108V470.487z M442.812,359.782H110.704V311.35h332.108V359.782z M228.323,269.836 c0-26.706,21.727-48.432,48.432-48.432s48.432,21.727,48.432,48.432H228.323z M442.812,269.836h-76.111 c0-49.596-40.35-89.946-89.946-89.946s-89.946,40.35-89.946,89.946h-76.105V138.377h332.108V269.836z M442.812,96.863H110.704 v-55.35h332.108V96.863z"
                  fill="#FEDD00"
                />
              </svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight hidden sm:block">
              Copa<span style={{ color: '#FEDD00' }}>Cards</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = location.pathname === link.to || location.pathname.startsWith(link.to.split('/perfil')[0] + '/perfil');
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.icon}
                  <span style={{ width: 8, height: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 3, display: 'inline-block', marginRight: 8 }} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
              title="Alternar tema"
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {/* Avatar + Hamburger */}
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/10 transition-all"
            >
              <Avatar src={profile?.avatar_url} name={profile?.username} size="sm" />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

      </header>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{
          background: '#012169',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        {navLinks.map(link => {
          const isProfile = link.to.includes('/perfil/');
          const active = isProfile
            ? location.pathname.includes('/perfil/')
            : location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                active ? 'text-[#FEDD00] bg-white/10' : 'text-white/60 hover:text-white'
              }`}
            >
              {link.icon}
              <span style={{ width: 14, height: 6, background: 'rgba(255,255,255,0.14)', borderRadius: 3, display: 'inline-block', marginTop: 6 }} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Dropdown Menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed top-16 right-4 z-50 w-56 rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden fade-in"
            style={{ background: 'var(--bg-card)' }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
              <Avatar src={profile?.avatar_url} name={profile?.username} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {profile?.username || user?.email}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { setMenuOpen(false); navigate(`/perfil/${user?.id}`); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </button>

              <button
                onClick={() => { setMenuOpen(false); navigate('/mensagens'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mensagens
              </button>

              <div className="my-1 border-t border-[var(--border)]" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sair / Logout
              </button>

              <button
                onClick={() => { setMenuOpen(false); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7M3 12a9 9 0 1118 0 9 9 0 01-18 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Trocar de Conta
              </button>

              <div className="my-1 border-t border-[var(--border)]" />

              <button
                onClick={() => { setMenuOpen(false); setDeleteModalOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Deletar Conta
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete account modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Deletar Conta"
        message="Tem certeza que deseja deletar sua conta? Esta ação é irreversível e todos os seus dados serão perdidos."
        confirmLabel="Deletar Conta"
        loading={deletingAccount}
      />
    </>
  );
}

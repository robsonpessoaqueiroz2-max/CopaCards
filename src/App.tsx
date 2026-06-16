import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Header/Header';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { ResetPassword } from './pages/ResetPassword';
import { Feed } from './pages/Feed';
import { Perfil } from './pages/Perfil';
import { Mensagens } from './pages/Mensagens';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#012169] text-2xl"
            style={{ background: '#FEDD00' }}
          >
            CC
          </div>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
            <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      {/* pt-16 = fixed header; pb-20 md:pb-4 = space for bottom nav on mobile */}
      <div className="pt-16">
        <div className="pb-20 md:pb-4">
          <Routes>
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/perfil/:id" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/mensagens" element={<ProtectedRoute><Mensagens /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}


function AppRouter({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#012169] text-2xl animate-pulse"
            style={{ background: '#FEDD00' }}
          >
            CC
          </div>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
            <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Carregando CopaCards...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes — no header */}
      <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <Login />} />
      <Route path="/cadastro" element={user ? <Navigate to="/feed" replace /> : <Cadastro />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* App routes — with header */}
      <Route
        path="/*"
        element={
          user ? (
            <AppLayout theme={theme} onToggleTheme={onToggleTheme} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('copacards-theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('copacards-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRouter theme={theme} onToggleTheme={toggleTheme} />
      </BrowserRouter>
    </ToastProvider>
  );
}

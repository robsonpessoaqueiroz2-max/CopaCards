import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if there's a valid session from the recovery link
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session) {
          setValidSession(true);
          setChecking(false);
          return;
        }

        // Wait a bit for auth state to update from URL hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession) {
          setValidSession(true);
        }
        setChecking(false);
      } catch (err) {
        console.error('Session check error:', err);
        setChecking(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        setValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast('Preencha todos os campos', 'warning');
      return;
    }
    if (password.length < 6) {
      toast('A senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      toast('As senhas não coincidem', 'warning');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Senha atualizada com sucesso!', 'success');
      navigate('/feed');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <svg className="animate-spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#009739" strokeWidth="4" />
          <path className="opacity-75" fill="#009739" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Link inválido</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Este link de redefinição de senha é inválido ou expirou.
          </p>
          <Button onClick={() => navigate('/login')}>
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden mx-auto mb-3"
            style={{ background: '#FEDD00' }}
          >
            <img src="/brasil.ico" alt="Brasil" className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Redefinir senha</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Digite e confirme sua nova senha para continuar
          </p>
        </div>

        <div
          className="rounded-2xl p-6 border border-[var(--border)]"
          style={{ background: 'var(--bg-card)', boxShadow: '0 8px 32px var(--shadow)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nova Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </svg>
              }
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              error={confirmPassword && password !== confirmPassword ? 'Senhas não coincidem' : undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Atualizar Senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

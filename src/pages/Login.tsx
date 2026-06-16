import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast('Preencha todos os campos', 'warning');
      return;
    }
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {
      toast(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : error.message, 'error');
    } else {
      navigate('/feed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast('Digite seu e-mail', 'warning');
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPassword(forgotEmail);
    setForgotLoading(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('E-mail de redefinição enviado! Verifique sua caixa de entrada.', 'success');
      setForgotOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left side — decorative */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-1/2 p-12 relative overflow-hidden"
        style={{ background: '#012169' }}
      >
        <div className="absolute inset-0 opacity-40">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                width: 14 + Math.random() * 20,
                height: 10 + Math.random() * 18,
                left: `${(i * 9) % 100}%`,
                top: `${(i * 12) % 100}%`,
                background: i % 2 === 0 ? '#009739' : '#FEDD00',
                opacity: 0.16,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-[#012169] text-4xl mx-auto mb-6"
            style={{ background: '#FEDD00', boxShadow: '0 8px 32px rgba(254,221,0,0.4)' }}
          >
            <img src="/brasil.ico" alt="Brasil" className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">CopaCards</h1>
          <p className="text-white/80 text-lg max-w-xs">
            A rede social de figurinhas digitais da Copa do Mundo
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {['Colecione figurinhas de atletas', 'Conecte-se com outros fãs', 'Troque e compartilhe'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEDD00' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#012169" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#012169] text-2xl mx-auto mb-3"
              style={{ background: '#FEDD00' }}
            >
              <img src="/brasil.ico" alt="Brasil" className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>CopaCards</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {forgotOpen ? 'Recuperar Senha' : 'Entrar'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {forgotOpen
              ? 'Enviaremos um link de redefinição para seu e-mail'
              : 'Bem-vindo de volta ao CopaCards'}
          </p>

          {forgotOpen ? (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
              <Button type="submit" loading={forgotLoading} className="w-full">
                Enviar link de redefinição
              </Button>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-sm text-center font-medium"
                style={{ color: '#009739' }}
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                  </svg>
                }
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="cursor-pointer">
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-medium"
                  style={{ color: '#009739' }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Entrar
              </Button>
            </form>
          )}

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold" style={{ color: '#009739' }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

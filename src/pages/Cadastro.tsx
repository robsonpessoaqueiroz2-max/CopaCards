import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export function Cadastro() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast('Preencha todos os campos', 'warning');
      return;
    }
    if (form.password.length < 6) {
      toast('A senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast('As senhas não coincidem', 'warning');
      return;
    }

    setLoading(true);
    const { error } = await signUp(form.email, form.password);
    setLoading(false);

    if (error) {
      toast(error.message === 'User already registered'
        ? 'Este e-mail já está cadastrado'
        : error.message, 'error');
    } else {
      toast('Conta criada com sucesso! Bem-vindo ao CopaCards!', 'success');
      navigate('/feed');
    }
  };

  const passwordStrength = () => {
    if (!form.password) return 0;
    let strength = 0;
    if (form.password.length >= 6) strength++;
    if (form.password.length >= 10) strength++;
    if (/[A-Z]/.test(form.password)) strength++;
    if (/[0-9]/.test(form.password)) strength++;
    if (/[^A-Za-z0-9]/.test(form.password)) strength++;
    return strength;
  };

  const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
  const strengthColor = ['', '#ef4444', '#f97316', '#FEDD00', '#009739', '#009739'];

  const ps = passwordStrength();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left side */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #009739 0%, #012169 100%)' }}
      >
        <div className="relative z-10 text-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-[#012169] text-4xl mx-auto mb-6"
            style={{ background: '#FEDD00', boxShadow: '0 8px 32px rgba(254,221,0,0.4)' }}
          >
            CC
          </div>
          <h1 className="text-4xl font-black text-white mb-3">CopaCards</h1>
          <p className="text-white/80 text-lg max-w-sm">
            Junte-se à maior comunidade de figurinhas digitais da Copa do Mundo!
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: '⭐', label: 'Figurinhas únicas' },
              { icon: '🤝', label: 'Conecte-se' },
              { icon: '💬', label: 'Comentários' },
              { icon: '📱', label: 'Mobile-first' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-white/80 text-xs font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-[#012169] text-2xl mx-auto mb-3"
              style={{ background: '#FEDD00' }}
            >
              CC
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>CopaCards</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Criar conta</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Junte-se ao CopaCards gratuitamente
          </p>

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

            <div>
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                leftIcon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                  </svg>
                }
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPassword
                        ? <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" />
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                  </button>
                }
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= ps ? strengthColor[ps] : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: strengthColor[ps] || 'var(--text-secondary)' }}>
                    {strengthLabel[ps]}
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              error={form.confirmPassword && form.password !== form.confirmPassword ? 'Senhas não coincidem' : undefined}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Criar Conta
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#009739' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

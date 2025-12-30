import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Music, Mail, Lock, User, AlertCircle, CheckCircle, Globe, Building, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';

export default function RegisterForm() {
  const [searchParams] = useSearchParams();
  const inviteCodeFromUrl = searchParams.get('invite');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState('pt');
  const [accountType, setAccountType] = useState<'artist' | 'office' | 'producer'>('artist');
  const [inviteCode, setInviteCode] = useState(inviteCodeFromUrl || '');
  const [inviteValidated, setInviteValidated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validate invite code on mount if present in URL
  useEffect(() => {
    if (inviteCodeFromUrl) {
      validateInviteCode(inviteCodeFromUrl);
    }
  }, [inviteCodeFromUrl]);

  const validateInviteCode = async (code: string) => {
    if (!code) {
      setInviteValidated(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        setError('Código de convite inválido');
        setInviteValidated(false);
        return;
      }

      // Check if code is still valid
      if (data.used_count >= data.max_uses) {
        setError('Este código de convite já foi utilizado o máximo de vezes');
        setInviteValidated(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('Este código de convite expirou');
        setInviteValidated(false);
        return;
      }

      setInviteValidated(true);
      setError('');
    } catch (err) {
      setError('Erro ao validar código de convite');
      setInviteValidated(false);
    }
  };

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const handlePasswordChange = (pass: string) => {
    setPassword(pass);
    setPasswordStrength(calculatePasswordStrength(pass));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações frontend
    if (!name || name.trim() === '') {
      setError('Digite seu nome');
      toast.error('Digite seu nome');
      return;
    }

    if (!email || email.trim() === '') {
      setError('Digite seu email');
      toast.error('Digite seu email');
      return;
    }

    if (!email.includes('@')) {
      setError('Digite um email válido');
      toast.error('Digite um email válido');
      return;
    }

    if (!password || password.trim() === '') {
      setError('Digite uma senha');
      toast.error('Digite uma senha');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      toast.error('As senhas não coincidem');
      return;
    }

    // Validate invite code in beta mode
    const betaMode = import.meta.env.VITE_BETA_MODE === 'true';
    const inviteOnly = import.meta.env.VITE_INVITE_ONLY === 'true';

    if (betaMode && inviteOnly && !inviteValidated) {
      setError('Código de convite obrigatório para cadastro. Solicite um convite para participar do beta.');
      toast.error('Código de convite obrigatório');
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            language,
            account_type: accountType,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            beta_user: true,
            invite_code: inviteCode || null,
            created_at: new Date().toISOString()
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      console.log('User created successfully:', authData.user.id);

      // Log beta user registration (não bloqueia o cadastro se falhar)
      try {
        const { error: logError } = await supabase.from('beta_user_logs').insert({
          user_id: authData.user.id,
          action_type: 'signup',
          module: 'auth',
          metadata: {
            email,
            account_type: accountType,
            language,
            signup_source: 'web',
            invite_code: inviteCode || null
          }
        });

        if (logError) {
          console.error('Failed to log beta user:', logError);
        }
      } catch (logErr) {
        console.error('Beta log insert failed:', logErr);
      }

      // Increment invite code usage (não bloqueia o cadastro se falhar)
      if (inviteCode && inviteValidated) {
        try {
          const { error: rpcError } = await supabase.rpc('increment_invite_code_usage', {
            invite_code: inviteCode
          });
          if (rpcError) {
            console.error('Failed to increment invite code:', rpcError);
          }
        } catch (rpcErr) {
          console.error('RPC increment_invite_code_usage failed:', rpcErr);
        }
      }

      console.log('Signup complete, redirecting to /');

      toast.success('Cadastro realizado com sucesso! Bem-vindo ao TaskMaster!');

      // Redirect to onboarding
      navigate('/');
    } catch (err: any) {
      console.error('Signup failed:', err);

      if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        const errorMsg = 'Este email já está cadastrado. Faça login ou use outro email.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = err.message || 'Erro ao criar conta. Tente novamente.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-xl flex items-center justify-center">
            <Music className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">TaskMaster</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crie sua conta gratuita
            </h2>
            <p className="text-gray-600">
              Comece a gerenciar sua carreira artística com inteligência e controle total
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Invite Code Field */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Convite {import.meta.env.VITE_INVITE_ONLY === 'true' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    if (e.target.value.length > 5) {
                      validateInviteCode(e.target.value);
                    }
                  }}
                  placeholder="BETA-2025-XXXXXX"
                  required={import.meta.env.VITE_INVITE_ONLY === 'true'}
                  disabled={!!inviteCodeFromUrl}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                    inviteCodeFromUrl
                      ? 'bg-gray-100 cursor-not-allowed'
                      : inviteValidated
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                />
                {inviteValidated && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {inviteValidated && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Código válido! Você pode prosseguir com o cadastro.
                </p>
              )}
              {import.meta.env.VITE_INVITE_ONLY === 'true' && !inviteValidated && (
                <p className="mt-1 text-xs text-gray-500">
                  O cadastro está disponível apenas para beta testers convidados
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <div className={`h-1 flex-1 rounded ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${passwordStrength >= 5 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Mínimo de 8 caracteres (inclua letras, números e símbolos para maior segurança)</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Idioma Preferido
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('artist')}
                  className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                    accountType === 'artist'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Artista
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('office')}
                  className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                    accountType === 'office'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Escritório
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('producer')}
                  className={`py-3 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                    accountType === 'producer'
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Produtor
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2">
                <input type="checkbox" required className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1" />
                <span className="text-sm text-gray-600">
                  Concordo com os{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                    Política de Privacidade
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Criando conta...
                </span>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Gratuito</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Sem cartão</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Setup 2min</p>
          </div>
        </div>
      </div>
    </div>
  );
}

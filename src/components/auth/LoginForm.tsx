import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music, Mail, Lock, AlertCircle, Target, Bot, Compass, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validações frontend
    if (!email || email.trim() === '') {
      setError('Digite seu email');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Digite um email válido');
      setLoading(false);
      return;
    }

    if (!password || password.trim() === '') {
      setError('Digite sua senha');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Check if it's demo mode
      if (email === 'usuario@exemplo.com' && password === 'senha123') {
        setIsDemoMode(true);
        // Demo mode: store flag and redirect without real authentication
        localStorage.setItem('taskmaster_demo_mode', 'true');
        toast.success('Login realizado! Modo demonstração ativado.');
        navigate('/');
      } else {
        // Real authentication
        localStorage.removeItem('taskmaster_demo_mode');
        await signIn(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setEmail('usuario@exemplo.com');
    setPassword('senha123');
  };

  const features = [
    {
      icon: Target,
      title: 'Planejamento de Shows',
      text: 'Organize turnês, riders técnicos e setlists em um só lugar. Nunca mais perca um detalhe importante.'
    },
    {
      icon: Bot,
      title: 'Gestão de Lançamentos',
      text: 'Cronograma completo de releases com checklist automático e acompanhamento em tempo real.'
    },
    {
      icon: Music,
      title: 'Controle Financeiro',
      text: 'Saiba exatamente quanto você ganha e gasta. Orçamentos, receitas e despesas organizados.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-orange-50 to-yellow-50 flex">

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-500 via-orange-500 to-yellow-400 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Music className="w-7 h-7 text-cyan-600" />
            </div>
            <span className="text-3xl font-bold text-white">TaskMaster</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                A plataforma que músicos, produtores e gestores usam para planejar shows, lançamentos e carreiras.
              </h1>
              <p className="text-xl text-white text-opacity-95 leading-relaxed">
                Chega de planilhas e desorganização. Gerencie sua carreira musical com inteligência artificial e tenha tudo sob controle em um só lugar.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-5">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-5 border border-white border-opacity-20">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold mb-2">{feature.title}</h3>
                        <p className="text-white text-opacity-90 text-sm leading-relaxed">{feature.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white border-opacity-20">
              <div>
                <div className="text-4xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-white text-opacity-90">Artistas Usando</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">20mil+</div>
                <div className="text-sm text-white text-opacity-90">Tarefas Organizadas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1">2mil+</div>
                <div className="text-sm text-white text-opacity-90">Lançamentos Gerenciados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white text-opacity-90 text-sm">
          © 2025 TaskMaster. Desenvolvido por profissionais com mais de uma década de experiência na indústria musical.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Music className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TaskMaster</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta!
              </h2>
              <p className="text-gray-600">
                Entre com suas credenciais para acessar a plataforma
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                </label>
                <Link to="/reset-password" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                  Criar conta gratuita
                </Link>
              </p>
            </div>

            {/* Demo Access */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoAccess}
                className="mt-4 w-full border-2 border-cyan-200 bg-cyan-50 text-cyan-700 py-3 rounded-lg font-semibold hover:bg-cyan-100 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
              >
                Acessar Demonstração Gratuita
              </button>
              <p className="mt-2 text-xs text-center text-gray-500">
                Explore a plataforma sem criar conta
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-gray-500">Confiado por artistas e produtores musicais</p>
            <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Dados 100% Seguros</span>
              <span>•</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

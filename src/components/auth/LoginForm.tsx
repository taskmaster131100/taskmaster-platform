import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music, Mail, Lock, AlertCircle, Calendar, Rocket, DollarSign, FolderKanban, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      await signIn(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Rocket,
      title: 'Carreiras',
      text: 'Gerencie a trajetória completa de artistas'
    },
    {
      icon: Calendar,
      title: 'Lançamentos',
      text: 'Cronogramas e checklists automáticos'
    },
    {
      icon: Music,
      title: 'Shows',
      text: 'Turnês, riders e setlists organizados'
    },
    {
      icon: FolderKanban,
      title: 'Projetos',
      text: 'Tudo em um só lugar, sem planilhas'
    }
  ];

  const stats = [
    { value: '+500', label: 'Artistas' },
    { value: '+80', label: 'Escritórios' },
    { value: '+20mil', label: 'Tarefas' },
    { value: '+2mil', label: 'Lançamentos' }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] flex">

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-[55%] p-12 flex-col justify-between relative overflow-hidden">
        
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FFAD85]/30 to-[#FEC89A]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#FFAD85]/20 to-transparent rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"></div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFAD85]/30">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">TaskMaster</span>
          </div>

          {/* Main Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-[1.15] tracking-tight">
              Gerencie carreiras, lançamentos, shows e projetos
              <span className="text-[#FF9B6A]"> em um só lugar.</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              A plataforma completa para músicos, produtores e gestores organizarem tudo com inteligência artificial.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="group p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-[#FFAD85]/50 hover:shadow-lg hover:shadow-[#FFAD85]/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85]/20 to-[#FEC89A]/20 rounded-xl flex items-center justify-center group-hover:from-[#FFAD85] group-hover:to-[#FF9B6A] transition-all duration-300">
                        <Icon className="w-5 h-5 text-[#FF9B6A] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-semibold mb-1">{feature.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{feature.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-gray-400 text-sm">
          © 2025 TaskMaster. Desenvolvido por profissionais da indústria musical.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFAD85]/30">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">TaskMaster</span>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-500">
                Entre para continuar gerenciando seus projetos
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-[#FFAD85] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-[#FFAD85] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#FFAD85] border-gray-300 rounded focus:ring-[#FFAD85]" />
                  <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                </label>
                <Link to="/reset-password" className="text-sm text-[#FF9B6A] hover:text-[#FFAD85] font-medium transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-[#FFAD85]/30 focus:outline-none focus:ring-2 focus:ring-[#FFAD85] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Entrando...
                  </span>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>


          </div>

          {/* Trust Badges */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-xs text-gray-400">Confiado por artistas e produtores musicais</p>
            <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Dados Seguros
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Suporte 24/7
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

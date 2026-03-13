import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Music, Calendar, BarChart3, Users, Zap, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Music className="w-6 h-6" />,
      title: 'Gestão de Artistas',
      description: 'Gerencie múltiplos artistas, suas carreiras e toda a agenda em um só lugar.'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Shows e Turnês',
      description: 'Organize shows, riders, contratos e setlists. Nunca perca um compromisso importante.'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Financeiro e Relatórios',
      description: 'Controle receitas, despesas, splits e métricas de carreira em tempo real.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Equipe Integrada',
      description: 'Trabalhe com seu time, distribua tarefas e mantenha todos alinhados.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Planejamento com IA',
      description: 'Receba sugestões inteligentes para lançamentos, campanhas e estratégias de carreira.'
    },
    {
      icon: <ListChecks className="w-6 h-6" />,
      title: 'Lançamentos e Projetos',
      description: 'Checklists automáticos, fases de produção e cronogramas para cada lançamento.'
    }
  ];

  const testimonials = [
    {
      name: 'Rafael Andrade',
      role: 'Empresário Musical',
      company: 'Independente — 8 artistas na carteira',
      quote: 'Antes eu vivia no WhatsApp e em planilha. Hoje tudo está em um lugar só. Economizo horas toda semana.',
      avatar: '🎸'
    },
    {
      name: 'Juliana Costa',
      role: 'Produtora Executiva',
      company: 'Estúdio próprio — São Paulo',
      quote: 'O módulo de lançamentos com checklist automático mudou completamente minha produção. Nada mais cai no esquecimento.',
      avatar: '🎤'
    },
    {
      name: 'Diego Fernandes',
      role: 'Gestor de Carreira',
      company: 'Escritório de gestão — BH',
      quote: 'A visão financeira integrada com a agenda de shows é o que eu procurava há anos. Resultado: menos erro, mais foco.',
      avatar: '🎹'
    }
  ];

  const stats = [
    { value: 'Tudo em 1', label: 'plataforma integrada' },
    { value: '10+', label: 'anos de expertise musical' },
    { value: '4 pilares', label: 'de gestão profissional' },
    { value: 'IA nativa', label: 'assistente de planejamento' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Music className="w-8 h-8 text-[#FFAD85]" />
              <span className="text-xl font-bold text-gray-900">TaskMaster</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] font-medium transition-colors"
              >
                Criar conta grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              Beta aberto — Cadastre-se agora
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              A plataforma completa para
              <span className="text-[#FFAD85]"> gerenciar carreiras musicais</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Shows, lançamentos, finanças, equipe e IA — tudo integrado em uma só plataforma.
              Feito para músicos, produtores e gestores que levam a carreira a sério.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] font-semibold text-lg transition-colors flex items-center gap-2 shadow-lg shadow-orange-200"
              >
                Criar conta grátis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg hover:border-gray-400 font-semibold text-lg transition-colors"
              >
                Ver planos
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Sem cartão de crédito</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Setup em 2 minutos</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Cancele quando quiser</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo o que você precisa para gerir uma carreira profissional
            </h2>
            <p className="text-xl text-gray-600">
              De artistas independentes a escritórios de gestão — a TaskMaster cobre todas as frentes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-[#FFAD85] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Usado por profissionais da música no Brasil
            </h2>
            <p className="text-xl text-gray-600">
              O que quem já está na plataforma tem a dizer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#FFAD85] to-[#FF8C5A] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para organizar sua operação musical?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Crie sua conta agora e comece a usar em minutos. Sem cartão, sem burocracia.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-[#FF8C5A] rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors inline-flex items-center gap-2 shadow-lg"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-orange-100 mt-4">
            Acesso imediato • Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-6 h-6 text-[#FFAD85]" />
                <span className="text-lg font-bold text-white">TaskMaster</span>
              </div>
              <p className="text-sm">
                A plataforma completa para gestão de carreiras musicais.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/pricing" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Criar conta</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Entrar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:contact@taskmaster.works" className="hover:text-white transition-colors">contact@taskmaster.works</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 TaskMaster. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

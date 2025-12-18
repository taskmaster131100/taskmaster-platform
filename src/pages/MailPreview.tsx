import React from 'react';
import { Link } from 'react-router-dom';
import {
  Music, Sparkles, Calendar, TrendingUp, Users, BarChart3,
  CheckCircle, ArrowRight, Shield, Zap, Award, Clock
} from 'lucide-react';

export default function MailPreview() {
  const features = [
    {
      icon: Music,
      title: 'Produção Musical Completa',
      description: 'Gerencie repertório, arranjos, ensaios e setlists em uma única plataforma. Modo palco offline, QR codes para músicos e sincronização em tempo real.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Sparkles,
      title: 'IA com 10+ Anos de Expertise',
      description: 'Planning Copilot baseado em experiência real da indústria musical. Gera automaticamente fases, tarefas, orçamentos e cronogramas otimizados.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Calendar,
      title: 'Gestão de Projetos Profissional',
      description: 'Templates D-30, D-45, D-90 para DVDs, Shows e Lançamentos. Sistema completo de aprovações, timeline e controle de prazos.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Analytics e KPIs em Tempo Real',
      description: 'Acompanhe o progresso de projetos, produtividade da equipe e métricas financeiras. Relatórios exportáveis e insights acionáveis.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Users,
      title: 'Gestão de Artistas e Contratos',
      description: 'Centralize informações de artistas, contratos, exclusividade e comissões. Dashboard financeiro completo por artista.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Shield,
      title: 'Seguro e Escalável',
      description: 'Dados criptografados, backup automático e infraestrutura enterprise. Modo local para trabalhar offline quando necessário.',
      color: 'from-cyan-500 to-cyan-600'
    }
  ];

  const stats = [
    { value: '95%', label: 'Funcionalidades Completas', icon: CheckCircle },
    { value: '26', label: 'Tabelas de Database', icon: BarChart3 },
    { value: '12', label: 'Módulos Enterprise', icon: Award },
    { value: '10+', label: 'Anos de Expertise', icon: Clock }
  ];

  const methodology = [
    {
      number: '01',
      title: 'Geração de Conteúdo',
      description: 'DVDs, videoclipes, singles e álbuns com planejamento completo de pré-produção, gravação e pós-produção.',
      icon: Music
    },
    {
      number: '02',
      title: 'Vendas de Shows',
      description: 'Prospecção de eventos, negociação de cachês, contratos e gestão de agenda de apresentações.',
      icon: Calendar
    },
    {
      number: '03',
      title: 'Pré-Produção',
      description: 'Rider técnico, logística de equipamentos, cronogramas e checklist completo de produção.',
      icon: Zap
    },
    {
      number: '04',
      title: 'Gestão Estratégica',
      description: 'KPIs, relatórios financeiros, análise de ROI e planejamento de carreira de longo prazo.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Preview Badge */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
        MODO PREVIEW
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
              <Music className="w-9 h-9 text-purple-600" />
            </div>
            <span className="text-4xl font-bold">TaskMaster</span>
          </div>

          {/* Main Content */}
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gerencie sua carreira musical como um profissional
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              A única plataforma que une gestão de projetos, produção musical e inteligência artificial baseada em 10+ anos de experiência na indústria.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-blue-50 transition-all shadow-xl font-semibold text-lg flex items-center justify-center gap-2"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/welcome"
                className="px-8 py-4 bg-white bg-opacity-10 backdrop-blur-sm border-2 border-white text-white rounded-xl hover:bg-opacity-20 transition-all font-semibold text-lg flex items-center justify-center gap-2"
              >
                Ver Demo Interativa
                <Sparkles className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-white border-opacity-20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="w-8 h-8 text-blue-100" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Methodology Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Metodologia dos 4 Pilares
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistema completo de gestão musical baseado em expertise comprovada e resultados reais da indústria
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {methodology.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-purple-600 mb-2">{pillar.number}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{pillar.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Plataforma Completa e Integrada
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todas as ferramentas que você precisa para gerenciar sua carreira musical em um só lugar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar sua carreira musical?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Junte-se a produtores e artistas que já estão gerenciando seus projetos de forma profissional
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-10 py-5 bg-white text-purple-600 rounded-xl hover:bg-blue-50 transition-all shadow-2xl font-bold text-lg flex items-center justify-center gap-2"
            >
              Criar Conta Grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/lobby"
              className="px-10 py-5 bg-white bg-opacity-10 backdrop-blur-sm border-2 border-white text-white rounded-xl hover:bg-opacity-20 transition-all font-bold text-lg flex items-center justify-center gap-2"
            >
              Explorar Dashboard
              <Sparkles className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-sm text-blue-100 mt-8">
            Sem cartão de crédito necessário. Comece em minutos.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">TaskMaster</span>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025 TaskMaster. Desenvolvido com expertise de 10+ anos na indústria musical.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { X, Music, Sparkles, Calendar, TrendingUp } from 'lucide-react';

interface WelcomeModalProps {
  userName: string;
  onClose: () => void;
}

export default function WelcomeModal({ userName, onClose }: WelcomeModalProps) {
  const features = [
    {
      icon: Music,
      title: 'Produção Musical',
      description: 'Sistema completo de repertório, arranjos e setlists',
      color: 'from-[#FFAD85] to-[#FF9B6A]'
    },
    {
      icon: Calendar,
      title: 'Gestão de Projetos',
      description: 'Organize DVDs, Shows e Lançamentos',
      color: 'from-purple-500 to-[#FF9B6A]'
    },
    {
      icon: Sparkles,
      title: 'IA com Expertise',
      description: '10+ anos de conhecimento da indústria',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'KPIs e Relatórios',
      description: 'Métricas e análises em tempo real',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-w-[calc(100vw-2rem)]">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFAD85] via-purple-600 to-pink-600 p-5 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <Music className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{getGreeting()}, {userName}!</h2>
              <p className="text-blue-100 text-lg">Bem-vindo de volta ao TaskMaster</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-2xl font-bold">95%</div>
              <div className="text-xs text-blue-100">Funcionalidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">26</div>
              <div className="text-xs text-blue-100">Tabelas Database</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-blue-100">Módulos Enterprise</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Plataforma Completa de Gestão Musical
            </h3>
            <p className="text-gray-600">
              Gerencie sua carreira musical profissionalmente com ferramentas baseadas em 10+ anos de experiência na indústria.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Comece Agora</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition-all text-sm font-medium text-gray-700"
              >
                <Music className="w-4 h-4" />
                Novo Projeto
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg hover:bg-purple-50 hover:border-purple-300 border border-gray-200 transition-all text-sm font-medium text-gray-700"
              >
                <Calendar className="w-4 h-4" />
                Ver Calendário
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Ir para Dashboard
          </button>
        </div>

        {/* Tip */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-500">
            💡 Dica: Use o Command Center para ter uma visão geral de todos os seus projetos
          </p>
        </div>
      </div>
    </div>
  );
}

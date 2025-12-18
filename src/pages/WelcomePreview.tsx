import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Music, Users, Calendar, TrendingUp, Check, X } from 'lucide-react';

export default function WelcomePreview() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bem-vindo ao TaskMaster',
      description: 'A plataforma completa para gestão de carreira musical profissional',
      icon: Music,
      content: 'TaskMaster é baseado em 10+ anos de experiência na indústria musical, oferecendo ferramentas completas para gerenciar todos os aspectos da sua carreira.',
      image: '🎵',
    },
    {
      title: 'Metodologia dos 4 Pilares',
      description: 'Gestão musical profissional baseada em expertise comprovada',
      icon: Users,
      content: 'Nossa metodologia divide a gestão em 4 pilares estratégicos: Geração de Conteúdo, Vendas de Shows, Pré-Produção e Gestão Estratégica.',
      image: '🏛️',
    },
    {
      title: 'Projetos e Tarefas',
      description: 'Organize toda a produção musical em um só lugar',
      icon: Calendar,
      content: 'Crie projetos para DVDs, Shows, Lançamentos e muito mais. Cada projeto possui fases automáticas, tarefas e cronogramas otimizados.',
      image: '📋',
    },
    {
      title: 'Insights e IA',
      description: 'Inteligência artificial com 10+ anos de conhecimento musical',
      icon: TrendingUp,
      content: 'Receba sugestões inteligentes de planejamento, análise de viabilidade e recomendações baseadas em experiência real da indústria.',
      image: '🤖',
    },
    {
      title: 'Produção Musical Integrada',
      description: 'Do repertório ao palco, tudo em uma plataforma',
      icon: Music,
      content: 'Gerencie repertório, arranjos, ensaios e setlists. Sistema completo com modo palco offline, QR codes para músicos e muito mais.',
      image: '🎸',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">

      {/* Preview Badge */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
        MODO PREVIEW
      </div>

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <Link
            to="/"
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{step.title}</h2>
              <p className="text-blue-100">{step.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-blue-100 mt-2">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{step.image}</div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Features List for specific steps */}
          {currentStep === 1 && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Geração de Conteúdo</h4>
                  <p className="text-sm text-gray-600">DVDs, videoclipes, singles e álbuns</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Vendas de Shows</h4>
                  <p className="text-sm text-gray-600">Prospecção, negociação e contratos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Pré-Produção</h4>
                  <p className="text-sm text-gray-600">Rider técnico, logística e cronogramas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <Check className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900">Gestão Estratégica</h4>
                  <p className="text-sm text-gray-600">KPIs, relatórios e planejamento</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {currentStep === 4 && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">95%</div>
                <div className="text-xs text-gray-600">Funcionalidades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">26</div>
                <div className="text-xs text-gray-600">Tabelas Database</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-xs text-gray-600">Módulos Enterprise</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
          <Link
            to="/login"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Voltar ao Login
          </Link>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Criar Conta
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

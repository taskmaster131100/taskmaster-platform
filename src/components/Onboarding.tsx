import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Music, Users, Calendar, TrendingUp, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
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
      title: 'Planejamento Inteligente',
      description: 'Estrutura profissional para tomar decisões com clareza',
      icon: TrendingUp,
      content: 'Organize projetos, acompanhe KPIs e visualize o estado real da sua carreira. A plataforma é construída para apoiar decisões estratégicas com dados e estrutura.',
      image: '🤖',
    },
    {
      title: 'Produção Musical Integrada',
      description: 'Do repertório ao palco, tudo em uma plataforma',
      icon: Music,
      content: 'Gerencie repertório, arranjos, ensaios e setlists. Inclui modo palco com acesso rápido a letras e cifras, e QR code para músicos acessarem o material direto do celular.',
      image: '🎸',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] p-4 sm:p-6 text-white relative">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">{step.title}</h2>
              <p className="text-blue-100 text-sm sm:text-base">{step.description}</p>
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
        <div className="p-4 sm:p-8 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="text-5xl sm:text-6xl mb-4">{step.image}</div>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Features List for specific steps */}
          {currentStep === 1 && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Check className="w-5 h-5 text-[#FFAD85] flex-shrink-0 mt-0.5" />
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

          {/* Plans */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <div className="text-2xl font-bold text-orange-600">$49<span className="text-sm font-normal text-gray-500">/mês</span></div>
                <div className="text-sm font-medium text-gray-700 mt-1">Plano Entrada</div>
                <div className="text-xs text-gray-500 mt-0.5">1 artista · projetos · shows · tarefas</div>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-600">$79<span className="text-sm font-normal text-gray-500">/mês</span></div>
                <div className="text-sm font-medium text-gray-700 mt-1">Plano Base</div>
                <div className="text-xs text-gray-500 mt-0.5">Múltiplos artistas · financeiro · CRM</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors w-full sm:w-auto text-left sm:text-center"
          >
            Pular Tutorial
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 sm:py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

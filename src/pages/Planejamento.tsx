import React from 'react';
import PlanningCopilot from '../components/PlanningCopilot';
import { Sparkles, Target, Zap, ShieldCheck } from 'lucide-react';

export default function PlanejamentoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Info & Methodology */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#FFAD85]" />
                Planning Copilot
              </h1>
              <p className="text-gray-600 mt-2">
                Sua inteligência artificial treinada com a metodologia de 10+ anos do Marcos Menezes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Metodologia 4 Pilares
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">01</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Conteúdo</h4>
                    <p className="text-xs text-gray-500">Gestão de ativos, música e presença digital.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">02</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Shows & Vendas</h4>
                    <p className="text-xs text-gray-500">Estratégia de booking e comercialização.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-xs">03</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Logística</h4>
                    <p className="text-xs text-gray-500">Operação de turnê, equipe e deslocamento.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-xs">04</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Estratégia</h4>
                    <p className="text-xs text-gray-500">Posicionamento, marketing e carreira.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Modo Proativo Ativado</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                O Copilot analisa seus dados em tempo real para sugerir ações antes mesmo de você pedir. Fique atento às notificações no seu Dashboard.
              </p>
            </div>
          </div>

          {/* Right Side: Chat Interface */}
          <div className="lg:col-span-8">
            <PlanningCopilot />
          </div>

        </div>
      </div>
    </div>
  );
}

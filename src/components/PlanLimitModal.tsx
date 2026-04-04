import React from 'react';
import { X, ArrowUpCircle, Lock } from 'lucide-react';

interface PlanLimitModalProps {
  resource: string;       // ex: "artistas", "projetos", "shows"
  limit: number;
  planName: string;       // ex: "Plano Inicial"
  onClose: () => void;
  onUpgrade?: () => void;
}

const RESOURCE_LABELS: Record<string, { icon: string; hint: string }> = {
  artistas:  { icon: '🎤', hint: 'Gerencie mais talentos com planos superiores.' },
  projetos:  { icon: '📁', hint: 'Crie mais projetos para organizar toda a sua operação.' },
  tarefas:   { icon: '✅', hint: 'Mais tarefas para controlar cada detalhe da sua operação.' },
  shows:     { icon: '🎸', hint: 'Gerencie mais shows e eventos ao longo do ano.' },
  lançamentos: { icon: '🚀', hint: 'Controle mais lançamentos musicais em paralelo.' },
};

const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  resource,
  limit,
  planName,
  onClose,
  onUpgrade,
}) => {
  const info = RESOURCE_LABELS[resource] || { icon: '⚡', hint: 'Faça upgrade para continuar.' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">
            {info.icon}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
            Limite atingido
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Limite de {resource} do {planName}
        </h3>

        <p className="text-sm text-gray-500 mb-1">
          O {planName} permite até{' '}
          <span className="font-semibold text-gray-700">
            {limit} {resource}
          </span>
          .
        </p>

        <p className="text-sm text-gray-500 mb-6">{info.hint}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-xl text-sm font-bold hover:from-[#FF9B6A] hover:to-[#FF8A55] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Fazer Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanLimitModal;

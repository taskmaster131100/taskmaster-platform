import React, { useState } from 'react';
import { BrainCircuit, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

export interface ContextualGuide {
  module: 'financial' | 'logistics' | 'marketing' | 'production' | 'legal' | 'general';
  title: string;
  description: string;
  tips: string[];
  actionItems: {
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  relatedModules?: string[];
}

interface MentorContextualGuideProps {
  guide: ContextualGuide;
  onClose?: () => void;
}

export default function MentorContextualGuide({ guide, onClose }: MentorContextualGuideProps) {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'financial': return 'from-green-600 to-emerald-600';
      case 'logistics': return 'from-blue-600 to-cyan-600';
      case 'marketing': return 'from-pink-600 to-rose-600';
      case 'production': return 'from-purple-600 to-indigo-600';
      case 'legal': return 'from-gray-600 to-slate-600';
      default: return 'from-indigo-600 to-purple-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getModuleColor(guide.module)} p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{guide.title}</h3>
              <p className="text-white/80 text-sm">{guide.description}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Tips */}
        {guide.tips.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              Dicas de Marcos Menezes
            </h4>
            <ul className="space-y-2">
              {guide.tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-indigo-600 font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {guide.actionItems.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <h4 className="font-bold text-gray-900">Próximas Ações</h4>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="space-y-2 mt-2">
                {guide.actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}
                  >
                    <div className="font-bold text-sm mb-1">{item.label}</div>
                    <div className="text-xs opacity-90">{item.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related Modules */}
        {guide.relatedModules && guide.relatedModules.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Módulos Relacionados:</p>
            <div className="flex flex-wrap gap-2">
              {guide.relatedModules.map((module, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Guias contextuais pré-configurados para cada módulo
 */
export const CONTEXTUAL_GUIDES: Record<string, ContextualGuide> = {
  financial_overview: {
    module: 'financial',
    title: 'Gestão Financeira Inteligente',
    description: 'Marcos Menezes guia você através da gestão financeira de seus shows',
    tips: [
      'Sempre negocie o cachê com antecedência para garantir fluxo de caixa',
      'Considere os custos de logística ao definir o split com o artista',
      'Mantenha uma margem mínima de 20% para cobrir despesas operacionais',
      'Documente todos os acordos financeiros em contrato'
    ],
    actionItems: [
      {
        label: 'Revisar Splits Recentes',
        description: 'Analise se seus splits estão gerando margem suficiente',
        priority: 'high'
      },
      {
        label: 'Atualizar Previsões de Caixa',
        description: 'Projete o fluxo de caixa para os próximos 90 dias',
        priority: 'medium'
      },
      {
        label: 'Negociar Melhores Termos',
        description: 'Busque aumentar sua margem em novos shows',
        priority: 'low'
      }
    ],
    relatedModules: ['Logística', 'Contratos']
  },

  logistics_roadmap: {
    module: 'logistics',
    title: 'Planejamento de Logística',
    description: 'Otimize o conforto e eficiência da sua equipe nas viagens',
    tips: [
      'Detalhe os horários de saída, paradas e chegada para evitar atrasos',
      'Considere o tempo de descanso da equipe entre shows',
      'Documente pontos de parada, hotéis e refeições',
      'Comunique o roteiro com toda a equipe com antecedência'
    ],
    actionItems: [
      {
        label: 'Definir Rotas Eficientes',
        description: 'Planeje as melhores rotas considerando distância e tempo',
        priority: 'high'
      },
      {
        label: 'Reservar Hospedagem',
        description: 'Garanta acomodação confortável para a equipe',
        priority: 'high'
      },
      {
        label: 'Comunicar Roteiro',
        description: 'Envie o RoadMap para todos os envolvidos',
        priority: 'medium'
      }
    ],
    relatedModules: ['Shows', 'Financeiro']
  },

  marketing_strategy: {
    module: 'marketing',
    title: 'Estratégia de Marketing',
    description: 'Maximize o engajamento e público para seus shows',
    tips: [
      'Comece a promover o show com pelo menos 2 semanas de antecedência',
      'Use Reels e Stories para criar conteúdo viral',
      'Engaje com fãs nos comentários para aumentar alcance',
      'Crie uma hashtag única para cada show'
    ],
    actionItems: [
      {
        label: 'Gerar Conteúdo com IA',
        description: 'Use o assistente de IA para criar roteiros de Reels',
        priority: 'high'
      },
      {
        label: 'Agendar Posts',
        description: 'Agende posts para os próximos 14 dias',
        priority: 'medium'
      },
      {
        label: 'Analisar Engajamento',
        description: 'Revise qual tipo de conteúdo gera mais engajamento',
        priority: 'low'
      }
    ],
    relatedModules: ['Shows', 'Setlist']
  },

  production_setlist: {
    module: 'production',
    title: 'Preparação Artística',
    description: 'Organize o setlist e a preparação para o show',
    tips: [
      'Escolha músicas que conectem com o público do local',
      'Varie o ritmo e energia ao longo do show',
      'Reserve tempo para interação com o público',
      'Tenha um plano B para imprevistos'
    ],
    actionItems: [
      {
        label: 'Montar Setlist',
        description: 'Defina a ordem das músicas para o show',
        priority: 'high'
      },
      {
        label: 'Revisar Técnica',
        description: 'Verifique equipamentos e som',
        priority: 'high'
      },
      {
        label: 'Ensaiar',
        description: 'Faça ensaios antes do show',
        priority: 'medium'
      }
    ],
    relatedModules: ['Shows', 'Logística']
  },

  legal_contracts: {
    module: 'legal',
    title: 'Segurança Jurídica',
    description: 'Proteja seus interesses com contratos bem estruturados',
    tips: [
      'Sempre tenha um contrato assinado antes do show',
      'Defina claramente as responsabilidades de cada parte',
      'Inclua cláusulas de cancelamento e força maior',
      'Documente todos os acordos verbais por escrito'
    ],
    actionItems: [
      {
        label: 'Revisar Contrato',
        description: 'Verifique se o contrato está completo e assinado',
        priority: 'high'
      },
      {
        label: 'Confirmar Termos',
        description: 'Confirme cachê, data, hora e local com o contratante',
        priority: 'high'
      },
      {
        label: 'Arquivar Documentos',
        description: 'Mantenha cópias de todos os contratos assinados',
        priority: 'medium'
      }
    ],
    relatedModules: ['Financeiro', 'Shows']
  }
};

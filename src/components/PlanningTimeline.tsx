import React from 'react';
import { Calendar, CheckCircle, Circle, Clock } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  order_index: number;
}

interface PlanningTimelineProps {
  phases: Phase[];
}

export default function PlanningTimeline({ phases }: PlanningTimelineProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (phases.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhuma fase cadastrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Visual */}
      <div className="relative">
        {sortedPhases.map((phase, index) => (
          <div key={phase.id} className="relative pb-8 last:pb-0">
            {/* Linha conectora */}
            {index < sortedPhases.length - 1 && (
              <div className="absolute left-3 top-9 bottom-0 w-0.5 bg-gray-300" />
            )}

            {/* Item da timeline */}
            <div className="flex items-start gap-4">
              {/* Ícone de status */}
              <div className="flex-shrink-0 mt-1 relative z-10 bg-white">
                {getStatusIcon(phase.status)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: phase.color }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {phase.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {phase.description}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${phase.color}20`,
                      color: phase.color
                    }}
                  >
                    {getStatusLabel(phase.status)}
                  </span>
                </div>

                <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {calculateDuration(phase.start_date, phase.end_date)} dias
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda de Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Em andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Concluído</span>
          </div>
        </div>
      </div>
    </div>
  );
}

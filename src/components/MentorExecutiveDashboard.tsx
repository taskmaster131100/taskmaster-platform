import React, { useState, useEffect } from 'react';
import { BrainCircuit, TrendingUp, AlertCircle, CheckCircle2, Clock, DollarSign, BarChart3, ArrowRight } from 'lucide-react';
import { getMentorExecutiveSummary, MentorExecutiveSummary } from '../services/mentorDiagnosticService';

export default function MentorExecutiveDashboard() {
  const [summary, setSummary] = useState<MentorExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      const data = await getMentorExecutiveSummary();
      setSummary(data);
      setLoading(false);
    };
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-900';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'success': return 'bg-green-50 border-green-200 text-green-900';
      default: return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Dashboard Executivo</h2>
              <p className="text-white/80 text-sm">Análise Estratégica de Marcos Menezes</p>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm text-white/80 mb-1">Saúde Geral</div>
            <div className={`text-4xl font-bold ${getHealthColor(summary.overallHealth)}`}>
              {summary.overallHealth}%
            </div>
          </div>
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{summary.overallHealth}%</div>
              <div className="text-xs text-white/80">Saúde</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Shows Próximos</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{summary.activeShows}</div>
          <p className="text-xs text-gray-500 mt-1">Próximos 30 dias</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Receita Prevista</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            R$ {(summary.upcomingRevenue / 1000).toFixed(1)}k
          </div>
          <p className="text-xs text-gray-500 mt-1">Próximos 30 dias</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Tarefas Pendentes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{summary.pendingTasks}</div>
          <p className="text-xs text-gray-500 mt-1">Aguardando ação</p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Recomendações de Marcos Menezes
        </h3>
        <ul className="space-y-2">
          {summary.recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
              <span className="text-indigo-600 font-bold mt-0.5">→</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Diagnostics */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-lg">Diagnósticos Detalhados</h3>
        {summary.diagnostics.map((diagnostic, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 border transition-all hover:shadow-md ${getSeverityStyles(diagnostic.severity)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getSeverityIcon(diagnostic.severity)}</div>
              <div className="flex-1">
                <h4 className="font-bold mb-1">{diagnostic.title}</h4>
                <p className="text-sm opacity-90 mb-2">{diagnostic.message}</p>
                <p className="text-xs opacity-75 mb-3">{diagnostic.recommendation}</p>

                {diagnostic.dataPoints && diagnostic.dataPoints.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {diagnostic.dataPoints.map((point, pidx) => (
                      <div key={pidx} className="bg-black/5 rounded-lg p-2">
                        <div className="text-xs opacity-75">{point.label}</div>
                        <div className="font-bold text-sm flex items-center gap-1">
                          {point.value}
                          {point.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-600" />}
                          {point.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {diagnostic.actionPath && (
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    Tomar Ação <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Importar ícone que faltou
const Calendar = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

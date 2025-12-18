import React from 'react';
import { Link } from 'react-router-dom';
import {
  Music, Users, Calendar, TrendingUp, FolderOpen,
  Clock, AlertCircle, ArrowRight,
  Sparkles, Library
} from 'lucide-react';

export default function LobbyPreview() {
  const stats = [
    { label: 'Projetos Ativos', value: '12', icon: FolderOpen, color: 'from-blue-500 to-blue-600' },
    { label: 'Tarefas Pendentes', value: '47', icon: Clock, color: 'from-purple-500 to-purple-600' },
    { label: 'Artistas', value: '8', icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Eventos Próximos', value: '5', icon: Calendar, color: 'from-orange-500 to-orange-600' }
  ];

  const quickActions = [
    {
      title: 'Novo Projeto',
      description: 'Criar DVD, Show, ou Lançamento',
      icon: FolderOpen,
      link: '/login',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Produção Musical',
      description: 'Repertório, arranjos e setlists',
      icon: Music,
      link: '/login',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Planejamento IA',
      description: 'Assistente com expertise de 10+ anos',
      icon: Sparkles,
      link: '/login',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Templates',
      description: 'D-30, D-45, D-90 profissionais',
      icon: Library,
      link: '/login',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentActivity = [
    {
      type: 'project',
      message: 'Novo projeto "DVD Ao Vivo 2025" criado',
      time: '2 horas atrás'
    },
    {
      type: 'task',
      message: '5 tarefas concluídas em "Lançamento Single"',
      time: '5 horas atrás'
    },
    {
      type: 'music',
      message: 'Arranjo "Amor Eterno" atualizado',
      time: '1 dia atrás'
    }
  ];

  const upcomingTasks = [
    {
      title: 'Finalizar roteiro do DVD',
      project: 'DVD Ao Vivo 2025',
      dueDate: 'Amanhã',
      priority: 'high'
    },
    {
      title: 'Aprovar arte do single',
      project: 'Lançamento Single',
      dueDate: '2 dias',
      priority: 'medium'
    },
    {
      title: 'Ensaio geral com banda',
      project: 'Show Especial',
      dueDate: '3 dias',
      priority: 'medium'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Preview Badge */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
        MODO PREVIEW
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
              <p className="text-gray-600 mt-1">Visão geral da sua gestão musical</p>
            </div>
            <Link
              to="/login"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Novo Projeto
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    Acessar
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Atividade Recente
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.message}</p>
                    <span className="text-xs text-gray-500 mt-1">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Próximas Tarefas
            </h2>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.priority === 'high' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{task.project}</p>
                  <p className="text-xs text-gray-500">Prazo: {task.dueDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Productivity Tips */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Dica de Produtividade</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use o <strong>Planning Copilot</strong> para criar projetos completos baseados em 10+ anos de experiência na indústria musical. A IA irá gerar automaticamente fases, tarefas, orçamentos e cronogramas otimizados.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Experimentar Planning Copilot
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* CTA to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg font-semibold"
          >
            Acessar Minha Conta
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            Este é um preview. Faça login para ver seus dados reais.
          </p>
        </div>

      </div>
    </div>
  );
}

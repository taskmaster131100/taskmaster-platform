import React from 'react';
import { Link } from 'react-router-dom';
import {
  Music, Users, Calendar, TrendingUp, FolderOpen,
  BarChart3, Clock, CheckCircle, AlertCircle, ArrowRight,
  Sparkles, Library, List
} from 'lucide-react';

export default function CommandCenter() {
  const stats = [
    { label: 'Projetos Ativos', value: '0', icon: FolderOpen, color: 'from-[#FFAD85] to-[#FF9B6A]' },
    { label: 'Tarefas Pendentes', value: '0', icon: Clock, color: 'from-purple-500 to-[#FF9B6A]' },
    { label: 'Artistas', value: '0', icon: Users, color: 'from-green-500 to-green-600' },
    { label: 'Eventos Próximos', value: '0', icon: Calendar, color: 'from-orange-500 to-orange-600' }
  ];

  const quickActions = [
    {
      title: 'Novo Projeto',
      description: 'Criar DVD, Show, ou Lançamento',
      icon: FolderOpen,
      link: '/',
      color: 'from-[#FFAD85] to-[#FF9B6A]'
    },
    {
      title: 'Produção Musical',
      description: 'Repertório, arranjos e setlists',
      icon: Music,
      link: '/music',
      color: 'from-purple-500 to-[#FF9B6A]'
    },
    {
      title: 'Planejamento IA',
      description: 'Assistente com expertise de 10+ anos',
      icon: Sparkles,
      link: '/planejamento',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Templates',
      description: 'D-30, D-45, D-90 profissionais',
      icon: Library,
      link: '/templates',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentActivity = [
    {
      type: 'info',
      message: 'Bem-vindo ao TaskMaster! Comece criando seu primeiro projeto.',
      time: 'Agora'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
              <p className="text-gray-600 mt-1">Visão geral da sua gestão musical</p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
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
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#FFAD85] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex items-center text-sm text-[#FFAD85] font-medium">
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
                  <AlertCircle className="w-5 h-5 text-[#FFAD85] flex-shrink-0 mt-0.5" />
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
              <List className="w-5 h-5" />
              Próximas Tarefas
            </h2>
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma tarefa pendente</p>
              <p className="text-gray-400 text-xs mt-1">Crie um projeto para começar</p>
            </div>
          </div>
        </div>

        {/* Productivity Tips */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Dica de Produtividade</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use o <strong>Planning Copilot</strong> para criar projetos completos baseados em 10+ anos de experiência na indústria musical. A IA irá gerar automaticamente fases, tarefas, orçamentos e cronogramas otimizados.
              </p>
              <Link
                to="/planejamento"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#FFAD85] hover:text-[#FF9B6A]"
              >
                Experimentar Planning Copilot
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

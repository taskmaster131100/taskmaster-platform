import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FolderOpen, DollarSign, Calendar, Music, Rocket, Search, 
  MoreVertical, TrendingUp, TrendingDown, Loader2, Sparkles, 
  AlertTriangle, Info, CheckCircle2, ArrowRight, Building2, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProactiveSuggestions, Suggestion } from '../services/suggestionService';
import { checkTaskDeadlines, checkUpcomingShows, checkUpcomingReleases } from '../services/notificationService';
import VirtualAgentWidget from './VirtualAgentWidget';

interface OrganizationDashboardProps {
  onSelectArtist: (id: string) => void;
  onCreateArtist: () => void;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  projects: any[];
  departments: any[];
  users: any[];
}

export default function OrganizationDashboard({
  onSelectArtist,
  onCreateArtist,
  onSelectProject,
  onCreateProject,
  projects: initialProjects,
  departments,
  users
}: OrganizationDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState([
    {
      icon: Music,
      label: 'Artistas',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-cyan-500 to-cyan-600',
      iconColor: 'text-cyan-600',
      onClick: () => navigate('/artists')
    },
    {
      icon: Rocket,
      label: 'Projetos',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      onClick: () => navigate('/planejamento')
    },
    {
      icon: DollarSign,
      label: 'Faturamento',
      value: 'R$ 0,00',
      subtitle: 'este mês',
      trend: 'up',
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      onClick: () => navigate('/finance')
    },
    {
      icon: Calendar,
      label: 'Próximos Shows',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-yellow-500 to-yellow-600',
      iconColor: 'text-yellow-600',
      onClick: () => navigate('/shows')
    }
  ]);

  useEffect(() => {
    loadDashboardData();
    // Executar verificações automáticas de notificações
    checkTaskDeadlines();
    checkUpcomingShows();
    checkUpcomingReleases();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // 1. Carregar Artistas
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*')
        .order('name');
      
      const artistsList = artistsData || [];
      setArtists(artistsList);

      // 2. Carregar Projetos/Planejamentos
      const { data: planningsData } = await supabase
        .from('plannings')
        .select('*');
      
      const planningsList = planningsData || [];
      setProjects(planningsList);

      // 3. Carregar Shows
      const { data: showsData } = await supabase
        .from('shows')
        .select('*')
        .gte('show_date', new Date().toISOString().split('T')[0]);
      
      const showsCount = showsData?.length || 0;

      // 4. Carregar Financeiro (Faturamento do mês)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      const { data: financeData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'revenue')
        .eq('status', 'paid')
        .gte('transaction_date', firstDayOfMonth.toISOString().split('T')[0]);
      
      const totalRevenue = financeData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // 5. Carregar Sugestões Proativas
      const proactiveSuggestions = await getProactiveSuggestions();
      setSuggestions(proactiveSuggestions);

      // Atualizar Stats
      setStats([
        {
          icon: Music,
          label: 'Artistas',
          value: artistsList.length.toString(),
          subtitle: `${artistsList.length} talentos ativos`,
          color: 'from-cyan-500 to-cyan-600',
          iconColor: 'text-cyan-600',
          onClick: () => navigate('/artists')
        },
        {
          icon: Rocket,
          label: 'Projetos',
          value: planningsList.length.toString(),
          subtitle: `${planningsList.length} planejamentos`,
          color: 'from-orange-500 to-orange-600',
          iconColor: 'text-orange-600',
          onClick: () => navigate('/planejamento')
        },
        {
          icon: DollarSign,
          label: 'Faturamento',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
          subtitle: 'receita confirmada',
          trend: 'up',
          color: 'from-green-500 to-green-600',
          iconColor: 'text-green-600',
          onClick: () => navigate('/finance')
        },
        {
          icon: Calendar,
          label: 'Próximos Shows',
          value: showsCount.toString(),
          subtitle: 'agenda futura',
          color: 'from-yellow-500 to-yellow-600',
          iconColor: 'text-yellow-600',
          onClick: () => navigate('/shows')
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FFAD85] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando seu escritório virtual...</p>
        </div>
      </div>
    );
  }

  const isSoloArtist = artists.length === 1;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Virtual Agent Proactive Notifications */}
      <VirtualAgentWidget />

      {/* Welcome & Organization Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isSoloArtist ? `Olá, ${artists[0].name}` : 'Central de Comando'}
          </h1>
          <p className="text-gray-600">
            {isSoloArtist ? 'Sua carreira musical em 360°' : 'Gerencie sua produtora e artistas em 360°'}
          </p>
        </div>
        <div className="flex gap-3">
          {!isSoloArtist && (
            <button
              onClick={() => navigate('/team')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              Minha Organização
            </button>
          )}
          <button
            onClick={isSoloArtist ? () => onSelectArtist(artists[0].id) : onCreateArtist}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-md transition-all shadow-sm text-sm font-medium"
          >
            {isSoloArtist ? <Music className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSoloArtist ? 'Meu Perfil Artístico' : 'Novo Artista'}
          </button>
        </div>
      </div>

      {/* Header with Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                onClick={stat.onClick}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md hover:border-[#FFAD85] transition-all cursor-pointer touch-button"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {stat.trend && (
                    stat.trend === 'up' ?
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> :
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</h3>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                  {stat.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proactive Suggestions Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sugestões do TaskMaster</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between touch-button ${
                  suggestion.type === 'warning' ? 'border-l-4 border-l-amber-500' : 
                  suggestion.type === 'action' ? 'border-l-4 border-l-purple-500' : 
                  'border-l-4 border-l-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {suggestion.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {suggestion.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'action' && <Sparkles className="w-4 h-4 text-purple-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {suggestion.module}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{suggestion.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">{suggestion.description}</p>
                </div>
                
                {suggestion.actionLabel && (
                  <button 
                    onClick={() => navigate(suggestion.actionPath || '/')}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors mt-auto touch-button"
                  >
                    {suggestion.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-6 sm:p-8 rounded-xl border border-dashed border-gray-300 text-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Tudo em ordem!</h3>
              <p className="text-xs sm:text-sm text-gray-600">Não há pendências críticas ou sugestões no momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Artists Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Nossos Talentos</h2>
            </div>
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
            >
              <Music className="w-4 h-4" />
              Novo Talento
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar artistas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Artista
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Gênero
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {artists.map((artist) => (
                <tr
                  key={artist.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSelectArtist(artist.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {artist.artistic_name?.charAt(0) || artist.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{artist.artistic_name || artist.name}</div>
                        <div className="text-sm text-gray-500">{artist.genre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{artist.genre}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      artist.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${artist.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      {artist.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-700 capitalize">{artist.contract_type?.replace('_', ' ') || 'Não definido'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(artist.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#FF9B6A] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {artists.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Nenhum artista cadastrado</p>
            <p className="text-gray-400 text-sm mb-4">Comece adicionando seu primeiro talento</p>
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors text-sm font-medium"
            >
              Adicionar Artista
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

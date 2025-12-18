import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FolderOpen, DollarSign, Calendar, Music, Rocket, Search, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

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
  projects,
  departments,
  users
}: OrganizationDashboardProps) {
  const navigate = useNavigate();

  // Mock data para demonstração - será substituído por dados reais do Supabase
  const mockArtists = [
    {
      id: '1',
      name: 'João Silva',
      artisticName: 'João Músico',
      genre: 'Pop Rock',
      status: 'active',
      projects: 2,
      contract: 'Não definido',
      exclusive: true,
      avatar: 'JS'
    },
    {
      id: '2',
      name: 'Maria Oliveira',
      artisticName: 'Maria Voz',
      genre: 'MPB',
      status: 'active',
      projects: 0,
      contract: 'Não definido',
      exclusive: false,
      avatar: 'MO'
    },
    {
      id: '3',
      name: 'Darlan',
      artisticName: 'Cantor Darlan',
      genre: 'Samba e Pagode',
      status: 'active',
      projects: 0,
      contract: 'Não definido',
      exclusive: true,
      avatar: 'D'
    }
  ];

  const stats = [
    {
      icon: Music,
      label: 'Artistas',
      value: '3',
      subtitle: 'de 3 talentos',
      color: 'from-cyan-500 to-cyan-600',
      iconColor: 'text-cyan-600',
      onClick: () => navigate('/artistas')
    },
    {
      icon: Rocket,
      label: 'Projetos',
      value: '2',
      subtitle: 'de 2 sonhos',
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      onClick: () => navigate('/projects')
    },
    {
      icon: DollarSign,
      label: 'Faturamento',
      value: 'R$ 85.000,00',
      subtitle: '+15% que mês passado',
      trend: 'up',
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      onClick: () => navigate('/reports')
    },
    {
      icon: Calendar,
      label: 'Próximos Shows',
      value: '6',
      subtitle: '5 shows 1 lançamentos',
      color: 'from-yellow-500 to-yellow-600',
      iconColor: 'text-yellow-600',
      onClick: () => navigate('/shows')
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header with Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                onClick={stat.onClick}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.trend && (
                    stat.trend === 'up' ?
                      <TrendingUp className="w-5 h-5 text-green-500" /> :
                      <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {stat.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {stat.subtitle}
                </div>
              </div>
            );
          })}
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
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white">
              <option>Todos os status</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
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
                  Projetos
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
              {mockArtists.map((artist) => (
                <tr
                  key={artist.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSelectArtist(artist.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {artist.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{artist.name}</div>
                        <div className="text-sm text-gray-500">{artist.artisticName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{artist.genre}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Rocket className="w-4 h-4 text-orange-500" />
                      {artist.projects} projetos
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-700">{artist.contract}</div>
                      <div className="text-xs text-gray-500">
                        {artist.exclusive ? '✓ Exclusivo' : 'Não exclusivo'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(artist.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
        {mockArtists.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Nenhum artista cadastrado</p>
            <p className="text-gray-400 text-sm mb-4">Comece adicionando seu primeiro talento</p>
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Adicionar Artista
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

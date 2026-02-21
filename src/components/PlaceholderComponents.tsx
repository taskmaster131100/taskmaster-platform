import React from 'react';
import { Music, Users, Calendar, Sparkles, FileText, BarChart3, Settings, User, Search, ArrowLeft, Plus, X, Check, Clock, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

export function ArtistManager({ onSelectArtist, onCreateArtist, onSelectProject }: any) {
  const [artists, setArtists] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const storedArtists = localStorage.getItem('taskmaster_artists');
    if (storedArtists) {
      try {
        const parsed = JSON.parse(storedArtists);
        setArtists(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setArtists([]);
      }
    }
  }, []);

  const filteredArtists = artists.filter(artist =>
    artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.stage_name || artist.artisticName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AA';
  };

  const genreColors: Record<string, string> = {
    'Pop': 'from-pink-500 to-purple-500',
    'Rock': 'from-red-500 to-orange-500',
    'Hip Hop': 'from-purple-500 to-indigo-500',
    'Eletrônica': 'from-cyan-500 to-blue-500',
    'MPB': 'from-green-500 to-teal-500',
    'Samba': 'from-yellow-500 to-orange-500',
    'Funk': 'from-purple-500 to-pink-500',
    'Sertanejo': 'from-orange-500 to-red-500'
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Artistas</h2>
          <p className="text-gray-600">{artists.length} artistas cadastrados</p>
        </div>
        <button
          onClick={onCreateArtist}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
        >
          + Novo Artista
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar artistas por nome, nome artístico ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum artista encontrado' : 'Nenhum artista cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro artista'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Adicionar Artista
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map(artist => {
            const initials = getInitials(artist.name);
            const colorClass = genreColors[artist.genre] || 'from-gray-500 to-gray-600';

            return (
              <div
                key={artist.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 cursor-pointer"
                onClick={() => onSelectArtist(artist.id)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {initials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{artist.name}</h3>
                    {artist.stage_name || artist.artisticName && (
                      <p className="text-sm text-gray-600">{artist.stage_name || artist.artisticName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{artist.genre || 'Não definido'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      artist.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {artist.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>

                    {artist.exclusivity && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Exclusivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(artist.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ArtistDetails({ artistId, onBack, onSelectProject, onCreateProject }: any) {
  const [artist, setArtist] = React.useState<any>(null);

  React.useEffect(() => {
    const storedArtists = localStorage.getItem('taskmaster_artists');
    if (storedArtists) {
      try {
        const artists = JSON.parse(storedArtists);
        const found = artists.find((a: any) => a.id === artistId);
        setArtist(found);
      } catch (e) {
        console.error('Erro ao carregar artista:', e);
      }
    }
  }, [artistId]);

  if (!artist) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="mb-4 text-[#FFAD85] hover:text-[#FF9B6A]">← Voltar</button>
        <p className="text-gray-600">Carregando artista...</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AA';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 text-[#FFAD85] hover:text-[#FF9B6A] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
      >
        ← Voltar para Artistas
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
            {getInitials(artist.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{artist.name}</h1>
            {artist.stage_name || artist.artisticName && (
              <p className="text-xl text-gray-600 mb-2">{artist.stage_name || artist.artisticName}</p>
            )}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                artist.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {artist.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
              {artist.exclusivity && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Contrato Exclusivo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Informações</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Gênero Musical</p>
                <p className="font-medium text-gray-900">{artist.genre || 'Não definido'}</p>
              </div>
              {artist.contactEmail && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{artist.contactEmail}</p>
                </div>
              )}
              {artist.contactPhone && (
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium text-gray-900">{artist.contactPhone}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Contrato</h3>
            <div className="space-y-3">
              {artist.contractStartDate && (
                <div>
                  <p className="text-sm text-gray-600">Início do Contrato</p>
                  <p className="font-medium text-gray-900">
                    {new Date(artist.contractStartDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {artist.contractEndDate && (
                <div>
                  <p className="text-sm text-gray-600">Fim do Contrato</p>
                  <p className="font-medium text-gray-900">
                    {new Date(artist.contractEndDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {artist.commissionRate && (
                <div>
                  <p className="text-sm text-gray-600">Taxa de Comissão</p>
                  <p className="font-medium text-gray-900">{artist.commissionRate}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {artist.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Biografia</h3>
            <p className="text-gray-700">{artist.bio}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Projetos do Artista</h2>
        <div className="text-center py-8">
          <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Nenhum projeto vinculado ainda</p>
          <button
            onClick={onCreateProject}
            className="px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Criar Projeto
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectDashboard({ project, tasks = [], departments, onTaskUpdate, onAddTask }: any) {
  if (!project) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Selecione um projeto para ver os detalhes</p>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const stats = [
    {
      label: 'Tarefas Totais',
      value: totalTasks,
      color: 'from-[#FFAD85] to-[#FF9B6A]',
      icon: FileText
    },
    {
      label: 'Concluídas',
      value: completedTasks,
      color: 'from-green-500 to-green-600',
      icon: FileText
    },
    {
      label: 'Progresso',
      value: `${Math.round(progress)}%`,
      color: 'from-purple-500 to-[#FF9B6A]',
      icon: BarChart3
    },
    {
      label: 'Orçamento',
      value: project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : 'N/A',
      color: 'from-orange-500 to-orange-600',
      icon: DollarSign
    }
  ];

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
        <p className="text-gray-600">{project.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {project.status === 'active' ? 'Ativo' : project.status}
          </span>
          <span className="text-sm text-gray-600">
            Tipo: {project.project_type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Progresso do Projeto</h3>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Conclusão</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tarefas Recentes</h3>
          {recentTasks.length > 0 ? (
            <div className="space-y-2">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'done' ? 'bg-green-500' :
                    task.status === 'inProgress' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="flex-1 text-sm text-gray-900">{task.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma tarefa criada ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskBoard({ tasks = [], departments, project, onTasksChange }: any) {
  const [showNewTask, setShowNewTask] = React.useState(false);
  const [columns, setColumns] = React.useState({
    backlog: [] as any[],
    todo: [] as any[],
    inProgress: [] as any[],
    done: [] as any[]
  });

  React.useEffect(() => {
    const taskArray = Array.isArray(tasks) ? tasks : [];
    setColumns({
      backlog: taskArray.filter(t => t.status === 'backlog'),
      todo: taskArray.filter(t => t.status === 'todo'),
      inProgress: taskArray.filter(t => t.status === 'inProgress'),
      done: taskArray.filter(t => t.status === 'done')
    });
  }, [tasks]);

  const handleNewTask = () => {
    const newTask = {
      id: `task_${Date.now()}`,
      name: 'Nova Tarefa',
      description: 'Descrição da tarefa',
      status: 'todo',
      projectId: project?.id,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, newTask];
    if (onTasksChange) {
      onTasksChange(updatedTasks);
    }
    setShowNewTask(false);
  };

  const columnConfig = [
    { id: 'backlog', title: 'Backlog', color: 'from-gray-500 to-gray-600', tasks: columns.backlog },
    { id: 'todo', title: 'A Fazer', color: 'from-[#FFAD85] to-[#FF9B6A]', tasks: columns.todo },
    { id: 'inProgress', title: 'Em Progresso', color: 'from-yellow-500 to-yellow-600', tasks: columns.inProgress },
    { id: 'done', title: 'Concluído', color: 'from-green-500 to-green-600', tasks: columns.done }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quadro de Tarefas</h2>
          <p className="text-gray-600">Gerencie as tarefas do projeto {project?.name}</p>
        </div>
        <button
          onClick={handleNewTask}
          className="px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          + Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columnConfig.map(column => (
          <div key={column.id} className="bg-white rounded-lg shadow-md">
            <div className={`bg-gradient-to-r ${column.color} text-white p-4 rounded-t-lg`}>
              <h3 className="font-semibold text-lg">{column.title}</h3>
              <p className="text-sm opacity-90">{column.tasks.length} tarefas</p>
            </div>
            <div className="p-4 space-y-3 min-h-[400px]">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{task.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500">
                      📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
              {column.tasks.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nenhuma tarefa</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Calendar({ tasks = [], onTaskUpdate }: any) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [showNewEvent, setShowNewEvent] = React.useState(false);
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    const storedEvents = localStorage.getItem('taskmaster_events');
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleNewEvent = () => {
    const newEvent = {
      id: `event_${Date.now()}`,
      title: 'Novo Evento',
      date: new Date().toISOString(),
      type: 'meeting'
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('taskmaster_events', JSON.stringify(updatedEvents));
    setShowNewEvent(false);
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendário</h2>
        <button
          onClick={handleNewEvent}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-[#FF9B6A] text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          + Novo Evento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Anterior
          </button>
          <h3 className="text-xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Próximo →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() &&
                           currentDate.getMonth() === new Date().getMonth() &&
                           currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-blue-50 border-[#FFAD85]' : 'border-gray-200'
                }`}
              >
                <div className={`font-semibold mb-1 ${
                  isToday ? 'text-[#FFAD85]' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-xs bg-cyan-100 text-cyan-800 rounded px-1 py-0.5 mb-1 truncate"
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Eventos do Mês</h3>
          <div className="space-y-2">
            {events
              .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === currentDate.getMonth() &&
                       eventDate.getFullYear() === currentDate.getFullYear();
              })
              .map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Schedule({ selectedProject, onProjectUpdate, tasks, onTasksChange }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Cronograma</h2>
      <p className="text-gray-600">Planejamento temporal do projeto</p>
    </div>
  );
}

export function WhatsAppManager({ tasks, selectedProject, onProjectUpdate }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">WhatsApp Manager</h2>
      <p className="text-gray-600">Gerenciamento de comunicação</p>
    </div>
  );
}

export function GoogleIntegration() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Integração Google</h2>
      <p className="text-gray-600">Conecte com Google Calendar e Drive</p>
    </div>
  );
}

export function MeetingsManager({ project }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reuniões</h2>
      <p className="text-gray-600">Gerencie reuniões do projeto</p>
    </div>
  );
}

export function MarketingManager({ project }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Marketing</h2>
      <p className="text-gray-600">Estratégias de marketing e divulgação</p>
    </div>
  );
}

export function ProductionManager({ project }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Produção</h2>
      <p className="text-gray-600">Gerenciamento de produção</p>
    </div>
  );
}

export function PreProductionManager({ project }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Pré-Produção</h2>
      <p className="text-gray-600">Planejamento de pré-produção</p>
    </div>
  );
}

export function AIInsights({ project, tasks }: any) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold">AI Insights</h2>
      </div>
      <p className="text-gray-600">Análises e sugestões inteligentes</p>
    </div>
  );
}

export function KPIManager({ selectedProject }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">KPIs</h2>
      <p className="text-gray-600">Indicadores de performance</p>
    </div>
  );
}

export function MindMap({ selectedProject, tasks, onTasksChange }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Mapa Mental</h2>
      <p className="text-gray-600">Visualização de projeto em mapa mental</p>
    </div>
  );
}

export function UserManagement({ project, onProjectUpdate }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gerenciamento de Usuários</h2>
      <p className="text-gray-600">Gerencie membros do projeto</p>
    </div>
  );
}

export function Presentation() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Apresentação</h2>
      <p className="text-gray-600">Modo apresentação</p>
    </div>
  );
}

export function About() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sobre TaskMaster</h2>
      <p className="text-gray-600 mb-4">
        Plataforma completa de gestão musical baseada em 10+ anos de experiência na indústria.
      </p>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Funcionalidades</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✅ Gestão de projetos musicais</li>
          <li>✅ Produção musical integrada</li>
          <li>✅ IA com expertise profissional</li>
          <li>✅ Metodologia dos 4 pilares</li>
        </ul>
      </div>
    </div>
  );
}

export function UserProfile() {
  const [user, setUser] = React.useState<any>({
    name: 'Usuário',
    email: 'usuario@taskmaster.app',
    role: 'Gestor Musical'
  });
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('taskmaster_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erro ao carregar usuário:', e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedUser = {
      ...user,
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      phone: formData.get('phone') as string,
      bio: formData.get('bio') as string
    };
    setUser(updatedUser);
    localStorage.setItem('taskmaster_user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500 mt-1">{user.role}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-[#FF9B6A] text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
            >
              {isEditing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                <input
                  name="role"
                  type="text"
                  defaultValue={user.role}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sobre você</label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={user.bio}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-[#FF9B6A] text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              )}
              {user.bio && (
                <div>
                  <p className="text-sm text-gray-600">Sobre</p>
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Estatísticas</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Projetos Criados</span>
                <span className="font-bold text-gray-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Artistas Gerenciados</span>
                <span className="font-bold text-gray-900">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tarefas Concluídas</span>
                <span className="font-bold text-gray-900">248</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Preferências</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Notificações</span>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Privacidade</span>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Segurança</span>
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserPreferences() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Preferências</h2>
      <p className="text-gray-600">Configure suas preferências</p>
    </div>
  );
}

export function UserRoleFeatures() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Funcionalidades por Papel</h2>
      <p className="text-gray-600">Recursos baseados no seu papel</p>
    </div>
  );
}

export function FunctionalityValidator() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Validador de Funcionalidades</h2>
      <p className="text-gray-600">Teste funcionalidades do sistema</p>
    </div>
  );
}

export function SystemValidator() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Validador de Sistema</h2>
      <p className="text-gray-600">Validação do sistema</p>
    </div>
  );
}

export function ProjectForm({ onSubmit, onCancel }: any) {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Novo Projeto</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name'),
          description: formData.get('description'),
          project_type: formData.get('project_type') || 'artist_management',
          status: 'active'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Projeto</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              name="project_type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            >
              <option value="artist_management">Gestão de Artista</option>
              <option value="dvd">DVD</option>
              <option value="show">Show</option>
              <option value="release">Lançamento</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Criar Projeto
          </button>
        </div>
      </form>
    </div>
  );
}

export function ArtistForm({ onSubmit, onCancel }: any) {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h2 className="text-2xl font-bold mb-6">Novo Artista</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name'),
          artisticName: formData.get('artisticName'),
          genre: formData.get('genre'),
          status: 'active'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Artístico</label>
            <input
              name="artisticName"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gênero Musical</label>
            <input
              name="genre"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Criar Artista
          </button>
        </div>
      </form>
    </div>
  );
}

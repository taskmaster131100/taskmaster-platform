import React, { useState, useEffect } from 'react';
import { ArrowLeft, Music, Loader2, Mail, Phone, Calendar, Globe, Instagram, Twitter, Youtube, Edit2, Save, X, Mic2, Disc3, CheckSquare, ArrowRight, AlertCircle, Plus, Sparkles, Radio, Briefcase, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// ── Fase de Carreira por Artista ──────────────────────────────────────────────
type CareerStage = 'iniciante' | 'desenvolvimento' | 'crescimento' | 'profissional';

interface CareerInfo {
  stage: CareerStage;
  label: string;
  color: string;
  bg: string;
  description: string;
  nextSteps: string[];
}

function computeCareerStage(totalShows: number, totalReleases: number, activeProjects: number): CareerInfo {
  if (totalShows >= 20 && totalReleases >= 8) {
    return {
      stage: 'profissional',
      label: 'Profissional',
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      description: 'Carreira consolidada com histórico sólido de shows e lançamentos.',
      nextSteps: [
        'Avaliar parceria com booking internacional',
        'Estruturar estratégia de licenciamento e sync',
        'Considerar distribuição própria ou selo',
      ],
    };
  }
  if (totalShows >= 10 || totalReleases >= 5) {
    return {
      stage: 'crescimento',
      label: 'Em Crescimento',
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      description: 'Base construída. Hora de estruturar equipe, marca e escala.',
      nextSteps: [
        'Lançar EP ou álbum para consolidar identidade',
        'Definir manager/booking dedicado',
        'Criar estratégia de conteúdo consistente',
      ],
    };
  }
  if (totalShows >= 3 || totalReleases >= 2) {
    return {
      stage: 'desenvolvimento',
      label: 'Em Desenvolvimento',
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      description: 'Primeiros resultados. Foco em consistência e audiência.',
      nextSteps: [
        'Lançar pelo menos 1 música por trimestre',
        'Atingir 5 shows e coletar feedbacks',
        'Estabelecer presença digital ativa',
      ],
    };
  }
  return {
    stage: 'iniciante',
    label: 'Iniciante',
    color: 'text-green-700',
    bg: 'bg-green-100',
    description: 'Início de jornada. Prioridade: primeiro lançamento e primeiros shows.',
    nextSteps: [
      'Gravar e lançar o primeiro single',
      'Fazer os 3 primeiros shows (mesmo que pequenos)',
      'Abrir perfis nas plataformas de streaming',
    ],
  };
}

interface ArtistDetailsProps {
  artistId: string;
  onBack: () => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
}

const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'MPB', 'Sertanejo', 'Samba', 'Pagode', 'Funk',
  'Eletrônica', 'Jazz', 'Blues', 'Reggae', 'Country', 'Gospel', 'Forró',
  'Bossa Nova', 'Rap', 'Trap', 'R&B', 'Soul', 'Indie', 'Metal', 'Punk',
  'Folk', 'Clássica', 'Outro'
];

const ArtistDetails: React.FC<ArtistDetailsProps> = ({ artistId, onBack }) => {
  const navigate = useNavigate();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Dados operacionais 360
  const [artistShows, setArtistShows] = useState<any[]>([]);
  const [artistReleases, setArtistReleases] = useState<any[]>([]);
  const [artistTasks, setArtistTasks] = useState<any[]>([]);
  const [artistProjects, setArtistProjects] = useState<any[]>([]);
  const [artistProjectTasks, setArtistProjectTasks] = useState<any[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);
  // Contagens totais para cálculo de fase de carreira
  const [totalShowsCount, setTotalShowsCount] = useState(0);
  const [totalReleasesCount, setTotalReleasesCount] = useState(0);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();

        if (error) throw error;
        setArtist(data);
        populateEditData(data);
      } catch (error) {
        console.error('Erro ao carregar detalhes do artista:', error);
        toast.error('Erro ao carregar detalhes do artista');
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      loadArtist();
    }
  }, [artistId]);

  // Carrega projetos vinculados ao artista pelo artist_id (FK real)
  // Recarrega também quando o Copilot cria um projeto via evento customizado
  useEffect(() => {
    if (!artistId) return;

    const loadProjects = async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, description, created_at')
        .eq('artist_id', artistId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(6);
      const list = projects || [];
      setArtistProjects(list);

      if (list.length > 0) {
        const projectIds = list.map((p: any) => p.id);
        const { data: ptasks } = await supabase
          .from('tasks')
          .select('id, title, status, priority, project_id, due_date, labels')
          .in('project_id', projectIds)
          .neq('status', 'done')
          .order('due_date', { ascending: true })
          .limit(10);
        setArtistProjectTasks(ptasks || []);
      } else {
        setArtistProjectTasks([]);
      }
    };

    loadProjects();

    // Recarrega quando o Copilot cria um projeto (sem precisar sair e voltar do artista)
    const handleProjectCreated = () => loadProjects();
    window.addEventListener('taskmaster:project-created', handleProjectCreated);
    return () => window.removeEventListener('taskmaster:project-created', handleProjectCreated);
  }, [artistId]);

  // Carrega dados operacionais 360 após o artista estar disponível
  useEffect(() => {
    if (!artist?.name) return;

    const loadOpsData = async () => {
      setLoadingOps(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const [showsResult, releasesResult, totalShowsResult, totalReleasesResult] = await Promise.all([
          supabase
            .from('shows')
            .select('id, title, show_date, venue, venue_address, status, deal_value')
            .eq('artist_id', artistId)
            .gte('show_date', today)
            .order('show_date', { ascending: true })
            .limit(5),
          supabase
            .from('releases')
            .select('id, title, release_date, status, release_type')
            .eq('artist_id', artistId)
            .neq('status', 'released')
            .order('release_date', { ascending: true })
            .limit(5),
          supabase
            .from('shows')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', artistId),
          supabase
            .from('releases')
            .select('id', { count: 'exact', head: true })
            .eq('artist_id', artistId),
        ]);

        const shows = showsResult.data || [];
        setArtistShows(shows);
        setArtistReleases(releasesResult.data || []);
        setTotalShowsCount(totalShowsResult.count ?? 0);
        setTotalReleasesCount(totalReleasesResult.count ?? 0);

        // Buscar tarefas abertas dos shows deste artista
        if (shows.length > 0) {
          const showIds = shows.map(s => s.id);
          const { data: tasksData } = await supabase
            .from('show_tasks')
            .select('id, show_id, title, status, due_date, category')
            .in('show_id', showIds)
            .neq('status', 'completed')
            .order('due_date', { ascending: true })
            .limit(8);
          setArtistTasks(tasksData || []);
        } else {
          setArtistTasks([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados operacionais:', error);
      } finally {
        setLoadingOps(false);
      }
    };

    loadOpsData();
  }, [artist?.name]);

  const populateEditData = (data: any) => {
    setEditData({
      name: data.name || '',
      stage_name: data.stage_name || '',
      genre: data.genre || '',
      bio: data.bio || '',
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      commission_rate: data.commission_rate ?? '',
      contract_start_date: data.contract_start_date || '',
      contract_end_date: data.contract_end_date || '',
      status: data.status || 'active',
    });
  };

  const handleSave = async () => {
    if (!editData.name?.trim()) {
      toast.error('O nome do artista é obrigatório');
      return;
    }
    if (editData.commission_rate !== '' && (Number(editData.commission_rate) < 0 || Number(editData.commission_rate) > 100)) {
      toast.error('A comissão deve ser entre 0% e 100%');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editData,
        commission_rate: editData.commission_rate === '' ? null : Number(editData.commission_rate),
      };
      const { error } = await supabase
        .from('artists')
        .update(payload)
        .eq('id', artistId);
      if (error) throw error;
      setArtist({ ...artist, ...payload });
      setIsEditing(false);
      toast.success('Artista atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    populateEditData(artist);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando detalhes do artista...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Artista não encontrado</h2>
        <button onClick={onBack} className="text-purple-600 hover:underline">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Ações 360 do Artista — contexto viaja junto */}
        {!isEditing && artist && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => navigate('/planejamento', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-bold"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Novo Projeto</span>
            </button>
            <button
              onClick={() => navigate('/releases', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
              className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-bold"
            >
              <Radio className="w-4 h-4 flex-shrink-0" />
              <span>Novo Lançamento</span>
            </button>
            <button
              onClick={() => navigate('/shows', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 text-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-yellow-300 transition-all text-sm font-bold"
            >
              <Mic2 className="w-4 h-4 flex-shrink-0 text-yellow-600" />
              <span>Novo Show</span>
            </button>
            <button
              onClick={() => navigate('/music', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 text-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-sm font-bold"
            >
              <Music className="w-4 h-4 flex-shrink-0 text-purple-600" />
              <span>Nova Música</span>
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                (artist.stage_name || artist.name)?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="text-center md:text-left flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nome Completo *</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg font-bold"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nome Artístico</label>
                    <input
                      type="text"
                      value={editData.stage_name}
                      onChange={(e) => setEditData({ ...editData, stage_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome artístico"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Gênero</label>
                      <select
                        value={editData.genre}
                        onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecionar gênero</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{artist.name}</h2>
                  {artist.stage_name && (
                    <p className="text-xl text-purple-600 font-medium mb-2">"{artist.stage_name}"</p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    {artist.genre && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                        {artist.genre}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      artist.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                      {artist.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                    {/* Badge fase de carreira */}
                    {!loadingOps && (() => {
                      const career = computeCareerStage(totalShowsCount, totalReleasesCount, artistProjects.length);
                      return (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 ${career.bg} ${career.color} border-transparent`}>
                          <Star className="w-3 h-3" />
                          {career.label}
                        </span>
                      );
                    })()}
                  </div>
                  {/* Contadores rápidos */}
                  {!loadingOps && (
                    <div className="flex gap-4 mt-3 justify-center md:justify-start text-xs text-gray-500">
                      <span><strong className="text-gray-800">{totalShowsCount}</strong> show{totalShowsCount !== 1 ? 's' : ''}</span>
                      <span><strong className="text-gray-800">{totalReleasesCount}</strong> lançamento{totalReleasesCount !== 1 ? 's' : ''}</span>
                      <span><strong className="text-gray-800">{artistProjects.length}</strong> projeto{artistProjects.length !== 1 ? 's' : ''} ativos</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                Contato e Redes
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
                    <input
                      type="email"
                      value={editData.contact_email}
                      onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Telefone</label>
                    <input
                      type="tel"
                      value={editData.contact_phone}
                      onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {artist.contact_email ? (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{artist.contact_email}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sem email cadastrado</p>
                  )}
                  {artist.contact_phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{artist.contact_phone}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-50 flex gap-4 justify-center">
                    <Instagram className="w-5 h-5 text-gray-400 hover:text-pink-600 cursor-pointer transition-colors" />
                    <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                    <Youtube className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Contrato
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comissão (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.commission_rate}
                      onChange={(e) => setEditData({ ...editData, commission_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Início do Contrato</label>
                    <input
                      type="date"
                      value={editData.contract_start_date}
                      onChange={(e) => setEditData({ ...editData, contract_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Término do Contrato</label>
                    <input
                      type="date"
                      value={editData.contract_end_date}
                      onChange={(e) => setEditData({ ...editData, contract_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Início:</span>
                    <span className="text-gray-900 font-medium">{artist.contract_start_date || 'Não definida'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Término:</span>
                    <span className="text-gray-900 font-medium">{artist.contract_end_date || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comissão:</span>
                    <span className="text-gray-900 font-medium">{artist.commission_rate != null ? `${artist.commission_rate}%` : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Biografia</h3>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Escreva uma breve biografia do artista..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {artist.bio || 'Nenhuma biografia cadastrada para este artista.'}
                </p>
              )}
            </div>

            {/* ── Fase de Carreira e Próximos Passos ── */}
            {!loadingOps && (() => {
              const career = computeCareerStage(totalShowsCount, totalReleasesCount, artistProjects.length);
              return (
                <div className={`rounded-2xl shadow-sm p-6 border ${career.bg} border-transparent`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={`w-5 h-5 ${career.color}`} />
                    <h3 className={`text-base font-bold ${career.color}`}>Fase de Carreira: {career.label}</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{career.description}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Próximos passos recomendados</p>
                  <ul className="space-y-2">
                    {career.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${career.color}`} />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/planejamento', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                    className={`mt-4 text-xs font-bold ${career.color} flex items-center gap-1 hover:underline`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Planejar com o Copiloto IA
                  </button>
                </div>
              );
            })()}

            {/* ── VISÃO 360 OPERACIONAL ── */}

            {/* Próximos Shows */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-yellow-500" />
                  Próximos Shows
                </h3>
                <button
                  onClick={() => navigate('/shows', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                  className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {loadingOps ? (
                <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : artistShows.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <Mic2 className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-gray-400 text-sm">Nenhum show agendado</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {artistShows.map(show => (
                    <li
                      key={show.id}
                      onClick={() => navigate('/shows', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          show.status === 'fechado' ? 'bg-green-500' :
                          show.status === 'pago' ? 'bg-purple-500' :
                          show.status === 'proposto' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-600">{show.title}</p>
                          <p className="text-xs text-gray-500">{show.venue || show.venue_address || '—'} · {new Date(show.show_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        show.status === 'fechado' ? 'bg-green-100 text-green-700' :
                        show.status === 'pago' ? 'bg-purple-100 text-purple-700' :
                        show.status === 'proposto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {show.status === 'fechado' ? 'Fechado' :
                         show.status === 'pago' ? 'Pago' :
                         show.status === 'proposto' ? 'Proposto' : 'Consultado'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Releases Ativas */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Disc3 className="w-4 h-4 text-purple-500" />
                  Releases em Andamento
                </h3>
                <button
                  onClick={() => navigate('/releases', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                  className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {loadingOps ? (
                <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : artistReleases.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <Disc3 className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-gray-400 text-sm">Nenhum lançamento ativo</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {artistReleases.map(release => (
                    <li
                      key={release.id}
                      onClick={() => navigate('/releases', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-600">{release.title}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {release.release_type}
                          {release.release_date ? ` · ${new Date(release.release_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        release.status === 'distribution' ? 'bg-green-100 text-green-700' :
                        release.status === 'mastering' ? 'bg-orange-100 text-orange-700' :
                        release.status === 'mixing' ? 'bg-yellow-100 text-yellow-700' :
                        release.status === 'production' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {release.status === 'pre_production' ? 'Pré-prod.' :
                         release.status === 'production' ? 'Produção' :
                         release.status === 'mixing' ? 'Mixagem' :
                         release.status === 'mastering' ? 'Master' :
                         release.status === 'distribution' ? 'Distribuição' : release.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Projetos Ativos */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  Projetos Ativos
                  {artistProjects.length > 0 && (
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                      {artistProjects.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => navigate('/planejamento', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                  className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Novo projeto
                </button>
              </div>
              {artistProjects.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-gray-400 text-sm">Nenhum projeto ativo</p>
                  <button
                    onClick={() => navigate('/planejamento', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                    className="mt-2 text-xs text-purple-600 font-semibold hover:underline"
                  >
                    Criar com IA
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {artistProjects.map(proj => (
                    <li
                      key={proj.id}
                      onClick={() => navigate('/planejamento', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-600">{proj.name}</p>
                        {proj.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{proj.description}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        proj.status === 'active' ? 'bg-green-100 text-green-700' :
                        proj.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                        proj.status === 'completed' ? 'bg-gray-100 text-gray-500' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {proj.status === 'active' ? 'Ativo' :
                         proj.status === 'planning' ? 'Planejamento' :
                         proj.status === 'completed' ? 'Concluído' : proj.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tarefas dos Projetos */}
            {artistProjectTasks.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-500" />
                    Próximas Tarefas
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      {artistProjectTasks.length}
                    </span>
                  </h3>
                  <button
                    onClick={() => navigate('/tarefas')}
                    className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {artistProjectTasks.map(task => {
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = task.due_date && task.due_date < today;
                    const priorityColor = task.priority === 'high' || task.priority === 'urgent'
                      ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400';
                    return (
                      <li key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${priorityColor}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                              {isOverdue ? 'Atrasada · ' : 'Prazo: '}
                              {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                        {isOverdue && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Tarefas Abertas */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                  Tarefas em Aberto
                  {artistTasks.length > 0 && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {artistTasks.length}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => navigate('/shows', { state: { artist: { id: artistId, name: artist.stage_name || artist.name } } })}
                  className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Ver shows <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {loadingOps ? (
                <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : artistTasks.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <CheckSquare className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-gray-400 text-sm">
                    {artistShows.length === 0 ? 'Nenhum show agendado para gerar tarefas' : 'Todas as tarefas concluídas'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {artistTasks.map(task => {
                    const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0];
                    return (
                      <li key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {isOverdue
                            ? <AlertCircle className="w-3 h-3 text-red-500" />
                            : task.status === 'in_progress'
                              ? <div className="w-2 h-2 rounded-full bg-blue-500" />
                              : <div className="w-2 h-2 rounded-full bg-gray-400" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                              {isOverdue ? 'Atrasada · ' : ''}
                              Prazo: {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetails;

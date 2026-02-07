import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Users, Megaphone, Video, Music, TrendingUp, BarChart, Map, FileText, Info, User, Settings } from 'lucide-react';
import AIMarketingAssistant from './AIMarketingAssistant';
import InviteManager from './InviteManager';
import { supabase } from '../lib/supabase';

// Simple placeholder component factory
const createSimpleComponent = (title: string, icon: React.ReactNode, description: string) => {
  return function SimpleComponent() {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-4 mb-4">
            {icon}
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    );
  };
};

export const Schedule = createSimpleComponent(
  'Agenda',
  <Calendar className="w-8 h-8 text-[#FFAD85]" />,
  'Gerenciamento de agenda e cronograma de projetos'
);

export const WhatsAppManager = createSimpleComponent(
  'WhatsApp',
  <MessageSquare className="w-8 h-8 text-green-600" />,
  'Gerenciamento de grupos e comunicação via WhatsApp'
);

export const GoogleIntegration = createSimpleComponent(
  'Integração Google',
  <Calendar className="w-8 h-8 text-[#FFAD85]" />,
  'Integração com Google Calendar e Google Drive'
);

export const MeetingsManager = createSimpleComponent(
  'Reuniões',
  <Users className="w-8 h-8 text-purple-600" />,
  'Gerenciamento de reuniões e acompanhamentos'
);

export const MarketingManager = () => {
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const { data, error } = await supabase.from('artists').select('*').order('name');
        if (error) throw error;
        setArtists(data || []);
        if (data && data.length > 0) setSelectedArtist(data[0]);
      } catch (error) {
        console.error('Erro ao carregar artistas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-pink-600" />
              Marketing & Estratégia
            </h2>
            <p className="text-gray-600 mt-1">Gere conteúdos e roteiros criativos com auxílio de IA.</p>
          </div>

          {artists.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase ml-2">Artista:</span>
              <select 
                value={selectedArtist?.id || ''} 
                onChange={(e) => setSelectedArtist(artists.find(a => a.id === e.target.value))}
                className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none pr-8"
              >
                {artists.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
          </div>
        ) : selectedArtist ? (
          <AIMarketingAssistant 
            artistName={selectedArtist.name} 
            genre={selectedArtist.genre || 'Pop'} 
          />
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum artista encontrado</h3>
            <p className="text-gray-600">Você precisa cadastrar um artista para usar o assistente de marketing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductionManager = createSimpleComponent(
  'Produção',
  <Video className="w-8 h-8 text-red-600" />,
  'Gerenciamento de produção de conteúdo'
);

export const PreProductionManager = createSimpleComponent(
  'Pré-Produção',
  <Music className="w-8 h-8 text-orange-600" />,
  'Planejamento e preparação de projetos'
);

export const AIInsights = createSimpleComponent(
  'Insights com IA',
  <TrendingUp className="w-8 h-8 text-cyan-600" />,
  'Análises e insights gerados por inteligência artificial'
);

export const KPIManager = createSimpleComponent(
  'KPIs',
  <BarChart className="w-8 h-8 text-green-600" />,
  'Gerenciamento de indicadores-chave de desempenho'
);

export const MindMap = createSimpleComponent(
  'Mapa Mental',
  <Map className="w-8 h-8 text-purple-600" />,
  'Visualização de ideias e conexões de projetos'
);

export const UserManagement = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#FFAD85]" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 mt-1">Controle quem tem acesso à sua plataforma e gerencie convites.</p>
        </div>
        
        <InviteManager />
      </div>
    </div>
  );
};

export const UserPreferences = createSimpleComponent(
  'Preferências',
  <Settings className="w-8 h-8 text-gray-600" />,
  'Configurações e preferências do usuário'
);

export const UserRoleFeatures = createSimpleComponent(
  'Funcionalidades por Perfil',
  <User className="w-8 h-8 text-[#FFAD85]" />,
  'Recursos disponíveis por tipo de usuário'
);

export const Presentation = createSimpleComponent(
  'Apresentação',
  <FileText className="w-8 h-8 text-orange-600" />,
  'Modo de apresentação e visualização de projetos'
);

export const About = createSimpleComponent(
  'Sobre',
  <Info className="w-8 h-8 text-gray-600" />,
  'Informações sobre o TaskMaster'
);

export const FunctionalityValidator = createSimpleComponent(
  'Validador de Funcionalidades',
  <BarChart className="w-8 h-8 text-green-600" />,
  'Ferramenta de validação de funcionalidades do sistema'
);

export const SystemValidator = createSimpleComponent(
  'Validador de Sistema',
  <Settings className="w-8 h-8 text-red-600" />,
  'Ferramenta de validação de integridade do sistema'
);

// Form components
export const ProjectForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Projeto</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name'),
          description: formData.get('description'),
          project_type: formData.get('project_type') || 'artist_management'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};

export const ArtistForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Artista</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const genre = formData.get('genre') === 'Outro' ? formData.get('genreOther') : formData.get('genre');
        onSubmit({
          name: formData.get('name'),
          artistic_name: formData.get('artisticName'),
          genre: genre || 'Pop'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Artístico</label>
            <input name="artisticName" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero Musical</label>
            <select
              name="genre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => {
                const select = e.target;
                const otherInput = select.parentElement?.querySelector('[name="genreOther"]') as HTMLInputElement;
                if (otherInput) {
                  otherInput.style.display = select.value === 'Outro' ? 'block' : 'none';
                  if (select.value !== 'Outro') {
                    otherInput.value = '';
                  }
                }
              }}
            >
              <option value="">Selecione um gênero</option>
              <option>Pop</option>
              <option>Rock</option>
              <option>Hip Hop</option>
              <option>MPB</option>
              <option>Sertanejo</option>
              <option>Samba</option>
              <option>Pagode</option>
              <option>Funk</option>
              <option>Eletrônica</option>
              <option>Jazz</option>
              <option>Blues</option>
              <option>Reggae</option>
              <option>Country</option>
              <option>Gospel</option>
              <option>Forró</option>
              <option>Bossa Nova</option>
              <option>Rap</option>
              <option>Trap</option>
              <option>R&B</option>
              <option>Soul</option>
              <option>Indie</option>
              <option>Metal</option>
              <option>Punk</option>
              <option>Folk</option>
              <option>Clássica</option>
              <option>Outro</option>
            </select>
            <input
              name="genreOther"
              type="text"
              placeholder="Especifique o gênero..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};

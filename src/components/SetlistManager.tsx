import React, { useState, useEffect } from 'react';
import { 
  ListMusic, Music, Plus, GripVertical, Trash2, 
  Clock, Hash, Save, Download, Share2, Search,
  ChevronRight, PlayCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SetlistItem {
  id: string;
  song_id: string;
  title: string;
  duration: string; // "03:45"
  key: string;
  order: number;
  notes?: string;
}

interface SetlistManagerProps {
  showId: string;
  artistId?: string;
}

export default function SetlistManager({ showId, artistId }: SetlistManagerProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSong, setShowAddSong] = useState(false);

  useEffect(() => {
    loadSetlist();
    loadAvailableSongs();
  }, [showId]);

  async function loadSetlist() {
    try {
      setLoading(true);
      // Simulação de carregamento - em um cenário real buscaria de uma tabela 'show_setlists'
      // Por enquanto vamos usar um estado local para demonstração da funcionalidade 360
      const savedSetlist = localStorage.getItem(`setlist_${showId}`);
      if (savedSetlist) {
        setItems(JSON.parse(savedSetlist));
      }
    } catch (error) {
      console.error('Erro ao carregar setlist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSongs() {
    try {
      // Buscar músicas do repertório (tabela arrangements ou similar)
      const { data } = await supabase
        .from('artists') // Simplificação para pegar algo
        .select('*')
        .limit(10);
      
      // Mock de músicas para o exemplo
      setAvailableSongs([
        { id: 's1', title: 'Sucesso do Verão', duration: '03:30', key: 'G' },
        { id: 's2', title: 'Balada Romântica', duration: '04:15', key: 'Am' },
        { id: 's3', title: 'Rock da Pesada', duration: '02:50', key: 'E' },
        { id: 's4', title: 'Samba de Roda', duration: '05:00', key: 'C' },
      ]);
    } catch (error) {
      console.error('Erro ao carregar músicas disponíveis:', error);
    }
  }

  const addSongToSetlist = (song: any) => {
    const newItem: SetlistItem = {
      id: Math.random().toString(36).substr(2, 9),
      song_id: song.id,
      title: song.title,
      duration: song.duration,
      key: song.key,
      order: items.length + 1
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    localStorage.setItem(`setlist_${showId}`, JSON.stringify(newItems));
    toast.success(`${song.title} adicionada ao setlist`);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    localStorage.setItem(`setlist_${showId}`, JSON.stringify(newItems));
  };

  const calculateTotalTime = () => {
    let totalSeconds = 0;
    items.forEach(item => {
      const [min, sec] = item.duration.split(':').map(Number);
      totalSeconds += (min * 60) + sec;
    });
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}min ${s}s`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-purple-600" />
            Setlist do Show
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {items.length} músicas • Tempo total: <span className="font-bold text-purple-600">{calculateTotalTime()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {items.length > 0 ? (
          <div className="space-y-2 mb-6">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-sm transition-all group"
              >
                <div className="text-gray-300 group-hover:text-purple-300 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded uppercase">
                      Tom: {item.key}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.duration}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl mb-6">
            <Music className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">O setlist está vazio.</p>
            <p className="text-xs text-gray-400">Adicione músicas do repertório abaixo.</p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Repertório Disponível</h4>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar música..."
                className="pl-7 pr-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs focus:ring-1 focus:ring-purple-500 w-40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableSongs
              .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(song => (
                <button
                  key={song.id}
                  onClick={() => addSongToSetlist(song)}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/30 transition-all text-left group"
                >
                  <div>
                    <h5 className="text-sm font-bold text-gray-700 group-hover:text-purple-700">{song.title}</h5>
                    <p className="text-[10px] text-gray-400">{song.duration} • Tom: {song.key}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-purple-500" />
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

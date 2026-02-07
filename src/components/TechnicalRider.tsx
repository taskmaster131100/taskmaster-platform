import React, { useState, useEffect } from 'react';
import { 
  Settings, Mic2, Zap, Layout, Save, Download, 
  Plus, Trash2, ChevronRight, FileText, Share2,
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { DocumentService } from '../services/documentService';

interface TechnicalRiderProps {
  showId: string;
  artistId?: string;
  showData?: any;
}

interface InputListItem {
  id: string;
  channel: string;
  instrument: string;
  mic_line: string;
  insert: string;
  stand: string;
}

export default function TechnicalRider({ showId, artistId }: TechnicalRiderProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'lighting' | 'stage'>('audio');
  
  const [inputList, setInputList] = useState<InputListItem[]>([
    { id: '1', channel: '01', instrument: 'Bumbo', mic_line: 'Beta 52', insert: 'Comp/Gate', stand: 'Small' },
    { id: '2', channel: '02', instrument: 'Caixa', mic_line: 'SM57', insert: 'Comp', stand: 'Small' },
    { id: '3', channel: '03', instrument: 'Voz Principal', mic_line: 'KSM9 / Wireless', insert: 'Comp/Verb', stand: 'Tall' },
  ]);

  const [lightingNeeds, setLightingNeeds] = useState({
    moving_heads: 8,
    par_leds: 12,
    smoke_machine: true,
    notes: 'Preferência por cores quentes no início do show.'
  });

  const addInputRow = () => {
    const newChannel = (inputList.length + 1).toString().padStart(2, '0');
    setInputList([...inputList, { 
      id: Math.random().toString(36).substr(2, 9), 
      channel: newChannel, 
      instrument: '', 
      mic_line: '', 
      insert: '', 
      stand: '' 
    }]);
  };

  const removeInputRow = (id: string) => {
    setInputList(inputList.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulação de salvamento
      localStorage.setItem(`rider_${showId}`, JSON.stringify({ inputList, lightingNeeds }));
      toast.success('Rider técnico salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar rider');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!showData) {
      toast.error('Dados do show não carregados');
      return;
    }
    try {
      toast.info('Gerando Rider Técnico...');
      await DocumentService.generateTechnicalRider(showData, { inputList, lightingNeeds });
      toast.success('Rider gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar documento');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header do Rider */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Rider Técnico
          </h3>
          <p className="text-xs text-gray-500 mt-1">Configurações de som, luz e mapa de palco</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Internas */}
      <div className="flex border-b border-gray-100 px-6 bg-white">
        <button 
          onClick={() => setActiveTab('audio')}
          className={`py-4 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'audio' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Áudio (Input List)
        </button>
        <button 
          onClick={() => setActiveTab('lighting')}
          className={`py-4 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'lighting' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Iluminação
        </button>
        <button 
          onClick={() => setActiveTab('stage')}
          className={`py-4 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'stage' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Mapa de Palco
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 px-2">CH</th>
                    <th className="pb-3 px-2">Instrumento</th>
                    <th className="pb-3 px-2">Mic / Line</th>
                    <th className="pb-3 px-2">Insert</th>
                    <th className="pb-3 px-2">Pedestal</th>
                    <th className="pb-3 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inputList.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-2 text-sm font-bold text-blue-600">{item.channel}</td>
                      <td className="py-3 px-2">
                        <input 
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-medium text-gray-900"
                          value={item.instrument}
                          onChange={(e) => {
                            const newList = [...inputList];
                            newList[index].instrument = e.target.value;
                            setInputList(newList);
                          }}
                          placeholder="Ex: Bumbo"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input 
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-600"
                          value={item.mic_line}
                          onChange={(e) => {
                            const newList = [...inputList];
                            newList[index].mic_line = e.target.value;
                            setInputList(newList);
                          }}
                          placeholder="Ex: SM57"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input 
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-600"
                          value={item.insert}
                          onChange={(e) => {
                            const newList = [...inputList];
                            newList[index].insert = e.target.value;
                            setInputList(newList);
                          }}
                          placeholder="Ex: Comp"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input 
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-600"
                          value={item.stand}
                          onChange={(e) => {
                            const newList = [...inputList];
                            newList[index].stand = e.target.value;
                            setInputList(newList);
                          }}
                          placeholder="Ex: Small"
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button 
                          onClick={() => removeInputRow(item.id)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={addInputRow}
              className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Canal
            </button>
          </div>
        )}

        {activeTab === 'lighting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Moving Heads (Mínimo)</label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={lightingNeeds.moving_heads}
                  onChange={(e) => setLightingNeeds({...lightingNeeds, moving_heads: Number(e.target.value)})}
                />
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">PAR LEDs (Mínimo)</label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={lightingNeeds.par_leds}
                  onChange={(e) => setLightingNeeds({...lightingNeeds, par_leds: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Observações de Luz</label>
              <textarea 
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                value={lightingNeeds.notes}
                onChange={(e) => setLightingNeeds({...lightingNeeds, notes: e.target.value})}
                placeholder="Descreva as necessidades de iluminação..."
              />
            </div>
          </div>
        )}

        {activeTab === 'stage' && (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
            <Layout className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-900">Mapa de Palco Visual</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Em breve: Arraste e solte instrumentos para criar seu mapa de palco personalizado.
            </p>
            <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all">
              Subir Imagem do Mapa
            </button>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Dica do TaskMaster:</strong> Mantenha seu rider sempre atualizado. Ao fechar um show, o sistema enviará automaticamente este documento para o responsável técnico do evento.
        </p>
      </div>
    </div>
  );
}

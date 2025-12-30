import React, { useState, useEffect } from 'react';
import { Save, X, Upload, FileMusic, Plus, Trash2 } from 'lucide-react';
import { arrangementService, Arrangement, Part } from '../../services/music/arrangementService';
import { Song } from '../../services/music/songService';

interface ArrangementEditorProps {
  song: Song;
  arrangement?: Arrangement | null;
  onSave: () => void;
  onCancel: () => void;
}

const instruments = [
  'Vocal', 'Backing Vocal', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Piano',
  'Violão', 'Saxofone', 'Trompete', 'Trombone', 'Violino', 'Viola', 'Violoncelo',
  'Contrabaixo', 'Percussão', 'Flauta', 'Clarinete', 'Oboé', 'Fagote'
];

const clefs = [
  { value: 'treble', label: 'Sol' },
  { value: 'bass', label: 'Fá' },
  { value: 'alto', label: 'Dó (Alto)' },
  { value: 'tenor', label: 'Dó (Tenor)' }
];

const difficulties = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'expert', label: 'Expert' }
];

export function ArrangementEditor({ song, arrangement, onSave, onCancel }: ArrangementEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: ''
  });
  const [parts, setParts] = useState<Partial<Part>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (arrangement) {
      setFormData({
        title: arrangement.title || '',
        description: arrangement.description || '',
        notes: arrangement.notes || ''
      });
      loadParts();
    } else {
      setFormData({
        title: `Arranjo ${song.title}`,
        description: '',
        notes: ''
      });
    }
  }, [arrangement, song]);

  const loadParts = async () => {
    if (!arrangement) return;
    try {
      const loadedParts = await arrangementService.getPartsByArrangement(arrangement.id);
      setParts(loadedParts);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const handleAddPart = () => {
    setParts([...parts, {
      instrument: 'Vocal',
      transpose_semitones: 0,
      clef: 'treble',
      difficulty: 'intermediate',
      notes: ''
    }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleFileUpload = async (index: number, type: 'pdf' | 'musicxml' | 'midi', file: File) => {
    console.log('File upload simulation:', file.name, type);

    const fakeUrl = `https://storage.example.com/${song.id}/${type}/${file.name}`;

    const newParts = [...parts];
    newParts[index] = {
      ...newParts[index],
      [`url_${type}`]: fakeUrl
    };
    setParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      let arrangementId: string;

      if (arrangement) {
        await arrangementService.updateArrangement(arrangement.id, formData);
        arrangementId = arrangement.id;
      } else {
        const newArrangement = await arrangementService.createArrangement({
          song_id: song.id,
          ...formData
        });
        arrangementId = newArrangement.id;
      }

      for (const part of parts) {
        if (part.id) {
          await arrangementService.updatePart(part.id, part as Part);
        } else if (part.instrument) {
          await arrangementService.createPart({
            arrangement_id: arrangementId,
            instrument: part.instrument,
            transpose_semitones: part.transpose_semitones || 0,
            clef: part.clef || 'treble',
            url_pdf: part.url_pdf,
            url_musicxml: part.url_musicxml,
            url_midi: part.url_midi,
            notes: part.notes,
            difficulty: part.difficulty
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving arrangement:', error);
      alert('Erro ao salvar arranjo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {arrangement ? 'Editar Arranjo' : 'Novo Arranjo'}
        </h2>
        <p className="text-gray-600 mt-1">
          {song.title} - {song.artist_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Arranjo</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Arranjo *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                placeholder="Ex: Arranjo para Show Acústico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                placeholder="Descreva as características deste arranjo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas e Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                placeholder="Observações técnicas, mudanças em relação ao original..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Partes por Instrumento</h3>
            <button
              type="button"
              onClick={handleAddPart}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Parte
            </button>
          </div>

          {parts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <FileMusic className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">Nenhuma parte adicionada</p>
              <button
                type="button"
                onClick={handleAddPart}
                className="text-[#FFAD85] hover:text-[#FF9B6A] text-sm font-medium"
              >
                Adicionar primeira parte
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {parts.map((part, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Parte #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instrumento
                      </label>
                      <select
                        value={part.instrument || ''}
                        onChange={(e) => handlePartChange(index, 'instrument', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      >
                        {instruments.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transposição (semitons)
                      </label>
                      <input
                        type="number"
                        min="-12"
                        max="12"
                        value={part.transpose_semitones || 0}
                        onChange={(e) => handlePartChange(index, 'transpose_semitones', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clave
                      </label>
                      <select
                        value={part.clef || 'treble'}
                        onChange={(e) => handlePartChange(index, 'clef', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      >
                        {clefs.map(clef => (
                          <option key={clef.value} value={clef.value}>{clef.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dificuldade
                      </label>
                      <select
                        value={part.difficulty || 'intermediate'}
                        onChange={(e) => handlePartChange(index, 'difficulty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      >
                        {difficulties.map(diff => (
                          <option key={diff.value} value={diff.value}>{diff.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={part.notes || ''}
                      onChange={(e) => handlePartChange(index, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                      placeholder="Observações sobre esta parte..."
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Arquivos</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">PDF</label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'pdf', e.target.files[0])}
                          className="w-full text-xs"
                        />
                        {part.url_pdf && (
                          <p className="text-xs text-green-600 mt-1">✓ Arquivo enviado</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">MusicXML</label>
                        <input
                          type="file"
                          accept=".xml,.musicxml"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'musicxml', e.target.files[0])}
                          className="w-full text-xs"
                        />
                        {part.url_musicxml && (
                          <p className="text-xs text-green-600 mt-1">✓ Arquivo enviado</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">MIDI</label>
                        <input
                          type="file"
                          accept=".mid,.midi"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(index, 'midi', e.target.files[0])}
                          className="w-full text-xs"
                        />
                        {part.url_midi && (
                          <p className="text-xs text-green-600 mt-1">✓ Arquivo enviado</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Arranjo'}
          </button>
        </div>
      </form>
    </div>
  );
}

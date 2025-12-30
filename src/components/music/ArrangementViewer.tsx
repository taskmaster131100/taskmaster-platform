import React, { useState, useEffect } from 'react';
import { X, Edit2, FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { arrangementService, Arrangement, Part } from '../../services/music/arrangementService';

interface ArrangementViewerProps {
  arrangement: Arrangement;
  onClose: () => void;
  onEdit: () => void;
}

export function ArrangementViewer({ arrangement, onClose, onEdit }: ArrangementViewerProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParts();
  }, [arrangement]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const data = await arrangementService.getPartsByArrangement(arrangement.id);
      setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'review': return 'Em Revisão';
      case 'draft': return 'Rascunho';
      case 'rejected': return 'Rejeitado';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  const getClefLabel = (clef: string) => {
    switch (clef) {
      case 'treble': return 'Sol';
      case 'bass': return 'Fá';
      case 'alto': return 'Dó (Alto)';
      case 'tenor': return 'Dó (Tenor)';
      default: return clef;
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      case 'expert': return 'Expert';
      default: return difficulty || '-';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{arrangement.title}</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(arrangement.status)}`}>
              {getStatusLabel(arrangement.status)}
            </span>
            {arrangement.is_current && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                Versão Atual
              </span>
            )}
          </div>
          <p className="text-gray-600">Versão {arrangement.version}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-[#FFAD85] hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
            Editar
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
            Fechar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Arranjo</h3>

          <div className="space-y-3">
            {arrangement.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <p className="text-gray-900">{arrangement.description}</p>
              </div>
            )}

            {arrangement.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <p className="text-gray-900 whitespace-pre-wrap">{arrangement.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Criado em</label>
                <p className="text-gray-900">
                  {new Date(arrangement.created_at || '').toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atualizado em</label>
                <p className="text-gray-900">
                  {new Date(arrangement.updated_at || '').toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {arrangement.status === 'approved' && arrangement.approved_at && (
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Aprovado em</p>
                  <p className="text-gray-900">
                    {new Date(arrangement.approved_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}

            {arrangement.status === 'rejected' && arrangement.rejected_reason && (
              <div className="flex items-start gap-2 pt-4 border-t border-gray-200">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Motivo da rejeição</p>
                  <p className="text-gray-900">{arrangement.rejected_reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Partes ({parts.length})
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFAD85] mx-auto"></div>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>Nenhuma parte cadastrada neste arranjo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parts.map((part) => (
                <div key={part.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-lg">{part.instrument}</h4>
                      {part.notes && (
                        <p className="text-sm text-gray-600 mt-1">{part.notes}</p>
                      )}
                    </div>
                    {part.difficulty && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {getDifficultyLabel(part.difficulty)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Clave:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {getClefLabel(part.clef)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Transposição:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {part.transpose_semitones > 0 ? '+' : ''}{part.transpose_semitones} semitons
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Versão:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {part.version}
                      </span>
                    </div>
                  </div>

                  {(part.url_pdf || part.url_musicxml || part.url_midi) && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Arquivos</p>
                      <div className="flex flex-wrap gap-2">
                        {part.url_pdf && (
                          <a
                            href={part.url_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </a>
                        )}
                        {part.url_musicxml && (
                          <a
                            href={part.url_musicxml}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            MusicXML
                          </a>
                        )}
                        {part.url_midi && (
                          <a
                            href={part.url_midi}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            MIDI
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

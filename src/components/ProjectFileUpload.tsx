import React, { useState } from 'react';
import { Upload, FileText, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseProjectFromText } from '../services/planningAI';

interface ProjectFileUploadProps {
  planningId?: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export default function ProjectFileUpload({ planningId, onComplete, onCancel }: ProjectFileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx'];

    const fileExtension = selectedFile.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    const isValidType = allowedTypes.includes(selectedFile.type) ||
                       (fileExtension && allowedExtensions.includes(fileExtension));

    if (!isValidType) {
      toast.error('Tipo de arquivo não suportado. Use .txt, .md, .pdf ou .docx');
      return;
    }

    // Validar tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    setProcessing(true);

    try {
      // Ler arquivo como texto
      const text = await readFileAsText(file);

      if (!text || text.trim().length < 10) {
        throw new Error('Arquivo vazio ou muito curto');
      }

      toast.info('Processando projeto com IA...');

      // Processar com IA
      const planning = await parseProjectFromText(text, file.name);

      toast.success('Projeto processado! Revise as sugestões.');

      // Passar resultado para o componente pai
      onComplete({
        planning,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          content: text
        }
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Erro ao processar arquivo. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text || '');
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Para .txt e .md, ler como texto
      // Para .pdf e .docx, por enquanto também tenta ler como texto
      // TODO: Implementar leitura específica para PDF/DOCX
      reader.readAsText(file);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anexar Projeto</h2>
            <p className="text-gray-600 mt-1">Envie um arquivo com seu projeto para análise automática</p>
          </div>
          <button
            onClick={onCancel}
            disabled={processing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${dragActive
                ? 'border-[#FFAD85] bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }
            `}
          >
            <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Formatos aceitos: .txt, .md, .pdf, .docx (até 10MB)
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors cursor-pointer">
              <FileText className="w-5 h-5" />
              Selecionar Arquivo
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="w-10 h-10 text-[#FFAD85] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!processing && (
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">O que acontecerá:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>A IA lerá seu projeto e identificará fases e tarefas</li>
                    <li>Você poderá revisar e ajustar as sugestões antes de salvar</li>
                    <li>Nada será criado automaticamente sem sua confirmação</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcess}
                disabled={processing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Processar com IA
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">💡 Dicas para melhor resultado:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Seja específico nas descrições de tarefas</li>
            <li>• Mencione datas quando possível (ex: "Lançamento em 15/12")</li>
            <li>• Liste as músicas ou etapas do projeto claramente</li>
            <li>• Inclua informações sobre equipe, orçamento e objetivos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Download, Trash2, History, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  GenerationType,
  GENERATION_TYPES,
  generateText,
  saveGeneration,
  listGenerations,
  deleteGeneration,
  copyToClipboard,
  exportAsText,
  AIGeneration
} from '../services/aiTextService';

export function AITextGenerator() {
  const [selectedType, setSelectedType] = useState<GenerationType>('copywriting');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AIGeneration[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const selectedTypeInfo = GENERATION_TYPES.find(t => t.value === selectedType);

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await listGenerations();
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um briefing para gerar o texto');
      return;
    }

    setIsGenerating(true);
    setResult('');

    try {
      const generatedText = await generateText({
        type: selectedType,
        prompt: prompt.trim()
      });

      setResult(generatedText);
      toast.success('Texto gerado com sucesso!');

      await saveGeneration(selectedType, prompt.trim(), generatedText);
    } catch (error) {
      console.error('Erro ao gerar texto:', error);
      toast.error('Erro ao gerar texto. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await copyToClipboard(result);
      toast.success('Texto copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  const handleExport = () => {
    if (!result) return;

    const filename = `${selectedType}_${Date.now()}`;
    exportAsText(result, filename);
    toast.success('Texto exportado com sucesso!');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGeneration(id);
      setHistory(history.filter(h => h.id !== id));
      toast.success('Geração excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir geração:', error);
      toast.error('Erro ao excluir geração');
    }
  };

  const handleLoadFromHistory = (generation: AIGeneration) => {
    setSelectedType(generation.generation_type);
    setPrompt(generation.prompt);
    setResult(generation.result);
    setShowHistory(false);
    toast.success('Geração carregada do histórico');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              IA de Texto
            </h1>
            <p className="text-gray-600 mt-1">
              Gere conteúdo profissional com inteligência artificial
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <History className="w-5 h-5" />
            Histórico
          </button>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Histórico de Gerações</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-sm text-[#FFAD85] hover:text-[#FF9B6A]"
              >
                Voltar
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Carregando histórico...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma geração salva ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(gen => (
                  <div
                    key={gen.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">
                          {GENERATION_TYPES.find(t => t.value === gen.generation_type)?.label}
                        </span>
                        <p className="text-sm text-gray-600 mb-2">
                          {gen.prompt.substring(0, 100)}
                          {gen.prompt.length > 100 ? '...' : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(gen.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleLoadFromHistory(gen)}
                          className="p-2 text-[#FFAD85] hover:bg-blue-50 rounded transition-colors"
                          title="Carregar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta geração?')) {
                              handleDelete(gen.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Configuração</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Texto
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as GenerationType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {GENERATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {selectedTypeInfo && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTypeInfo.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Briefing / Contexto
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Descreva o que você precisa... Quanto mais detalhes, melhor será o resultado."
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {prompt.length} caracteres
                    </p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Gerar Texto
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Resultado</h2>
                  {result && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Copiar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleExport}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Exportar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Gerando seu texto...</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Isso pode levar alguns segundos
                    </p>
                  </div>
                ) : result ? (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-[600px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                        {result}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{result.length} caracteres</span>
                      <span>Gerado por IA</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Configure e clique em "Gerar Texto"
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      O resultado aparecerá aqui
                    </p>
                  </div>
                )}
              </div>

              {result && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    💡 Dica
                  </h3>
                  <p className="text-xs text-[#FF9B6A]">
                    Você pode editar o texto gerado diretamente no resultado antes de copiar ou exportar.
                    A IA é uma ferramenta de apoio - sinta-se livre para personalizar!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

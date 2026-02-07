import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Video, MessageSquare, Target, Calendar, Copy, Check } from 'lucide-react';
import { generateMarketingStrategy, MarketingContent } from '../services/aiMarketingService';
import { toast } from 'sonner';

interface AIMarketingAssistantProps {
  artistName: string;
  genre: string;
  initialContext?: string;
}

export default function AIMarketingAssistant({ artistName, genre, initialContext = '' }: AIMarketingAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(initialContext);
  const [eventType, setEventType] = useState<'show' | 'release' | 'tour'>('show');
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!details.trim()) {
      toast.error('Por favor, descreva o que deseja promover.');
      return;
    }

    setLoading(true);
    try {
      const result = await generateMarketingStrategy({
        artistName,
        genre,
        eventType,
        details
      });
      setContent(result);
      toast.success('Estratégia gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Assistente de Marketing IA</h3>
            <p className="text-purple-100 text-sm">Crie roteiros e estratégias para {artistName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(['show', 'release', 'tour'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                  eventType === type 
                    ? 'bg-white text-purple-600 shadow-md' 
                    : 'bg-purple-500/30 text-white hover:bg-purple-500/50'
                }`}
              >
                {type === 'show' ? 'Show' : type === 'release' ? 'Lançamento' : 'Turnê'}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: Show de lançamento do novo EP no Circo Voador, com participação especial..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[100px]"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="absolute bottom-3 right-3 bg-white text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {content && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Roteiros de Vídeo */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-pink-500" />
              Roteiros de Reels/TikTok
            </h4>
            {content.scripts.reels.map((script, i) => (
              <div key={`reel-${i}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{script}</p>
                <button 
                  onClick={() => copyToClipboard(script, `reel-${i}`)}
                  className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-purple-600"
                >
                  {copiedIndex === `reel-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>

          {/* Legendas e Estratégia */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Legendas para Feed
              </h4>
              {content.captions.map((caption, i) => (
                <div key={`cap-${i}`} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group">
                  <p className="text-sm text-gray-600">{caption}</p>
                  <button 
                    onClick={() => copyToClipboard(caption, `cap-${i}`)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-purple-600"
                  >
                    {copiedIndex === `cap-${i}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
              <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
                <Target className="w-5 h-5" />
                Estratégia de Guerrilha
              </h4>
              <p className="text-sm text-purple-800 leading-relaxed">
                {content.strategy}
              </p>
            </div>
          </div>
        </div>
      )}

      {!content && !loading && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Descreva seu evento acima para gerar uma estratégia completa.</p>
        </div>
      )}
    </div>
  );
}

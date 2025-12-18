import React from 'react';
import { Sparkles, Send } from 'lucide-react';

export default function PlanejamentoPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Planning Copilot
        </h2>
        <p className="text-gray-600 mt-1">IA com 10+ anos de expertise em gestão musical</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Exemplo: 'Crie um plano completo para lançar meu single' ou 'Como organizar uma turnê de 10 cidades?'"
          />
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2">
          <Send className="w-4 h-4" />
          Gerar Plano
        </button>
      </div>
    </div>
  );
}

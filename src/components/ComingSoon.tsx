import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  badge?: string;
  eta?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description,
  badge = 'Em Desenvolvimento',
  eta,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
          <Clock className="w-3.5 h-3.5" />
          {badge}
        </span>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {description ||
            'Este módulo está em desenvolvimento e será disponibilizado em breve. Estamos trabalhando para entregar a melhor experiência possível.'}
        </p>

        {eta && (
          <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block">
            <span className="text-xs text-gray-500">Previsão: </span>
            <span className="text-xs font-semibold text-gray-700">{eta}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComingSoon;

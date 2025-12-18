import React from 'react';
import { Database, HardDrive, ArrowRight } from 'lucide-react';

interface SupabaseConnectionProps {
  onConnectionSuccess: () => void;
  onUseLocalDatabase: () => void;
}

export default function SupabaseConnection({ onConnectionSuccess, onUseLocalDatabase }: SupabaseConnectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bem-vindo ao TaskMaster</h1>
          <p className="text-gray-600">Escolha como deseja armazenar seus dados</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={onUseLocalDatabase}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Modo Local</h3>
            <p className="text-gray-600 mb-4">Dados armazenados no seu navegador</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                Funciona offline
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                Sem necessidade de conta
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                Dados privados no dispositivo
              </li>
            </ul>
          </button>

          <button
            onClick={onConnectionSuccess}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Modo Nuvem</h3>
            <p className="text-gray-600 mb-4">Dados sincronizados via Supabase</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                Acesso de qualquer lugar
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                Backup automático
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                Sincronização em tempo real
              </li>
            </ul>
          </button>
        </div>
      </div>
    </div>
  );
}

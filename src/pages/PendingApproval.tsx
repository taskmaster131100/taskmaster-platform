import React, { useEffect, useState } from 'react';
import { Clock, Mail, Music, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PendingApproval() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  async function checkApproval() {
    setChecking(true);
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data?.session?.user?.user_metadata?.approved === true) {
        // onAuthStateChange will fire and App.tsx will redirect automatically
        window.location.href = '/';
      }
    } catch {}
    setLastCheck(new Date());
    setChecking(false);
  }

  // Auto-poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkApproval, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-xl flex items-center justify-center">
            <Music className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">TaskMaster</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Cadastro Realizado!
          </h2>

          <p className="text-gray-600 mb-6">
            Seu cadastro foi recebido. Assim que aprovado, você terá acesso completo à plataforma e poderá começar a organizar sua carreira imediatamente.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800 text-left">
                Você receberá um <span className="font-semibold">email de confirmação</span> quando seu acesso for aprovado. Verifique também sua caixa de spam.
              </p>
            </div>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Após aprovação você acessa:</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-orange-400">→</span> Gestão de artistas, projetos e tarefas</li>
              <li className="flex items-center gap-2"><span className="text-orange-400">→</span> Agenda de shows e lançamentos</li>
              <li className="flex items-center gap-2"><span className="text-orange-400">→</span> Produção musical e setlists</li>
              <li className="flex items-center gap-2"><span className="text-orange-400">→</span> Planos a partir de US$49/mês</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={checkApproval}
              disabled={checking}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Verificando...' : 'Verificar aprovação'}
            </button>
            <Link
              to="/login"
              className="block w-full border border-gray-200 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Voltar para Login
            </Link>
          </div>

          {lastCheck && (
            <p className="mt-4 text-xs text-gray-400">
              Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Dúvidas? Entre em contato: <a href="mailto:contact@taskmaster.works" className="text-purple-600 hover:underline">contact@taskmaster.works</a>
        </p>
      </div>
    </div>
  );
}

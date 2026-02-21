import React from 'react';
import { Clock, Mail, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PendingApproval() {
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
            Seu cadastro foi recebido com sucesso. O administrador irá analisar e aprovar seu acesso em breve.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800 text-left">
                Você receberá um <span className="font-semibold">email de confirmação</span> quando seu acesso for aprovado. Fique atento à sua caixa de entrada e spam.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              Voltar para Login
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Dúvidas? Entre em contato: <a href="mailto:contact@taskmaster.works" className="text-purple-600 hover:underline">contact@taskmaster.works</a>
        </p>
      </div>
    </div>
  );
}

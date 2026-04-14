import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, User, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendAccessRequestNotification } from '../../lib/email';

export default function RequestAccessForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Digite seu nome'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Digite um e-mail válido'); return; }
    if (!contact.trim()) { setError('Digite seu telefone ou @instagram'); return; }

    setLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('access_requests')
        .insert({ name: name.trim(), email: email.trim().toLowerCase(), contact: contact.trim() });

      if (dbError) throw dbError;

      await sendAccessRequestNotification({ name: name.trim(), email: email.trim(), contact: contact.trim() });

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação enviada!</h2>
          <p className="text-gray-500 text-sm">
            Recebemos seu pedido de acesso. Entraremos em contato em breve pelo e-mail ou contato informado.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-[#FF9B6A] hover:underline font-medium"
          >
            Já tem acesso? Fazer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-xl flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">TaskMaster</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Solicitar acesso</h1>
        <p className="text-sm text-gray-500 mb-6">
          A plataforma está em acesso fechado. Preencha abaixo e entraremos em contato.
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B6A]/40 focus:border-[#FF9B6A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B6A]/40 focus:border-[#FF9B6A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone ou Instagram</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="(11) 99999-9999 ou @seuinstagram"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9B6A]/40 focus:border-[#FF9B6A]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 text-sm"
          >
            {loading ? 'Enviando...' : 'Solicitar acesso'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem acesso?{' '}
          <Link to="/login" className="text-[#FF9B6A] font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

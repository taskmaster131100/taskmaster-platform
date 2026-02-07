import React, { useState, useEffect } from 'react';
import { Mail, Send, UserPlus, ShieldCheck, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { sendInvite, listInvites, Invite } from '../services/inviteService';
import { toast } from 'sonner';

export default function InviteManager() {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadInvites = async () => {
    try {
      const data = await listInvites();
      setInvites(data);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendInvite(email);
      toast.success(`Convite enviado para ${email}`);
      setEmail('');
      loadInvites();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Convidar Novos Usuários</h3>
            <p className="text-sm text-gray-500">A plataforma agora é restrita. Apenas e-mails convidados podem se cadastrar.</p>
          </div>
        </div>

        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail do artista ou produtor"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Enviar Convite
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Convites Enviados
          </h4>
          <span className="text-xs font-bold text-gray-400 uppercase">{invites.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data de Envio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 text-sm">
                    Nenhum convite enviado ainda.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{invite.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {invite.status === 'pending' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        ) : invite.status === 'accepted' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Aceito
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase">
                            <XCircle className="w-3 h-3" /> Expirado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

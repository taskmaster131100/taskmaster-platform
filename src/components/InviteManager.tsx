import React, { useState, useEffect } from 'react';
import { Mail, Send, UserPlus, ShieldCheck, Clock, CheckCircle2, XCircle, Loader2, Copy, Link2, X } from 'lucide-react';
import { sendInvite, listInvites, revokeInvite, Invite } from '../services/inviteService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://www.taskmaster.works';

const ROLE_OPTS = [
  { value: 'viewer', label: 'Visualizador', desc: 'Só leitura' },
  { value: 'editor', label: 'Editor',        desc: 'Criar e editar tarefas' },
  { value: 'admin',  label: 'Administrador', desc: 'Acesso total' },
];

export default function InviteManager() {
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState<'viewer'|'editor'|'admin'>('editor');
  const [artistId, setArtistId] = useState('');
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const loadArtists = async () => {
    const { data } = await supabase
      .from('artists')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    setArtists(data || []);
  };

  const loadInvites = async () => {
    try {
      setFetching(true);
      const data = await listInvites();
      setInvites(data);
    } catch (err) {
      console.error('Erro ao carregar convites:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadArtists();
    loadInvites();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setLastLink(null);
    try {
      const { token } = await sendInvite({
        email,
        role,
        artist_id: artistId || null,
      });
      const link = `${APP_URL}/invite/${token}`;
      setLastLink(link);
      toast.success(`Convite enviado para ${email}`);
      setEmail('');
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    try {
      await revokeInvite(id);
      toast.success(`Convite para ${email} revogado`);
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revogar convite');
    }
  };

  const copyLink = (token: string) => {
    const link = `${APP_URL}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-8">
      {/* Formulário de convite */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <UserPlus className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Convidar Membro</h3>
            <p className="text-sm text-gray-500">
              Convite por organização (acesso total) ou por artista específico.
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* E-mail */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e-mail do membro"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Role + Artista */}
          <div className="flex gap-3">
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-700"
            >
              {ROLE_OPTS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>

            <select
              value={artistId}
              onChange={e => setArtistId(e.target.value)}
              className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-600"
            >
              <option value="">Organização inteira</option>
              {artists.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Enviando…' : 'Enviar Convite'}
          </button>
        </form>

        {/* Link copiável (fallback se e-mail não chegar) */}
        {lastLink && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <p className="text-xs text-indigo-700 flex-1 truncate">
              <span className="font-semibold">Link do convite:</span> {lastLink}
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(lastLink); toast.success('Copiado!'); }}
              className="flex-shrink-0 p-1.5 hover:bg-indigo-100 rounded-lg"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
            </button>
            <button onClick={() => setLastLink(null)} className="flex-shrink-0 p-1.5 hover:bg-indigo-100 rounded-lg">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Lista de convites */}
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
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Escopo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Enviado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    Nenhum convite enviado ainda.
                  </td>
                </tr>
              ) : (
                invites.map(invite => (
                  <tr key={invite.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{invite.email}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 capitalize">{invite.role}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {invite.artist_id ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">Por artista</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Organização</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {invite.status === 'pending' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase w-fit">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      ) : invite.status === 'accepted' ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Aceito
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase w-fit">
                          <XCircle className="w-3 h-3" /> Expirado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {invite.status === 'pending' && (
                          <>
                            <button
                              onClick={() => copyLink(invite.token)}
                              title="Copiar link"
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevoke(invite.id, invite.email)}
                              title="Revogar"
                              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Edit2, Save, X, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  'Artista',
  'Produtor Musical',
  'Gestor de Artistas',
  'Booking Agent',
  'Assessor de Imprensa',
  'Diretor de Escritório',
  'Fundador de Selo',
  'Sócio / Co-fundador',
  'Outro',
];

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    bio: ''
  });
  const [originalData, setOriginalData] = useState(profileData);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Tentar carregar do user_profiles no Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const profile = {
          name: data.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          phone: data.phone || '',
          role: data.role || '',
          bio: data.bio || ''
        };
        setProfileData(profile);
        setOriginalData(profile);
      } else {
        // Fallback: usar dados do auth e criar perfil
        const profile = {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          phone: '',
          role: '',
          bio: ''
        };
        setProfileData(profile);
        setOriginalData(profile);

        // Tentar criar o perfil no Supabase
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          display_name: profile.name,
          phone: '',
          role: '',
          bio: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setProfileData({
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário',
        email: user?.email || '',
        phone: '',
        role: '',
        bio: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: profileData.name,
          phone: profileData.phone,
          role: profileData.role,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Também atualizar o nome no auth metadata
      await supabase.auth.updateUser({
        data: { name: profileData.name }
      });

      setOriginalData(profileData);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const handlePasswordReset = async () => {
    if (!profileData.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      toast.error('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setSendingReset(false);
    }
  };

  const getInitials = () => {
    return profileData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFAD85] mx-auto mb-3" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-[#FF9B6A] flex items-center justify-center text-white text-3xl font-bold">
                {getInitials()}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.role}</p>
                <p className="text-sm text-gray-500">{profileData.department}</p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-[#FFAD85] hover:bg-[#FFF8F3] rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </div>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 px-4 py-2">{profileData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone / WhatsApp
                </div>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 px-4 py-2">{profileData.phone || 'Não informado'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função na plataforma
              </label>
              {isEditing ? (
                <select
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  <option value="">Selecione sua função</option>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 px-4 py-2">{profileData.role || 'Não informado'}</p>
              )}
            </div>
          </div>

          <div className="mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobre
            </label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                placeholder="Conte um pouco sobre você e seu trabalho..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg min-h-[60px]">
                {profileData.bio || 'Nenhuma informação adicional'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Conta</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>E-mail</span>
              </div>
              <span className="text-gray-900 font-medium">{profileData.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Membro desde</span>
              <span className="text-gray-900 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Ativo
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Senha</p>
                <p className="text-xs text-gray-500">Receba um link de redefinição por e-mail</p>
              </div>
              <button
                onClick={handlePasswordReset}
                disabled={sendingReset}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
              >
                {sendingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {sendingReset ? 'Enviando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

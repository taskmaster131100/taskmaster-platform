import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
    department: '',
    bio: ''
  });
  const [originalData, setOriginalData] = useState(profileData);

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
          role: data.role || 'Gerente de Projetos',
          department: data.department || 'Gestão',
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
          role: 'Gerente de Projetos',
          department: 'Gestão',
          bio: ''
        };
        setProfileData(profile);
        setOriginalData(profile);

        // Tentar criar o perfil no Supabase
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          display_name: profile.name,
          phone: '',
          role: profile.role,
          department: profile.department,
          bio: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      // Fallback para dados do auth
      setProfileData({
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário',
        email: user?.email || '',
        phone: '',
        role: 'Gerente de Projetos',
        department: 'Gestão',
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
          department: profileData.department,
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
                  <Mail className="w-4 h-4" />
                  E-mail
                </div>
              </label>
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profileData.email}</p>
              <p className="text-xs text-gray-500 mt-1">E-mail não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 px-4 py-2">{profileData.role}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobre
            </label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={4}
                placeholder="Conte um pouco sobre você..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                {profileData.bio || 'Nenhuma informação adicional'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Informações da Conta</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">E-mail</span>
              <span className="text-gray-900 font-medium">{profileData.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Membro desde</span>
              <span className="text-gray-900 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Ativo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

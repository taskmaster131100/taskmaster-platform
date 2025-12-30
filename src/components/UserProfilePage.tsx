import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    bio: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('taskmaster_user_profile');
    if (stored) {
      try {
        setProfileData(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    } else if (user) {
      setProfileData({
        name: user.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        phone: '',
        role: 'Gerente de Projetos',
        department: 'Gestão',
        bio: ''
      });
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('taskmaster_user_profile', JSON.stringify(profileData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    const stored = localStorage.getItem('taskmaster_user_profile');
    if (stored) {
      setProfileData(JSON.parse(stored));
    }
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>

          <div className="space-y-4">
            {[
              { action: 'Criou projeto "Turnê 2024"', date: 'Há 2 horas' },
              { action: 'Adicionou artista "João Silva"', date: 'Ontem' },
              { action: 'Completou 5 tarefas', date: 'Há 2 dias' },
              { action: 'Exportou relatório financeiro', date: 'Há 3 dias' }
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#FFAD85]" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

import { useState, useEffect } from 'react';
import { Building2, Phone, Globe, Instagram, Facebook, Twitter, Youtube, Save, Loader2, MapPin, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth/AuthProvider';
import { toast } from 'sonner';

interface OrgData {
  id: string;
  name: string;
  phone: string;
  description: string;
  website: string;
  address: string;
  logo_url: string;
  social_media: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    spotify?: string;
  };
}

export default function OrganizationProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrgData>({
    id: '',
    name: '',
    phone: '',
    description: '',
    website: '',
    address: '',
    logo_url: '',
    social_media: {}
  });

  useEffect(() => {
    if (user) {
      loadOrganization();
    }
  }, [user]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      
      // Get user's organization
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!userOrg) {
        // Tentar criar organização automaticamente
        try {
          const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc('bootstrap_organization', {
            org_name: 'Minha Organização'
          });

          if (bootstrapError) {
            console.error('Erro ao criar organização:', bootstrapError);
            toast.error('Não foi possível criar a organização. Tente recarregar a página.');
            return;
          }

          // Re-buscar organização (funciona tanto para nova quanto para skipped)
          const { data: reloadedOrg } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user?.id)
            .maybeSingle();
          if (reloadedOrg?.organization_id) {
            setOrgId(reloadedOrg.organization_id);
            const { data: org } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', reloadedOrg.organization_id)
              .single();
            if (org) {
              setFormData({
                id: org.id,
                name: org.name || '',
                phone: org.phone || '',
                description: org.description || '',
                website: org.website || '',
                address: org.address || '',
                logo_url: org.logo_url || '',
                social_media: org.social_media || {}
              });
            }
            if (!bootstrapResult?.skipped) {
              toast.success('Organização criada com sucesso! Preencha os dados abaixo.');
            }
            return;
          }
        } catch (err) {
          console.error('Erro ao criar organização:', err);
          toast.error('Erro ao configurar organização. Tente recarregar a página.');
          return;
        }
      }

      setOrgId(userOrg.organization_id);

      // Get organization data
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userOrg.organization_id)
        .single();

      if (error) throw error;

      if (org) {
        setFormData({
          id: org.id,
          name: org.name || '',
          phone: org.phone || '',
          description: org.description || '',
          website: org.website || '',
          address: org.address || '',
          logo_url: org.logo_url || '',
          social_media: org.social_media || {}
        });
      }
    } catch (error) {
      console.error('Erro ao carregar organização:', error);
      toast.error('Erro ao carregar dados da organização');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    
    try {
      setSaving(true);

      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          phone: formData.phone,
          description: formData.description,
          website: formData.website,
          address: formData.address,
          logo_url: formData.logo_url,
          social_media: formData.social_media,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId);

      if (error) throw error;

      toast.success('Organização atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados da organização');
    } finally {
      setSaving(false);
    }
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Perfil da Organização</h2>
          <p className="text-gray-600 text-sm">Preencha as informações da sua organização</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>

      {/* Informações Básicas */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Informações Básicas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Organização *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Minha Produtora Musical"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 (11) 99999-9999"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descreva sua organização, serviços oferecidos..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://meusite.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Cidade, Estado, País"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Redes Sociais */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-pink-100 p-2 rounded-lg">
            <Instagram className="w-5 h-5 text-pink-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Redes Sociais</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
              <input
                type="text"
                value={formData.social_media.instagram || ''}
                onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                placeholder="@minhaprodutora"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            <div className="relative">
              <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
              <input
                type="text"
                value={formData.social_media.facebook || ''}
                onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                placeholder="facebook.com/minhaprodutora"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
              <input
                type="text"
                value={formData.social_media.youtube || ''}
                onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                placeholder="youtube.com/@minhaprodutora"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input
                type="text"
                value={formData.social_media.tiktok || ''}
                onChange={(e) => updateSocialMedia('tiktok', e.target.value)}
                placeholder="@minhaprodutora"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spotify</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
              <input
                type="text"
                value={formData.social_media.spotify || ''}
                onChange={(e) => updateSocialMedia('spotify', e.target.value)}
                placeholder="open.spotify.com/artist/..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X</label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
              <input
                type="text"
                value={formData.social_media.twitter || ''}
                onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                placeholder="@minhaprodutora"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar no final */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </div>
    </div>
  );
}

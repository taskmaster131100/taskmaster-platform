import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Instagram, Youtube, Share2, Download, Loader2, ChevronDown, ExternalLink, Mic2, Disc3, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

interface Artist {
  id: string;
  name: string;
  genre?: string;
  bio?: string;
  image_url?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  spotify?: string;
}

interface Release {
  id: string;
  title: string;
  release_date: string;
  type?: string;
}

interface Show {
  id: string;
  title: string;
  show_date: string;
  venue?: string;
  city?: string;
}

export default function EPKPage() {
  const { organizationId } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadArtists();
  }, [organizationId]);

  useEffect(() => {
    if (selectedArtist) loadArtistData(selectedArtist.id);
  }, [selectedArtist]);

  async function loadArtists() {
    if (!organizationId) return;
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, genre, bio, image_url, instagram, youtube, tiktok, spotify')
        .eq('organization_id', organizationId)
        .order('name');
      if (error) throw error;
      const list = data || [];
      setArtists(list);
      if (list.length > 0) setSelectedArtist(list[0]);
    } catch (e: any) {
      toast.error('Erro ao carregar artistas');
    } finally {
      setLoading(false);
    }
  }

  async function loadArtistData(artistId: string) {
    const [releasesResult, showsResult] = await Promise.all([
      supabase.from('releases').select('id, title, release_date, type').eq('artist_id', artistId).order('release_date', { ascending: false }).limit(6),
      supabase.from('shows').select('id, title, show_date, venue, city').eq('artist_id', artistId).gte('show_date', new Date().toISOString().split('T')[0]).order('show_date').limit(5),
    ]);
    setReleases(releasesResult.data || []);
    setShows(showsResult.data || []);
  }

  function handleShare() {
    if (!selectedArtist) return;
    const text = `${selectedArtist.name} — EPK gerado via TaskMaster`;
    if (navigator.share) {
      navigator.share({ title: selectedArtist.name, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Texto copiado!'));
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFAD85]" />
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum artista cadastrado</h3>
          <p className="text-gray-600 mb-4">Cadastre um artista para gerar o EPK.</p>
          <button
            onClick={() => navigate('/artists')}
            className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]"
          >
            Ir para Artistas
          </button>
        </div>
      </div>
    );
  }

  const a = selectedArtist!;
  const socialLinks = [
    a.instagram && { label: 'Instagram', icon: Instagram, url: a.instagram.startsWith('http') ? a.instagram : `https://instagram.com/${a.instagram.replace('@', '')}` },
    a.youtube && { label: 'YouTube', icon: Youtube, url: a.youtube.startsWith('http') ? a.youtube : `https://youtube.com/${a.youtube}` },
    a.spotify && { label: 'Spotify', icon: Music, url: a.spotify.startsWith('http') ? a.spotify : `https://open.spotify.com/artist/${a.spotify}` },
  ].filter(Boolean) as { label: string; icon: any; url: string }[];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EPK — Electronic Press Kit</h1>
          <p className="text-sm text-gray-600 mt-0.5">Material de divulgação profissional do artista</p>
        </div>
        <div className="flex gap-2">
          {artists.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(d => !d)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                {a.name}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                  {artists.map(art => (
                    <button
                      key={art.id}
                      onClick={() => { setSelectedArtist(art); setShowDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {art.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#FFAD85] text-white rounded-lg text-sm hover:bg-[#FF9B6A]">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* EPK Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header / Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-8 py-10 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0 overflow-hidden">
              {a.image_url ? (
                <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
              ) : (
                a.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">{a.name}</h2>
              {a.genre && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {a.genre}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Bio */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFAD85]" />
              Biografia
            </h3>
            {a.bio ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{a.bio}</p>
            ) : (
              <p className="text-gray-400 italic">Biografia não cadastrada. Edite o perfil do artista para adicionar.</p>
            )}
          </section>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Links & Redes Sociais</h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Releases */}
          {releases.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-[#FFAD85]" />
                Lançamentos Recentes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {releases.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Disc3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.type && `${r.type} • `}
                        {r.release_date ? new Date(r.release_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Shows */}
          {shows.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-[#FFAD85]" />
                Próximos Shows
              </h3>
              <div className="space-y-2">
                {shows.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-center min-w-12">
                      <p className="text-lg font-bold text-gray-900 leading-none">
                        {new Date(s.show_date + 'T12:00:00').getDate()}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase">
                        {new Date(s.show_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      {(s.venue || s.city) && (
                        <p className="text-xs text-gray-500">{[s.venue, s.city].filter(Boolean).join(' — ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact / Footer */}
          <section className="border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 text-center">
              EPK gerado via TaskMaster · taskmaster.works
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

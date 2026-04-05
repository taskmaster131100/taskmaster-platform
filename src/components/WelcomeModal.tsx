import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Music, Sparkles, Calendar, Users, Zap, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { PLAN_LIMITS } from '../config/pricing';

interface WelcomeModalProps {
  userName: string;
  onClose: () => void;
}

interface UsageCounts {
  projects: number;
  tasks: number;
  shows: number;
  releases: number;
  artists: number;
}

const PLAN_DISPLAY: Record<string, { name: string }> = {
  starter:      { name: 'Plano Inicial' },
  pro:          { name: 'Plano Base' },
  professional: { name: 'Plano Pro' },
};

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  if (max === -1) return null;
  const pct = Math.min((used / max) * 100, 100);
  const nearLimit = pct >= 75;
  const atLimit = used >= max;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-medium ${atLimit ? 'text-red-600' : nearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
          {used} de {max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : nearLimit ? 'bg-amber-400' : 'bg-orange-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function WelcomeModal({ userName, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const { subscription } = useSubscription(organizationId || undefined);
  const [usage, setUsage] = useState<UsageCounts>({ projects: 0, tasks: 0, shows: 0, releases: 0, artists: 0 });

  const planId = subscription?.plan_id || 'starter';
  const plan = PLAN_DISPLAY[planId] || PLAN_DISPLAY.starter;
  const isStarter = planId === 'starter';

  useEffect(() => {
    if (!organizationId) return;
    Promise.all([
      supabase.from('plannings').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('shows').select('*', { count: 'exact', head: true }),
      supabase.from('releases').select('*', { count: 'exact', head: true }),
      supabase.from('artists').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    ]).then(([p, t, s, r, a]) => {
      setUsage({
        projects:  p.count  ?? 0,
        tasks:     t.count  ?? 0,
        shows:     s.count  ?? 0,
        releases:  r.count  ?? 0,
        artists:   a.count  ?? 0,
      });
    });
  }, [organizationId]);

  const planLimits = (PLAN_LIMITS as any)[planId] || PLAN_LIMITS.starter;

  const nearLimit = (
    (planLimits.maxProjects  !== -1 && usage.projects  / planLimits.maxProjects  >= 0.75) ||
    (planLimits.maxTasks     !== -1 && usage.tasks     / planLimits.maxTasks     >= 0.75) ||
    (planLimits.maxShows     !== -1 && usage.shows     / planLimits.maxShows     >= 0.75) ||
    (planLimits.maxReleases  !== -1 && usage.releases  / planLimits.maxReleases  >= 0.75)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFAD85] via-purple-600 to-pink-600 p-6 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Music className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-tight">{getGreeting()}, {userName}!</h2>
              <p className="text-white text-opacity-90 text-sm mt-0.5">
                Plataforma global para profissionais da música
              </p>
            </div>
          </div>

          <p className="text-white text-opacity-80 text-sm leading-relaxed">
            Gerencie projetos, lançamentos, shows, tarefas e equipe com apoio de inteligência artificial.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-white bg-opacity-15 rounded-lg px-3 py-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Você está no {plan.name}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">

          {/* Social proof */}
          <p className="text-center text-sm text-gray-500">
            Utilizado por artistas, produtores e equipes no mundo todo
          </p>

          {/* Near-limit alert */}
          {nearLimit && isStarter && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Você está próximo do limite do seu plano</p>
                <p className="text-xs text-amber-600 mt-0.5">Faça upgrade para continuar crescendo sem restrições.</p>
              </div>
            </div>
          )}

          {/* Usage */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Uso do plano</h3>
            <div className="space-y-3">
              <UsageBar used={usage.projects}  max={planLimits.maxProjects}  label="Projetos" />
              <UsageBar used={usage.tasks}     max={planLimits.maxTasks}     label="Tarefas" />
              <UsageBar used={usage.shows}     max={planLimits.maxShows}     label="Shows" />
              <UsageBar used={usage.releases}  max={planLimits.maxReleases}  label="Lançamentos" />
              <UsageBar used={usage.artists}   max={planLimits.maxArtists}   label="Artistas" />
            </div>
          </div>

          {/* Plans block */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Planos disponíveis</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className={`rounded-xl border p-4 ${isStarter ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">Plano Inicial</span>
                  {isStarter && (
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Atual</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">Ideal para quem está começando</p>
                <p className="text-lg font-bold text-gray-900">$49<span className="text-sm font-normal text-gray-500">/mês</span></p>
              </div>

              <div className={`rounded-xl border p-4 ${planId === 'pro' ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">Plano Base</span>
                  {planId === 'pro' && (
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Atual</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">Para artistas e equipes em crescimento</p>
                <p className="text-lg font-bold text-gray-900">$75<span className="text-sm font-normal text-gray-500">/mês</span></p>
              </div>
            </div>

            {/* Upgrade benefits + CTA (starter only) */}
            {isStarter && (
              <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-semibold text-purple-800 mb-2">No Plano Base você libera:</p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'Mais projetos, shows e lançamentos',
                    'Controle financeiro completo',
                    'CRM de contatos',
                    'Gestão de múltiplos artistas',
                  ].map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-purple-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Desbloquear mais recursos
                </button>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Acesso rápido</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNavigate('/artists')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-sm font-medium text-gray-700 text-left"
              >
                <Users className="w-4 h-4 text-orange-500 flex-shrink-0" />
                Adicionar artista
              </button>
              <button
                onClick={() => handleNavigate('/projects')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm font-medium text-gray-700 text-left"
              >
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                Criar projeto
              </button>
              <button
                onClick={() => handleNavigate('/agenda')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 text-left"
              >
                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                Ver agenda
              </button>
              <button
                onClick={() => handleNavigate('/tasks')}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-sm font-medium text-gray-700 text-left"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                Ver tarefas
              </button>
            </div>
          </div>

          {/* Onboarding steps */}
          <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Comece agora:</h3>
            <div className="space-y-2">
              {[
                'Crie seu artista',
                'Organize seu primeiro projeto',
                'Adicione tarefas',
                'Planeje seu próximo lançamento',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-6">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            Ir para o dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

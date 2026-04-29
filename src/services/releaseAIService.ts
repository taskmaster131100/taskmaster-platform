import { supabase } from '../lib/supabase';
import { ReleaseType } from './releaseService';

// Minimum days required before release date, per type
export const RELEASE_MIN_DAYS: Record<string, number> = {
  single: 21,
  ep: 35,
  album: 60,
  remix: 21,
  live: 21,
};

export interface AIReleaseTask {
  title: string;
  description: string;
  area: 'Lançamento' | 'Marketing';
  due_date: string;
  priority: 'alta' | 'media';
  status: 'a_fazer';
  project_id: null;
}

export interface ReleaseMilestone {
  label: string;
  date: string;
  daysBeforeRelease: number;
  isToday?: boolean;
  isRelease?: boolean;
}

export interface ReleaseTimelineProposal {
  viable: boolean;
  minDaysRequired: number;
  daysUntilRelease: number;
  milestones: ReleaseMilestone[];
  tasks: AIReleaseTask[];
  inviableReason?: 'no_date' | 'below_minimum' | 'critical_in_past';
}

// Task templates — short, operational descriptions of real deliverables
const TASK_TEMPLATES: Record<string, Array<{
  title: string;
  description: string;
  area: 'Lançamento' | 'Marketing';
  days_before: number;
  priority: 'alta' | 'media';
  critical: boolean;
}>> = {
  single: [
    {
      title: 'Enviar capa 3000x3000 e master WAV ao distribuidor',
      description: 'Capa JPG/PNG 3000x3000px + master WAV 24bit/44.1kHz. Prazo mínimo exigido pela distribuidora.',
      area: 'Lançamento',
      days_before: 14,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Cadastrar letra e composição no ECAD e na distribuição',
      description: 'Registrar composição, co-autores e splits de royalties na plataforma de distribuição e ECAD.',
      area: 'Lançamento',
      days_before: 10,
      priority: 'media',
      critical: false,
    },
    {
      title: 'Criar link de pré-save e publicar nos stories',
      description: 'Gerar link de pré-save via distribuidor e divulgar em Instagram Stories e feed.',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Enviar pitch para playlists editoriais',
      description: 'Submeter o single via distribuidor para curadoria de playlists editoriais (prazo mínimo 7 dias).',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
  ],
  ep: [
    {
      title: 'Aprovar masters finais de todas as faixas',
      description: 'Confirmar aprovação dos masters com o engenheiro de mixagem/masterização antes do envio.',
      area: 'Lançamento',
      days_before: 21,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Enviar capa e masters WAV de todas as faixas ao distribuidor',
      description: 'Capa 3000x3000px + masters WAV de cada faixa. Prazo mínimo da distribuidora.',
      area: 'Lançamento',
      days_before: 14,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Cadastrar letras e composições (ECAD / distribuição)',
      description: 'Registrar composições, co-autores e splits de royalties por faixa.',
      area: 'Lançamento',
      days_before: 10,
      priority: 'media',
      critical: false,
    },
    {
      title: 'Criar landing page do EP com tracklist',
      description: 'Página de divulgação com tracklist, créditos, bio atualizada e pré-save.',
      area: 'Marketing',
      days_before: 10,
      priority: 'media',
      critical: false,
    },
    {
      title: 'Criar link de pré-save e lançar campanha de contagem',
      description: 'Gerar pré-save e iniciar campanha de contagem regressiva nas redes sociais.',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Enviar pitch para playlists editoriais',
      description: 'Submeter EP via distribuidor para curadoria editorial (prazo mínimo 7 dias).',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
  ],
  album: [
    {
      title: 'Entregar masters WAV finalizados ao produtor',
      description: 'Versões finais aprovadas de todas as faixas para início da masterização.',
      area: 'Lançamento',
      days_before: 45,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Aprovar mixagem e masterização de todas as faixas',
      description: 'Aprovar masters finais com o engenheiro antes do envio ao distribuidor.',
      area: 'Lançamento',
      days_before: 30,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Enviar capa 3000x3000 e masters WAV ao distribuidor',
      description: 'Capa + todos os masters WAV. Prazo mínimo da distribuidora para álbum completo.',
      area: 'Lançamento',
      days_before: 21,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Cadastrar letras, composições e co-autores no ECAD',
      description: 'Registrar todas as composições, arranjos e splits de royalties por faixa.',
      area: 'Lançamento',
      days_before: 14,
      priority: 'media',
      critical: false,
    },
    {
      title: 'Criar landing page do álbum com tracklist e bio',
      description: 'Página com tracklist completo, créditos, bio atualizada e link de pré-save.',
      area: 'Marketing',
      days_before: 14,
      priority: 'media',
      critical: false,
    },
    {
      title: 'Criar link de pré-save e lançar campanha',
      description: 'Gerar pré-save e iniciar campanha de contagem regressiva.',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
    {
      title: 'Enviar pitch para playlists editoriais',
      description: 'Submeter álbum via distribuidor para curadoria editorial (prazo mínimo 7 dias).',
      area: 'Marketing',
      days_before: 7,
      priority: 'alta',
      critical: true,
    },
  ],
};

TASK_TEMPLATES['remix'] = TASK_TEMPLATES['single'];
TASK_TEMPLATES['live'] = TASK_TEMPLATES['single'];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00');
  const b = new Date(to + 'T12:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateReleaseProposal(
  releaseType: ReleaseType,
  releaseDate: string | null | undefined
): ReleaseTimelineProposal {
  const today = todayStr();
  const minDays = RELEASE_MIN_DAYS[releaseType] ?? 21;

  if (!releaseDate) {
    return {
      viable: false,
      minDaysRequired: minDays,
      daysUntilRelease: 0,
      milestones: [],
      tasks: [],
      inviableReason: 'no_date',
    };
  }

  const daysUntilRelease = daysBetween(today, releaseDate);
  const templates = TASK_TEMPLATES[releaseType] ?? TASK_TEMPLATES['single'];

  // Below minimum floor → inviable
  if (daysUntilRelease < minDays) {
    return {
      viable: false,
      minDaysRequired: minDays,
      daysUntilRelease,
      milestones: [],
      tasks: [],
      inviableReason: 'below_minimum',
    };
  }

  // Adjustment 1: if ANY critical task falls before today → inviable (no partial cronogram)
  const anyCriticalInPast = templates
    .filter(t => t.critical)
    .some(t => addDays(releaseDate, -t.days_before) < today);

  if (anyCriticalInPast) {
    return {
      viable: false,
      minDaysRequired: minDays,
      daysUntilRelease,
      milestones: [],
      tasks: [],
      inviableReason: 'critical_in_past',
    };
  }

  // Build tasks
  const tasks: AIReleaseTask[] = templates.map(t => ({
    title: t.title,
    description: t.description,
    area: t.area,
    due_date: addDays(releaseDate, -t.days_before),
    priority: t.priority,
    status: 'a_fazer' as const,
    project_id: null,
  }));

  // Build visual milestones (display only — not inserted)
  const milestones: ReleaseMilestone[] = [
    { label: 'Hoje', date: today, daysBeforeRelease: daysUntilRelease, isToday: true },
    ...templates.map(t => ({
      label: t.title,
      date: addDays(releaseDate, -t.days_before),
      daysBeforeRelease: t.days_before,
    })),
    { label: 'Lançamento', date: releaseDate, daysBeforeRelease: 0, isRelease: true },
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    viable: true,
    minDaysRequired: minDays,
    daysUntilRelease,
    milestones,
    tasks,
  };
}

export function getMinReleaseDateFor(releaseType: ReleaseType): string {
  const minDays = RELEASE_MIN_DAYS[releaseType] ?? 21;
  return addDays(todayStr(), minDays);
}

export async function saveReleaseWithTasks(
  releaseId: string,
  tasks: AIReleaseTask[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Fetch organization_id from the release so tasks pass RLS
  const { data: release } = await supabase
    .from('releases')
    .select('organization_id')
    .eq('id', releaseId)
    .single();
  const orgId = release?.organization_id || null;

  // Map AIReleaseTask fields to actual tasks schema:
  //   - area → workstream ('Lançamento'→'lancamento', 'Marketing'→'marketing')
  //   - priority: 'alta'→'high', 'media'→'medium'
  //   - strip: status (not 'a_fazer'), project_id (null, not a required link), release_id (column doesn't exist)
  const tasksToInsert = tasks.map(({ area, status: _s, priority, project_id: _pid, ...rest }) => ({
    ...rest,
    workstream: area === 'Marketing' ? 'marketing' : 'lancamento',
    status: 'todo',
    priority: priority === 'alta' ? 'high' : 'medium',
    reporter_id: user.id,
    organization_id: orgId,
    labels: [`release:${releaseId}`],
  }));

  const { error } = await supabase.from('tasks').insert(tasksToInsert);
  if (error) throw error;
}

import { supabase } from '../lib/supabase';

// ============================================
// SERVIÇO UNIFICADO DE BANCO DE DADOS
// Conecta todos os módulos ao Supabase
// ============================================

// Tipos
export interface Artist {
  id?: string;
  name: string;
  artistic_name?: string;
  genre?: string;
  bio?: string;
  photo_url?: string;
  contract_type?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Show {
  id?: string;
  title: string;
  artist_name: string;
  show_date: string;
  show_time?: string;
  venue?: string;
  city: string;
  state?: string;
  country?: string;
  contractor_name?: string;
  contractor_contact?: string;
  contractor_whatsapp?: string;
  value?: number;
  currency?: string;
  status: 'consultado' | 'proposto' | 'fechado' | 'pago';
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Release {
  id?: string;
  title: string;
  artist_name: string;
  type: 'single' | 'ep' | 'album' | 'remix' | 'ao_vivo';
  release_date: string;
  status: 'pre_producao' | 'producao' | 'mixagem' | 'masterizacao' | 'distribuicao' | 'lancado';
  isrc?: string;
  upc?: string;
  distributor?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  area: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'a_fazer' | 'em_progresso' | 'bloqueado' | 'concluido';
  due_date?: string;
  assigned_to?: string;
  project_id?: string;
  show_id?: string;
  release_id?: string;
  created_by?: string;
  created_at?: string;
  completed_at?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  event_type: 'tarefa' | 'reuniao' | 'evento' | 'show' | 'prazo';
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  created_by?: string;
  created_at?: string;
}

export interface FinancialTransaction {
  id?: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'pendente' | 'pago' | 'cancelado';
  source_type?: string;
  source_id?: string;
  created_by?: string;
  created_at?: string;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  type: string;
  artist_id?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id?: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  category: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
}

// ============================================
// ARTISTAS
// ============================================
export const artistService = {
  async getAll(): Promise<Artist[]> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar artistas:', error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar artista:', error);
      return null;
    }
    return data;
  },

  async create(artist: Artist): Promise<Artist | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('artists')
      .insert([{ ...artist, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar artista:', error);
      return null;
    }
    console.log('✅ Artista criado:', data);
    return data;
  },

  async update(id: string, updates: Partial<Artist>): Promise<Artist | null> {
    const { data, error } = await supabase
      .from('artists')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar artista:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar artista:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// SHOWS
// ============================================
export const showService = {
  async getAll(): Promise<Show[]> {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .order('show_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar shows:', error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Show | null> {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar show:', error);
      return null;
    }
    return data;
  },

  async create(show: Show): Promise<Show | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('shows')
      .insert([{ ...show, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar show:', error);
      return null;
    }
    
    console.log('✅ Show criado:', data);
    
    // Criar tarefas padrão do show
    if (data) {
      await this.createDefaultTasks(data.id);
      
      // Se o show foi fechado, criar transação financeira
      if (show.status === 'fechado' && show.value) {
        await financialService.create({
          type: 'receita',
          description: `Show: ${show.title} - ${show.city}`,
          amount: show.value,
          date: show.show_date,
          category: 'shows',
          status: 'pendente',
          source_type: 'show',
          source_id: data.id
        });
      }
      
      // Criar evento no calendário
      await calendarService.create({
        title: `Show: ${show.title}`,
        description: `${show.venue || ''} - ${show.city}`,
        event_type: 'show',
        event_date: show.show_date,
        start_time: show.show_time,
        location: `${show.venue || ''}, ${show.city}`
      });
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Show>): Promise<Show | null> {
    const oldShow = await this.getById(id);
    
    const { data, error } = await supabase
      .from('shows')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar show:', error);
      return null;
    }
    
    // Se o status mudou para 'fechado', criar transação financeira
    if (oldShow && oldShow.status !== 'fechado' && updates.status === 'fechado' && data.value) {
      await financialService.create({
        type: 'receita',
        description: `Show: ${data.title} - ${data.city}`,
        amount: data.value,
        date: data.show_date,
        category: 'shows',
        status: 'pendente',
        source_type: 'show',
        source_id: data.id
      });
    }
    
    // Se o status mudou para 'pago', atualizar transação financeira
    if (oldShow && oldShow.status !== 'pago' && updates.status === 'pago') {
      await financialService.updateBySource('show', id, { status: 'pago' });
    }
    
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar show:', error);
      return false;
    }
    return true;
  },

  async createDefaultTasks(showId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const defaultTasks = [
      // ANTES DO SHOW
      { title: 'Confirmar contrato assinado', category: 'antes', priority: 'alta' },
      { title: 'Enviar rider técnico', category: 'antes', priority: 'alta' },
      { title: 'Confirmar transporte', category: 'antes', priority: 'alta' },
      { title: 'Confirmar hospedagem', category: 'antes', priority: 'media' },
      { title: 'Confirmar alimentação', category: 'antes', priority: 'media' },
      { title: 'Divulgar show nas redes', category: 'antes', priority: 'media' },
      { title: 'Confirmar equipe técnica', category: 'antes', priority: 'alta' },
      { title: 'Preparar setlist', category: 'antes', priority: 'media' },
      // NO DIA
      { title: 'Check-in no local', category: 'no_dia', priority: 'alta' },
      { title: 'Passagem de som', category: 'no_dia', priority: 'alta' },
      { title: 'Verificar camarim', category: 'no_dia', priority: 'media' },
      { title: 'Confirmar horário do show', category: 'no_dia', priority: 'alta' },
      { title: 'Realizar show', category: 'no_dia', priority: 'alta' },
      // DEPOIS DO SHOW
      { title: 'Confirmar pagamento final', category: 'depois', priority: 'alta' },
      { title: 'Coletar fotos e vídeos', category: 'depois', priority: 'media' },
      { title: 'Enviar agradecimento ao contratante', category: 'depois', priority: 'baixa' },
      { title: 'Coletar feedback', category: 'depois', priority: 'baixa' },
      { title: 'Atualizar relatório financeiro', category: 'depois', priority: 'media' }
    ];

    const tasksToInsert = defaultTasks.map(task => ({
      show_id: showId,
      title: task.title,
      description: `Categoria: ${task.category}`,
      status: 'pending',
      created_by: user?.id
    }));

    const { error } = await supabase
      .from('show_tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('Erro ao criar tarefas do show:', error);
    } else {
      console.log('✅ Tarefas do show criadas');
    }
  }
};

// ============================================
// LANÇAMENTOS (RELEASES)
// ============================================
export const releaseService = {
  async getAll(): Promise<Release[]> {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .order('release_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar lançamentos:', error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Release | null> {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar lançamento:', error);
      return null;
    }
    return data;
  },

  async create(release: Release): Promise<Release | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('releases')
      .insert([{ ...release, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar lançamento:', error);
      return null;
    }
    
    console.log('✅ Lançamento criado:', data);
    
    // Criar tarefas automáticas por departamento
    if (data) {
      await this.createReleaseTasks(data);
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Release>): Promise<Release | null> {
    const { data, error } = await supabase
      .from('releases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar lançamento:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('releases')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar lançamento:', error);
      return false;
    }
    return true;
  },

  async createReleaseTasks(release: Release): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const releaseDate = new Date(release.release_date);
    
    const tasksByDepartment = [
      // PRODUÇÃO
      { title: 'Finalizar gravação', department: 'producao', days_before: 60 },
      { title: 'Mixagem', department: 'producao', days_before: 45 },
      { title: 'Masterização', department: 'producao', days_before: 30 },
      { title: 'Aprovar master final', department: 'producao', days_before: 25 },
      // DISTRIBUIÇÃO
      { title: 'Cadastrar na distribuidora', department: 'distribuicao', days_before: 21 },
      { title: 'Enviar metadados', department: 'distribuicao', days_before: 21 },
      { title: 'Confirmar ISRC', department: 'distribuicao', days_before: 14 },
      // MARKETING
      { title: 'Criar plano de divulgação', department: 'marketing', days_before: 30 },
      { title: 'Produzir arte de capa', department: 'marketing', days_before: 21 },
      { title: 'Aprovar arte de capa', department: 'marketing', days_before: 14 },
      { title: 'Criar posts para redes sociais', department: 'marketing', days_before: 7 },
      { title: 'Agendar posts', department: 'marketing', days_before: 3 },
      { title: 'Enviar release para imprensa', department: 'marketing', days_before: 7 },
      // AUDIOVISUAL
      { title: 'Definir conceito do clipe', department: 'audiovisual', days_before: 45 },
      { title: 'Gravar clipe', department: 'audiovisual', days_before: 30 },
      { title: 'Editar clipe', department: 'audiovisual', days_before: 14 },
      { title: 'Aprovar clipe final', department: 'audiovisual', days_before: 7 },
      // PÓS-LANÇAMENTO
      { title: 'Monitorar performance nas plataformas', department: 'marketing', days_before: -7 },
      { title: 'Coletar feedback', department: 'marketing', days_before: -14 },
      { title: 'Relatório de lançamento', department: 'marketing', days_before: -30 }
    ];

    const tasksToInsert = tasksByDepartment.map(task => {
      const dueDate = new Date(releaseDate);
      dueDate.setDate(dueDate.getDate() - task.days_before);
      
      return {
        title: task.title,
        description: `Departamento: ${task.department}`,
        area: task.department,
        priority: task.days_before <= 7 ? 'alta' : task.days_before <= 21 ? 'media' : 'baixa',
        status: 'a_fazer',
        due_date: dueDate.toISOString().split('T')[0],
        release_id: release.id,
        created_by: user?.id
      };
    });

    const { error } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('Erro ao criar tarefas do lançamento:', error);
    } else {
      console.log('✅ Tarefas do lançamento criadas');
    }
  }
};

// ============================================
// TAREFAS
// ============================================
export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar tarefas:', error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar tarefa:', error);
      return null;
    }
    return data;
  },

  async create(task: Task): Promise<Task | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar tarefa:', error);
      return null;
    }
    console.log('✅ Tarefa criada:', data);
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const updateData: any = { ...updates };
    
    // Se a tarefa foi concluída, registrar a data
    if (updates.status === 'concluido') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      return false;
    }
    return true;
  },

  async getByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar tarefas do projeto:', error);
      return [];
    }
    return data || [];
  }
};

// ============================================
// CALENDÁRIO
// ============================================
export const calendarService = {
  async getAll(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
    return data || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar eventos por período:', error);
      return [];
    }
    return data || [];
  },

  async create(event: CalendarEvent): Promise<CalendarEvent | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{ ...event, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar evento:', error);
      return null;
    }
    console.log('✅ Evento criado:', data);
    return data;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar evento:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar evento:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// FINANCEIRO
// ============================================
export const financialService = {
  async getAll(): Promise<FinancialTransaction[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
    return data || [];
  },

  async create(transaction: FinancialTransaction): Promise<FinancialTransaction | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([{ ...transaction, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar transação:', error);
      return null;
    }
    console.log('✅ Transação criada:', data);
    return data;
  },

  async update(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction | null> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar transação:', error);
      return null;
    }
    return data;
  },

  async updateBySource(sourceType: string, sourceId: string, updates: Partial<FinancialTransaction>): Promise<boolean> {
    const { error } = await supabase
      .from('financial_transactions')
      .update(updates)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId);
    
    if (error) {
      console.error('Erro ao atualizar transação por fonte:', error);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar transação:', error);
      return false;
    }
    return true;
  },

  async getSummary(): Promise<{ receitas: number; despesas: number; saldo: number }> {
    const transactions = await this.getAll();
    
    const receitas = transactions
      .filter(t => t.type === 'receita' && t.status !== 'cancelado')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const despesas = transactions
      .filter(t => t.type === 'despesa' && t.status !== 'cancelado')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  }
};

// ============================================
// PROJETOS
// ============================================
export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar projetos:', error);
      return [];
    }
    return data || [];
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar projeto:', error);
      return null;
    }
    return data;
  },

  async create(project: Project): Promise<Project | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar projeto:', error);
      return null;
    }
    console.log('✅ Projeto criado:', data);
    return data;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar projeto:', error);
      return false;
    }
    return true;
  }
};

// ============================================
// CONTATOS (CRM)
// ============================================
export const contactService = {
  async getAll(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar contatos:', error);
      return [];
    }
    return data || [];
  },

  async create(contact: Contact): Promise<Contact | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ ...contact, created_by: user?.id }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar contato:', error);
      return null;
    }
    console.log('✅ Contato criado:', data);
    return data;
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar contato:', error);
      return null;
    }
    return data;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar contato:', error);
      return false;
    }
    return true;
  }
};

// Exportar todos os serviços
export const db = {
  artists: artistService,
  shows: showService,
  releases: releaseService,
  tasks: taskService,
  calendar: calendarService,
  financial: financialService,
  projects: projectService,
  contacts: contactService
};

export default db;

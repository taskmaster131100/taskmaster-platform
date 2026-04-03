import { supabase } from '../lib/supabase';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface FinancialTransaction {
  id: string;
  type: 'revenue' | 'expense';
  category: FinanceCategory;
  subcategory?: string;
  description: string;
  amount: number;
  // Campos reais do banco: user_id, transaction_date
  user_id?: string;
  transaction_date?: string;
  // Aliases mantidos para compatibilidade com código legado
  due_date?: string;
  reference_type?: 'show' | 'release' | 'production' | 'marketing' | 'audiovisual' | 'team' | 'other';
  reference_id?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type FinanceCategory = 
  // Receitas
  | 'shows'           // Cachês de shows
  | 'streaming'       // Royalties de streaming
  | 'licensing'       // Licenciamento de músicas
  | 'merchandising'   // Vendas de produtos
  | 'sponsorship'     // Patrocínios
  | 'other_revenue'   // Outras receitas
  // Despesas
  | 'production'      // Produção musical (estúdio, mixagem, master)
  | 'marketing'       // Marketing e publicidade
  | 'audiovisual'     // Clipes, fotos, conteúdo
  | 'logistics'       // Transporte, hospedagem
  | 'team'            // Equipe e freelancers
  | 'distribution'    // Distribuição digital
  | 'legal'           // Jurídico e contratos
  | 'equipment'       // Equipamentos
  | 'other_expense';  // Outras despesas

export const FINANCE_CATEGORIES = {
  revenue: [
    { id: 'shows', label: 'Shows e Eventos', icon: '🎤' },
    { id: 'streaming', label: 'Streaming/Royalties', icon: '🎵' },
    { id: 'licensing', label: 'Licenciamento', icon: '📜' },
    { id: 'merchandising', label: 'Merchandising', icon: '👕' },
    { id: 'sponsorship', label: 'Patrocínios', icon: '🤝' },
    { id: 'other_revenue', label: 'Outras Receitas', icon: '💰' },
  ],
  expense: [
    { id: 'production', label: 'Produção Musical', icon: '🎹' },
    { id: 'marketing', label: 'Marketing', icon: '📢' },
    { id: 'audiovisual', label: 'Audiovisual', icon: '🎬' },
    { id: 'logistics', label: 'Logística', icon: '🚐' },
    { id: 'team', label: 'Equipe', icon: '👥' },
    { id: 'distribution', label: 'Distribuição', icon: '📦' },
    { id: 'legal', label: 'Jurídico', icon: '⚖️' },
    { id: 'equipment', label: 'Equipamentos', icon: '🎸' },
    { id: 'other_expense', label: 'Outras Despesas', icon: '📋' },
  ]
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Cria uma transação financeira
 */
export async function createTransaction(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Embute referência nas notas quando fornecida (colunas reference_* não existem no banco)
  const refNote = data.reference_type && data.reference_id
    ? `ref:${data.reference_type}:${data.reference_id}`
    : null;
  const finalNotes = [data.notes, refNote].filter(Boolean).join(' | ') || null;

  const { data: transaction, error } = await supabase
    .from('financial_transactions')
    .insert({
      user_id: user.id,
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
      status: data.status || 'pending',
      // due_date é o alias legado; transaction_date é o campo real do banco
      transaction_date: data.transaction_date || data.due_date || new Date().toISOString().split('T')[0],
      notes: finalNotes,
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

/**
 * Atualiza uma transação financeira
 */
export async function updateTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category !== undefined)    dbUpdates.category = updates.category;
  if (updates.amount !== undefined)      dbUpdates.amount = updates.amount;
  if (updates.type !== undefined)        dbUpdates.type = updates.type;
  if (updates.status !== undefined)      dbUpdates.status = updates.status;
  if (updates.notes !== undefined)       dbUpdates.notes = updates.notes;
  if (updates.transaction_date !== undefined) dbUpdates.transaction_date = updates.transaction_date;
  else if (updates.due_date !== undefined)    dbUpdates.transaction_date = updates.due_date;

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lista transações com filtros
 */
export async function listTransactions(filters?: {
  type?: 'revenue' | 'expense';
  category?: FinanceCategory;
  status?: string;
  startDate?: string;
  endDate?: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<FinancialTransaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.startDate) query = query.gte('transaction_date', filters.startDate);
  if (filters?.endDate) query = query.lte('transaction_date', filters.endDate);
  // reference_type e reference_id não existem no banco — use notes ILIKE se necessário
  if (filters?.referenceId) query = (query as any).ilike('notes', `%${filters.referenceId}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================
// INTEGRAÇÕES COM OUTROS MÓDULOS
// ============================================

/**
 * Cria transação de receita quando um show é fechado
 */
export async function createShowRevenue(show: {
  id: string;
  title: string;
  artist_name: string;
  value?: number;
  currency?: string;
  show_date: string;
  venue?: string;
  city: string;
}): Promise<FinancialTransaction | null> {
  if (!show.value || show.value <= 0) return null;

  return createTransaction({
    type: 'revenue',
    category: 'shows',
    description: `Cachê: ${show.title} - ${show.artist_name}`,
    amount: show.value,
    currency: show.currency || 'BRL',
    status: 'pending',
    due_date: show.show_date,
    reference_type: 'show',
    reference_id: show.id,
    notes: `Local: ${show.venue || ''}, ${show.city}`
  });
}

/**
 * Atualiza transação para pago quando show é marcado como pago
 */
export async function markShowAsPaid(showId: string): Promise<void> {
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('id')
    .ilike('notes', `%ref:show:${showId}%`);

  if (transactions && transactions.length > 0) {
    await supabase
      .from('financial_transactions')
      .update({ status: 'paid' })
      .ilike('notes', `%ref:show:${showId}%`);
  }
}

/**
 * Cria despesas de logística para um show
 */
export async function createShowExpenses(show: {
  id: string;
  title: string;
  show_date: string;
}, expenses: {
  transport?: number;
  accommodation?: number;
  food?: number;
  crew?: number;
}): Promise<void> {
  const expenseItems = [];

  if (expenses.transport && expenses.transport > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'logistics',
      subcategory: 'transport',
      description: `Transporte: ${show.title}`,
      amount: expenses.transport,
      due_date: show.show_date,
      reference_type: 'show',
      reference_id: show.id
    });
  }

  if (expenses.accommodation && expenses.accommodation > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'logistics',
      subcategory: 'accommodation',
      description: `Hospedagem: ${show.title}`,
      amount: expenses.accommodation,
      due_date: show.show_date,
      reference_type: 'show',
      reference_id: show.id
    });
  }

  if (expenses.food && expenses.food > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'logistics',
      subcategory: 'food',
      description: `Alimentação: ${show.title}`,
      amount: expenses.food,
      due_date: show.show_date,
      reference_type: 'show',
      reference_id: show.id
    });
  }

  if (expenses.crew && expenses.crew > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'team',
      subcategory: 'crew',
      description: `Equipe: ${show.title}`,
      amount: expenses.crew,
      due_date: show.show_date,
      reference_type: 'show',
      reference_id: show.id
    });
  }

  for (const expense of expenseItems) {
    await createTransaction(expense as Partial<FinancialTransaction>);
  }
}

/**
 * Cria despesas de produção para um release
 */
export async function createReleaseExpenses(release: {
  id: string;
  title: string;
  release_date?: string;
}, expenses: {
  studio?: number;
  mixing?: number;
  mastering?: number;
  artwork?: number;
  distribution?: number;
}): Promise<void> {
  const expenseItems = [];
  const dueDate = release.release_date || new Date().toISOString().split('T')[0];

  if (expenses.studio && expenses.studio > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'production',
      subcategory: 'studio',
      description: `Estúdio: ${release.title}`,
      amount: expenses.studio,
      due_date: dueDate,
      reference_type: 'release',
      reference_id: release.id
    });
  }

  if (expenses.mixing && expenses.mixing > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'production',
      subcategory: 'mixing',
      description: `Mixagem: ${release.title}`,
      amount: expenses.mixing,
      due_date: dueDate,
      reference_type: 'release',
      reference_id: release.id
    });
  }

  if (expenses.mastering && expenses.mastering > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'production',
      subcategory: 'mastering',
      description: `Masterização: ${release.title}`,
      amount: expenses.mastering,
      due_date: dueDate,
      reference_type: 'release',
      reference_id: release.id
    });
  }

  if (expenses.artwork && expenses.artwork > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'audiovisual',
      subcategory: 'artwork',
      description: `Arte/Capa: ${release.title}`,
      amount: expenses.artwork,
      due_date: dueDate,
      reference_type: 'release',
      reference_id: release.id
    });
  }

  if (expenses.distribution && expenses.distribution > 0) {
    expenseItems.push({
      type: 'expense',
      category: 'distribution',
      description: `Distribuição: ${release.title}`,
      amount: expenses.distribution,
      due_date: dueDate,
      reference_type: 'release',
      reference_id: release.id
    });
  }

  for (const expense of expenseItems) {
    await createTransaction(expense as Partial<FinancialTransaction>);
  }
}

/**
 * Cria despesas de marketing
 */
export async function createMarketingExpense(data: {
  description: string;
  amount: number;
  due_date: string;
  campaign_id?: string;
  subcategory?: 'ads' | 'pr' | 'influencer' | 'content' | 'other';
}): Promise<FinancialTransaction> {
  return createTransaction({
    type: 'expense',
    category: 'marketing',
    subcategory: data.subcategory,
    description: data.description,
    amount: data.amount,
    due_date: data.due_date,
    reference_type: 'marketing',
    reference_id: data.campaign_id,
    status: 'pending'
  });
}

/**
 * Cria despesas de audiovisual (clipes, fotos, etc.)
 */
export async function createAudiovisualExpense(data: {
  description: string;
  amount: number;
  due_date: string;
  project_id?: string;
  subcategory?: 'video' | 'photo' | 'design' | 'other';
}): Promise<FinancialTransaction> {
  return createTransaction({
    type: 'expense',
    category: 'audiovisual',
    subcategory: data.subcategory,
    description: data.description,
    amount: data.amount,
    due_date: data.due_date,
    reference_type: 'audiovisual',
    reference_id: data.project_id,
    status: 'pending'
  });
}

/**
 * Cria despesa de equipe/freelancer
 */
export async function createTeamExpense(data: {
  description: string;
  amount: number;
  due_date: string;
  member_id?: string;
  subcategory?: 'salary' | 'freelancer' | 'bonus' | 'other';
}): Promise<FinancialTransaction> {
  return createTransaction({
    type: 'expense',
    category: 'team',
    subcategory: data.subcategory,
    description: data.description,
    amount: data.amount,
    due_date: data.due_date,
    reference_type: 'team',
    reference_id: data.member_id,
    status: 'pending'
  });
}

// ============================================
// RELATÓRIOS E ANÁLISES
// ============================================

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  pendingRevenue: number;
  pendingExpenses: number;
}

/**
 * Gera resumo financeiro para um período
 */
export async function getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .neq('status', 'cancelled');

  if (startDate) query = query.gte('due_date', startDate);
  if (endDate) query = query.lte('due_date', endDate);

  const { data: transactions, error } = await query;
  if (error) throw error;

  const summary: FinancialSummary = {
    totalRevenue: 0,
    totalExpenses: 0,
    balance: 0,
    revenueByCategory: {},
    expensesByCategory: {},
    pendingRevenue: 0,
    pendingExpenses: 0
  };

  for (const t of transactions || []) {
    if (t.type === 'revenue') {
      summary.totalRevenue += t.amount;
      summary.revenueByCategory[t.category] = (summary.revenueByCategory[t.category] || 0) + t.amount;
      if (t.status === 'pending') summary.pendingRevenue += t.amount;
    } else {
      summary.totalExpenses += t.amount;
      summary.expensesByCategory[t.category] = (summary.expensesByCategory[t.category] || 0) + t.amount;
      if (t.status === 'pending') summary.pendingExpenses += t.amount;
    }
  }

  summary.balance = summary.totalRevenue - summary.totalExpenses;

  return summary;
}

/**
 * Calcula o lucro líquido de um show específico
 */
export async function getShowProfit(showId: string): Promise<{
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}> {
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('reference_id', showId)
    .neq('status', 'cancelled');

  let revenue = 0;
  let expenses = 0;

  for (const t of transactions || []) {
    if (t.type === 'revenue') {
      revenue += t.amount;
    } else {
      expenses += t.amount;
    }
  }

  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, expenses, profit, profitMargin };
}

/**
 * Calcula o custo total de um release
 */
export async function getReleaseCost(releaseId: string): Promise<{
  totalCost: number;
  costByCategory: Record<string, number>;
}> {
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('reference_id', releaseId)
    .eq('type', 'expense')
    .neq('status', 'cancelled');

  let totalCost = 0;
  const costByCategory: Record<string, number> = {};

  for (const t of transactions || []) {
    totalCost += t.amount;
    costByCategory[t.category] = (costByCategory[t.category] || 0) + t.amount;
  }

  return { totalCost, costByCategory };
}

// ============================================
// UTILITÁRIOS
// ============================================

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
}

export function getCategoryLabel(category: FinanceCategory): string {
  const allCategories = [...FINANCE_CATEGORIES.revenue, ...FINANCE_CATEGORIES.expense];
  const found = allCategories.find(c => c.id === category);
  return found?.label || category;
}

export function getCategoryIcon(category: FinanceCategory): string {
  const allCategories = [...FINANCE_CATEGORIES.revenue, ...FINANCE_CATEGORIES.expense];
  const found = allCategories.find(c => c.id === category);
  return found?.icon || '💰';
}

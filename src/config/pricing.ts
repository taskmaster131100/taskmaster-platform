/**
 * Pricing Plans Configuration
 * All prices in USD
 * Updated: Feb 2026
 */

export interface PricingFeature {
  name: string;
  included: boolean;
  limit?: number | string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceMonthly: number;
  priceSemiannual: number;
  priceSemiannualMonthly: number;
  priceAnnual: number;
  priceAnnualMonthly: number;
  currency: string;
  interval: 'month' | 'semester' | 'year';
  stripePriceId?: string;
  features: PricingFeature[];
  popular?: boolean;
  cta: string;
}

/**
 * Promoção de Lançamento
 * 25% de desconto nos 3 primeiros meses (aplicável ao plano mensal)
 */
export const LAUNCH_PROMO = {
  enabled: true,
  discountPercent: 25,
  durationMonths: 3,
  label: 'Promoção de Lançamento',
  description: '25% de desconto nos 3 primeiros meses!'
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para artistas independentes começando sua carreira',
    price: 49,
    priceMonthly: 49,
    priceSemiannual: 249.90,
    priceSemiannualMonthly: 41.65,
    priceAnnual: 441,
    priceAnnualMonthly: 36.75,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    features: [
      { name: 'Até 3 artistas', included: true, limit: 3 },
      { name: 'Gestão de tarefas', included: true },
      { name: 'Calendário e eventos', included: true },
      { name: 'Relatórios básicos', included: true },
      { name: 'Até 5 KPIs', included: true, limit: 5 },
      { name: 'Armazenamento (5GB)', included: true, limit: '5GB' },
      { name: 'Suporte por email', included: true },
      { name: 'Chat com Marcos Menezes (IA)', included: true },
      { name: 'Diagnóstico de maturidade', included: true },
      { name: 'Assistente de planejamento IA', included: false },
      { name: 'Analytics avançado', included: false },
      { name: 'Branding personalizado', included: false },
      { name: 'Acesso à API', included: false }
    ],
    cta: 'Começar Agora'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para gerenciadores profissionais e pequenas agências',
    price: 79,
    priceMonthly: 79,
    priceSemiannual: 402.90,
    priceSemiannualMonthly: 67.15,
    priceAnnual: 711,
    priceAnnualMonthly: 59.25,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    popular: true,
    features: [
      { name: 'Até 15 artistas', included: true, limit: 15 },
      { name: 'Gestão de tarefas', included: true },
      { name: 'Calendário e eventos', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'KPIs ilimitados', included: true, limit: 'Ilimitado' },
      { name: 'Armazenamento (50GB)', included: true, limit: '50GB' },
      { name: 'Suporte prioritário', included: true },
      { name: 'Chat com Marcos Menezes (IA)', included: true },
      { name: 'Diagnóstico de maturidade', included: true },
      { name: 'Assistente de planejamento IA', included: true },
      { name: 'Analytics avançado', included: true },
      { name: 'Colaboração em equipe', included: true },
      { name: 'Produção musical completa', included: true },
      { name: 'Módulo financeiro completo', included: true },
      { name: 'Branding personalizado', included: false },
      { name: 'Acesso à API', included: false }
    ],
    cta: 'Começar Agora'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Consultoria personalizada com Marcos Menezes + acesso total',
    price: 99,
    priceMonthly: 99,
    priceSemiannual: 504.90,
    priceSemiannualMonthly: 84.15,
    priceAnnual: 891,
    priceAnnualMonthly: 74.25,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '',
    features: [
      { name: 'Artistas ilimitados', included: true, limit: 'Ilimitado' },
      { name: 'Gestão de tarefas', included: true },
      { name: 'Calendário e eventos', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'KPIs ilimitados', included: true, limit: 'Ilimitado' },
      { name: 'Armazenamento (500GB)', included: true, limit: '500GB' },
      { name: 'Suporte 24/7 prioritário', included: true },
      { name: 'Chat com Marcos Menezes (IA)', included: true },
      { name: 'Diagnóstico de maturidade', included: true },
      { name: 'Assistente de planejamento IA', included: true },
      { name: 'Analytics avançado', included: true },
      { name: 'Colaboração em equipe', included: true },
      { name: 'Produção musical completa', included: true },
      { name: 'Módulo financeiro completo', included: true },
      { name: 'Consultoria com Marcos (mensal)', included: true },
      { name: 'Branding personalizado', included: true },
      { name: 'Acesso à API', included: true },
      { name: 'Gerente de conta dedicado', included: true }
    ],
    cta: 'Falar com Marcos'
  }
];

/**
 * Feature limits by plan
 *
 * Mapeamento comercial:
 *   starter      = Plano Inicial
 *   pro          = Plano Base
 *   professional = Plano Pro
 *
 * Regra: -1 = ilimitado | false = feature indisponível no plano
 */
export const PLAN_LIMITS = {
  // ── Plano Inicial ────────────────────────────────────────────────────────────
  starter: {
    // Limites de recursos
    maxArtists: 1,
    maxProjects: 3,
    maxTasks: 30,
    maxShows: 5,
    maxReleases: 1,
    maxKPIs: 5,
    maxStorage: 5 * 1024 * 1024 * 1024, // 5 GB

    // Features de módulo
    hasFinance: false,       // sem financeiro
    hasTeam: false,          // sem equipe
    hasTours: false,         // sem turnês
    hasAI: false,            // sem IA (aguarda backend)
    hasAIAdvanced: false,

    // Legado — mantidos para compatibilidade
    aiPlanning: false,
    advancedAnalytics: false,
    customBranding: false,
    apiAccess: false,
    musicProduction: false,
    financeFull: false,
    consulting: false,

    // Metadados de exibição
    displayName: 'Plano Inicial',
  },

  // ── Plano Base ───────────────────────────────────────────────────────────────
  pro: {
    maxArtists: 5,
    maxProjects: 10,
    maxTasks: 100,
    maxShows: 20,
    maxReleases: 5,
    maxKPIs: -1,
    maxStorage: 50 * 1024 * 1024 * 1024, // 50 GB

    hasFinance: true,
    hasTeam: false,
    hasTours: false,
    hasAI: false,            // ainda aguarda backend
    hasAIAdvanced: false,

    aiPlanning: false,
    advancedAnalytics: true,
    customBranding: false,
    apiAccess: false,
    musicProduction: true,
    financeFull: true,
    consulting: false,

    displayName: 'Plano Base',
  },

  // ── Plano Pro ────────────────────────────────────────────────────────────────
  professional: {
    maxArtists: -1,
    maxProjects: -1,
    maxTasks: -1,
    maxShows: -1,
    maxReleases: -1,
    maxKPIs: -1,
    maxStorage: 500 * 1024 * 1024 * 1024, // 500 GB

    hasFinance: true,
    hasTeam: true,
    hasTours: true,
    hasAI: false,
    hasAIAdvanced: false,

    aiPlanning: true,
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: true,
    musicProduction: true,
    financeFull: true,
    consulting: true,

    displayName: 'Plano Pro',
  },

  // Aliases dos plan_ids reais do banco (enterprise / plan_enterprise → ilimitado)
  enterprise: {
    maxArtists: -1, maxProjects: -1, maxTasks: -1, maxShows: -1,
    maxReleases: -1, maxKPIs: -1, maxStorage: 500 * 1024 * 1024 * 1024,
    hasFinance: true, hasTeam: true, hasTours: true, hasAI: false, hasAIAdvanced: false,
    aiPlanning: true, advancedAnalytics: true, customBranding: true, apiAccess: true,
    musicProduction: true, financeFull: true, consulting: true,
    displayName: 'Admin',
  },
  plan_enterprise: {
    maxArtists: -1, maxProjects: -1, maxTasks: -1, maxShows: -1,
    maxReleases: -1, maxKPIs: -1, maxStorage: 500 * 1024 * 1024 * 1024,
    hasFinance: true, hasTeam: true, hasTours: true, hasAI: false, hasAIAdvanced: false,
    aiPlanning: true, advancedAnalytics: true, customBranding: true, apiAccess: true,
    musicProduction: true, financeFull: true, consulting: true,
    displayName: 'Admin',
  },
};

/**
 * Free trial configuration
 */
export const FREE_TRIAL = {
  enabled: true,
  durationDays: 14,
  plan: 'pro'
};

/**
 * Billing intervals with discounts
 */
export const BILLING_INTERVALS = [
  { id: 'month', label: 'Mensal', discount: 0 },
  { id: 'semester', label: 'Semestral', discount: 15, badge: '-15%' },
  { id: 'year', label: 'Anual', discount: 25, badge: '-25%' }
];

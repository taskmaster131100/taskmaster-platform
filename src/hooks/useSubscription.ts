import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_LIMITS, FREE_TRIAL } from '../config/pricing';

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: 'starter' | 'pro' | 'enterprise';
  status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
}

export interface SubscriptionLimits {
  maxArtists: number;
  maxKPIs: number;
  maxStorage: number;
  aiPlanning: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  limits: SubscriptionLimits;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  daysLeftInTrial: number;
  loading: boolean;
  error: Error | null;
}

export function useSubscription(organizationId?: string): SubscriptionStatus {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [organizationId]);

  async function loadSubscription() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setSubscription(data);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate subscription status
  const now = new Date();
  const isTrialing = subscription?.status === 'trialing' && 
    subscription.trial_end ? new Date(subscription.trial_end) > now : false;
  
  const isActive = subscription?.status === 'active' ||
    (isTrialing && subscription.trial_end ? new Date(subscription.trial_end) > now : false);

  const isPastDue = subscription?.status === 'past_due';

  const daysLeftInTrial = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Get plan limits
  const planId = subscription?.plan_id || 'starter';
  const limits: SubscriptionLimits = PLAN_LIMITS[planId] || PLAN_LIMITS.starter;

  return {
    subscription,
    limits,
    isActive,
    isTrialing,
    isPastDue,
    daysLeftInTrial,
    loading,
    error
  };
}

/**
 * Hook to check if a feature is available in the current plan
 */
export function useFeatureAccess(organizationId?: string) {
  const { limits, isActive, loading } = useSubscription(organizationId);

  const hasFeature = (feature: keyof SubscriptionLimits): boolean => {
    if (!isActive) return false;
    
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    
    return false;
  };

  const canAddArtist = async (): Promise<boolean> => {
    if (!organizationId || !isActive) return false;
    if (limits.maxArtists === -1) return true; // Unlimited

    const { count } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return (count || 0) < limits.maxArtists;
  };

  const canAddKPI = async (): Promise<boolean> => {
    if (!organizationId || !isActive) return false;
    if (limits.maxKPIs === -1) return true; // Unlimited

    const { count } = await supabase
      .from('kpis')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return (count || 0) < limits.maxKPIs;
  };

  const canUploadFile = async (fileSize: number): Promise<boolean> => {
    if (!organizationId || !isActive) return false;

    // Get current storage usage
    const { data: files } = await supabase
      .from('file_library')
      .select('file_size')
      .eq('organization_id', organizationId);

    const currentUsage = files?.reduce((sum, file) => sum + file.file_size, 0) || 0;
    
    return (currentUsage + fileSize) <= limits.maxStorage;
  };

  return {
    hasFeature,
    canAddArtist,
    canAddKPI,
    canUploadFile,
    limits,
    loading
  };
}

/**
 * Hook to get usage statistics
 */
export function useUsageStats(organizationId?: string) {
  const [stats, setStats] = useState({
    artistsCount: 0,
    kpisCount: 0,
    storageUsed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    loadStats();
  }, [organizationId]);

  async function loadStats() {
    try {
      setLoading(true);

      // Get artists count
      const { count: artistsCount } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get KPIs count
      const { count: kpisCount } = await supabase
        .from('kpis')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get storage usage
      const { data: files } = await supabase
        .from('file_library')
        .select('file_size')
        .eq('organization_id', organizationId);

      const storageUsed = files?.reduce((sum, file) => sum + file.file_size, 0) || 0;

      setStats({
        artistsCount: artistsCount || 0,
        kpisCount: kpisCount || 0,
        storageUsed
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return { stats, loading, refresh: loadStats };
}

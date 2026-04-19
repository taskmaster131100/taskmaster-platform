import posthog from 'posthog-js';
import { supabase } from './supabase';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Session ID simples para mapear jornadas dentro de uma sessão
let _sessionId: string | null = null;
function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = sessionStorage.getItem('tm_session_id');
    if (!_sessionId) {
      _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('tm_session_id', _sessionId);
    }
  }
  return _sessionId;
}

export function initAnalytics() {
  if (!POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) posthog.identify(userId, properties);
}

/**
 * Registra evento no PostHog (se configurado) E na tabela analytics_events do Supabase.
 * Fire-and-forget: nunca bloqueia o fluxo da UI.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  // 1. PostHog (se key configurada)
  if (POSTHOG_KEY) posthog.capture(event, properties);

  // 2. Supabase — fire and forget
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return; // sem auth, não registra
    supabase
      .from('analytics_events')
      .insert({
        user_id: session.user.id,
        event_name: event,
        properties: properties || {},
        session_id: getSessionId(),
      })
      .then(({ error }) => {
        if (error) console.warn('[analytics] insert falhou:', error.message, '| event:', event);
      });
  }).catch((err) => { console.warn('[analytics] getSession falhou:', err); });
}

export function resetAnalytics() {
  if (POSTHOG_KEY) posthog.reset();
  _sessionId = null;
  sessionStorage.removeItem('tm_session_id');
}

export default posthog;

import { useEffect, useRef, useCallback } from 'react';
import { checkMentorNotifications, generateContextualSupport } from '../services/mentorLiveService';

/**
 * Hook para manter o Marcos Menezes "vivo" na plataforma
 * Monitora atividades do usuário e oferece suporte proativo
 */
export function useMentorLive(userId: string | null) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Rastrear atividade do usuário
  const trackActivity = useCallback(() => {
    lastActivityRef.current = new Date();
  }, []);

  // Verificar notificações periodicamente
  const checkNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      await checkMentorNotifications(userId);
    } catch (error) {
      console.error('Erro ao verificar notificações do mentor:', error);
    }
  }, [userId]);

  // Setup de listeners de atividade
  useEffect(() => {
    if (!userId) return;

    // Eventos que indicam atividade do usuário
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      window.addEventListener(event, trackActivity);
    });

    // Verificar notificações a cada 5 minutos
    checkIntervalRef.current = setInterval(checkNotifications, 5 * 60 * 1000);

    // Verificação inicial
    checkNotifications();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [userId, trackActivity, checkNotifications]);

  // Retornar funções úteis
  return {
    lastActivity: lastActivityRef.current,
    trackActivity,
    checkNotifications
  };
}

/**
 * Hook para suporte contextual baseado no módulo atual
 */
export function useMentorContextualSupport(currentModule: string, userAction: string) {
  return generateContextualSupport(currentModule, userAction);
}

/**
 * Hook para gerenciar o estado de notificações do mentor
 */
export function useMentorNotifications(userId: string | null) {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('mentor_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadNotifications();

    // Recarregar a cada 2 minutos
    const interval = setInterval(loadNotifications, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const dismissNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('mentor_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao descartar notificação:', error);
    }
  };

  return {
    notifications,
    loading,
    dismissNotification,
    reload: loadNotifications
  };
}

// Importar React e supabase
import React from 'react';
import { supabase } from '../lib/supabase';

import { supabase } from '../../lib/supabase';

export interface MusicNotification {
  type: 'arrangement_uploaded' | 'setlist_updated' | 'setlist_locked' | 'rehearsal_reminder';
  title: string;
  message: string;
  recipients: string[];
  metadata?: Record<string, any>;
}

class MusicNotificationService {
  async sendNotification(notification: MusicNotification): Promise<void> {
    console.log('📧 Notification:', notification.title);
    console.log('Recipients:', notification.recipients.length);
    console.log('Message:', notification.message);
  }

  async notifyArrangementUploaded(
    songTitle: string,
    arrangementTitle: string,
    recipients: string[]
  ): Promise<void> {
    await this.sendNotification({
      type: 'arrangement_uploaded',
      title: 'Novo arranjo disponível',
      message: `O arranjo "${arrangementTitle}" da música "${songTitle}" está disponível para aprovação.`,
      recipients,
      metadata: { songTitle, arrangementTitle }
    });
  }

  async notifySetlistUpdated(
    setlistTitle: string,
    showDate: string,
    recipients: string[]
  ): Promise<void> {
    await this.sendNotification({
      type: 'setlist_updated',
      title: 'Setlist atualizado',
      message: `O setlist "${setlistTitle}" para o show de ${new Date(showDate).toLocaleDateString('pt-BR')} foi atualizado.`,
      recipients,
      metadata: { setlistTitle, showDate }
    });
  }

  async notifySetlistLocked(
    setlistTitle: string,
    showDate: string,
    recipients: string[]
  ): Promise<void> {
    await this.sendNotification({
      type: 'setlist_locked',
      title: 'Setlist travado (D-1)',
      message: `O setlist "${setlistTitle}" foi travado para o show de ${new Date(showDate).toLocaleDateString('pt-BR')}. Baixe o conteúdo para uso offline.`,
      recipients,
      metadata: { setlistTitle, showDate }
    });
  }

  async notifyRehearsalReminder(
    rehearsalTitle: string,
    dateTime: string,
    location: string,
    recipients: string[]
  ): Promise<void> {
    await this.sendNotification({
      type: 'rehearsal_reminder',
      title: 'Lembrete de ensaio',
      message: `Ensaio "${rehearsalTitle}" amanhã às ${new Date(dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} em ${location}.`,
      recipients,
      metadata: { rehearsalTitle, dateTime, location }
    });
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
    console.log(`📱 WhatsApp to ${phoneNumber}:`, message);
  }

  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    console.log(`📧 Email to ${to.length} recipients:`, subject);
  }
}

export const musicNotificationService = new MusicNotificationService();

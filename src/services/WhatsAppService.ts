
export const WhatsAppService = {
  /**
   * Gera um link do WhatsApp para enviar uma mensagem formatada
   * @param phone Número de telefone (com DDI e DDD)
   * @param message Mensagem a ser enviada
   */
  generateLink: (phone: string, message: string) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  },

  /**
   * Formata uma mensagem de nova tarefa
   */
  formatTaskMessage: (taskTitle: string, dueDate: string, artistName: string) => {
    return `*Nova Tarefa no TaskMaster* 🚀\n\n` +
           `📌 *Tarefa:* ${taskTitle}\n` +
           `👤 *Artista:* ${artistName}\n` +
           `📅 *Prazo:* ${dueDate}\n\n` +
           `Acesse a plataforma para mais detalhes: https://taskmaster.works`;
  },

  /**
   * Formata uma mensagem de resumo de show
   */
  formatShowMessage: (showTitle: string, date: string, venue: string, fee: string) => {
    return `*Confirmação de Show - TaskMaster* 🎤\n\n` +
           `📅 *Data:* ${date}\n` +
           `📍 *Local:* ${venue}\n` +
           `💰 *Cachê:* ${fee}\n\n` +
           `O contrato e o rider já estão disponíveis na plataforma: https://taskmaster.works`;
  },

  /**
   * Abre o WhatsApp em uma nova aba
   */
  send: (phone: string, message: string) => {
    const link = WhatsAppService.generateLink(phone, message);
    window.open(link, '_blank');
  }
};

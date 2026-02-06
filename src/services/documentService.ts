import { Show } from './showService';

export interface ContractData {
  show: Show;
  contractor: {
    name: string;
    document: string;
    address: string;
    representative: string;
  };
  clauses: string[];
}

export const DEFAULT_CLAUSES = [
  "O CONTRATADO compromete-se a realizar a apresentação musical conforme data, horário e local especificados.",
  "O CONTRATANTE pagará o valor total acordado, sendo 50% no ato da assinatura e 50% até 24 horas antes do evento.",
  "O CONTRATANTE é responsável por toda a infraestrutura de som, luz e palco, conforme rider técnico enviado.",
  "Em caso de cancelamento por parte do CONTRATANTE, o valor da entrada não será devolvido.",
  "Fica eleito o foro da comarca do artista para dirimir quaisquer dúvidas oriundas deste contrato."
];

export class DocumentService {
  static async generateShowContract(data: ContractData): Promise<void> {
    const { show, contractor, clauses } = data;
    
    // Cálculo de Split para o contrato (se houver)
    const artistValue = show.value && show.artist_split 
      ? (show.value * (show.artist_split / 100)).toLocaleString('pt-BR')
      : show.value?.toLocaleString('pt-BR');

    const content = `
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS
      
      CONTRATANTE: ${contractor.name}
      CNPJ/CPF: ${contractor.document}
      ENDEREÇO: ${contractor.address}
      REPRESENTANTE: ${contractor.representative}
      
      CONTRATADO: ${show.artist_name}
      
      1. OBJETO
      Apresentação musical do artista ${show.artist_name} no evento "${show.title}".
      DATA: ${show.show_date}
      HORÁRIO: ${show.show_time || 'A definir'}
      LOCAL: ${show.venue || show.city}
      
      2. VALORES E PAGAMENTO
      O valor total deste contrato é de ${show.currency} ${show.value?.toLocaleString('pt-BR')}.
      O pagamento deverá ser realizado via transferência bancária/PIX conforme os prazos:
      - 50% (Entrada): ${show.currency} ${(show.value ? show.value * 0.5 : 0).toLocaleString('pt-BR')} na assinatura.
      - 50% (Saldo): ${show.currency} ${(show.value ? show.value * 0.5 : 0).toLocaleString('pt-BR')} até 24h antes do show.
      
      3. OBRIGAÇÕES DO CONTRATANTE
      - Fornecer infraestrutura de som, luz e palco conforme Rider Técnico.
      - Garantir a segurança do artista e equipe no local do evento.
      - Providenciar camarim com alimentação e bebidas conforme Rider de Camarim.
      
      4. CLÁUSULAS ADICIONAIS:
      ${clauses.map((c, i) => `${i + 1}. ${c}`).join('\n')}
      
      Este documento serve como compromisso formal entre as partes.
      
      Data do documento: ${new Date().toLocaleDateString('pt-BR')}
      
      _________________________________          _________________________________
      CONTRATANTE: ${contractor.name}            CONTRATADO: ${show.artist_name}
    `;

    // Simulação de download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${show.artist_name}_${show.show_date}.txt`;
    // a.click(); // Comentado para não disparar no sandbox sem UI
  }

  static async generateTechnicalRider(show: Show, riderData: any): Promise<void> {
    const { inputList, lightingNeeds } = riderData;
    
    const content = `
      RIDER TÉCNICO - ${show.artist_name.toUpperCase()}
      Evento: ${show.title}
      Data: ${show.show_date}
      
      1. INPUT LIST (ÁUDIO)
      ------------------------------------------------------------------
      CH | INSTRUMENTO      | MIC/LINE        | INSERT     | PEDESTAL
      ------------------------------------------------------------------
      ${inputList.map((item: any) => 
        `${item.channel.padEnd(3)}| ${item.instrument.padEnd(16)}| ${item.mic_line.padEnd(16)}| ${item.insert.padEnd(11)}| ${item.stand}`
      ).join('\n')}
      ------------------------------------------------------------------
      
      2. ILUMINAÇÃO
      - Moving Heads: ${lightingNeeds.moving_heads} unidades (mínimo)
      - PAR LEDs: ${lightingNeeds.par_leds} unidades (mínimo)
      - Máquina de Fumaça: ${lightingNeeds.smoke_machine ? 'Sim' : 'Não'}
      
      OBSERVAÇÕES DE LUZ:
      ${lightingNeeds.notes || 'Nenhuma observação adicional.'}
      
      3. MAPA DE PALCO
      O mapa de palco detalhado deve seguir as posições dos instrumentos conforme Input List.
      Qualquer alteração deve ser comunicada com 72h de antecedência.
      
      CONTATO TÉCNICO:
      Responsável: Equipe Técnica ${show.artist_name}
      Telefone: (00) 00000-0000
      
      Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rider_Tecnico_${show.artist_name}_${show.show_date}.txt`;
    // a.click();
  }
}

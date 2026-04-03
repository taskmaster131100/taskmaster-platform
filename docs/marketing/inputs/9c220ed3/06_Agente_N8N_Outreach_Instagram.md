# TaskMaster — Estrutura do Agente N8N para Outreach no Instagram

**Documento Técnico | Fevereiro 2026**
**Elaborado por: Manus AI para Marcos Menezes**

---

## 1. Objetivo

Automatizar o processo de outreach diário no Instagram para identificar artistas independentes, interagir organicamente e direcioná-los para o WhatsApp, onde o funil de vendas self-serve converte em assinatura. O agente deve respeitar os Termos de Serviço do Instagram e a LGPD.

---

## 2. Visão Geral do Fluxo

```
[Trigger: Cron diário 9h]
    ↓
[Buscar perfis-alvo no Instagram]
    ↓
[Filtrar e qualificar perfis]
    ↓
[Gerar mensagem personalizada (IA)]
    ↓
[Registar no CRM/Planilha]
    ↓
[Enviar DM ou comentário]
    ↓
[Follow-up automático (24-48h)]
    ↓
[Direcionar para WhatsApp]
```

---

## 3. Estrutura Detalhada dos Nós N8N

### 3.1 Nó 1 — Trigger (Cron Schedule)

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Cron |
| **Frequência** | Diário, 9h (horário local do mercado) |
| **Dias** | Segunda a Sexta |

### 3.2 Nó 2 — Buscar Perfis-Alvo

**Opção A — Via API do Instagram (Graph API)**

| Configuração | Valor |
|-------------|-------|
| **Tipo** | HTTP Request |
| **Endpoint** | Instagram Graph API — Business Discovery |
| **Método** | Buscar seguidores de contas concorrentes ou hashtags |
| **Hashtags-alvo** | #artistaindependente, #musicaindependente, #produtormusical, #lancamento, #showtime |
| **Contas concorrentes** | Perfis de TuneCore, DistroKid, CD Baby, estúdios locais |
| **Limite diário** | 50-100 perfis |

**Opção B — Via Planilha Manual (mais seguro para ToS)**

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Google Sheets / Airtable |
| **Fonte** | Lista curada manualmente de perfis identificados |
| **Atualização** | Equipa adiciona 50-100 perfis/dia |

> **Recomendação:** Começar com Opção B (planilha manual) para respeitar ToS do Instagram. Migrar para Opção A quando tiver conta Business verificada e aprovação da API.

### 3.3 Nó 3 — Filtrar e Qualificar Perfis

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Code (JavaScript) |
| **Critérios de qualificação** | Ver tabela abaixo |

**Critérios de Qualificação:**

| Critério | Valor Mínimo | Valor Ideal |
|----------|-------------|-------------|
| **Seguidores** | 500 | 1.000-50.000 |
| **Posts nos últimos 30 dias** | 2 | 5+ |
| **Bio contém** | "músico", "artista", "produtor", "cantor", "banda" | + link de Spotify/YouTube |
| **Conta Business/Creator** | Preferível | Sim |
| **Já contactado?** | Não | — |
| **Idioma** | Mercado-alvo | — |

### 3.4 Nó 4 — Gerar Mensagem Personalizada (IA)

| Configuração | Valor |
|-------------|-------|
| **Tipo** | OpenAI (GPT-4o) |
| **Input** | Nome, bio, género musical, número de seguidores, últimos posts |
| **Output** | Mensagem personalizada de DM (máx. 300 caracteres) |

**System Prompt:**

```
Você é o Marcos Menezes, produtor e manager musical com mais de 20 anos de experiência. 
Escreva uma DM curta e direta para um artista independente no Instagram.

Regras:
- Tom: animado, extrovertido, "papo reto" do mercado musical
- NÃO parecer spam ou vendedor
- Mencionar algo específico do perfil da pessoa (género, último post, bio)
- Gerar curiosidade sobre a plataforma TaskMaster
- Terminar com convite para conversar no WhatsApp
- Máximo 300 caracteres
- Idioma: {idioma_do_mercado}

Exemplo de tom:
"Fala, [nome]! Vi que você tá lançando [género]. Cara, tenho uma ferramenta que tá ajudando artistas como você a organizar a carreira toda num lugar só. Bora trocar uma ideia? Te mando no WhatsApp 🤙"
```

### 3.5 Nó 5 — Registar no CRM/Planilha

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Google Sheets / Airtable / Supabase |
| **Campos** | Ver tabela abaixo |

**Campos do CRM:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **instagram_handle** | Texto | @username |
| **nome** | Texto | Nome do perfil |
| **seguidores** | Número | Contagem de seguidores |
| **genero_musical** | Texto | Género identificado |
| **mercado** | Texto | BR, US, MX, RD, AR, CA |
| **status** | Enum | prospectado, contactado, respondeu, qualificado, cadastrado, assinante |
| **data_primeiro_contato** | Data | Quando foi contactado |
| **data_ultimo_contato** | Data | Último follow-up |
| **mensagem_enviada** | Texto | DM enviada |
| **resposta** | Texto | Resposta recebida |
| **objecao** | Texto | Objeção identificada |
| **whatsapp** | Texto | Número do WhatsApp (se fornecido) |

### 3.6 Nó 6 — Enviar DM ou Comentário

**Opção A — DM via Instagram API**

| Configuração | Valor |
|-------------|-------|
| **Tipo** | HTTP Request |
| **Endpoint** | Instagram Messaging API |
| **Limite** | 20-30 DMs/dia (respeitar rate limits) |
| **Delay entre mensagens** | 2-5 minutos (aleatório) |

**Opção B — Notificação para Envio Manual**

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Slack / Telegram / E-mail |
| **Conteúdo** | Perfil + mensagem gerada pela IA |
| **Ação** | Equipa envia manualmente a DM |

> **Recomendação:** Começar com Opção B (envio manual assistido pela IA). A IA gera a mensagem, a equipa copia e envia. Isso garante 100% de compliance com ToS do Instagram.

### 3.7 Nó 7 — Follow-Up Automático (24-48h)

| Configuração | Valor |
|-------------|-------|
| **Tipo** | IF + Wait + HTTP Request |
| **Condição** | Se status = "contactado" E data_ultimo_contato > 24h E resposta = vazio |
| **Ação** | Gerar mensagem de follow-up (IA) + notificar equipa |
| **Limite** | Máximo 2 follow-ups por perfil |

**System Prompt do Follow-Up:**

```
O artista [nome] não respondeu à primeira DM há [X] horas.
Gere uma mensagem de follow-up curta e natural, sem parecer insistente.
Mencione algo novo (ex: uma funcionalidade da plataforma, um caso de sucesso).
Máximo 200 caracteres.
```

### 3.8 Nó 8 — Direcionar para WhatsApp

| Configuração | Valor |
|-------------|-------|
| **Tipo** | Condicional |
| **Condição** | Se o artista respondeu positivamente |
| **Ação** | Enviar link do WhatsApp com mensagem pré-pronta |

**Link do WhatsApp:**

```
https://wa.me/5511XXXXXXXXX?text=Oi%20Marcos!%20Vi%20o%20TaskMaster%20no%20Instagram%20e%20quero%20saber%20mais%20sobre%20a%20plataforma.
```

---

## 4. Workflow Completo no N8N (JSON)

```json
{
  "name": "TaskMaster - Instagram Outreach Agent",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 9, "minute": 0 }]
        }
      }
    },
    {
      "name": "Buscar Perfis (Google Sheets)",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "SEU_SHEET_ID",
        "range": "Prospects!A:L",
        "filters": { "status": "novo" }
      }
    },
    {
      "name": "Filtrar Qualificados",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return items.filter(item => item.json.seguidores >= 500 && item.json.seguidores <= 50000 && item.json.ja_contactado !== 'sim');"
      }
    },
    {
      "name": "Gerar Mensagem (OpenAI)",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "model": "gpt-4o",
        "messages": [
          { "role": "system", "content": "Você é o Marcos Menezes..." },
          { "role": "user", "content": "Perfil: {{$json.nome}}, @{{$json.instagram}}, {{$json.seguidores}} seguidores, género: {{$json.genero}}, bio: {{$json.bio}}" }
        ],
        "maxTokens": 150
      }
    },
    {
      "name": "Registar no CRM",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "update",
        "sheetId": "SEU_SHEET_ID",
        "range": "CRM!A:L",
        "data": {
          "status": "contactado",
          "mensagem_enviada": "{{$json.message}}",
          "data_primeiro_contato": "{{$now.toISO()}}"
        }
      }
    },
    {
      "name": "Notificar Equipa (Telegram)",
      "type": "n8n-nodes-base.telegram",
      "parameters": {
        "chatId": "SEU_CHAT_ID",
        "text": "📩 Nova DM para enviar:\n\nPerfil: @{{$json.instagram}}\nNome: {{$json.nome}}\nSeguidores: {{$json.seguidores}}\n\nMensagem:\n{{$json.mensagem_gerada}}\n\n👉 Copie e envie no Instagram"
      }
    },
    {
      "name": "Wait 24h",
      "type": "n8n-nodes-base.wait",
      "parameters": { "amount": 24, "unit": "hours" }
    },
    {
      "name": "Verificar Resposta",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": { "string": [{ "value1": "={{$json.resposta}}", "operation": "isEmpty" }] }
      }
    },
    {
      "name": "Gerar Follow-Up (OpenAI)",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "model": "gpt-4o",
        "messages": [
          { "role": "system", "content": "Gere um follow-up natural e curto..." },
          { "role": "user", "content": "Artista: {{$json.nome}}, primeira DM: {{$json.mensagem_enviada}}" }
        ]
      }
    }
  ]
}
```

---

## 5. Métricas do Agente

| Métrica | Meta Diária | Meta Semanal |
|---------|------------|-------------|
| **Perfis identificados** | 50-100 | 350-700 |
| **DMs enviadas** | 30-50 | 210-350 |
| **Taxa de resposta** | >15% | — |
| **Leads qualificados** | 5-10 | 35-70 |
| **Direcionados ao WhatsApp** | 3-5 | 21-35 |

---

## 6. Configuração Necessária

### 6.1 Contas e APIs

| Serviço | O que precisa | Como obter |
|---------|--------------|-----------|
| **N8N** | Instância self-hosted ou cloud | n8n.io |
| **Instagram Business** | Conta Business verificada | Converter perfil pessoal |
| **Meta Graph API** | App ID + Token | developers.facebook.com |
| **OpenAI** | API Key | platform.openai.com |
| **Google Sheets** | Conta Google + OAuth | console.cloud.google.com |
| **Telegram** | Bot Token + Chat ID | @BotFather no Telegram |
| **WhatsApp Business** | Número dedicado | business.whatsapp.com |

### 6.2 Custos Estimados do Agente

| Item | Custo/Mês |
|------|----------|
| **N8N Cloud** | US$ 20-50 |
| **OpenAI (GPT-4o)** | US$ 30-60 (1.500-3.000 mensagens/mês) |
| **Google Workspace** | US$ 6 |
| **Telegram Bot** | Gratuito |
| **TOTAL** | **US$ 56-116/mês** |

---

## 7. Compliance e Boas Práticas

### 7.1 Instagram ToS

- **NÃO usar bots** de automação de DMs (risco de ban)
- **NÃO fazer scraping** de perfis (risco de ban + LGPD)
- **SIM:** usar a API oficial (Graph API) com conta Business verificada
- **SIM:** envio manual assistido por IA (a IA gera, humano envia)
- **Respeitar rate limits:** máximo 30-50 DMs/dia
- **Delay entre ações:** 2-5 minutos (parecer humano)

### 7.2 LGPD/GDPR

- Só contactar perfis públicos
- Incluir opção de opt-out em toda comunicação
- Não armazenar dados pessoais sem consentimento
- Registar base legal: legítimo interesse (B2B)

---

## 8. Evolução do Agente

| Fase | Timing | Capacidade |
|------|--------|-----------|
| **v1 — Manual Assistido** | Agora | IA gera mensagem, equipa envia manualmente |
| **v2 — Semi-Automático** | Mês 2 | API do Instagram para envio, equipa aprova |
| **v3 — Automático** | Mês 4+ | Envio automático com aprovação por exceção |

---

## 9. Próximos Passos

1. Configurar instância N8N (cloud ou self-hosted)
2. Criar Google Sheet com template do CRM
3. Configurar bot do Telegram para notificações
4. Criar conta Business no Instagram (se ainda não tem)
5. Gerar API Key da OpenAI
6. Importar o workflow JSON no N8N
7. Testar com 10 perfis manualmente
8. Escalar para 50-100/dia após validação

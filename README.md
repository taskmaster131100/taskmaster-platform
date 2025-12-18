# TaskMaster - Plataforma de Gestão Musical

## 🚀 Deploy no Vercel

O TaskMaster está configurado para deploy automático no Vercel:

```bash
# Deploy de produção
npm run deploy

# Deploy de preview
npm run deploy:preview
```

### Configuração Automática:
- ✅ Build otimizado para produção
- ✅ Headers de segurança configurados
- ✅ Cache otimizado
- ✅ Redirects para SPA
- ✅ Variáveis de ambiente

## 🎵 Marcos Menezes + ChatGPT Integration

O Planning Copilot agora conta com a expertise do **Marcos Menezes** (10+ anos na indústria) + **ChatGPT** para planejamento profissional!

### 👨‍💼 Sobre Marcos Menezes:
- ✅ **10+ anos** de experiência em gestão musical
- ✅ **40+ artistas** gerenciados em grandes gravadoras
- ✅ **Atuação internacional** (Brasil e Estados Unidos)
- ✅ **Metodologia dos 4 Pilares** comprovada
- ✅ **Templates profissionais** (D-30, D-45, D-90)

### Como Configurar ChatGPT:

1. **Obtenha sua API Key:**
   - Acesse [platform.openai.com](https://platform.openai.com/api-keys)
   - Crie uma nova API key
   - Copie a chave (começa com `sk-proj-...`)

2. **Configure no arquivo .env:**
   ```
   VITE_OPENAI_API_KEY=sk-proj-sua-chave-aqui
   ```

3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

### 🎯 Com ChatGPT Ativado:
- ✅ **Expertise Profissional** - Conhecimento de 10+ anos aplicado
- ✅ **Templates da Indústria** - D-30, D-45, D-90 comprovados
- ✅ **Orçamentos Reais** - Baseados em projetos da indústria
- ✅ **4 Pilares Metodologia** - Conteúdo, Shows, Logística, Estratégia
- ✅ **Análise de Riscos** - Identificação profissional de problemas
- ✅ **Caminho Crítico** - Tarefas prioritárias mapeadas
- ✅ **Cronogramas Otimizados** - Baseados em experiência real

### 🏠 Sem ChatGPT:
- ✅ **Modo Local** - Respostas básicas pré-programadas
- ✅ **Zero Tokens** - Sem consumo de API
- ✅ **Funcional** - Todas as funcionalidades básicas

### 🎯 Exemplos do que Marcos + IA podem fazer:

**Digite no Planning Copilot:**
- *"Crie um plano completo para lançar meu single"*
- *"Como organizar uma turnê de 10 cidades?"*
- *"Qual o melhor cronograma para um DVD?"*
- *"Análise de risco do meu projeto"*
- *"Orçamento profissional para álbum"*

**A IA criará automaticamente:**
- ✅ Projeto estruturado com metodologia profissional
- ✅ Fases organizadas pelos 4 pilares
- ✅ Tarefas com dependências e SLAs
- ✅ Orçamento baseado em projetos reais
- ✅ Cronograma otimizado da indústria
- ✅ Análise de riscos profissional
- ✅ Caminho crítico identificado

## 🏠 Sistema Otimizado

O TaskMaster agora roda em **modo local otimizado** para:

- ✅ **Economizar tokens** - Sem chamadas desnecessárias para APIs externas
- ✅ **Evitar problemas de migração** - Sem dependências de banco externo
- ✅ **Funcionamento offline** - Dados seguros no navegador
- ✅ **Performance melhorada** - Sem latência de rede

## 🚀 Como Usar

1. **Login Local**: Use as credenciais de demonstração
   - Email: `usuario@exemplo.com`
   - Senha: `senha123`

2. **Planning Copilot**: 
   - 🤖 **Com ChatGPT**: IA avançada para criar projetos completos
   - 🏠 **Sem ChatGPT**: Respostas básicas funcionais

3. **Dados de Exemplo**: O sistema já vem com dados pré-configurados

4. **Sem Configuração**: Não precisa configurar Supabase ou migrações

## 📊 Funcionalidades Disponíveis

- Gestão de Artistas
- Projetos Musicais
- Tarefas e Cronogramas
- Comunicação (WhatsApp simulado)
- Relatórios e Análises
- Calendário de Eventos

## 🔧 Benefícios do Modo Local

- **Sem consumo de tokens** da API
- **Sem problemas de migração** de banco
- **Dados persistentes** no navegador
- **Funcionamento offline**
- **Performance otimizada**

## 💡 Dica

Para uma experiência completa, use o sistema em modo local. Todos os dados ficam salvos no navegador e você pode trabalhar offline sem problemas.

## 🌐 Deploy no Vercel

Para fazer deploy da aplicação:

1. **Conectar ao Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Configurar variáveis de ambiente no Vercel Dashboard:**
   - VITE_OPENAI_API_KEY (opcional)
   - VITE_SUPABASE_URL (opcional)
   - VITE_SUPABASE_ANON_KEY (opcional)

A aplicação está otimizada para funcionar perfeitamente no Vercel com todas as configurações necessárias.
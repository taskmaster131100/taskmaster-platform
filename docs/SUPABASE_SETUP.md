# Configuração do Supabase para TaskMaster

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta com o email oficial: `admin@taskmaster.works`
3. Clique em "New Project"
4. Configure:
   - **Name**: TaskMaster Production
   - **Database Password**: [Crie uma senha forte]
   - **Region**: South America (São Paulo) - para melhor performance no Brasil
   - **Pricing Plan**: Pro (recomendado para produção)

## 2. Configurar Variáveis de Ambiente

Após criar o projeto, vá em **Settings > API** e copie:

```bash
# Cole no arquivo .env
VITE_SUPABASE_URL=https://[seu-projeto-id].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-anon-key]
```

## 3. Configurar Autenticação

1. Vá em **Authentication > Settings**
2. Configure:
   - **Site URL**: `https://taskmaster.works` (ou seu domínio)
   - **Redirect URLs**: 
     - `https://taskmaster.works/**`
     - `http://localhost:3000/**` (para desenvolvimento)

### Configurar Google OAuth (Opcional)

1. Vá em **Authentication > Providers**
2. Habilite "Google"
3. Configure com suas credenciais do Google Cloud Console

## 4. Configurar Políticas RLS

As migrações já incluem as políticas de Row Level Security necessárias.
Certifique-se de que RLS está habilitado em todas as tabelas.

## 5. Configurar Storage (Opcional)

Para upload de arquivos:
1. Vá em **Storage**
2. Crie buckets para:
   - `avatars` (fotos de perfil)
   - `project-files` (arquivos de projetos)
   - `sheet-music` (partituras)

## 6. Configurar Edge Functions (Opcional)

Para funcionalidades avançadas como integração WhatsApp:
1. Vá em **Edge Functions**
2. Deploy das funções necessárias

## 7. Monitoramento

Configure alertas em **Settings > Alerts** para:
- Uso de CPU alto
- Muitas conexões simultâneas
- Erros de autenticação

## 8. Backup

Configure backup automático em **Settings > Database**:
- **Backup Schedule**: Diário
- **Retention**: 30 dias

## Custos Estimados (Plano Pro)

- **Base**: $25/mês
- **Database**: ~$0.125 por GB/mês
- **Auth**: Gratuito até 100k MAUs
- **Storage**: $0.021 por GB/mês
- **Edge Functions**: $2 por 1M invocações

**Estimativa total para TaskMaster**: $30-50/mês dependendo do uso.

## Próximos Passos

1. Criar conta e projeto no Supabase
2. Atualizar arquivo `.env` com as novas credenciais
3. Testar conexão
4. Migrar dados existentes (se necessário)
5. Configurar domínio personalizado
6. Configurar monitoramento e alertas
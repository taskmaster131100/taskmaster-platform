# Scripts de Seed - TaskMaster

Este diretório contém scripts SQL para popular a plataforma TaskMaster com dados de teste.

## Scripts Disponíveis

### 1. seed_fictional_artist.sql
Cria um perfil completo de artista fictício chamado **Luna** com:
- Perfil do artista (Pop Eletrônico)
- Projeto de lançamento de single "Estrela Cadente" (8 semanas)
- 10 tarefas detalhadas do projeto
- 2 shows/eventos agendados
- 1 contrato de gravação
- Dados financeiros (receitas e despesas)
- 3 KPIs com metas
- Histórico de atividades

**Ideal para:** Testar todas as funcionalidades da plataforma de forma geral.

### 2. seed_rennan_fiore.sql
Importa o projeto real do artista **Rennan Fiore** com:
- Perfil do artista (Samba e Pagode Moderno)
- Projeto principal "Estratégia de Lançamento 2025-2026"
- 3 fases do projeto:
  - Fase 1: Explosão de Conteúdo (Jan-Abr 2026)
  - Fase 2: Segundo Ciclo (Mai-Jun 2026)
  - Fase 3: Audiovisual Oficial (Jul-Dez 2026)
- 30+ tarefas distribuídas nas 3 fases
- 8 shows agendados (meta: 8 shows/mês)
- Tarefas de vendas de shows
- 4 KPIs com metas (3, 6 e 12 meses)
- Notificações iniciais

**Ideal para:** Testar projeto complexo com múltiplas fases e longo prazo.

## Como Usar

### Pré-requisitos
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto TaskMaster
3. Vá em **SQL Editor** no menu lateral

### Passo 1: Obter seus IDs
Execute esta query para obter seu `user_id` e `organization_id`:

```sql
-- Obter seu user_id
SELECT id, email FROM auth.users LIMIT 1;

-- Obter seu organization_id
SELECT id, name FROM organizations LIMIT 1;
```

### Passo 2: Editar os Scripts
Abra cada arquivo SQL e substitua:
- `'SEU_USER_ID_AQUI'` pelo seu ID de usuário
- `'SEU_ORG_ID_AQUI'` pelo ID da sua organização

### Passo 3: Executar os Scripts
1. Copie o conteúdo do arquivo `seed_fictional_artist.sql`
2. Cole no SQL Editor do Supabase
3. Clique em **Run** (ou pressione Ctrl+Enter)
4. Repita o processo para `seed_rennan_fiore.sql`

### Verificar os Dados
Após executar os scripts, verifique se os dados foram criados:

```sql
-- Verificar artistas
SELECT * FROM artists ORDER BY created_at DESC;

-- Verificar projetos
SELECT * FROM projects ORDER BY created_at DESC;

-- Verificar tarefas
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;
```

## Observações

- **Ordem de execução:** Você pode executar os scripts em qualquer ordem
- **Dados duplicados:** Se executar o mesmo script duas vezes, serão criados registros duplicados
- **Limpeza:** Para remover os dados de teste, delete manualmente os artistas criados pela interface da plataforma

## Suporte

Se encontrar algum erro ao executar os scripts, verifique:
1. Se os IDs foram substituídos corretamente
2. Se as migrations do Supabase estão todas aplicadas
3. Se as tabelas existem no banco de dados

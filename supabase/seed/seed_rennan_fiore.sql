-- ============================================
-- SCRIPT: PROJETO RENNAN FIORE
-- TaskMaster - Plataforma de Gestão Musical
-- ============================================
-- 
-- Este script cria o projeto completo do Rennan Fiore:
-- - Perfil do artista
-- - Projeto de lançamento 2025-2026
-- - 3 Fases do projeto
-- - Tarefas detalhadas
-- - Shows e eventos
-- - Dados de redes sociais
--
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_USER_ID_AQUI' pelo seu ID de usuário
-- 2. Substitua 'SEU_ORG_ID_AQUI' pelo ID da sua organização
-- 3. Execute este script no SQL Editor do Supabase
--
-- ============================================

-- Variáveis (substitua pelos seus IDs)
DO $$
DECLARE
    v_user_id UUID := 'SEU_USER_ID_AQUI'::UUID;
    v_org_id UUID := 'SEU_ORG_ID_AQUI'::UUID;
    v_artist_id UUID;
    v_project_id UUID;
    v_fase1_id UUID;
    v_fase2_id UUID;
    v_fase3_id UUID;
BEGIN

-- ============================================
-- 1. CRIAR ARTISTA RENNAN FIORE
-- ============================================

INSERT INTO artists (
    id,
    organization_id,
    name,
    stage_name,
    genre,
    subgenre,
    bio,
    instagram,
    spotify,
    youtube,
    tiktok,
    email,
    phone,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    'Rennan Fiore',
    'Rennan Fiore',
    'Samba',
    'Samba e Pagode Moderno',
    'Rennan Fiore é um cantor de samba e pagode moderno, trazendo uma nova onda para o gênero com arranjos contemporâneos e uma presença digital massiva. Direção Geral: Marcos Menezes e Flavio Regis.',
    '@rennanfiore',
    'https://open.spotify.com/artist/rennanfiore',
    'https://youtube.com/@rennanfiore',
    '@rennanfiore',
    'contato@rennanfiore.com.br',
    '+55 21 98765-4321',
    NOW()
) RETURNING id INTO v_artist_id;

-- ============================================
-- 2. CRIAR PROJETO PRINCIPAL
-- ============================================

INSERT INTO projects (
    id,
    organization_id,
    artist_id,
    title,
    description,
    type,
    start_date,
    end_date,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_artist_id,
    'Estratégia de Lançamento 2025-2026',
    'Projeto completo para lançar Rennan Fiore como novo nome do samba e pagode moderno. Três pilares principais: Volume extremo de conteúdo, Construção da marca Rennan, e Produto comercial (shows).',
    'artist_launch',
    '2026-01-01',
    '2026-12-31',
    'in_progress',
    NOW()
) RETURNING id INTO v_project_id;

-- ============================================
-- 3. CRIAR FASE 1: EXPLOSÃO DE CONTEÚDO (JAN-ABR 2026)
-- ============================================

INSERT INTO projects (
    id,
    organization_id,
    artist_id,
    parent_project_id,
    title,
    description,
    type,
    start_date,
    end_date,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_artist_id,
    v_project_id,
    'FASE 1: Explosão de Conteúdo',
    'Fase dedicada à viralização e presença digital contínua. Produção de 400-600 cortes curtos distribuídos em 10 contas de apoio por 60 dias.',
    'content_phase',
    '2026-01-01',
    '2026-04-30',
    'in_progress',
    NOW()
) RETURNING id INTO v_fase1_id;

-- TAREFAS DA FASE 1

-- SHOW BASE - 2H DE ÁUDIO
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Gravar show base de 2h', 'Gravação em estúdio com repertório forte, arranjos modernos, versões populares, sambas retrô e músicas top 30 adaptadas', 'in_progress', 'high', '2026-01-15', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Masterizar áudio do show', 'Saída: áudio master profissional', 'pending', 'high', '2026-01-20', v_user_id, NOW());

-- GRAVAÇÃO DE IMAGEM
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Gravar na praia', 'Locação: praia - lifestyle carioca', 'pending', 'high', '2026-01-22', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar no estúdio', 'Locação: estúdio - performance profissional', 'pending', 'high', '2026-01-23', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar na rua', 'Locação: rua - conexão com o público', 'pending', 'high', '2026-01-24', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar show real', 'Locação: show real - energia ao vivo', 'pending', 'high', '2026-01-25', v_user_id, NOW());

-- PRODUÇÃO MASSIVA
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Editar 400-600 cortes curtos', 'Conteúdos de 15-20s com refrões, explosões vocais, hits atuais, versões inesperadas e estética moderna', 'pending', 'high', '2026-02-10', v_user_id, NOW());

-- DISTRIBUIÇÃO - 10 CONTAS DE APOIO
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Criar 10 contas de apoio', 'Criar 10 contas no TikTok/Instagram para distribuição', 'pending', 'high', '2026-02-12', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Distribuir conteúdo por 60 dias', 'Postar 10 vídeos por dia em cada conta (6K vídeos totais) - Objetivo: flood do algoritmo', 'pending', 'high', '2026-04-15', v_user_id, NOW());

-- CONTA OFICIAL
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Gerenciar conta oficial', 'Postar conteúdo selecionado: rotina, bastidores, ensaios, agenda e vídeos chave', 'pending', 'medium', '2026-04-30', v_user_id, NOW());

-- ============================================
-- 4. CRIAR FASE 2: SEGUNDO CICLO (MAI-JUN 2026)
-- ============================================

INSERT INTO projects (
    id,
    organization_id,
    artist_id,
    parent_project_id,
    title,
    description,
    type,
    start_date,
    end_date,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_artist_id,
    v_project_id,
    'FASE 2: Segundo Ciclo',
    'Repetição da fórmula: novo repertório, novas versões, novos cortes, nova gravação, nova distribuição. Reforço da presença diária.',
    'content_phase',
    '2026-05-01',
    '2026-06-30',
    'pending',
    NOW()
) RETURNING id INTO v_fase2_id;

-- TAREFAS DA FASE 2
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase2_id, 'Gravar novo show base', 'Novo repertório com novas versões', 'pending', 'high', '2026-05-15', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Gravar novas locações', 'Novas locações para manter a variedade', 'pending', 'high', '2026-05-20', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Editar novos cortes', '400-600 novos cortes curtos', 'pending', 'high', '2026-06-05', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Distribuir novo conteúdo', 'Nova distribuição por 60 dias', 'pending', 'high', '2026-06-30', v_user_id, NOW());

-- ============================================
-- 5. CRIAR FASE 3: AUDIOVISUAL OFICIAL (JUL-DEZ 2026)
-- ============================================

INSERT INTO projects (
    id,
    organization_id,
    artist_id,
    parent_project_id,
    title,
    description,
    type,
    start_date,
    end_date,
    status,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_artist_id,
    v_project_id,
    'FASE 3: Audiovisual Oficial',
    'Produção profissional de 12 músicas com produtor, músicos, estúdio, roteiro visual e gravação completa. Trabalhado por 12 meses.',
    'album_production',
    '2026-07-01',
    '2026-12-31',
    'pending',
    NOW()
) RETURNING id INTO v_fase3_id;

-- TAREFAS DA FASE 3
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase3_id, 'Contratar produtor musical', 'Fechar contrato com produtor profissional', 'pending', 'high', '2026-07-15', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Contratar músicos', 'Montar banda completa para gravação', 'pending', 'high', '2026-07-20', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Reservar estúdio', 'Agendar estúdio para 12 músicas', 'pending', 'high', '2026-07-25', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Criar roteiro visual', 'Desenvolver conceito visual para os videoclipes', 'pending', 'medium', '2026-08-01', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Gravar 12 músicas', 'Gravação completa do álbum', 'pending', 'high', '2026-10-31', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Produzir 12 videoclipes', 'Gravação e edição dos videoclipes', 'pending', 'high', '2026-12-15', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Lançar álbum oficial', 'Lançamento nas plataformas digitais', 'pending', 'high', '2026-12-31', v_user_id, NOW());

-- ============================================
-- 6. CRIAR TAREFAS DE VENDAS DE SHOWS
-- ============================================

INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_project_id, 'Criar kit comercial', 'Montar kit comercial profissional para venda de shows', 'pending', 'high', '2026-01-31', v_user_id, NOW()),
(v_org_id, v_project_id, 'Desenvolver identidade visual', 'Criar identidade visual forte para o artista', 'pending', 'high', '2026-01-31', v_user_id, NOW()),
(v_org_id, v_project_id, 'Fazer abordagem profissional', 'Estruturar abordagem de vendas', 'pending', 'medium', '2026-02-15', v_user_id, NOW()),
(v_org_id, v_project_id, 'Contatar casas do RJ', 'Entrar em contato com casas de show do Rio de Janeiro', 'pending', 'high', '2026-02-28', v_user_id, NOW()),
(v_org_id, v_project_id, 'Follow-up semanal', 'Fazer follow-up semanal com casas de show', 'pending', 'medium', '2026-12-31', v_user_id, NOW());

-- ============================================
-- 7. CRIAR SHOWS AGENDADOS (META: 8 SHOWS/MÊS)
-- ============================================

-- Março 2026
INSERT INTO calendar_events (organization_id, title, description, start_time, end_time, type, location, created_at) VALUES
(v_org_id, 'Show no Bar do Samba', 'Show de 2h - Repertório de samba e pagode', '2026-03-07 20:00:00', '2026-03-07 22:00:00', 'show', 'Bar do Samba - Lapa, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show na Casa de Shows XYZ', 'Show de 2h - Lançamento da Fase 1', '2026-03-14 21:00:00', '2026-03-14 23:00:00', 'show', 'Casa de Shows XYZ - Copacabana, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show no Boteco do João', 'Show de 1h30 - Acústico', '2026-03-21 19:00:00', '2026-03-21 20:30:00', 'show', 'Boteco do João - Ipanema, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show no Festival de Samba', 'Participação no Festival de Samba 2026', '2026-03-28 18:00:00', '2026-03-28 19:00:00', 'show', 'Praça da Apoteose - Centro, Rio de Janeiro/RJ', NOW());

-- Junho 2026
INSERT INTO calendar_events (organization_id, title, description, start_time, end_time, type, location, created_at) VALUES
(v_org_id, 'Show no Circo Voador', 'Show de 2h - Fase 2 do projeto', '2026-06-06 21:00:00', '2026-06-06 23:00:00', 'show', 'Circo Voador - Lapa, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show na Fundição Progresso', 'Show de 2h - Repertório completo', '2026-06-13 20:00:00', '2026-06-13 22:00:00', 'show', 'Fundição Progresso - Lapa, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show no Vivo Rio', 'Show de 2h30 - Grande show', '2026-06-20 21:00:00', '2026-06-20 23:30:00', 'show', 'Vivo Rio - Flamengo, Rio de Janeiro/RJ', NOW()),
(v_org_id, 'Show no Jockey Club', 'Show de 2h - Evento especial', '2026-06-27 19:00:00', '2026-06-27 21:00:00', 'show', 'Jockey Club - Gávea, Rio de Janeiro/RJ', NOW());

-- ============================================
-- 8. CRIAR KPIs E METAS
-- ============================================

INSERT INTO kpis (organization_id, artist_id, name, target_value, current_value, unit, period, created_at) VALUES
-- 3 meses
(v_org_id, v_artist_id, 'Viralização Inicial (3 meses)', 1000000, 0, 'views', 'quarterly', NOW()),
-- 6 meses
(v_org_id, v_artist_id, 'Shows por Mês (6 meses)', 10, 0, 'shows', 'monthly', NOW()),
-- 12 meses
(v_org_id, v_artist_id, 'Audiovisual Lançado (12 meses)', 12, 0, 'videos', 'yearly', NOW()),
(v_org_id, v_artist_id, 'Público Consolidado (12 meses)', 100000, 0, 'followers', 'yearly', NOW());

-- ============================================
-- 9. CRIAR NOTIFICAÇÕES INICIAIS
-- ============================================

INSERT INTO notifications (organization_id, user_id, title, message, type, read, created_at) VALUES
(v_org_id, v_user_id, 'Projeto Rennan Fiore criado!', 'O projeto "Estratégia de Lançamento 2025-2026" foi criado com sucesso. Comece pela Fase 1: Explosão de Conteúdo.', 'info', false, NOW()),
(v_org_id, v_user_id, 'Primeira tarefa: Gravar show base', 'A primeira tarefa do projeto é gravar o show base de 2h. Prazo: 15/01/2026.', 'reminder', false, NOW());

END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT * FROM artists WHERE stage_name = 'Rennan Fiore';
-- SELECT * FROM projects WHERE title LIKE '%Rennan%';
-- SELECT * FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE title LIKE '%Rennan%');

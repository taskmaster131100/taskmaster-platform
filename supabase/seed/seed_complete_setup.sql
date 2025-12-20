-- ============================================
-- SCRIPT: SETUP COMPLETO - TASKMASTER
-- ============================================
-- 
-- Este script cria:
-- 1. Organização para o usuário
-- 2. Vincula usuário à organização
-- 3. Artista fictício "Luna" com projeto completo
-- 4. Artista real "Rennan Fiore" com projeto de lançamento
--
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Todos os dados serão criados automaticamente
--
-- ============================================

DO $$
DECLARE
    v_user_id UUID := '31650d83-fd97-4f16-aa2e-db4135b21664'::UUID;
    v_org_id UUID;
    v_artist_luna_id UUID;
    v_artist_rennan_id UUID;
    v_project_luna_id UUID;
    v_project_rennan_id UUID;
    v_fase1_id UUID;
    v_fase2_id UUID;
    v_fase3_id UUID;
BEGIN

-- ============================================
-- 1. CRIAR ORGANIZAÇÃO
-- ============================================

INSERT INTO organizations (
    id,
    name,
    slug,
    created_at
) VALUES (
    gen_random_uuid(),
    'TaskMaster Studio',
    'taskmaster-studio',
    NOW()
) RETURNING id INTO v_org_id;

-- ============================================
-- 2. VINCULAR USUÁRIO À ORGANIZAÇÃO
-- ============================================

INSERT INTO user_organizations (
    user_id,
    organization_id,
    role,
    created_at
) VALUES (
    v_user_id,
    v_org_id,
    'owner',
    NOW()
);

-- ============================================
-- 3. CRIAR ARTISTA FICTÍCIO: LUNA
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
    'Isabela Oliveira',
    'Luna',
    'Pop',
    'Pop Eletrônico',
    'Luna é uma cantora e compositora de pop eletrônico que combina melodias cativantes com batidas dançantes. Sua música explora temas de amor, sonhos e a vida noturna de São Paulo.',
    '@lunaoficial',
    'https://open.spotify.com/artist/lunaoficial',
    'https://youtube.com/@lunaoficial',
    '@lunaoficial',
    'contato@lunaoficial.com.br',
    '+55 11 91234-5678',
    NOW()
) RETURNING id INTO v_artist_luna_id;

-- Projeto Luna
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
    v_artist_luna_id,
    'Lançamento do Single "Estrela Cadente"',
    'Projeto de 8 semanas para o lançamento do single "Estrela Cadente", incluindo produção, marketing e show de lançamento.',
    'single_launch',
    NOW(),
    NOW() + INTERVAL '8 weeks',
    'in_progress',
    NOW()
) RETURNING id INTO v_project_luna_id;

-- Tarefas Luna
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_project_luna_id, 'Finalizar composição da música', 'Revisar letra e melodia com o produtor.', 'completed', 'high', NOW() + INTERVAL '3 days', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Gravar vocais', 'Sessão de gravação no estúdio A.', 'in_progress', 'high', NOW() + INTERVAL '1 week', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Mixagem e Masterização', 'Enviar para o engenheiro de som.', 'pending', 'high', NOW() + INTERVAL '2 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Sessão de fotos para a capa', 'Definir conceito visual e fotógrafo.', 'pending', 'high', NOW() + INTERVAL '3 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Gravar videoclipe', 'Roteiro, locação e equipe de filmagem.', 'pending', 'high', NOW() + INTERVAL '4 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Criar plano de marketing digital', 'Estratégia para redes sociais, imprensa e influenciadores.', 'pending', 'medium', NOW() + INTERVAL '4 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Distribuir single para plataformas', 'Agendar lançamento em todas as plataformas digitais.', 'pending', 'high', NOW() + INTERVAL '5 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Enviar para playlists editoriais', 'Pitching para curadores do Spotify, Apple Music, etc.', 'pending', 'high', NOW() + INTERVAL '6 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Campanha com influenciadores', 'Enviar press kit e negociar parcerias.', 'pending', 'medium', NOW() + INTERVAL '7 weeks', v_user_id, NOW()),
(v_org_id, v_project_luna_id, 'Show de Lançamento', 'Organizar evento de lançamento em São Paulo.', 'pending', 'high', NOW() + INTERVAL '8 weeks', v_user_id, NOW());

-- ============================================
-- 4. CRIAR ARTISTA REAL: RENNAN FIORE
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
) RETURNING id INTO v_artist_rennan_id;

-- Projeto Principal Rennan
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
    v_artist_rennan_id,
    'Estratégia de Lançamento 2025-2026',
    'Projeto completo para lançar Rennan Fiore como novo nome do samba e pagode moderno. Três pilares principais: Volume extremo de conteúdo, Construção da marca Rennan, e Produto comercial (shows).',
    'artist_launch',
    '2026-01-01',
    '2026-12-31',
    'in_progress',
    NOW()
) RETURNING id INTO v_project_rennan_id;

-- FASE 1: Explosão de Conteúdo
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
    v_artist_rennan_id,
    v_project_rennan_id,
    'FASE 1: Explosão de Conteúdo',
    'Fase dedicada à viralização e presença digital contínua. Produção de 400-600 cortes curtos distribuídos em 10 contas de apoio por 60 dias.',
    'content_phase',
    '2026-01-01',
    '2026-04-30',
    'in_progress',
    NOW()
) RETURNING id INTO v_fase1_id;

-- Tarefas Fase 1
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase1_id, 'Gravar show base de 2h', 'Gravação em estúdio com repertório forte, arranjos modernos, versões populares, sambas retrô e músicas top 30 adaptadas', 'in_progress', 'high', '2026-01-15', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Masterizar áudio do show', 'Saída: áudio master profissional', 'pending', 'high', '2026-01-20', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar na praia', 'Locação: praia - lifestyle carioca', 'pending', 'high', '2026-01-22', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar no estúdio', 'Locação: estúdio - performance profissional', 'pending', 'high', '2026-01-23', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar na rua', 'Locação: rua - conexão com o público', 'pending', 'high', '2026-01-24', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gravar show real', 'Locação: show real - energia ao vivo', 'pending', 'high', '2026-01-25', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Editar 400-600 cortes curtos', 'Conteúdos de 15-20s com refrões, explosões vocais, hits atuais, versões inesperadas e estética moderna', 'pending', 'high', '2026-02-10', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Criar 10 contas de apoio', 'Criar 10 contas no TikTok/Instagram para distribuição', 'pending', 'high', '2026-02-12', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Distribuir conteúdo por 60 dias', 'Postar 10 vídeos por dia em cada conta (6K vídeos totais) - Objetivo: flood do algoritmo', 'pending', 'high', '2026-04-15', v_user_id, NOW()),
(v_org_id, v_fase1_id, 'Gerenciar conta oficial', 'Postar conteúdo selecionado: rotina, bastidores, ensaios, agenda e vídeos chave', 'pending', 'medium', '2026-04-30', v_user_id, NOW());

-- FASE 2: Segundo Ciclo
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
    v_artist_rennan_id,
    v_project_rennan_id,
    'FASE 2: Segundo Ciclo',
    'Repetição da fórmula: novo repertório, novas versões, novos cortes, nova gravação, nova distribuição. Reforço da presença diária.',
    'content_phase',
    '2026-05-01',
    '2026-06-30',
    'pending',
    NOW()
) RETURNING id INTO v_fase2_id;

-- Tarefas Fase 2
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase2_id, 'Gravar novo show base', 'Novo repertório com novas versões', 'pending', 'high', '2026-05-15', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Gravar novas locações', 'Novas locações para manter a variedade', 'pending', 'high', '2026-05-20', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Editar novos cortes', '400-600 novos cortes curtos', 'pending', 'high', '2026-06-05', v_user_id, NOW()),
(v_org_id, v_fase2_id, 'Distribuir novo conteúdo', 'Nova distribuição por 60 dias', 'pending', 'high', '2026-06-30', v_user_id, NOW());

-- FASE 3: Audiovisual Oficial
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
    v_artist_rennan_id,
    v_project_rennan_id,
    'FASE 3: Audiovisual Oficial',
    'Produção profissional de 12 músicas com produtor, músicos, estúdio, roteiro visual e gravação completa. Trabalhado por 12 meses.',
    'album_production',
    '2026-07-01',
    '2026-12-31',
    'pending',
    NOW()
) RETURNING id INTO v_fase3_id;

-- Tarefas Fase 3
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_fase3_id, 'Contratar produtor musical', 'Fechar contrato com produtor profissional', 'pending', 'high', '2026-07-15', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Contratar músicos', 'Montar banda completa para gravação', 'pending', 'high', '2026-07-20', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Reservar estúdio', 'Agendar estúdio para 12 músicas', 'pending', 'high', '2026-07-25', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Criar roteiro visual', 'Desenvolver conceito visual para os videoclipes', 'pending', 'medium', '2026-08-01', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Gravar 12 músicas', 'Gravação completa do álbum', 'pending', 'high', '2026-10-31', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Produzir 12 videoclipes', 'Gravação e edição dos videoclipes', 'pending', 'high', '2026-12-15', v_user_id, NOW()),
(v_org_id, v_fase3_id, 'Lançar álbum oficial', 'Lançamento nas plataformas digitais', 'pending', 'high', '2026-12-31', v_user_id, NOW());

-- Tarefas de vendas de shows
INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
(v_org_id, v_project_rennan_id, 'Criar kit comercial', 'Montar kit comercial profissional para venda de shows', 'pending', 'high', '2026-01-31', v_user_id, NOW()),
(v_org_id, v_project_rennan_id, 'Desenvolver identidade visual', 'Criar identidade visual forte para o artista', 'pending', 'high', '2026-01-31', v_user_id, NOW()),
(v_org_id, v_project_rennan_id, 'Fazer abordagem profissional', 'Estruturar abordagem de vendas', 'pending', 'medium', '2026-02-15', v_user_id, NOW()),
(v_org_id, v_project_rennan_id, 'Contatar casas do RJ', 'Entrar em contato com casas de show do Rio de Janeiro', 'pending', 'high', '2026-02-28', v_user_id, NOW()),
(v_org_id, v_project_rennan_id, 'Follow-up semanal', 'Fazer follow-up semanal com casas de show', 'pending', 'medium', '2026-12-31', v_user_id, NOW());

-- ============================================
-- 5. MENSAGEM DE SUCESSO
-- ============================================

RAISE NOTICE '✅ Setup completo executado com sucesso!';
RAISE NOTICE 'Organização criada: TaskMaster Studio (ID: %)', v_org_id;
RAISE NOTICE 'Artista Luna criado (ID: %)', v_artist_luna_id;
RAISE NOTICE 'Artista Rennan Fiore criado (ID: %)', v_artist_rennan_id;
RAISE NOTICE 'Total de tarefas criadas: 34';

END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

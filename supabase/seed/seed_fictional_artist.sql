-- ============================================
-- SCRIPT: ARTISTA FICTÍCIO COMPLETO
-- TaskMaster - Plataforma de Gestão Musical
-- ============================================
-- 
-- Este script cria um perfil de artista fictício completo:
-- - Perfil da artista "Luna"
-- - Projeto de lançamento de single "Estrela Cadente"
-- - Tarefas detalhadas do projeto
-- - Shows e eventos
-- - Contratos
-- - Dados financeiros
-- - KPIs e metas
-- - Histórico de atividades
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
    v_contract_id UUID;
BEGIN

-- ============================================
-- 1. CRIAR ARTISTA LUNA
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
) RETURNING id INTO v_artist_id;

-- ============================================
-- 2. CRIAR PROJETO DE LANÇAMENTO DE SINGLE
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
    'Lançamento do Single "Estrela Cadente"',
    'Projeto de 8 semanas para o lançamento do single "Estrela Cadente", incluindo produção, marketing e show de lançamento.',
    'single_launch',
    NOW(),
    NOW() + INTERVAL '8 weeks',
    'in_progress',
    NOW()
) RETURNING id INTO v_project_id;

-- ============================================
-- 3. CRIAR TAREFAS DO PROJETO
-- ============================================

INSERT INTO tasks (organization_id, project_id, title, description, status, priority, due_date, assigned_to, created_at) VALUES
-- Semana 1-2: Produção
(v_org_id, v_project_id, 'Finalizar composição da música', 'Revisar letra e melodia com o produtor.', 'completed', 'high', NOW() + INTERVAL '3 days', v_user_id, NOW()),
(v_org_id, v_project_id, 'Gravar vocais', 'Sessão de gravação no estúdio A.', 'in_progress', 'high', NOW() + INTERVAL '1 week', v_user_id, NOW()),
(v_org_id, v_project_id, 'Mixagem e Masterização', 'Enviar para o engenheiro de som.', 'pending', 'high', NOW() + INTERVAL '2 weeks', v_user_id, NOW()),

-- Semana 3-4: Marketing e Conteúdo
(v_org_id, v_project_id, 'Sessão de fotos para a capa', 'Definir conceito visual e fotógrafo.', 'pending', 'high', NOW() + INTERVAL '3 weeks', v_user_id, NOW()),
(v_org_id, v_project_id, 'Gravar videoclipe', 'Roteiro, locação e equipe de filmagem.', 'pending', 'high', NOW() + INTERVAL '4 weeks', v_user_id, NOW()),
(v_org_id, v_project_id, 'Criar plano de marketing digital', 'Estratégia para redes sociais, imprensa e influenciadores.', 'pending', 'medium', NOW() + INTERVAL '4 weeks', v_user_id, NOW()),

-- Semana 5-7: Divulgação
(v_org_id, v_project_id, 'Distribuir single para plataformas', 'Agendar lançamento em todas as plataformas digitais.', 'pending', 'high', NOW() + INTERVAL '5 weeks', v_user_id, NOW()),
(v_org_id, v_project_id, 'Enviar para playlists editoriais', 'Pitching para curadores do Spotify, Apple Music, etc.', 'pending', 'high', NOW() + INTERVAL '6 weeks', v_user_id, NOW()),
(v_org_id, v_project_id, 'Campanha com influenciadores', 'Enviar press kit e negociar parcerias.', 'pending', 'medium', NOW() + INTERVAL '7 weeks', v_user_id, NOW()),

-- Semana 8: Lançamento
(v_org_id, v_project_id, 'Show de Lançamento', 'Organizar evento de lançamento em São Paulo.', 'pending', 'high', NOW() + INTERVAL '8 weeks', v_user_id, NOW());

-- ============================================
-- 4. CRIAR SHOWS E EVENTOS
-- ============================================

INSERT INTO calendar_events (organization_id, title, description, start_time, end_time, type, location, created_at) VALUES
(v_org_id, 'Show de Lançamento "Estrela Cadente"', 'Show completo com banda e convidados especiais.', NOW() + INTERVAL '8 weeks', NOW() + INTERVAL '8 weeks' + INTERVAL '2 hours', 'show', 'Casa de Shows XYZ - São Paulo/SP', NOW()),
(v_org_id, 'Entrevista na Rádio Pop FM', 'Entrevista e performance acústica.', NOW() + INTERVAL '8 weeks' + INTERVAL '1 day', NOW() + INTERVAL '8 weeks' + INTERVAL '1 day' + INTERVAL '1 hour', 'event', 'Rádio Pop FM - São Paulo/SP', NOW());

-- ============================================
-- 5. CRIAR CONTRATO
-- ============================================

INSERT INTO contracts (
    id,
    organization_id,
    artist_id,
    title,
    type,
    status,
    start_date,
    end_date,
    file_url,
    created_at
) VALUES (
    gen_random_uuid(),
    v_org_id,
    v_artist_id,
    'Contrato de Gravação - Single "Estrela Cadente"',
    'recording',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    'https://example.com/contrato_luna.pdf',
    NOW()
) RETURNING id INTO v_contract_id;

-- ============================================
-- 6. CRIAR DADOS FINANCEIROS
-- ============================================

-- Receitas
INSERT INTO financials (organization_id, project_id, type, description, amount, date, created_at) VALUES
(v_org_id, v_project_id, 'revenue', 'Adiantamento da gravadora', 5000.00, NOW(), NOW());

-- Despesas
INSERT INTO financials (organization_id, project_id, type, description, amount, date, created_at) VALUES
(v_org_id, v_project_id, 'expense', 'Gravação em estúdio (10 horas)', -1500.00, NOW() + INTERVAL '1 week', NOW()),
(v_org_id, v_project_id, 'expense', 'Produção do videoclipe', -8000.00, NOW() + INTERVAL '4 weeks', NOW()),
(v_org_id, v_project_id, 'expense', 'Marketing e promoção', -2500.00, NOW() + INTERVAL '5 weeks', NOW());

-- ============================================
-- 7. CRIAR KPIs E METAS
-- ============================================

INSERT INTO kpis (organization_id, artist_id, name, target_value, current_value, unit, period, created_at) VALUES
(v_org_id, v_artist_id, 'Streams no 1º Mês', 500000, 0, 'streams', 'monthly', NOW()),
(v_org_id, v_artist_id, 'Novos Seguidores no Instagram', 10000, 0, 'followers', 'monthly', NOW()),
(v_org_id, v_artist_id, 'Visualizações do Clipe na 1ª Semana', 100000, 0, 'views', 'weekly', NOW());

-- ============================================
-- 8. CRIAR HISTÓRICO DE ATIVIDADES
-- ============================================

INSERT INTO activity_history (organization_id, user_id, entity_type, entity_id, action, details, created_at) VALUES
(v_org_id, v_user_id, 'artist', v_artist_id, 'create', 'Artista Luna criada no sistema.', NOW()),
(v_org_id, v_user_id, 'project', v_project_id, 'create', 'Projeto "Lançamento do Single 'Estrela Cadente'" criado.', NOW()),
(v_org_id, v_user_id, 'task', (SELECT id FROM tasks WHERE title = 'Finalizar composição da música'), 'update', 'Tarefa marcada como concluída.', NOW() + INTERVAL '1 day');

END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

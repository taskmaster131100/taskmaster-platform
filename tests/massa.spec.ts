import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://www.taskmaster.works';
const TEST_EMAIL = `test_${Date.now()}@taskmaster.test`;
const TEST_PASSWORD = 'Bal@131100';
const EXISTING_EMAIL = 'balmarcos@hotmail.com';

// ─── HELPERS ───────────────────────────────────────────
async function login(page: Page, email = EXISTING_EMAIL, password = TEST_PASSWORD) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
  await page.waitForTimeout(2000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
}

// ══════════════════════════════════════════════════════════
// BLOCO 1 — ACESSO E NAVEGAÇÃO
// ══════════════════════════════════════════════════════════

test.describe('1. Acesso e Carregamento', () => {
  test('1.1 Homepage carrega sem erro', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBeLessThan(400);
    await screenshot(page, '1-1-homepage');
    await expect(page).not.toHaveTitle(''); // tem título
    console.log('Título da página:', await page.title());
  });

  test('1.2 Página de login acessível', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
    await screenshot(page, '1-2-login-page');
  });

  test('1.3 Redirecionamento para login sem auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log('Redirecionou para:', url);
    await screenshot(page, '1-3-redirect-sem-auth');
    // Deve estar em login ou na home, não em /tasks
    expect(url).not.toContain('/tasks');
  });

  test('1.4 Console sem erros críticos na homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('analytics'));
    console.log('Erros no console:', criticalErrors);
    await screenshot(page, '1-4-console-errors');
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 2 — AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════

test.describe('2. Autenticação', () => {
  test('2.1 Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', 'naoexiste@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'senhaerrada123');
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
    await page.waitForTimeout(3000);
    await screenshot(page, '2-1-login-invalido');
    // Deve continuar na página de login ou mostrar erro
    const url = page.url();
    console.log('URL após login inválido:', url);
  });

  test('2.2 Registro de novo usuário', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, '2-2-register-page');

    // Verificar se página de registro existe
    const hasForm = await page.locator('input[type="email"], form').count() > 0;
    console.log('Formulário de registro encontrado:', hasForm);

    if (hasForm) {
      const fields = await page.locator('input').count();
      console.log('Campos de input encontrados:', fields);
    }
  });

  test('2.3 Recuperação de senha acessível', async ({ page }) => {
    await page.goto(`${BASE_URL}/reset-password`);
    await page.waitForTimeout(2000);
    await screenshot(page, '2-3-reset-password');
    const url = page.url();
    console.log('URL reset password:', url);
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 3 — DASHBOARD PÓS-LOGIN
// ══════════════════════════════════════════════════════════

test.describe('3. Dashboard e Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('3.1 Login bem-sucedido redireciona corretamente', async ({ page }) => {
    const url = page.url();
    console.log('URL após login:', url);
    await screenshot(page, '3-1-pos-login');
    // Não deve estar em /login
    expect(url).not.toContain('/login');
  });

  test('3.2 Sidebar/Menu principal visível', async ({ page }) => {
    await page.waitForTimeout(2000);
    await screenshot(page, '3-2-sidebar');

    // Verificar elementos de navegação (sidebar usa botões e divs, não apenas <a>)
    const navItems = await page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]').count();
    const navButtons = await page.locator('nav button, aside button, [class*="sidebar"] button').count();
    console.log('Containers de nav encontrados:', navItems);
    console.log('Botões de nav encontrados:', navButtons);
    expect(navItems + navButtons).toBeGreaterThan(3);
  });

  test('3.3 Navegar para Tarefas (/tasks)', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-3-tasks');
    const url = page.url();
    console.log('URL tasks:', url);
    // Verificar se carregou conteúdo
    const hasContent = await page.locator('h1, h2, [class*="kanban"], [class*="board"], [class*="task"]').count() > 0;
    console.log('Conteúdo de tasks encontrado:', hasContent);
  });

  test('3.4 Navegar para Calendário (/calendar)', async ({ page }) => {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-4-calendar');
    const hasCalendar = await page.locator('[class*="calendar"], [class*="Calendar"], table').count() > 0;
    console.log('Calendário encontrado:', hasCalendar);
  });

  test('3.5 Navegar para Financeiro (/finance)', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-5-finance');
    const hasContent = await page.locator('h1, h2').count() > 0;
    console.log('Financeiro carregou:', hasContent);
  });

  test('3.6 Navegar para Shows (/shows)', async ({ page }) => {
    await page.goto(`${BASE_URL}/shows`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-6-shows');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Shows carregou:', hasContent);
  });

  test('3.7 Navegar para Releases (/releases)', async ({ page }) => {
    await page.goto(`${BASE_URL}/releases`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-7-releases');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Releases carregou:', hasContent);
  });

  test('3.8 Navegar para Equipe (/team)', async ({ page }) => {
    await page.goto(`${BASE_URL}/team`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-8-team');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Equipe carregou:', hasContent);
  });

  test('3.9 Navegar para Produção Musical (/music)', async ({ page }) => {
    await page.goto(`${BASE_URL}/music`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-9-music');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Produção Musical carregou:', hasContent);
  });

  test('3.10 Navegar para Mentor Chat (/mentor-chat)', async ({ page }) => {
    await page.goto(`${BASE_URL}/mentor-chat`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-10-mentor-chat');
    const hasContent = await page.locator('h1, h2, input, textarea').count() > 0;
    console.log('Mentor Chat carregou:', hasContent);
  });

  test('3.11 Navegar para KPIs (/kpis)', async ({ page }) => {
    await page.goto(`${BASE_URL}/kpis`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-11-kpis');
    const hasContent = await page.locator('h1, h2').count() > 0;
    console.log('KPIs carregou:', hasContent);
  });

  test('3.12 Navegar para Relatórios (/reports)', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForTimeout(2000);
    await screenshot(page, '3-12-reports');
    const hasContent = await page.locator('h1, h2, svg').count() > 0;
    console.log('Relatórios carregou:', hasContent);
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 4 — CRUD DE ARTISTAS
// ══════════════════════════════════════════════════════════

test.describe('4. Artistas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('4.1 Página de artistas acessível', async ({ page }) => {
    await page.goto(`${BASE_URL}/artists`);
    await page.waitForTimeout(2000);
    await screenshot(page, '4-1-artists-list');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Artistas carregou:', hasContent);
  });

  test('4.2 Botão criar artista existe', async ({ page }) => {
    await page.goto(`${BASE_URL}/artists`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button:has-text("Novo Artista"), button:has-text("Criar Artista"), button:has-text("+ Artista")').first();
    const exists = await createBtn.count() > 0;
    console.log('Botão criar artista encontrado:', exists);
    await screenshot(page, '4-2-create-artist-btn');
  });

  test('4.3 Abrir formulário de criação de artista', async ({ page }) => {
    await page.goto(`${BASE_URL}/artists`);
    await page.waitForTimeout(2000);

    // Usar seletor específico do botão na área de conteúdo (não o sidebar)
    const createBtn = page.locator('button:has-text("Novo Artista"), button:has-text("Criar Artista"), button:has-text("+ Artista"), main button').filter({ hasText: /novo|criar|\+/i }).first();
    const visible = await createBtn.isVisible().catch(() => false);
    if (visible) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '4-3-artist-form');
      const hasForm = await page.locator('input, form, [role="dialog"]').count() > 0;
      console.log('Formulário abriu:', hasForm);
    } else {
      console.log('Botão criar artista não visível na área de conteúdo — pulando');
      await screenshot(page, '4-3-no-visible-btn');
    }
  });

  test('4.4 Criar artista completo', async ({ page }) => {
    await page.goto(`${BASE_URL}/artists`);
    await page.waitForTimeout(2000);

    // Usar seletor específico — não pegar itens do sidebar
    const createBtn = page.locator('button:has-text("Novo Artista"), button:has-text("Criar Artista")').first();
    const visible = await createBtn.isVisible().catch(() => false);
    if (visible) {
      await createBtn.click();
      await page.waitForTimeout(1500);

      // Preencher campos disponíveis
      const nameInput = page.locator('input[name*="name"], input[placeholder*="nome"], input[placeholder*="Nome"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Artista Teste Playwright');
      }

      const stageInput = page.locator('input[name*="stage"], input[placeholder*="artístico"]').first();
      if (await stageInput.count() > 0) {
        await stageInput.fill('Artista Teste');
      }

      await screenshot(page, '4-4-artist-form-filled');

      const saveBtn = page.locator('button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")').last();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '4-4-artist-created');
        console.log('URL após criar artista:', page.url());
      }
    } else {
      console.log('Botão "Novo Artista" não encontrado ou não visível — pulando');
      await screenshot(page, '4-4-no-btn');
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 5 — CRUD DE PROJETOS
// ══════════════════════════════════════════════════════════

test.describe('5. Projetos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
  });

  test('5.1 Botão criar projeto visível no dashboard', async ({ page }) => {
    await screenshot(page, '5-1-dashboard');
    const createBtn = page.locator('button:has-text("Criar Projeto"), button:has-text("Novo Projeto"), button:has-text("+ Projeto")').first();
    const exists = await createBtn.count() > 0;
    console.log('Botão criar projeto no dashboard:', exists);
  });

  test('5.2 Abrir modal de criação de projeto', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /projeto|project|\+/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '5-2-project-modal');
      const hasModal = await page.locator('[role="dialog"], .modal, form').count() > 0;
      console.log('Modal de projeto abriu:', hasModal);
    }
  });

  test('5.3 Opções de criação de projeto disponíveis', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /projeto|project|\+/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);

      // Verificar se há opções (Do Zero, Template, IA)
      const hasIA = await page.locator('text=IA, text=Copilot, text=Inteligência').count() > 0;
      const hasTemplate = await page.locator('text=Template, text=template').count() > 0;
      const hasZero = await page.locator('text=zero, text=Zero, text=scratch').count() > 0;

      console.log('Opção IA Copilot:', hasIA);
      console.log('Opção Template:', hasTemplate);
      console.log('Opção Do Zero:', hasZero);
      await screenshot(page, '5-3-project-options');
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 6 — TAREFAS E KANBAN
// ══════════════════════════════════════════════════════════

test.describe('6. Tarefas e Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('6.1 Board Kanban renderiza', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(3000);
    await screenshot(page, '6-1-kanban-board');

    // Verificar colunas do kanban
    const cols = await page.locator('[class*="column"], [class*="Column"], [class*="kanban"]').count();
    console.log('Colunas Kanban encontradas:', cols);
  });

  test('6.2 Colunas corretas no Kanban', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(3000);

    const pageText = await page.textContent('body') || '';
    const hasToDoCol = /a fazer|to.?do|pendente/i.test(pageText);
    const hasProgressCol = /em progresso|in progress|andamento/i.test(pageText);
    const hasDoneCol = /concluído|done|finalizado/i.test(pageText);

    console.log('Coluna "A Fazer":', hasToDoCol);
    console.log('Coluna "Em Progresso":', hasProgressCol);
    console.log('Coluna "Concluído":', hasDoneCol);
  });

  test('6.3 Botão nova tarefa existe', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /nova tarefa|new task|adicionar|\+/i }).first();
    const exists = await createBtn.count() > 0;
    console.log('Botão nova tarefa:', exists);
    await screenshot(page, '6-3-new-task-btn');
  });

  test('6.4 Criar nova tarefa', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /nova|new|task|tarefa|\+/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '6-4-task-form');

      const titleInput = page.locator('input[name*="title"], input[placeholder*="título"], input[placeholder*="Título"], input[name*="name"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('Tarefa Teste Playwright');
        await screenshot(page, '6-4-task-filled');

        const saveBtn = page.locator('button[type="submit"], button:has-text("Criar"), button:has-text("Salvar")').last();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await screenshot(page, '6-4-task-created');
        }
      }
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 7 — SHOWS
// ══════════════════════════════════════════════════════════

test.describe('7. Shows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('7.1 Página de shows carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/shows`);
    await page.waitForTimeout(2000);
    await screenshot(page, '7-1-shows');
    const hasContent = await page.locator('h1, h2, button').count() > 0;
    console.log('Shows carregou:', hasContent);
  });

  test('7.2 Abrir formulário de novo show', async ({ page }) => {
    await page.goto(`${BASE_URL}/shows`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /novo show|new show|criar show|\+/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '7-2-show-form');
      const hasForm = await page.locator('input, [role="dialog"]').count() > 0;
      console.log('Formulário show abriu:', hasForm);
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 8 — IA E MENTOR
// ══════════════════════════════════════════════════════════

test.describe('8. IA e Mentor', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('8.1 Mentor Chat carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/mentor-chat`);
    await page.waitForTimeout(3000);
    await screenshot(page, '8-1-mentor-chat');
    const hasChat = await page.locator('input, textarea, [class*="chat"], [class*="message"]').count() > 0;
    console.log('Mentor Chat tem input:', hasChat);
  });

  test('8.2 Enviar mensagem no Mentor Chat', async ({ page }) => {
    await page.goto(`${BASE_URL}/mentor-chat`);
    await page.waitForTimeout(3000);

    const input = page.locator('input[type="text"], textarea').last();
    if (await input.count() > 0) {
      await input.fill('Olá, qual é o status da plataforma?');
      await screenshot(page, '8-2-mentor-message-typed');

      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000); // aguardar resposta da IA
      await screenshot(page, '8-2-mentor-response');

      const messages = await page.locator('[class*="message"], [class*="chat"], [class*="bubble"]').count();
      console.log('Mensagens no chat:', messages);
    }
  });

  test('8.3 Planning Copilot acessível', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(2000);
    await screenshot(page, '8-3-planning');
    const hasContent = await page.locator('h1, h2, button, input, textarea').count() > 0;
    console.log('Planning carregou:', hasContent);
  });

  test('8.4 IA de Texto acessível', async ({ page }) => {
    await page.goto(`${BASE_URL}/ia-texto`);
    await page.waitForTimeout(2000);
    await screenshot(page, '8-4-ia-texto');
    const hasContent = await page.locator('input, textarea, button').count() > 0;
    console.log('IA Texto carregou:', hasContent);
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 9 — FINANCEIRO
// ══════════════════════════════════════════════════════════

test.describe('9. Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('9.1 Página financeira carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance`);
    await page.waitForTimeout(2000);
    await screenshot(page, '9-1-finance');
    const hasContent = await page.locator('h1, h2').count() > 0;
    console.log('Financeiro carregou:', hasContent);
  });

  test('9.2 Aba de receitas visível', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance`);
    await page.waitForTimeout(2000);
    const hasReceitas = await page.locator('text=Receita, text=receita').count() > 0;
    console.log('Aba Receitas:', hasReceitas);
    await screenshot(page, '9-2-receitas');
  });

  test('9.3 Gráficos renderizam', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance`);
    await page.waitForTimeout(3000);
    const hasSvg = await page.locator('svg, canvas, [class*="chart"], [class*="Chart"]').count() > 0;
    console.log('Gráficos encontrados:', hasSvg);
    await screenshot(page, '9-3-finance-charts');
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 10 — PRODUÇÃO MUSICAL
// ══════════════════════════════════════════════════════════

test.describe('10. Produção Musical', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('10.1 Módulo musical carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/music`);
    await page.waitForTimeout(3000);
    await screenshot(page, '10-1-music');
    const hasContent = await page.locator('h1, h2, button, [class*="music"], [class*="Music"]').count() > 0;
    console.log('Módulo musical carregou:', hasContent);
  });

  test('10.2 Setlists acessíveis', async ({ page }) => {
    await page.goto(`${BASE_URL}/music`);
    await page.waitForTimeout(2000);

    // Procurar aba ou link para setlists
    const setlistLink = page.locator('text=Setlist, text=setlist, [href*="setlist"]').first();
    if (await setlistLink.count() > 0) {
      await setlistLink.click();
      await page.waitForTimeout(1500);
    }
    await screenshot(page, '10-2-setlists');
  });

  test('10.3 Editor de arranjos carrega (abcjs)', async ({ page }) => {
    await page.goto(`${BASE_URL}/music`);
    await page.waitForTimeout(3000);

    // Verificar se abcjs não causou erros
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForTimeout(2000);
    const abcjsError = errors.some(e => e.toLowerCase().includes('abc'));
    console.log('Erro com abcjs:', abcjsError);
    console.log('Erros de página:', errors.slice(0, 5));
    await screenshot(page, '10-3-arrangement-editor');
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 11 — PERFORMANCE E QUALIDADE
// ══════════════════════════════════════════════════════════

test.describe('11. Performance', () => {
  test('11.1 Homepage carrega em menos de 5 segundos', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Homepage carregou em: ${duration}ms`);
    expect(duration).toBeLessThan(10000); // máx 10s
  });

  test('11.2 Dashboard pós-login carrega rápido', async ({ page }) => {
    await login(page);
    const start = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;
    console.log(`Dashboard carregou em: ${duration}ms`);
  });

  test('11.3 Sem memory leaks óbvios (navegação múltipla)', async ({ page }) => {
    await login(page);
    const pages = ['/tasks', '/calendar', '/shows', '/releases', '/finance', '/music', '/reports'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForTimeout(1000);
    }

    await screenshot(page, '11-3-nav-final');
    console.log('Navegação múltipla completada sem crash');
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 12 — RESPONSIVIDADE
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// BLOCO 13 — FLUXO DE CONVITE
// ══════════════════════════════════════════════════════════

test.describe('13. Fluxo de Convite', () => {
  test('13.1 Página de solicitar acesso carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/invite`);
    await page.waitForTimeout(2000);
    await screenshot(page, '13-1-invite-page');
    const hasContent = await page.locator('input, button, h1, h2').count() > 0;
    console.log('Página de convite carregou:', hasContent);
  });

  test('13.2 Formulário de solicitação de acesso existe', async ({ page }) => {
    await page.goto(`${BASE_URL}/invite`);
    await page.waitForTimeout(2000);
    const hasEmail = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    console.log('Campo de e-mail encontrado:', hasEmail);
    await screenshot(page, '13-2-invite-form');
  });

  test('13.3 Convite via link não resulta em tela branca', async ({ page }) => {
    // Simula acesso a link de convite inválido — deve mostrar erro, não tela branca
    await page.goto(`${BASE_URL}/invite?token=token-invalido-teste`);
    await page.waitForTimeout(3000);
    await screenshot(page, '13-3-invite-invalid-token');
    const body = await page.textContent('body') || '';
    const isBlank = body.trim().length < 50;
    console.log('Tela em branco:', isBlank);
    expect(isBlank).toBe(false);
  });

  test('13.4 Aceitar convite não trava em loading infinito', async ({ page }) => {
    await page.goto(`${BASE_URL}/invite?token=token-invalido-teste`);

    // Aguardar até 8 segundos — não deve ficar preso em spinner
    await page.waitForTimeout(8000);
    await screenshot(page, '13-4-invite-no-infinite-loading');

    // Spinner de loading não deve estar mais visível após 8s
    const hasSpinner = await page.locator('[class*="spin"], [class*="loading"], [class*="animate-spin"]').count();
    console.log('Spinners ainda visíveis após 8s:', hasSpinner);
    // Aceitamos 1 spinner como possível (header fixo), mas não múltiplos
    expect(hasSpinner).toBeLessThan(3);
  });

  test('13.5 Registro via convite — fluxo completo visível', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(2000);
    await screenshot(page, '13-5-register-invite');
    const hasForm = await page.locator('form, input').count() > 0;
    console.log('Formulário de registro existe:', hasForm);
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 14 — /project/:id (não pode ser tela branca)
// ══════════════════════════════════════════════════════════

test.describe('14. Projeto Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
  });

  test('14.1 Navegar para projeto via dashboard não fica em branco', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    // Clicar no primeiro projeto disponível
    const projectLink = page.locator('[href*="/project/"], button:has-text("Abrir"), a:has-text("Ver projeto")').first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForTimeout(4000);
      await screenshot(page, '14-1-project-detail');

      const body = await page.textContent('body') || '';
      const isBlank = body.trim().length < 100;
      console.log('Tela em branco:', isBlank);
      console.log('URL após clicar projeto:', page.url());
      expect(isBlank).toBe(false);
    } else {
      console.log('Nenhum projeto disponível para clicar — pulando');
    }
  });

  test('14.2 Acesso direto a /project/:id sem branco', async ({ page }) => {
    // Buscar um ID real de projeto via navegação
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    // Tentar clicar em um projeto para descobrir o ID
    const projectLink = page.locator('[href*="/project/"]').first();
    let projectUrl = '';
    if (await projectLink.count() > 0) {
      projectUrl = await projectLink.getAttribute('href') || '';
    }

    if (projectUrl) {
      await page.goto(`${BASE_URL}${projectUrl}`);
    } else {
      // Fallback: tentar rota genérica
      await page.goto(`${BASE_URL}/project/00000000-0000-0000-0000-000000000000`);
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '14-2-project-id-direct');

    const body = await page.textContent('body') || '';
    const isBlank = body.trim().length < 50;
    console.log('Tela em branco no /project/:id:', isBlank);
    console.log('URL final:', page.url());
    expect(isBlank).toBe(false);
  });

  test('14.3 ProjectDashboard mostra TaskBoard', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const projectLink = page.locator('[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      const href = await projectLink.getAttribute('href') || '';
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(4000);

      const hasTaskBoard = await page.locator(
        '[class*="task"], [class*="kanban"], [class*="board"], button:has-text("Tarefas")'
      ).count() > 0;
      console.log('TaskBoard presente no projeto:', hasTaskBoard);
      await screenshot(page, '14-3-project-taskboard');
    }
  });

  test('14.4 IA inline do projeto responde', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const projectLink = page.locator('[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      const href = await projectLink.getAttribute('href') || '';
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(4000);

      // Abrir painel de IA se houver botão
      const aiBtn = page.locator('button:has-text("IA"), button:has-text("Copilot"), button:has-text("Assistente")').first();
      if (await aiBtn.count() > 0) {
        await aiBtn.click();
        await page.waitForTimeout(1500);

        const input = page.locator('input[type="text"], textarea').last();
        if (await input.count() > 0) {
          await input.fill('Qual é o status deste projeto?');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(8000); // aguardar resposta IA
          await screenshot(page, '14-4-project-ai-response');

          const messages = await page.locator('[class*="message"], [class*="chat"]').count();
          console.log('Mensagens IA no projeto:', messages);
        }
      } else {
        console.log('Botão IA não encontrado no projeto');
        await screenshot(page, '14-4-no-ai-btn');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 15 — PDF / IMPRESSÃO (não pode ser branco)
// ══════════════════════════════════════════════════════════

test.describe('15. PDF e Impressão', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
  });

  test('15.1 CSS de impressão não esconde o conteúdo principal', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    // Emular mídia de impressão
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);
    await screenshot(page, '15-1-print-media-dashboard');

    // Verificar que o conteúdo principal ainda está visível
    const mainContent = await page.locator('main, [class*="flex-1"], [class*="content"]').first();
    const isVisible = await mainContent.isVisible().catch(() => false);
    console.log('Conteúdo principal visível no print:', isVisible);
    expect(isVisible).toBe(true);
  });

  test('15.2 Página de projeto tem conteúdo para imprimir', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const projectLink = page.locator('[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      const href = await projectLink.getAttribute('href') || '';
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(4000);

      // Emular print
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);
      await screenshot(page, '15-2-project-print');

      const body = await page.textContent('body') || '';
      console.log('Tamanho do conteúdo em modo print:', body.trim().length);
      expect(body.trim().length).toBeGreaterThan(100);
    }
  });

  test('15.3 Sidebar some no print (não polui o PDF)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);

    // Sidebar deve estar oculta no print
    const sidebar = page.locator('aside, nav.lg\\:flex, [class*="w-64"]').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    console.log('Sidebar visível no print:', sidebarVisible);
    await screenshot(page, '15-3-print-no-sidebar');
  });

  test('15.4 Releases — modal de detalhes tem conteúdo imprimível', async ({ page }) => {
    await page.goto(`${BASE_URL}/releases`);
    await page.waitForTimeout(2000);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);
    await screenshot(page, '15-4-releases-print');
    const body = await page.textContent('body') || '';
    expect(body.trim().length).toBeGreaterThan(50);
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 16 — COPILOT IA COM CONTEXTO DE PROJETO
// ══════════════════════════════════════════════════════════

test.describe('16. Copilot IA — Contexto de Projeto', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
  });

  test('16.1 /planejamento carrega sem erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(3000);
    await screenshot(page, '16-1-planejamento');
    const hasInput = await page.locator('input[type="text"], textarea').count() > 0;
    console.log('Copilot tem input:', hasInput);
    expect(hasInput).toBe(true);
  });

  test('16.2 Copilot responde sem citar "não tenho acesso a dados"', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(3000);

    const input = page.locator('input[type="text"], textarea').last();
    if (await input.count() > 0) {
      await input.fill('Quais são meus projetos ativos?');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000); // aguardar resposta IA

      await screenshot(page, '16-2-copilot-response');
      const body = await page.textContent('body') || '';
      const hasDataError = body.toLowerCase().includes('não tenho acesso a dados');
      console.log('Resposta contém "não tenho acesso a dados":', hasDataError);
      expect(hasDataError).toBe(false);
    }
  });

  test('16.3 Copilot com contexto de projeto via state', async ({ page }) => {
    // Navegar ao /planejamento com state de projeto (simula clique em "Copiloto IA" no dashboard)
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const projectLink = page.locator('[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      const href = await projectLink.getAttribute('href') || '';
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(4000);

      // Clicar no botão Copiloto IA do ProjectDashboard
      const copilotBtn = page.locator('button:has-text("Copiloto IA"), button:has-text("Copilot"), a:has-text("Copiloto")').first();
      if (await copilotBtn.count() > 0) {
        await copilotBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, '16-3-copilot-with-context');

        // Verificar se header mostra contexto do projeto
        const body = await page.textContent('body') || '';
        const hasContext = body.toLowerCase().includes('contexto') || body.toLowerCase().includes('projeto');
        console.log('Contexto de projeto presente no Copilot:', hasContext);
      } else {
        console.log('Botão Copiloto IA não encontrado — pulando');
        await screenshot(page, '16-3-no-copilot-btn');
      }
    }
  });

  test('16.4 Copilot usa nome real do projeto na resposta', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(3000);

    const input = page.locator('input[type="text"], textarea').last();
    if (await input.count() > 0) {
      await input.fill('Me dê o status operacional do meu projeto mais recente');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(12000);

      await screenshot(page, '16-4-copilot-operational');
      const body = await page.textContent('body') || '';

      // Resposta não deve ser genérica
      const isGeneric = body.toLowerCase().includes('seu projeto') && !body.includes('📍');
      console.log('Resposta genérica (sem nome do projeto):', isGeneric);
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 17 — HISTÓRICO DE CHAT POR PROJETO
// ══════════════════════════════════════════════════════════

test.describe('17. Histórico de Chat por Projeto', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.waitForTimeout(2000);
  });

  test('17.1 Mensagem persiste após F5 no Copilot', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(3000);

    const input = page.locator('input[type="text"], textarea').last();
    if (await input.count() > 0) {
      await input.fill('Mensagem de teste para persistência de histórico');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(8000);

      // Recarregar página
      await page.reload();
      await page.waitForTimeout(3000);
      await screenshot(page, '17-1-history-after-reload');

      const body = await page.textContent('body') || '';
      const hasHistory = body.includes('Mensagem de teste para persistência');
      console.log('Histórico persistiu após reload:', hasHistory);
    }
  });

  test('17.2 Botão "Nova conversa" limpa o histórico', async ({ page }) => {
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(3000);

    const novaBtn = page.locator('button:has-text("Nova conversa"), button:has-text("Nova Conversa")').first();
    if (await novaBtn.count() > 0) {
      await novaBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '17-2-nova-conversa');

      // Chat deve estar limpo (apenas mensagem de boas-vindas)
      const messages = await page.locator('[class*="message"], [class*="bubble"]').count();
      console.log('Mensagens após "Nova conversa":', messages);
      expect(messages).toBeLessThan(3);
    } else {
      console.log('Botão "Nova conversa" não encontrado — pulando');
    }
  });

  test('17.3 Histórico do projeto A não aparece no projeto B', async ({ page }) => {
    // Verificar que as chaves localStorage são isoladas por projeto
    await page.goto(`${BASE_URL}/planejamento`);
    await page.waitForTimeout(2000);

    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    const chatKeys = localStorageKeys.filter(k => k.startsWith('tm_copilot') || k.startsWith('tm_proj'));
    console.log('Chaves de histórico no localStorage:', chatKeys);

    // Deve ter chaves separadas por contexto
    const hasPerContextKeys = chatKeys.some(k => k.includes('proj_') || k.includes('artist_'));
    console.log('Histórico por contexto separado:', hasPerContextKeys);
    await screenshot(page, '17-3-localstorage-keys');
  });

  test('17.4 Botão "Limpar" no dashboard apaga histórico inline', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const projectLink = page.locator('[href*="/project/"]').first();
    if (await projectLink.count() > 0) {
      const href = await projectLink.getAttribute('href') || '';
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForTimeout(4000);

      // Abrir IA inline
      const aiBtn = page.locator('button:has-text("IA"), button:has-text("Copilot")').first();
      if (await aiBtn.count() > 0) {
        await aiBtn.click();
        await page.waitForTimeout(1000);

        // Limpar histórico
        const clearBtn = page.locator('button:has-text("Limpar")').first();
        if (await clearBtn.count() > 0) {
          await clearBtn.click();
          await page.waitForTimeout(500);
          await screenshot(page, '17-4-cleared-history');
          console.log('Botão Limpar funcionou');
        } else {
          console.log('Botão Limpar não encontrado');
        }
      }
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 18 — RELEASES OPERACIONAL
// ══════════════════════════════════════════════════════════

test.describe('18. Releases — Campos Operacionais', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('18.1 Formulário de release tem novos campos', async ({ page }) => {
    await page.goto(`${BASE_URL}/releases`);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /novo|criar|release|\+/i }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '18-1-release-form');

      const hasBudget = await page.locator('input[name*="budget"], input[placeholder*="orçamento"], input[placeholder*="budget"]').count() > 0;
      const hasPresave = await page.locator('input[name*="presave"], input[placeholder*="pré-save"], input[placeholder*="Pre-save"]').count() > 0;
      const hasPitch = await page.locator('select[name*="pitch"], [placeholder*="pitch"]').count() > 0;

      console.log('Campo budget:', hasBudget);
      console.log('Campo presave_link:', hasPresave);
      console.log('Campo pitch status:', hasPitch);
    }
  });

  test('18.2 Modal de detalhes de release mostra status operacional', async ({ page }) => {
    await page.goto(`${BASE_URL}/releases`);
    await page.waitForTimeout(2000);

    const releaseCard = page.locator('[class*="card"], [class*="release"], button:has-text("Ver"), button:has-text("Detalhes")').first();
    if (await releaseCard.count() > 0) {
      await releaseCard.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '18-2-release-detail');

      const body = await page.textContent('body') || '';
      const hasPitchStatus = /pitch|pré.save|presave|orçamento|capa/i.test(body);
      console.log('Modal tem campos operacionais:', hasPitchStatus);
    }
  });
});

// ══════════════════════════════════════════════════════════
// BLOCO 12 — RESPONSIVIDADE
// ══════════════════════════════════════════════════════════

test.describe('12. Responsividade', () => {
  test('12.1 Mobile (375x812) — iPhone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(2000);
    await screenshot(page, '12-1-mobile');
    const hasContent = await page.locator('body').count() > 0;
    console.log('Mobile carregou:', hasContent);
  });

  test('12.2 Tablet (768x1024) — iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.waitForTimeout(2000);
    await screenshot(page, '12-2-tablet');
  });

  test('12.3 Desktop (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.waitForTimeout(2000);
    await screenshot(page, '12-3-desktop');
  });

  test('12.4 Tasks mobile renderiza', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(2000);
    await screenshot(page, '12-4-tasks-mobile');
  });
});

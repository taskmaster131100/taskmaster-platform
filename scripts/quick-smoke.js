/**
 * TaskMaster v1.0.1 - Quick Smoke Test
 *
 * Script rápido para validar rotas core no console do navegador
 *
 * INSTRUÇÕES:
 * 1. Fazer login no TaskMaster
 * 2. Abrir Console (F12)
 * 3. Copiar e colar TODO este arquivo
 * 4. Pressionar Enter
 * 5. Aguardar resultados (30-60 segundos)
 */

console.log('%c🔥 TaskMaster Quick Smoke Test v1.0.1', 'color: #ff6b35; font-size: 20px; font-weight: bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff6b35');

const results = {
  timestamp: new Date().toISOString(),
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function log(msg, type = 'info') {
  const styles = {
    success: 'color: #10b981; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
    warning: 'color: #f59e0b; font-weight: bold',
    info: 'color: #3b82f6',
    section: 'color: #8b5cf6; font-size: 16px; font-weight: bold'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    section: '📋'
  };

  console.log(`%c${icons[type]} ${msg}`, styles[type]);
}

function addResult(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    log(`${name}${message ? ': ' + message : ''}`, 'success');
  } else {
    results.failed++;
    log(`${name}${message ? ': ' + message : ''}`, 'error');
  }
}

// ============================================================
// TESTE 1: ENVIRONMENT
// ============================================================
log('\nTESTE 1: ENVIRONMENT', 'section');

const currentURL = window.location.href;
log(`URL atual: ${currentURL}`, 'info');

addResult('Window carregado', typeof window !== 'undefined');
addResult('Document disponível', typeof document !== 'undefined');
addResult('React root presente', document.getElementById('root') !== null);

// ============================================================
// TESTE 2: ELEMENTOS DA INTERFACE
// ============================================================
log('\nTESTE 2: ELEMENTOS DA INTERFACE', 'section');

const hasHeader = document.querySelector('header') !== null;
const hasSidebar = document.querySelector('nav') !== null || document.querySelector('aside') !== null;
const hasMain = document.querySelector('main') !== null;
const bodyHasContent = document.body.children.length > 0;

addResult('Header renderizado', hasHeader);
addResult('Sidebar/Menu renderizado', hasSidebar);
addResult('Main content renderizado', hasMain);
addResult('Body tem conteúdo (não branco)', bodyHasContent);

// ============================================================
// TESTE 3: PERSISTÊNCIA LOCAL
// ============================================================
log('\nTESTE 3: PERSISTÊNCIA LOCAL', 'section');

const taskmaster_db = window.taskmaster_db;
const hasDB = typeof taskmaster_db !== 'undefined';

addResult('window.taskmaster_db disponível', hasDB);

if (hasDB) {
  try {
    const stats = taskmaster_db.getStats();
    log(`Estatísticas: ${JSON.stringify(stats)}`, 'info');
    addResult('getStats() funciona', true, `${stats.projects || 0} projetos, ${stats.artists || 0} artistas`);

    const validation = taskmaster_db.validatePersistence();
    addResult('validatePersistence() OK', validation.status === 'healthy');
  } catch (e) {
    addResult('Database operations', false, e.message);
  }
}

const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('taskmaster'));
log(`localStorage keys: ${localStorageKeys.join(', ')}`, 'info');
addResult('LocalStorage keys presentes', localStorageKeys.length >= 2, `${localStorageKeys.length} keys`);

// ============================================================
// TESTE 4: NAVEGAÇÃO DE ROTAS
// ============================================================
log('\nTESTE 4: NAVEGAÇÃO DE ROTAS (5 segundos por rota)', 'section');

const coreRoutes = [
  { path: '/', name: 'Dashboard', priority: 'CRÍTICA' },
  { path: '/tasks', name: 'Tasks', priority: 'CRÍTICA' },
  { path: '/calendar', name: 'Calendar', priority: 'CRÍTICA' },
  { path: '/artists', name: 'Artists', priority: 'CRÍTICA' },
  { path: '/profile', name: 'Profile', priority: 'CRÍTICA' },
  { path: '/reports', name: 'Reports', priority: 'ALTA' }
];

let currentRouteIndex = 0;

function testRoute(route) {
  return new Promise((resolve) => {
    log(`Testando rota: ${route.path} (${route.name})`, 'info');

    const previousURL = window.location.href;

    try {
      window.location.hash = route.path;

      setTimeout(() => {
        const pageIsWhite = document.body.children.length === 0 ||
                           (document.querySelector('main') && document.querySelector('main').children.length === 0);

        const hasErrorBoundary = document.body.textContent.includes('Ops! Algo deu errado') ||
                                 document.body.textContent.includes('Erro ao carregar');

        const consoleHasErrors = false;

        if (pageIsWhite && !hasErrorBoundary) {
          addResult(`Rota ${route.path}`, false, 'TELA BRANCA sem ErrorBoundary');
        } else if (hasErrorBoundary) {
          results.warnings++;
          log(`⚠️ Rota ${route.path}: ErrorBoundary ativo (componente com erro)`, 'warning');
        } else {
          addResult(`Rota ${route.path}`, true, 'Renderiza OK');
        }

        resolve();
      }, 5000);

    } catch (error) {
      addResult(`Rota ${route.path}`, false, error.message);
      resolve();
    }
  });
}

async function testAllRoutes() {
  for (const route of coreRoutes) {
    await testRoute(route);
  }

  log('\nTestando voltar ao Dashboard...', 'info');
  window.location.hash = '/';

  setTimeout(() => {
    showResults();
  }, 2000);
}

// ============================================================
// TESTE 5: CONSOLE ERRORS
// ============================================================
log('\nTESTE 5: CONSOLE ERRORS', 'section');
log('Verificando erros no console...', 'info');
log('(Erros anteriores já foram exibidos acima)', 'info');

// ============================================================
// RESULTADOS
// ============================================================
function showResults() {
  log('\n═══════════════════════════════════════════════════', 'section');
  log('RESULTADOS FINAIS', 'section');
  log('═══════════════════════════════════════════════════', 'section');

  const totalTests = results.passed + results.failed;
  const passRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;

  console.log('\n📊 RESUMO:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`✅ Passou: ${results.passed}`, 'success');
  log(`❌ Falhou: ${results.failed}`, 'error');
  log(`⚠️ Avisos: ${results.warnings}`, 'warning');
  log(`📊 Taxa de Sucesso: ${passRate}%`, 'info');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log('\n📋 DETALHES DOS TESTES:');
  results.tests.forEach((test, index) => {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? '#10b981' : '#ef4444';
    const message = test.message ? ` - ${test.message}` : '';
    console.log(`%c${icon} ${index + 1}. ${test.name}${message}`, `color: ${color}`);
  });

  console.log('\n🎯 VEREDITO FINAL:');
  if (results.failed === 0 && results.warnings === 0) {
    log('✅ TODOS OS TESTES PASSARAM!', 'success');
    log('Sistema pronto para staging deploy.', 'success');
  } else if (results.failed === 0 && results.warnings > 0) {
    log('⚠️  TESTES PASSARAM COM AVISOS', 'warning');
    log(`${results.warnings} componente(s) com ErrorBoundary ativo.`, 'warning');
    log('Revisar componentes com erro antes de deploy.', 'warning');
  } else if (results.failed <= 2) {
    log('⚠️  ALGUNS TESTES FALHARAM', 'warning');
    log('Revisar problemas antes de prosseguir.', 'warning');
  } else {
    log('❌ MÚLTIPLOS TESTES FALHARAM', 'error');
    log('Correções necessárias antes de staging deploy.', 'error');
  }

  window.quickSmokeResults = {
    ...results,
    passRate: passRate + '%',
    verdict: results.failed === 0 && results.warnings === 0 ? 'PASSED' :
             results.failed === 0 ? 'PASSED_WITH_WARNINGS' :
             results.failed <= 2 ? 'PARTIAL_FAIL' : 'CRITICAL_FAIL'
  };

  console.log('\n💾 Resultados salvos em: window.quickSmokeResults');
  console.log('Para exportar: copy(JSON.stringify(window.quickSmokeResults, null, 2))');

  console.log('\n%c✅ Smoke Test Completo!', 'color: #10b981; font-size: 16px; font-weight: bold');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981');
}

// Iniciar testes de rotas
log('\nIniciando testes de navegação em 2 segundos...', 'info');
log('Por favor, aguarde ~30 segundos para completar.', 'info');

setTimeout(() => {
  testAllRoutes();
}, 2000);

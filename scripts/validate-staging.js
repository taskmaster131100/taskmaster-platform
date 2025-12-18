/**
 * TaskMaster v1.0.1 - Script de Validação Staging
 *
 * INSTRUÇÕES:
 * 1. Acessar staging.taskmaster.app
 * 2. Fazer login como admin
 * 3. Abrir Console (F12)
 * 4. Copiar e colar TODO este arquivo
 * 5. Pressionar Enter
 * 6. Aguardar resultados
 */

console.log('%c🚀 TaskMaster Staging Validation Script v1.0.1', 'color: cyan; font-size: 18px; font-weight: bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan');

// Utility functions
const logger = {
  success: (msg) => console.log(`%c✅ ${msg}`, 'color: green; font-weight: bold'),
  error: (msg) => console.log(`%c❌ ${msg}`, 'color: red; font-weight: bold'),
  warning: (msg) => console.log(`%c⚠️  ${msg}`, 'color: orange; font-weight: bold'),
  info: (msg) => console.log(`%cℹ️  ${msg}`, 'color: blue'),
  section: (msg) => console.log(`%c\n📋 ${msg}`, 'color: cyan; font-size: 16px; font-weight: bold'),
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addResult(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    logger.success(`${name}${message ? ': ' + message : ''}`);
  } else {
    results.failed++;
    logger.error(`${name}${message ? ': ' + message : ''}`);
  }
}

// ============================================================
// SEÇÃO 1: AMBIENTE E VARIÁVEIS
// ============================================================
logger.section('SEÇÃO 1: AMBIENTE E VARIÁVEIS');

// Check URL
const currentURL = window.location.href;
const isStaging = currentURL.includes('staging.taskmaster.app') || currentURL.includes('vercel.app');
addResult('URL Staging', isStaging, currentURL);

// Check HTTPS
const isHTTPS = window.location.protocol === 'https:';
addResult('HTTPS Ativo', isHTTPS);

// Check environment variables
const envVars = {
  'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
  'VITE_APP_ENV': import.meta.env.VITE_APP_ENV,
  'VITE_BETA_MODE': import.meta.env.VITE_BETA_MODE,
  'VITE_FEATURE_BILLING': import.meta.env.VITE_FEATURE_BILLING,
  'VITE_FEATURE_SUBSCRIPTIONS': import.meta.env.VITE_FEATURE_SUBSCRIPTIONS,
};

console.log('\n📊 Variáveis de Ambiente:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

addResult('Supabase URL', envVars.VITE_SUPABASE_URL?.includes('supabase.co'));
addResult('App Env = staging', envVars.VITE_APP_ENV === 'staging');
addResult('Beta Mode = true', envVars.VITE_BETA_MODE === 'true' || envVars.VITE_BETA_MODE === true);
addResult('Billing = false', envVars.VITE_FEATURE_BILLING === 'false' || envVars.VITE_FEATURE_BILLING === false);
addResult('Subscriptions = false', envVars.VITE_FEATURE_SUBSCRIPTIONS === 'false' || envVars.VITE_FEATURE_SUBSCRIPTIONS === false);

// ============================================================
// SEÇÃO 2: DATABASE E PERSISTÊNCIA
// ============================================================
logger.section('SEÇÃO 2: DATABASE E PERSISTÊNCIA');

// Check taskmaster_db
const hasDB = typeof window.taskmaster_db !== 'undefined';
addResult('window.taskmaster_db disponível', hasDB);

if (hasDB) {
  try {
    // Get stats
    const stats = window.taskmaster_db.getStats();
    console.log('\n📊 Estatísticas do Database:');
    console.log(stats);

    addResult('getStats() funciona', true);

    // Validate persistence
    const validationResult = window.taskmaster_db.validatePersistence();
    console.log('\n🔍 Validação de Persistência:', validationResult);
    addResult('validatePersistence() OK', validationResult.status === 'healthy');

    // Check localStorage keys
    const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('taskmaster'));
    console.log('\n🔑 LocalStorage Keys:', localStorageKeys);
    addResult('LocalStorage keys presentes', localStorageKeys.length >= 3, `${localStorageKeys.length} keys`);

    // Test backup
    try {
      const backup = window.taskmaster_db.createBackup();
      const backupSize = (backup.length / 1024).toFixed(2);
      addResult('createBackup() funciona', backup.length > 0, `${backupSize} KB`);
    } catch (e) {
      addResult('createBackup() funciona', false, e.message);
    }

    // Get logs
    const logs = window.taskmaster_db.getLogs();
    console.log(`\n📝 Total de Logs: ${logs.length}`);
    if (logs.length > 0) {
      console.log('Últimos 3 logs:');
      logs.slice(-3).forEach(log => console.log(log));
    }
    addResult('getLogs() funciona', Array.isArray(logs));

  } catch (e) {
    addResult('Database Operations', false, e.message);
  }
} else {
  logger.warning('taskmaster_db não disponível - testes de database ignorados');
}

// ============================================================
// SEÇÃO 3: ELEMENTOS DA INTERFACE
// ============================================================
logger.section('SEÇÃO 3: ELEMENTOS DA INTERFACE');

// Check if on main page
const isMainPage = window.location.pathname === '/' || window.location.pathname === '/index.html';

if (isMainPage) {
  // Check header
  const hasHeader = document.querySelector('header') !== null;
  addResult('Header renderizado', hasHeader);

  // Check sidebar/menu
  const hasSidebar = document.querySelector('nav') !== null || document.querySelector('aside') !== null;
  addResult('Menu lateral renderizado', hasSidebar);

  // Check main content
  const hasMain = document.querySelector('main') !== null;
  addResult('Conteúdo principal renderizado', hasMain);
} else {
  logger.info(`Página atual: ${window.location.pathname}`);
  logger.info('Execute este script na página principal (/) para validar elementos');
}

// Check for React root
const hasReactRoot = document.getElementById('root') !== null;
addResult('React root presente', hasReactRoot);

// Check if content is loaded (not white screen)
const bodyHasContent = document.body.children.length > 0;
addResult('Página não está em branco', bodyHasContent);

// ============================================================
// SEÇÃO 4: CONSOLE ERRORS
// ============================================================
logger.section('SEÇÃO 4: ERROS NO CONSOLE');

// Note: This script can't access console errors that happened before it ran
logger.info('Verifique visualmente o console para erros em vermelho');
logger.info('Erros críticos devem estar em 0 (zero)');

// ============================================================
// SEÇÃO 5: ROTAS PRINCIPAIS
// ============================================================
logger.section('SEÇÃO 5: TESTE DE ROTAS');

logger.info('Testando rotas manualmente...');
logger.info('Execute os seguintes comandos um por vez:');

console.log(`
%cPara testar rotas, execute:
%cwindow.location.href = '/tasks';      // TaskBoard
window.location.href = '/calendar';   // Calendar
window.location.href = '/artists';    // Artists
window.location.href = '/profile';    // Profile
window.location.href = '/';           // Voltar ao Dashboard
`, 'color: yellow; font-weight: bold', 'color: white');

// ============================================================
// SEÇÃO 6: BACKUP/RESTORE TEST
// ============================================================
logger.section('SEÇÃO 6: TESTE DE BACKUP/RESTORE');

if (hasDB) {
  console.log(`
%cPara testar Backup/Restore, execute:
%c// 1. Criar backup
const backup = window.taskmaster_db.createBackup();
console.log('Backup criado:', backup.length, 'characters');

// 2. Salvar stats atuais
const statsBefore = window.taskmaster_db.getStats();
console.log('Stats antes:', statsBefore);

// 3. Limpar tudo
window.taskmaster_db.clearAll();
console.log('Dados limpos');

// 4. Verificar vazio
const statsEmpty = window.taskmaster_db.getStats();
console.log('Stats vazias:', statsEmpty);

// 5. Restaurar
window.taskmaster_db.restoreBackup(backup);
console.log('Backup restaurado');

// 6. Verificar restaurado
const statsAfter = window.taskmaster_db.getStats();
console.log('Stats depois:', statsAfter);

// 7. Comparar
console.log('Match?', JSON.stringify(statsBefore) === JSON.stringify(statsAfter));
`, 'color: yellow; font-weight: bold', 'color: white');
}

// ============================================================
// SEÇÃO 7: RESUMO FINAL
// ============================================================
logger.section('RESUMO FINAL');

const totalTests = results.passed + results.failed;
const passRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;

console.log('\n📊 RESULTADOS:');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`%c✅ Passou: ${results.passed}`, 'color: green; font-weight: bold');
console.log(`%c❌ Falhou: ${results.failed}`, 'color: red; font-weight: bold');
console.log(`%c📊 Taxa de Sucesso: ${passRate}%`, 'color: cyan; font-weight: bold');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

// Detailed results
console.log('\n📋 DETALHES DOS TESTES:');
results.tests.forEach((test, index) => {
  const icon = test.passed ? '✅' : '❌';
  const color = test.passed ? 'green' : 'red';
  const message = test.message ? ` - ${test.message}` : '';
  console.log(`%c${icon} ${index + 1}. ${test.name}${message}`, `color: ${color}`);
});

// Final verdict
console.log('\n🎯 VEREDITO FINAL:');
if (results.failed === 0) {
  console.log('%c✅ STAGING APROVADO!', 'color: green; font-size: 20px; font-weight: bold; background: #00ff0022; padding: 10px');
  console.log('%cTodos os testes passaram. Sistema pronto para testes beta.', 'color: green');
} else if (results.failed <= 2) {
  console.log('%c⚠️  STAGING COM AVISOS', 'color: orange; font-size: 20px; font-weight: bold; background: #ff990022; padding: 10px');
  console.log('%cAlguns testes falharam, mas podem não ser críticos. Revisar problemas.', 'color: orange');
} else {
  console.log('%c❌ STAGING REPROVADO', 'color: red; font-size: 20px; font-weight: bold; background: #ff000022; padding: 10px');
  console.log('%cMúltiplos testes falharam. Necessita correções antes de prosseguir.', 'color: red');
}

// Export results
window.stagingValidationResults = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  passed: results.passed,
  failed: results.failed,
  passRate: passRate + '%',
  tests: results.tests,
  verdict: results.failed === 0 ? 'APPROVED' : results.failed <= 2 ? 'WARNING' : 'REJECTED'
};

console.log('\n💾 Resultados salvos em: window.stagingValidationResults');
console.log('Para exportar resultados: copy(JSON.stringify(window.stagingValidationResults, null, 2))');

console.log('\n%c✅ Validação Completa!', 'color: cyan; font-size: 16px; font-weight: bold');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: cyan');

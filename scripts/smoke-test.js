#!/usr/bin/env node

/**
 * Smoke Test - TaskMaster Beta
 *
 * Testa funcionalidades críticas após deploy
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/smoke-test.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || 'https://app.taskmaster.works';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️ ', message, colors.blue);
}

function logWarning(message) {
  log('⚠️ ', message, colors.yellow);
}

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logError('Variáveis de ambiente não configuradas!');
  console.log('\nConfigure:');
  console.log('  export VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('  export VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Testes
const tests = [];
let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  process.stdout.write(`\n🧪 ${name}... `);
  try {
    await fn();
    logSuccess('PASSED');
    passedTests++;
    tests.push({ name, status: 'passed' });
  } catch (error) {
    logError(`FAILED: ${error.message}`);
    failedTests++;
    tests.push({ name, status: 'failed', error: error.message });
  }
}

async function runSmokeTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 TaskMaster Beta - Smoke Tests');
  console.log('='.repeat(60));
  logInfo(`App URL: ${APP_URL}`);
  logInfo(`Supabase: ${SUPABASE_URL}`);
  console.log('='.repeat(60));

  // Test 1: Healthcheck
  await test('Healthcheck (health.json acessível)', async () => {
    const response = await fetch(`${APP_URL}/health.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== 'healthy') throw new Error('Status não é healthy');
  });

  // Test 2: Supabase Connection
  await test('Supabase Connection', async () => {
    const { data, error } = await supabase.from('invite_codes').select('count').limit(1);
    if (error) throw error;
  });

  // Test 3: Beta User Logs Table
  await test('Beta User Logs Table existe', async () => {
    const { error } = await supabase.from('beta_user_logs').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = empty table (ok)
  });

  // Test 4: Get Beta Stats Function
  await test('Função get_beta_user_stats() funciona', async () => {
    const { data, error } = await supabase.rpc('get_beta_user_stats');
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Retorno inválido');
  });

  // Test 5: Invite Codes Disponíveis
  await test('Invite Codes disponíveis', async () => {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('code')
      .eq('used_count', 0)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Nenhum código disponível');
  });

  // Test 6: RLS em beta_user_logs
  await test('RLS ativo em beta_user_logs', async () => {
    // Tentar inserir sem autenticação deve falhar
    const { error } = await supabase.from('beta_user_logs').insert({
      email: 'test@test.com',
      account_type: 'artist'
    });
    if (!error) throw new Error('RLS não está ativo! Inserção não deveria funcionar.');
    // Erro esperado = sucesso do teste
  });

  // Test 7: Organizations Table
  await test('Organizations Table existe', async () => {
    const { error } = await supabase.from('organizations').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
  });

  // Test 8: Projects Table
  await test('Projects Table existe', async () => {
    const { error } = await supabase.from('projects').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
  });

  // Test 9: Tasks Table
  await test('Tasks Table existe', async () => {
    const { error } = await supabase.from('tasks').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
  });

  // Test 10: Approvals Table
  await test('Approvals Table existe', async () => {
    const { error } = await supabase.from('approvals').select('count').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
  });

  // Resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(60));
  console.log(`Total de testes: ${tests.length}`);
  logSuccess(`Passou: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Falhou: ${failedTests}`);
  }
  console.log('='.repeat(60));

  if (failedTests > 0) {
    console.log('\n❌ Testes falhados:');
    tests.filter(t => t.status === 'failed').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    logSuccess('\n✨ Todos os testes passaram! Sistema pronto para uso.');
    process.exit(0);
  }
}

// Executar
runSmokeTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});

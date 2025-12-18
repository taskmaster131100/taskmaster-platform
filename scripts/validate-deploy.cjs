#!/usr/bin/env node

/**
 * VALIDAÇÃO RÁPIDA DO DEPLOY
 *
 * Este script verifica se as correções do Sprint Beta estão presentes
 * nos arquivos compilados do bundle de produção.
 *
 * Uso:
 *   node scripts/validate-deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDANDO DEPLOY DO SPRINT BETA CORRECTIONS\n');

const checks = [];

// 1. Verificar se dist/ existe
const distExists = fs.existsSync(path.join(__dirname, '../dist'));
checks.push({
  name: 'Build Output Exists',
  passed: distExists,
  message: distExists ? '✅ Folder dist/ exists' : '❌ Folder dist/ NOT FOUND - Run: npm run build'
});

if (!distExists) {
  console.log('\n❌ ERRO: Pasta dist/ não encontrada!');
  console.log('Execute: npm run build\n');
  process.exit(1);
}

// 2. Verificar se arquivos críticos foram compilados
const criticalFiles = [
  'dist/assets/PlanningDashboard-*.js',
  'dist/assets/OrganizationDashboard-*.js',
  'dist/assets/FileLibrary-*.js',
  'dist/assets/MusicHub-*.js',
  'dist/assets/MainLayout-*.js',
  'dist/assets/SimpleComponents-*.js'
];

const distAssetsPath = path.join(__dirname, '../dist/assets');
const compiledFiles = fs.existsSync(distAssetsPath)
  ? fs.readdirSync(distAssetsPath)
  : [];

criticalFiles.forEach(pattern => {
  const filename = pattern.replace('dist/assets/', '').replace('-*.js', '');
  const found = compiledFiles.some(f => f.includes(filename));
  checks.push({
    name: `${filename} Compiled`,
    passed: found,
    message: found ? `✅ ${filename} found in bundle` : `❌ ${filename} NOT FOUND`
  });
});

// 3. Verificar código fonte
const sourceChecks = [
  {
    file: 'src/components/PlanningDashboard.tsx',
    pattern: 'Anexar Projeto',
    name: 'Botão Anexar Projeto'
  },
  {
    file: 'src/components/OrganizationDashboard.tsx',
    pattern: "onClick: () => navigate('/artistas')",
    name: 'Dashboard Cards Clicáveis'
  },
  {
    file: 'src/components/FileLibrary.tsx',
    pattern: 'export default function FileLibrary',
    name: 'FileLibrary Export Default'
  },
  {
    file: 'src/components/music/MusicHub.tsx',
    pattern: 'showSongModal',
    name: 'MusicHub Modals'
  },
  {
    file: 'src/components/SimpleComponents.tsx',
    pattern: '<option>Samba</option>',
    name: 'Gêneros Expandidos'
  },
  {
    file: 'src/components/MainLayout.tsx',
    pattern: "localStorage.setItem('sidebarOpen'",
    name: 'Menu Lateral Persistência'
  }
];

sourceChecks.forEach(check => {
  const filePath = path.join(__dirname, '..', check.file);
  let found = false;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    found = content.includes(check.pattern);
  }

  checks.push({
    name: check.name,
    passed: found,
    message: found ? `✅ ${check.name} OK` : `❌ ${check.name} MISSING`
  });
});

// 4. Verificar tamanho dos bundles
const bundleSizes = {
  'PlanningDashboard': { min: 40000, max: 50000 },
  'MusicHub': { min: 14000, max: 18000 },
  'FileLibrary': { min: 18000, max: 22000 }
};

Object.entries(bundleSizes).forEach(([name, size]) => {
  const file = compiledFiles.find(f => f.includes(name));
  if (file) {
    const filePath = path.join(distAssetsPath, file);
    const stats = fs.statSync(filePath);
    const inRange = stats.size >= size.min && stats.size <= size.max;
    checks.push({
      name: `${name} Bundle Size`,
      passed: inRange,
      message: inRange
        ? `✅ ${name}: ${(stats.size / 1024).toFixed(2)} KB`
        : `⚠️ ${name}: ${(stats.size / 1024).toFixed(2)} KB (expected ${(size.min/1024).toFixed(0)}-${(size.max/1024).toFixed(0)} KB)`
    });
  }
});

// 5. Imprimir resultados
console.log('📋 RESULTADOS DA VALIDAÇÃO:\n');

const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = ((passed / total) * 100).toFixed(0);

checks.forEach(check => {
  console.log(check.message);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 SCORE: ${passed}/${total} checks passed (${percentage}%)\n`);

if (passed === total) {
  console.log('✅ ✅ ✅ TUDO CERTO! BUILD VÁLIDO! ✅ ✅ ✅\n');
  console.log('Próximos passos:');
  console.log('1. Commit das alterações: git add . && git commit -m "fix: Sprint Beta Corrections"');
  console.log('2. Push para produção: git push origin main');
  console.log('3. Aguardar deploy automático (~2-5 minutos)');
  console.log('4. Testar em produção usando checklist no DEPLOY_ISSUE_RESOLUTION.md\n');
  process.exit(0);
} else {
  console.log('⚠️ ATENÇÃO: Alguns checks falharam!\n');
  console.log('Verifique os itens marcados com ❌ acima.');
  console.log('Execute "npm run build" novamente se necessário.\n');
  process.exit(1);
}

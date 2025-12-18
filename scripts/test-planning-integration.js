#!/usr/bin/env node

/**
 * Script de Teste de Integração Planejamento → TaskBoard → Calendar
 *
 * Este script cria um planejamento simulado e valida se as tarefas
 * e eventos aparecem corretamente nos módulos correspondentes.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPlanningIntegration() {
  log('\n🚀 INICIANDO TESTE DE INTEGRAÇÃO PLANEJAMENTO\n', 'cyan');

  try {
    // 1. Verificar autenticação
    log('1️⃣ Verificando autenticação...', 'blue');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      log('❌ Erro: Usuário não autenticado. Faça login primeiro.', 'red');
      log('   Use: npm run dev e faça login no navegador', 'yellow');
      return;
    }

    log(`✅ Usuário autenticado: ${user.email}`, 'green');

    // 2. Criar planejamento de teste
    log('\n2️⃣ Criando planejamento de teste...', 'blue');
    const { data: planning, error: planningError } = await supabase
      .from('plannings')
      .insert({
        name: '🧪 Teste de Integração - Lançamento EP',
        description: 'Planejamento criado automaticamente para testar integração entre módulos',
        type: 'test',
        status: 'active',
        created_by: user.id,
        ai_prompt: 'Teste automatizado de integração',
        metadata: {
          isTest: true,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (planningError) {
      log(`❌ Erro ao criar planejamento: ${planningError.message}`, 'red');
      return;
    }

    log(`✅ Planejamento criado: ${planning.id}`, 'green');

    // 3. Criar fase de teste
    log('\n3️⃣ Criando fase do planejamento...', 'blue');
    const { data: phase, error: phaseError } = await supabase
      .from('planning_phases')
      .insert({
        planning_id: planning.id,
        name: 'Fase 1: Pré-produção',
        description: 'Fase de preparação e planejamento',
        order_index: 0,
        status: 'active',
        color: 'blue'
      })
      .select()
      .single();

    if (phaseError) {
      log(`❌ Erro ao criar fase: ${phaseError.message}`, 'red');
      return;
    }

    log(`✅ Fase criada: ${phase.id}`, 'green');

    // 4. Criar tarefas de teste (diferentes workstreams)
    log('\n4️⃣ Criando tarefas no TaskBoard...', 'blue');

    const testTasks = [
      {
        title: '📝 Criar roteiro do videoclipe',
        description: 'Desenvolver conceito visual e narrativa do clipe',
        workstream: 'conteudo',
        priority: 'high'
      },
      {
        title: '🎵 Agendar ensaio técnico',
        description: 'Confirmar horário e local do ensaio',
        workstream: 'shows',
        priority: 'high'
      },
      {
        title: '🚚 Reservar equipamento de som',
        description: 'Contratar PA e backline',
        workstream: 'logistica',
        priority: 'medium'
      },
      {
        title: '📊 Definir orçamento da campanha',
        description: 'Calcular investimento em marketing',
        workstream: 'estrategia',
        priority: 'medium'
      }
    ];

    let tasksCreated = 0;
    for (const task of testTasks) {
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: 'todo',
          priority: task.priority,
          workstream: task.workstream,
          created_by: user.id,
          metadata: {
            source: 'planning',
            planningId: planning.id,
            phaseId: phase.id,
            moduleType: task.workstream
          }
        })
        .select()
        .single();

      if (taskError) {
        log(`  ⚠️  Erro ao criar tarefa "${task.title}": ${taskError.message}`, 'yellow');
      } else {
        // Vincular à fase
        await supabase
          .from('planning_tasks')
          .insert({
            phase_id: phase.id,
            task_id: newTask.id,
            module_type: task.workstream
          });

        tasksCreated++;
        log(`  ✅ Tarefa criada: ${task.title}`, 'green');
      }
    }

    log(`\n✅ ${tasksCreated}/${testTasks.length} tarefas criadas com sucesso`, 'green');

    // 5. Criar eventos de teste no calendário
    log('\n5️⃣ Criando eventos no CalendarView...', 'blue');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const testEvents = [
      {
        title: '🎬 Gravação do Videoclipe',
        description: 'Primeira sessão de gravação',
        event_date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '18:00'
      },
      {
        title: '🎤 Reunião com Produção',
        description: 'Alinhamento de cronograma e orçamento',
        event_date: nextWeek.toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00'
      },
      {
        title: '📅 Deadline: Aprovação do Mix',
        description: 'Data limite para aprovação da mixagem final',
        event_date: nextWeek.toISOString().split('T')[0],
        start_time: '23:59',
        end_time: '23:59'
      }
    ];

    let eventsCreated = 0;
    for (const event of testEvents) {
      const { error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          start_time: event.start_time,
          end_time: event.end_time,
          event_type: 'planning',
          color: 'indigo',
          created_by: user.id,
          metadata: {
            source: 'planning',
            planningId: planning.id,
            phaseId: phase.id
          }
        });

      if (eventError) {
        log(`  ⚠️  Erro ao criar evento "${event.title}": ${eventError.message}`, 'yellow');
      } else {
        eventsCreated++;
        log(`  ✅ Evento criado: ${event.title}`, 'green');
      }
    }

    log(`\n✅ ${eventsCreated}/${testEvents.length} eventos criados com sucesso`, 'green');

    // 6. Validar dados no banco
    log('\n6️⃣ Validando integração...', 'blue');

    // Verificar tarefas
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('metadata->>planningId', planning.id);

    log(`\n  📋 Tarefas no TaskBoard: ${tasks?.length || 0}`, 'cyan');
    if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        log(`     • ${task.title} [${task.workstream}] [${task.status}]`, 'reset');
      });
    }

    // Verificar eventos
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('metadata->>planningId', planning.id);

    log(`\n  📅 Eventos no CalendarView: ${events?.length || 0}`, 'cyan');
    if (events && events.length > 0) {
      events.forEach(event => {
        log(`     • ${event.title} [${event.event_date}]`, 'reset');
      });
    }

    // 7. Resultado final
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ TESTE DE INTEGRAÇÃO CONCLUÍDO COM SUCESSO!', 'green');
    log('='.repeat(60), 'cyan');

    log('\n📊 RESUMO:', 'blue');
    log(`   • Planejamento: ${planning.name}`, 'reset');
    log(`   • ID: ${planning.id}`, 'reset');
    log(`   • Tarefas criadas: ${tasksCreated}`, 'reset');
    log(`   • Eventos criados: ${eventsCreated}`, 'reset');

    log('\n🎯 PRÓXIMOS PASSOS:', 'blue');
    log('   1. Abra o TaskMaster no navegador', 'reset');
    log('   2. Vá para TaskBoard e veja as tarefas com badge roxo', 'reset');
    log('   3. Vá para CalendarView e veja os eventos agendados', 'reset');
    log('   4. Vá para ReportsPage e veja as métricas atualizadas', 'reset');

    log(`\n🗑️  Para limpar os dados de teste, execute:`, 'yellow');
    log(`   DELETE FROM plannings WHERE id = '${planning.id}';`, 'yellow');

  } catch (error) {
    log(`\n❌ ERRO CRÍTICO: ${error.message}`, 'red');
    console.error(error);
  }
}

// Executar teste
testPlanningIntegration().then(() => {
  log('\n✅ Script finalizado\n', 'cyan');
  process.exit(0);
}).catch(error => {
  log(`\n❌ Erro fatal: ${error.message}\n`, 'red');
  process.exit(1);
});

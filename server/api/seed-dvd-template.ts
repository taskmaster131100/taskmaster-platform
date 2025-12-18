import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const templates = [
      {
        name: "DVD D-90",
        anchor: "event_date",
        workstream: "conteudo",
        spec: {
          tasks: [
            {"title":"Definir repertório","workstream":"conteudo","offsetDays":-85,"priority":"high","requiresApproval":true,"slaHours":24},
            {"title":"Contratar diretor e equipe","workstream":"conteudo","offsetDays":-80,"priority":"high"},
            {"title":"Rider técnico e mapa de palco","workstream":"logistica","offsetDays":-75,"priority":"medium"},
            {"title":"Pré-produção musical","workstream":"conteudo","offsetDays":-70,"priority":"medium"},
            {"title":"Locação e licenças","workstream":"logistica","offsetDays":-65,"priority":"medium"},
            {"title":"Captação de áudio (gravação)","workstream":"conteudo","offsetDays":-7,"priority":"high"},
            {"title":"Gravação do DVD (Dia D)","workstream":"conteudo","offsetDays":0,"priority":"high"},
            {"title":"Edição e coloração","workstream":"conteudo","offsetDays":7,"priority":"medium"},
            {"title":"Distribuição/Marketing","workstream":"estrategia","offsetDays":14,"priority":"medium"}
          ]
        }
      },
      {
        name: "Single D-45",
        anchor: "launch_date",
        workstream: "conteudo",
        spec: {
          tasks: [
            {"title":"Definir capa final","workstream":"conteudo","offsetDays":-30,"priority":"high","requiresApproval":true,"slaHours":24},
            {"title":"Upload master (WAV/24b)","workstream":"conteudo","offsetDays":-28,"priority":"high","dependsOn":["Definir capa final"]},
            {"title":"Distribuição digital","workstream":"estrategia","offsetDays":-21,"priority":"medium","dependsOn":["Upload master (WAV/24b)"]},
            {"title":"Pré-save + campanha","workstream":"estrategia","offsetDays":-21,"priority":"medium","dependsOn":["Distribuição digital"]},
            {"title":"Pitch editorial","workstream":"estrategia","offsetDays":-18,"priority":"medium","dependsOn":["Distribuição digital"]},
            {"title":"Conteúdo social (reels/shorts)","workstream":"conteudo","offsetDays":-14,"priority":"medium"},
            {"title":"Dia D – lançamento","workstream":"estrategia","offsetDays":0,"priority":"high"},
            {"title":"Pós-lançamento (UGC/playlist)","workstream":"estrategia","offsetDays":7,"priority":"low"}
          ]
        }
      },
      {
        name: "Show D-60",
        anchor: "event_date",
        workstream: "shows",
        spec: {
          tasks: [
            {"title":"Confirmar local e data","workstream":"shows","offsetDays":-60,"priority":"high","requiresApproval":true,"slaHours":24},
            {"title":"Rider técnico final","workstream":"logistica","offsetDays":-45,"priority":"medium","dependsOn":["Confirmar local e data"]},
            {"title":"Contratar fornecedores","workstream":"logistica","offsetDays":-40,"priority":"medium","dependsOn":["Confirmar local e data"]},
            {"title":"Campanha de ingressos","workstream":"estrategia","offsetDays":-35,"priority":"medium"},
            {"title":"Transporte & hospedagem","workstream":"logistica","offsetDays":-20,"priority":"medium"},
            {"title":"Checklist de montagem","workstream":"logistica","offsetDays":-2,"priority":"high"},
            {"title":"Show (Dia D)","workstream":"shows","offsetDays":0,"priority":"high"},
            {"title":"Pós-show (relatório)","workstream":"estrategia","offsetDays":3,"priority":"low"}
          ]
        }
      },
      {
        name: "Álbum D-120",
        anchor: "launch_date",
        workstream: "conteudo",
        spec: {
          tasks: [
            {"title":"Seleção de faixas","workstream":"conteudo","offsetDays":-120,"priority":"high","requiresApproval":true,"slaHours":48},
            {"title":"Pré-produção","workstream":"conteudo","offsetDays":-110,"priority":"high","dependsOn":["Seleção de faixas"]},
            {"title":"Gravação","workstream":"conteudo","offsetDays":-90,"priority":"high","dependsOn":["Pré-produção"]},
            {"title":"Mixagem","workstream":"conteudo","offsetDays":-70,"priority":"high","dependsOn":["Gravação"]},
            {"title":"Masterização","workstream":"conteudo","offsetDays":-60,"priority":"high","dependsOn":["Mixagem"]},
            {"title":"Arte do álbum","workstream":"conteudo","offsetDays":-50,"priority":"medium"},
            {"title":"Distribuição digital","workstream":"estrategia","offsetDays":-40,"priority":"medium","dependsOn":["Masterização","Arte do álbum"]},
            {"title":"Campanha de marketing","workstream":"estrategia","offsetDays":-35,"priority":"medium"},
            {"title":"Lançamento","workstream":"estrategia","offsetDays":0,"priority":"high"},
            {"title":"Promoção pós-lançamento","workstream":"estrategia","offsetDays":7,"priority":"medium"}
          ]
        }
      }
    ];

    for (const template of templates) {
      await supabase.from("pipeline_templates").upsert(template, { onConflict: "name" });
    }
    
    return new Response(JSON.stringify({ ok: true, templatesCreated: templates.length }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro ao criar templates:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao criar templates',
      ok: false 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = POST;
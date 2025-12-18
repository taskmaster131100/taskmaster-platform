import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const body = await request.json().catch(() => ({}));
    const { organization_id, user_id, area, severity, message } = body;

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Mensagem de feedback é obrigatória" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar severidade
    const validSeverities = ['low', 'med', 'high'];
    if (severity && !validSeverities.includes(severity)) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Severidade deve ser 'low', 'med' ou 'high'" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inserir feedback
    const { data, error } = await supabase
      .from("feedback")
      .insert({ 
        organization_id, 
        user_id, 
        area: area || null,
        severity: severity || 'low',
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir feedback:', error);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: error.message 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true,
      feedback_id: data.id,
      message: "Feedback enviado com sucesso"
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro interno na API de feedback:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "Erro interno do servidor" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, key);

    const searchParams = new URL(url).searchParams;
    const user_id = searchParams.get('user_id');
    const organization_id = searchParams.get('organization_id');
    const area = searchParams.get('area');
    const severity = searchParams.get('severity');

    let query = supabase
      .from("feedback")
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros se fornecidos
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }
    if (area) {
      query = query.eq('area', area);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar feedback:', error);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: error.message 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      feedback: data || []
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro interno na API de feedback:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "Erro interno do servidor" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const body = await request.json().catch(() => ({}));
    
    // Gerar código único de 8 caracteres
    const code = (Math.random().toString(36).slice(2, 10)).toUpperCase();
    const max_uses = body.max_uses ?? 5;
    const expires_at = body.expires_at ?? null;
    const organization_id = body.organization_id || null;
    const created_by = body.created_by || null;

    // Inserir código de convite
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({ 
        code, 
        max_uses, 
        expires_at,
        organization_id,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar código de convite:', error);
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
      code,
      invite_id: data.id,
      max_uses,
      expires_at
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro interno na API de convites:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Erro interno do servidor' 
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
    const code = searchParams.get('code');

    if (code) {
      // Verificar código específico
      const { data, error } = await supabase
        .from("invite_codes")
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Código não encontrado' 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verificar se o código ainda é válido
      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
      const isMaxUsed = data.used_count >= data.max_uses;

      return new Response(JSON.stringify({ 
        ok: true, 
        code: data,
        valid: !isExpired && !isMaxUsed,
        expired: isExpired,
        max_used: isMaxUsed
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Listar todos os códigos (apenas para admins)
      const { data, error } = await supabase
        .from("invite_codes")
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
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
        invite_codes: data 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Erro interno na API de convites:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Erro interno do servidor' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
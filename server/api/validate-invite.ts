import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const body = await request.json().catch(() => ({}));
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Código de convite é obrigatório" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar código de convite
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Código de convite inválido" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();

    // Verificar se o código expirou
    if (data.expires_at && new Date(data.expires_at) < now) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Código de convite expirado" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar se atingiu o limite de usos
    if (data.used_count >= (data.max_uses ?? 1)) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Código de convite já foi usado o máximo de vezes" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Incrementar contador de uso
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({ 
        used_count: data.used_count + 1 
      })
      .eq("id", data.id);

    if (updateError) {
      console.error('Erro ao atualizar contador de uso:', updateError);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Erro interno ao processar convite" 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true,
      message: "Código de convite válido",
      invite: {
        id: data.id,
        organization_id: data.organization_id,
        remaining_uses: (data.max_uses ?? 1) - (data.used_count + 1)
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro interno na validação de convite:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "Erro interno do servidor" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = POST;
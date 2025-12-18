import type { APIRoute } from "astro";
import { PLANNING_SYSTEM_PROMPT } from "../../src/services/planning/systemPrompt";
import { dispatchPlanningActions } from "../../src/services/planning/dispatchPlanningActions";

async function callLLM(message: string) {
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: PLANNING_SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        temperature: 0.2
      })
    });
    
    if (!resp.ok) {
      throw new Error(`OpenAI API error: ${resp.status}`);
    }
    
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '{"actions":[]}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erro ao chamar LLM:', error);
    // Fallback response for demo
    return {
      actions: [{
        type: "ask",
        payload: {
          question: "Desculpe, estou com problemas técnicos. Pode me contar mais sobre o projeto que quer criar? (ex: Single, Álbum, Show, DVD)"
        }
      }]
    };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { message } = body;
    
    const plan = await callLLM(message || "Olá, quero criar um novo projeto musical");
    const results = await dispatchPlanningActions(plan.actions ?? []);
    
    return new Response(JSON.stringify({ plan, results }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro na API de planejamento:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      plan: { actions: [] },
      results: []
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = POST;
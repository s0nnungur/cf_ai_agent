// src/index.ts

import type {
  DurableObjectNamespace,
  Ai,
} from "@cloudflare/workers-types";

import { ChatMemory } from "./ChatMemory";

export interface Env {
  CHAT_MEMORY: DurableObjectNamespace;
  AI: Ai;  // <-- AI binding included here
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

type ChatMessage = {
  role: string;
  text: string;
};

type ChatRequest = {
  text?: string;
  sessionId?: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      // Basic health check
      if (path === "/" && request.method === "GET") {
        return jsonResponse({ ok: true, message: "Worker is running" });
      }

      // ------------------------------------------------------------------
      //  POST /chat   (DO memory + Workers AI + typed history)
      // ------------------------------------------------------------------
      if (path === "/chat" && request.method === "POST") {
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return jsonResponse(
            { ok: false, error: "Expected application/json" },
            400
          );
        }

        const body = (await request.json()) as ChatRequest;

        if (!body?.text || typeof body.text !== "string" || !body.text.trim()) {
          return jsonResponse(
            { ok: false, error: "Missing or empty 'text' field" },
            400
          );
        }

        // 1. Identify session (later: generate unique IDs client-side)
        const sessionId = body.sessionId ?? "default-session";

        // 2. Get DO instance
        const id = env.CHAT_MEMORY.idFromName(sessionId);
        const stub = env.CHAT_MEMORY.get(id);

        // 3. Append user's message
        await stub.fetch("https://do/append", {
          method: "POST",
          body: JSON.stringify({
            message: { role: "user", text: body.text },
          }),
        });

        // 4. Read history
        const historyRes = await stub.fetch("https://do/list");
        const raw = await historyRes.json();

        const history: ChatMessage[] = Array.isArray(raw)
          ? (raw as ChatMessage[])
          : [];

        // ---------------------------------------------------------
        // 5. Generate AI reply using Workers AI (Llama 3.3)
        // ---------------------------------------------------------
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              ...history.map((m) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.text,
              })),
              {
                role: "user",
                content: body.text,
              }
            ],
            max_tokens: 256,
          }
        );

        // Workers AI text models return one of these fields:
        // { response: string }
        // { result: string }
        // { output_text: string }
       // Cast the AI response to "any" because Workers AI schemas vary by model
        const out: any = aiResponse;

        const reply =
          out?.response ??
          out?.result ??
          out?.output_text ??
          out?.message ??
          out?.messages ??
          JSON.stringify(out) ??
          "I'm sorry, I couldn't generate a response.";


        // 6. Store assistant reply in DO
        await stub.fetch("https://do/append", {
          method: "POST",
          body: JSON.stringify({
            message: { role: "assistant", text: reply },
          }),
        });

        return jsonResponse({
          ok: true,
          reply,
          sessionId,
          history,
        });
      }

      // Fallback route
      return jsonResponse({ ok: false, error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse({ ok: false, error: "Internal server error" }, 500);
    }
  },
};

// Required so Wrangler registers the DO
export { ChatMemory };

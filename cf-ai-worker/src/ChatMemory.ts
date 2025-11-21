import type { DurableObjectState } from "@cloudflare/workers-types";

type ChatMessage = {
  role: string;
  text: string;
};

export class ChatMemory {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // --------------------------
    // POST /append
    // --------------------------
    if (url.pathname.endsWith("/append") && request.method === "POST") {
      // request.json() returns unknown → cast to expected shape
      const body = (await request.json()) as {
        message: ChatMessage;
      };

      const message = body.message;

      // list can be anything → assert type
      const list = (await this.state.storage.get("messages")) as ChatMessage[] | undefined;

      const updated: ChatMessage[] = list ? [...list, message] : [message];

      await this.state.storage.put("messages", updated);

      return new Response("ok");
    }

    // --------------------------
    // GET /list
    // --------------------------
    if (url.pathname.endsWith("/list") && request.method === "GET") {
      const list = (await this.state.storage.get("messages")) as ChatMessage[] | undefined;
      const safeList = list ?? [];

      return new Response(JSON.stringify(safeList), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}

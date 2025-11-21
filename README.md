# cf_ai_liveagent

An AI-powered chat application built entirely on the Cloudflare Developer Platform.  
This project was created as part of the Cloudflare Software Engineering Internship assignment.

## Overview

This application implements a complete AI chat experience using:

- Cloudflare Pages (frontend UI)
- Cloudflare Workers (backend API)
- Durable Objects (stateful memory)
- Workers AI (Llama 3.3 for inference)
- Retro 8-bit React chat interface

The user interacts with a retro-styled chat UI hosted on Pages, which sends requests to a Worker.  
The Worker stores memory per conversation using a Durable Object and generates AI responses using Workers AI.

## Features

- Fully serverless AI application  
- React retro 8-bit chat interface  
- Cloudflare Worker backend  
- Durable Object conversation memory  
- Llama 3.3 responses (Workers AI)  
- Unique per-session state with sessionId  
- Deployed end-to-end on Cloudflare

## Architecture

```
Frontend (Cloudflare Pages: React)
         |
         | POST /chat?sessionId=<UUID>
         v
Backend (Cloudflare Worker)
         |
         |-- Durable Object: ChatMemory
         |
         v
Workers AI (Llama 3.3)
```

## Project Structure

```
cf_ai_liveagent/
│
├── my-react-app/         # Frontend (Cloudflare Pages)
│   ├── src/App.tsx
│   ├── package.json
│   └── dist/
│
└── cf-ai-worker/         # Backend (Cloudflare Worker)
    ├── src/index.ts
    ├── src/ChatMemory.ts
    ├── wrangler.jsonc
    └── tsconfig.json
```

## Local Development

### Frontend
```
cd my-react-app
npm install
npm run dev
```

Runs at: http://localhost:5173

### Backend (Worker)
```
cd cf-ai-worker
wrangler dev
```

Runs at: http://127.0.0.1:8787/chat

## Production Deployment

### Frontend — Cloudflare Pages

- Root directory: my-react-app
- Build command: npm run build
- Build output directory: dist

Live deployment: https://cf-ai-agent-a6y.pages.dev

### Backend — Cloudflare Workers

```
wrangler deploy
```

Worker endpoint: https://cf-ai-worker.josemigreis.workers.dev/chat

## Durable Object Memory Model

Each browser session creates a unique sessionId:

```
const sessionId = crypto.randomUUID();
```

The Worker uses a Durable Object (ChatMemory) to store:

```
[
  { role: "user", text: "..." },
  { role: "assistant", text: "..." }
]
```

This history is sent to Llama 3.3 with every request, enabling stateful AI conversations.

## Cloudflare Documentation used

- Workers AI: https://developers.cloudflare.com/workers-ai/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

import { useState } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  text: string;
};

// Production Worker API
const API_URL = "https://cf-ai-worker.josemigreis.workers.dev/chat";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sessionId] = useState(() =>
    (window.crypto || self.crypto).randomUUID()
  );

  async function handleSend() {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setText("");

    try {
      const response = await fetch(`${API_URL}?sessionId=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      const reply: Message = {
        role: "assistant",
        text: data.reply ?? "No response.",
      };

      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: API unreachable." },
      ]);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a1a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Press Start 2P', monospace",
        color: "#fff",
      }}
    >
      <div style={{ width: "60%", maxWidth: "800px", textAlign: "center" }}>
        <h1 style={{ color: "#f48120", marginBottom: "20px" }}>
          Cloudflare AI Chat
        </h1>

        <div
          style={{
            border: "4px solid #f48120",
            padding: "20px",
            borderRadius: "4px",
            minHeight: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "#262626",
            marginBottom: "20px",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  background: msg.role === "user" ? "#f48120" : "#444",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "4px",
                  fontFamily: "'Press Start 2P', monospace",
                  color: msg.role === "user" ? "#000" : "#fff",
                  border: "2px solid black",
                  maxWidth: "70%",
                  textAlign: "left",
                }}
              >
                <b>{msg.role === "user" ? "YOU" : "AI"}:</b> {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type here..."
            style={{
              flex: 1,
              padding: "10px",
              fontFamily: "'Press Start 2P', monospace",
              border: "3px solid #f48120",
              background: "#1a1a1a",
              color: "white",
            }}
          />

          <button
            onClick={handleSend}
            style={{
              padding: "10px 20px",
              background: "#f48120",
              color: "black",
              border: "3px solid black",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}

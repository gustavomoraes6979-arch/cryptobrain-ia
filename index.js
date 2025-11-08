import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Express já entende JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ✅ CORS
// ============================================
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Serve arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// =======================
// ✅ Memory System
// =======================
const memoryDir = path.join(__dirname, "memory");
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);
const memoryPath = path.join(memoryDir, "sessions.json");

function loadMemory() {
  try {
    if (!fs.existsSync(memoryPath)) return {};
    return JSON.parse(fs.readFileSync(memoryPath, "utf8"));
  } catch (e) {
    console.error("⚠️ Memória corrompida, recriando…");
    saveMemory({});
    return {};
  }
}

function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

// =======================
// ✅ Groq Client
// =======================
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é a CryptoBrain IA — assistente especialista em criptomoedas.
Responda em português, em tom humano e direto:
- Sempre alerte sobre riscos
- Use bullets quando fizer listas
- Resuma: oportunidade + risco
`;

// =======================
// ✅ /api/chat
// =======================
app.post("/api/chat", async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Envie 'question' no corpo da requisição." });
    }

    const id = sessionId || "default";
    const memory = loadMemory();
    if (!memory[id]) memory[id] = [];

    const recent = memory[id]
      .slice(-8)
      .map(m => (m.role === "user" ? `Usuário: ${m.text}` : `CryptoBrain: ${m.text}`))
      .join("\n");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Histórico resumido:\n${recent}` },
      { role: "user", content: `Pergunta atual: ${question}` },
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() || "Sem resposta.";

    memory[id].push({ role: "user", text: question, time: new Date().toISOString() });
    memory[id].push({ role: "bot", text: answer, time: new Date().toISOString() });
    saveMemory(memory);

    return res.json({ response: answer });
  } catch (error) {
    console.error("Erro /api/chat:", error);
    return res.status(500).json({ error: "Erro no processamento." });
  }
});

// =======================
// ✅ /api/session/clear
// =======================
app.post("/api/session/clear", (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "Envie sessionId" });

    const memory = loadMemory();
    delete memory[sessionId];
    saveMemory(memory);

    return res.json({ ok: true });
  } catch (e) {
    console.error("Erro /api/session/clear:", e);
    return res.status(500).json({ error: "Erro ao limpar sessão" });
  }
});

// =======================
// ✅ Frontend fallback
// =======================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ CryptoBrain IA rodando na porta ${PORT}`));

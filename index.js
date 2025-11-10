import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();

// ============== Fix __dirname ==============
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============== App ========================
const app = express();
const PORT = process.env.PORT || 3000;

// ============== Middlewares ================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============== Serve PUBLIC ===============
app.use(express.static(path.join(__dirname, "public")));

// ============== Groq Client ================
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `
Você é a CryptoBrain IA — especialista em criptomoedas.
Responda em português.
Sempre seja:
• simples
• direto
• sempre informe riscos
`;

// ============== Routes =====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Envie 'question' no corpo!" });
    }

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question }
      ]
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Não consegui responder.";

    return res.json({ response: answer });
  } catch (error) {
    console.error("❌ Erro /api/chat:", error);
    return res.status(500).json({ error: "Falha ao consultar IA" });
  }
});

// ✅ fallback para SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============== Start ======================
app.listen(PORT, () => {
  console.log(`✅ CryptoBrain IA rodando na porta ${PORT}`);
});

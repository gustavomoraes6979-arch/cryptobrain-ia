import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";

dotenv.config();

// ✅ Corrigir __dirname para ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ✅ Servir pasta public
app.use(express.static(path.join(__dirname, "public")));

// ✅ Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Rota de chat
app.post("/chat", async (req, res) => {
  try {
    // ⛔ Antes: message
    // ✅ Agora: question (compatível com script.js)
    const { question } = req.body;

    if (!question) {
      return res
        .status(400)
        .json({ error: "Campo 'question' não enviado no corpo da requisição." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente especialista em criptomoedas. Sempre responda em português.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const resposta = completion?.choices?.[0]?.message?.content ?? "Sem resposta";

    return res.json({ response: resposta });
  } catch (err) {
    console.error("❌ Erro na API:", err);
    return res.status(500).json({ error: "Erro ao consultar IA" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ CryptoBrain rodando em: http://localhost:${PORT}`);
});

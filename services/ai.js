// services/ai.js
/**
 * Versão melhorada rule-based para criar respostas mais naturais.
 * Recebe:
 *  - data: { top10, cheapCoins, risingCoins } ou lista simples de coins
 *  - question: string
 *  - session (array) : histórico de mensagens (opcional)
 *
 * Retorna: string (resposta)
 */

function pick(list, n=3) {
  return list.slice(0, n).map(c => c.name || c);
}

function fmtListWithPercent(list) {
  return list.map(c => `- ${c.name}: ${ (c.change ?? 0).toFixed(2) }%`).join("\n");
}

function safeNumber(n) {
  return (typeof n === "number" && !isNaN(n)) ? n : 0;
}

export function generateNaturalResponse({ coins = [] , top10 = [], cheapCoins = [], risingCoins = [] }, question = "", session = []) {
  const q = (question || "").toLowerCase();

  // preparar blocos
  const essentials = pick(top10, 3);
  const cheap = cheapCoins.slice(0,5);
  const rising = risingCoins.slice(0,5);

  // título de abertura curto (não repetir o prompt)
  let reply = "";

  // se usuário pede barato
  if (q.includes("barat") || q.includes("baixo") || q.includes("preço baixo")) {
    if (cheap.length === 0) {
      reply = "No momento não encontrei moedas relevantes com preço abaixo de US$1 (filtrando stablecoins).";
    } else {
      reply = `💰 Moedas com preço baixo (top ${cheap.length}):\n` + cheap.map(c => `- ${c.name}: $${safeNumber(c.price)}`).join("\n");
    }
    reply += `\n\nDica: moedas baratas podem ter alta volatilidade.`;
    return reply + `\n\nLembre-se: o mercado é volátil e todo investimento envolve risco.`;
  }

  // se pergunta sobre subir / alta / potencial
  if (q.includes("subind") || q.includes("alta") || q.includes("potencial") || q.includes("comprar")) {
    if (rising.length === 0) {
      reply = "Não há muitas moedas em alta significativa entre as top analisadas neste momento.";
    } else {
      reply = `📈 Top moedas em valorização (24h):\n` + fmtListWithPercent(rising);
    }
    reply += `\n\nAnalise volume e notícias antes de tomar decisão.`;
    return reply + `\n\nLembre-se: o mercado é volátil e todo investimento envolve risco.`;
  }

  // se pergunta por "essenciais" ou "segurar"
  if (q.includes("essencial") || q.includes("segur") || q.includes("manter") || q.includes("top 10") || q.includes("topo")) {
    if (essentials.length === 0) {
      reply = "Sem dados de top no momento.";
    } else {
      reply = `🔒 Moedas essenciais para longo prazo: ${essentials.join(", ")}.`;
    }
    reply += `\n\nEsses ativos costumam ter maior liquidez e adoção.`;
    return reply + `\n\nLembre-se: o mercado é volátil e todo investimento envolve risco.`;
  }

  // se pedir resumo do mercado
  if (q.includes("resumo") || q.includes("como está") || q.includes("hoje")) {
    const topSample = pick(top10, 3);
    reply = `Resumo rápido: top do mercado — ${topSample.join(", ")}. ` +
            `Moedas em alta: ${rising.slice(0,3).map(c => c.name).join(", ") || "nenhuma relevante"}. ` +
            `Moedas baratas: ${cheap.map(c => c.name).join(", ") || "nenhuma relevante"}.`;
    return reply + `\n\nLembre-se: o mercado é volátil e todo investimento envolve risco.`;
  }

  // fallback: instrução de uso + lembrar contexto (se existir)
  if (session && session.length) {
    // mostrar a última pergunta do usuário pra dar impressão de "contexto"
    const lastUser = [...session].reverse().find(m => m.role === "user");
    if (lastUser) {
      reply = `Você perguntou antes: "${lastUser.text}". Posso continuar com base nisso ou respondo algo novo? `;
    } else {
      reply = "Posso ajudar com análises: pergunte por 'quais estão baratas?', 'quais estão subindo?' ou peça um resumo.";
    }
  } else {
    reply = "Posso ajudar com análises: pergunte por 'quais estão baratas?', 'quais estão subindo?' ou peça um resumo.";
  }

  return reply + `\n\nLembre-se: o mercado é volátil e todo investimento envolve risco.`;
}

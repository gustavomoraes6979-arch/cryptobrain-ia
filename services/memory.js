// services/memory.js
// Memória simples em RAM. Não persiste entre reinícios do servidor.
// Estrutura: { sessionId: [ { role: 'user'|'assistant', text: '...' }, ... ] }

const store = new Map(); // chave: sessionId, valor: array de mensagens

export function getSession(sessionId) {
  if (!sessionId) return [];
  return store.get(sessionId) || [];
}

export function appendMessage(sessionId, role, text) {
  if (!sessionId) return;
  const arr = store.get(sessionId) || [];
  arr.push({ role, text, timestamp: new Date().toISOString() });
  // limitar histórico para evitar crescer demais (ex: 20 mensagens)
  store.set(sessionId, arr.slice(-40));
}

export function clearSession(sessionId) {
  store.delete(sessionId);
}

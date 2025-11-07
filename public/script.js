/* ====== Estado ====== */
const inputEl = document.getElementById('input');
const messagesEl = document.getElementById('messages');
const sendBtn = document.getElementById('send');

let sessionId = localStorage.getItem('cb_sessionId') || null;
if (!sessionId) {
  sessionId = 's_' + Math.random().toString(36).slice(2, 9);
  localStorage.setItem('cb_sessionId', sessionId);
}

let history = JSON.parse(localStorage.getItem('cb_history_' + sessionId) || '[]');

function saveLocalHistory(){
  localStorage.setItem('cb_history_' + sessionId, JSON.stringify(history));
}
function formatTime(){
  return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}
function scrollToBottom(){
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* ====== Render ====== */
function addUserBubble(text, time=null, persist=true){
  const row = document.createElement('div');
  row.className='message user-message';
  row.textContent = text;
  messagesEl.appendChild(row);
  if(!time) time = formatTime();
  if(persist){
    history.push({role:'user', text, time});
    saveLocalHistory();
  }
  scrollToBottom();
}

function addBotBubble(text, persist=true, time=null){
  const row = document.createElement('div');
  row.className='message bot-message';
  row.innerHTML = marked.parse(text);
  messagesEl.appendChild(row);
  if(!time) time = formatTime();
  if(persist){
    history.push({role:'bot', text, time});
    saveLocalHistory();
  }
  scrollToBottom();
}

function showTyping(){
  const row = document.createElement('div');
  row.className='message bot-message typing';
  row.textContent = 'Digitando...';
  messagesEl.appendChild(row);
  scrollToBottom();
  return row;
}

/* ====== Send ====== */
sendBtn.addEventListener('click', onSend);
inputEl.addEventListener('keypress',(e)=>{
  if(e.key==='Enter') onSend();
});

async function onSend(){
  const text = inputEl.value.trim();
  if(!text) return;
  addUserBubble(text);
  inputEl.value = '';

  const typingNode = showTyping();

  try {
    const resp = await fetch('/chat', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ question:text, sessionId })
    });

    const raw = await resp.text();
    let data = null;
    try { data = JSON.parse(raw); } catch(e) {}

    typingNode.remove();

    const answer = data?.response;
    if(answer){
      addBotBubble(answer);
    } else {
      addBotBubble("⚠️ Resposta inválida do servidor.");
    }

  } catch(err){
    typingNode.remove();
    console.error(err);
    addBotBubble("❌ Erro de conexão");
  }
}

/* ====== Init ====== */
if(history.length===0){
  addBotBubble("👋 Olá! Eu sou a CryptoBrain IA. Pergunte: **quais moedas estão subindo?**");
} else {
  history.forEach(m=>{
    if(m.role==='user') addUserBubble(m.text, m.time, false);
    else addBotBubble(m.text, false, m.time);
  });
}

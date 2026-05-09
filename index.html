<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NetTalk Pro</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#08090d;--sidebar:#0c0e16;--card:#12141f;--border:#1c2033;--accent:#00e68a;--accent2:#00b36b;--danger:#ff4757;--warn:#ffa502;--muted:#5a6080;--text:#e0e4f0;--radius:12px;--bot:#8b5cf6}
body{font-family:'Space Grotesk',sans-serif;background:var(--bg);color:var(--text);display:flex;height:100vh;overflow:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:9px}

.sidebar{width:280px;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:2;flex-shrink:0}
.sidebar-head{padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.logo{width:36px;height:36px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#08090d}
.brand{font-size:18px;font-weight:700;letter-spacing:-.5px}.brand span{color:var(--accent)}
.room-info{padding:14px 20px;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}
.room-info i{color:var(--accent)}
.online-badge{background:var(--accent);color:#08090d;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:auto}
.users{flex:1;overflow:auto;padding:12px}
.users-title{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);padding:8px 8px 12px;font-weight:600}
.user{padding:10px 12px;border-radius:10px;font-size:13px;display:flex;align-items:center;gap:10px;margin-bottom:4px;transition:background .2s;cursor:default}
.user:hover{background:var(--card)}
.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.dot.on{background:var(--accent);box-shadow:0 0 8px var(--accent)}.dot.off{background:var(--muted)}
.user-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-tag{font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px}
.tag-you{color:var(--accent);background:#00e68a15}.tag-mute{color:var(--danger);background:#ff475715}.tag-bot{color:var(--bot);background:#8b5cf620}

.main{flex:1;display:flex;flex-direction:column;position:relative;min-width:0}
.top{padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;font-weight:600;font-size:15px;background:var(--sidebar)}
.top i{color:var(--accent)}
.muted-warn{margin-left:auto;font-size:12px;color:var(--danger);background:#ff475715;padding:6px 14px;border-radius:6px;display:none;align-items:center;gap:6px;font-weight:600}
.muted-warn.show{display:flex}

.conn-bar{padding:10px 24px;font-size:13px;display:none;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.conn-bar.show{display:flex}
.conn-bar.offline{background:#ff475715;color:var(--danger);border-color:#ff475733}
.conn-bar.reconnecting{background:#ffa50215;color:var(--warn);border-color:#ffa50233}
.conn-bar i{font-size:14px}
.retry-btn{margin-left:auto;padding:4px 12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600}

.messages{flex:1;overflow:auto;padding:20px 24px;display:flex;flex-direction:column;gap:6px}
.msg{max-width:70%;padding:12px 16px;border-radius:var(--radius);display:flex;flex-direction:column;gap:4px;animation:fadeUp .25s ease;position:relative}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg.self{align-self:flex-end;background:linear-gradient(135deg,#00e68a18,#00b36b18);border:1px solid #00e68a28;border-bottom-right-radius:4px}
.msg.other{align-self:flex-start;background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px}
.msg.bot{align-self:flex-start;background:#1a1c30;border:1px solid #2a2d4a;border-bottom-left-radius:4px}
.msg.system{align-self:center;background:transparent;border:none;padding:6px;font-size:12px;color:var(--muted);text-align:center;max-width:100%}
.msg-head{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted)}
.msg-head b{color:var(--accent);font-weight:600}
.bot-tag{color:var(--bot);font-weight:600;font-size:10px;background:#8b5cf620;padding:1px 5px;border-radius:4px}
.msg-time{margin-left:auto}
.msg-edited{font-size:10px;color:var(--muted);font-style:italic}
.msg-text{font-size:14px;line-height:1.6;word-break:break-word;white-space:pre-wrap}

.msg-reactions{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
.rx-btn{padding:2px 8px;border-radius:12px;border:1px solid var(--border);background:var(--sidebar);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;font-family:inherit;color:var(--text)}
.rx-btn:hover{background:var(--border)}.rx-btn.active{border-color:var(--accent);background:#00e68a15}
.rx-count{font-size:11px;color:var(--muted)}

.msg-actions{position:absolute;top:-12px;display:none;gap:2px;background:var(--sidebar);border:1px solid var(--border);border-radius:8px;padding:2px;z-index:5}
.msg.self .msg-actions{right:auto;left:8px}.msg.other .msg-actions{right:8px}
.msg:hover .msg-actions{display:flex}
.msg-actions button{width:28px;height:28px;border:none;background:transparent;color:var(--muted);border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
.msg-actions button:hover{background:var(--card);color:var(--text)}.msg-actions button.del:hover{color:var(--danger)}

.typing-bar{font-size:12px;color:var(--muted);padding:4px 24px;min-height:24px;display:flex;align-items:center;gap:6px}
.td span{display:inline-block;width:4px;height:4px;background:var(--accent);border-radius:50%;animation:bounce .6s infinite}
.td span:nth-child(2){animation-delay:.15s}.td span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

.input-bar{display:flex;align-items:center;padding:12px 16px;gap:8px;border-top:1px solid var(--border);background:var(--sidebar)}
.input-bar input{flex:1;padding:14px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border .2s;min-width:0}
.input-bar input:focus{border-color:var(--accent)}.input-bar input:disabled{opacity:.4;cursor:not-allowed}
.ibtn{height:44px;border:none;border-radius:var(--radius);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:transform .15s,background .2s;flex-shrink:0}
.emoji-btn{width:44px;background:var(--card);color:var(--muted);border:1px solid var(--border)}.emoji-btn:hover{color:var(--accent);border-color:var(--accent)}
.send-btn{padding:0 20px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#08090d;font-weight:700;font-family:inherit;gap:8px}
.send-btn:hover{transform:scale(1.03)}.send-btn:active{transform:scale(.97)}.send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.cancel-btn{width:44px;background:var(--card);color:var(--danger);border:1px solid var(--border)}.cancel-btn:hover{background:#ff475720}
.edit-label{font-size:12px;color:var(--warn);white-space:nowrap;font-weight:600}

.emoji-picker{position:absolute;bottom:80px;left:16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px;display:none;flex-wrap:wrap;gap:4px;width:280px;z-index:10;box-shadow:0 8px 32px #000a}
.emoji-picker.open{display:flex}
.emoji-picker button{width:36px;height:36px;border:none;background:transparent;border-radius:8px;font-size:20px;cursor:pointer;transition:background .15s}.emoji-picker button:hover{background:var(--border)}

.modal-overlay{position:fixed;inset:0;background:#000c;z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
.modal{background:var(--sidebar);border:1px solid var(--border);border-radius:16px;padding:40px;width:420px;max-width:92vw;text-align:center}
.modal h2{font-size:26px;font-weight:700;margin-bottom:6px}.modal h2 span{color:var(--accent)}
.modal p{color:var(--muted);font-size:13px;margin-bottom:24px;line-height:1.5}
.modal input{width:100%;padding:14px 18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);color:var(--text);font-family:inherit;font-size:15px;outline:none;margin-bottom:8px;text-align:center;transition:border .2s}
.modal input:focus{border-color:var(--accent)}
.modal button{width:100%;padding:14px;border:none;border-radius:var(--radius);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#08090d;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;transition:transform .15s;margin-top:8px}
.modal button:hover{transform:scale(1.02)}.modal button:active{transform:scale(.98)}
.modal .err{color:var(--danger);font-size:12px;min-height:18px;margin-bottom:4px}
.modal .hint{color:var(--muted);font-size:11px;margin-top:14px;line-height:1.6}

.toast-wrap{position:fixed;top:20px;right:20px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px 20px;font-size:13px;animation:slideIn .3s ease;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px #000a;pointer-events:auto;max-width:340px}
.toast.err{border-color:#ff475744;color:var(--danger)}.toast.ok{border-color:#00e68a44;color:var(--accent)}.toast.warn{border-color:#ffa50244;color:var(--warn)}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

@media(max-width:700px){.sidebar{display:none}.msg{max-width:88%}}
</style>
</head>
<body>

<!-- MODAL -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <div class="logo" style="margin:0 auto 16px;width:52px;height:52px;font-size:22px"><i class="fas fa-bolt"></i></div>
    <h2>Net<span>Talk</span> Pro</h2>
    <p>Gercek zamanli profesyonel sohbet platformu</p>
    <div class="err" id="modalErr"></div>
    <input id="nickInput" placeholder="Nick girin..." maxlength="20" autofocus />
    <button id="joinBtn" onclick="handleJoin()">Sohbete Baglan</button>
    <div class="hint">Komutlar: /help /users /stats /nick /clear /mute /unmute<br>Mesajlara reaksiyon ekleyin, duzenleyin veya silin</div>
  </div>
</div>

<!-- TOAST -->
<div class="toast-wrap" id="toastWrap"></div>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-head">
    <div class="logo"><i class="fas fa-bolt"></i></div>
    <div class="brand">Net<span>Talk</span></div>
  </div>
  <div class="room-info">
    <i class="fas fa-hashtag"></i> genel
    <span class="online-badge" id="onlineCount">0</span>
  </div>
  <div class="users" id="users"><div class="users-title">Cevrimici</div></div>
</aside>

<!-- MAIN -->
<main class="main">
  <div class="top">
    <i class="fas fa-hashtag"></i> genel odasi
    <div class="muted-warn" id="mutedWarn"><i class="fas fa-volume-mute"></i> Susturulmussunuz</div>
  </div>
  <div class="conn-bar" id="connBar">
    <i id="connIcon"></i>
    <span id="connText"></span>
    <button class="retry-btn" onclick="manualReconnect()">Yeniden Dene</button>
  </div>
  <div class="messages" id="messages"></div>
  <div class="typing-bar" id="typingBar"></div>
  <div class="emoji-picker" id="emojiPicker"></div>
  <div class="input-bar">
    <button class="ibtn emoji-btn" onclick="toggleEmoji()"><i class="far fa-smile"></i></button>
    <span class="edit-label" id="editLabel" style="display:none">Duzenleniyor</span>
    <button class="ibtn cancel-btn" id="cancelEdit" style="display:none" onclick="cancelEdit()"><i class="fas fa-times"></i></button>
    <input id="msgInput" placeholder="Mesaj yaz... veya /help" maxlength="500" />
    <button class="ibtn send-btn" id="sendBtn" onclick="send()"><i class="fas fa-paper-plane"></i><span id="sendText">Gonder</span></button>
  </div>
</main>

<script>
const API = "/api/messages";
const ROOM = "genel";
const RX_EMOJIS = ["👍","❤️","😂","🔥","😮"];

let userId = null;
let nick = "";
let isMuted = false;
let editingId = null;
let failCount = 0;
let connected = false;
let isRejoining = false; // Otomatik yeniden katılma kilidi
let reconnectTimer = null;
let loadInterval = null;
let hbInterval = null;

const MAX_FAIL = 3;
const POLL_MS = 2000;
const HB_MS = 5000;
const RC_MS = 4000;

let cachedMsgs = [];
let cachedUsers = [];

const EMOJIS = ["😀","😂","😍","🔥","👍","❤️","😎","🎉","💯","🙄","😢","🤔","👀","✨","🚀","👋","😅","🥳","💀","🙏","🤝","💪","🫡","🥰","😈","🤯","🫠"];
const ep = document.getElementById("emojiPicker");
EMOJIS.forEach(e => {
  const b = document.createElement("button"); b.textContent = e;
  b.onclick = () => { document.getElementById("msgInput").value += e; toggleEmoji(); };
  ep.appendChild(b);
});
function toggleEmoji() { ep.classList.toggle("open"); }

function esc(t) { return t ? String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;") : ""; }
function escJS(t) { return String(t || "").replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$/g,"\\$"); }
function fmtTime(ts) { return ts ? new Date(ts).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}) : ""; }

/* ========== OTOMATİK YENİDEN KATILMA (Auto-Rejoin) ========== */
async function autoRejoin() {
  if (isRejoining || !nick) return; // Zaten deniyor veya nick yoksa girme
  isRejoining = true;
  stopPolling(); clearInterval(hbInterval);
  setConn("reconnecting", "Oturum yenileniyor...");
  
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "join", name: nick, roomId: ROOM })
    });
    const data = await res.json();

    if (res.ok) {
      userId = data.userId; // Yeni userId al
      nick = data.userName; // Nick değişmişse güncelle
      isMuted = false;
      setMuted(false);
      connected = true;
      setConn("online");
      startPolling();
      startHeartbeat();
      toast("Oturum otomatik olarak yenilendi", "ok");
    } else {
      // Sunucu hatası (Örn: Nick alınmış)
      toast("Oturum yenilenemedi: " + (data.error || "Hata"), "err");
      setConn("offline", "Bağlantı koptu");
      scheduleReconnect();
    }
  } catch (e) {
    // Ağ hatası
    setConn("offline", "Bağlantı koptu");
    scheduleReconnect();
  } finally {
    isRejoining = false;
  }
}

/* API İsteği Yardımcısı */
async function apiCall(body) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    // Sunucu state'i sıfırlanmışsa otomatik yeniden katıl!
    if (data.error === "user_not_found" || data.error === "invalid_user") {
      await autoRejoin();
      throw new Error("session_auto_rejoined");
    }
    if (data.error === "muted") { setMuted(true); throw new Error("muted"); }
    if (data.error === "rate_limit") { toast("Çok hızlı yazıyorsunuz, yavaşlayın", "warn"); throw new Error("rate_limit"); }
    if (!res.ok) { toast(data.message || data.error || "İstek başarısız", "err"); throw new Error(data.error || "unknown"); }
    
    return data;
  } catch (e) {
    if (e.message !== "session_auto_rejoined" && e.message !== "muted" && e.message !== "rate_limit") {
       // Ağ hatası vs.
    }
    throw e;
  }
}

function setMuted(val) {
  isMuted = val;
  document.getElementById("mutedWarn").classList.toggle("show", val);
  document.getElementById("msgInput").disabled = val || !connected;
  document.getElementById("sendBtn").disabled = val || !connected;
}

/* ========== MODAL ========== */
async function handleJoin() {
  const v = document.getElementById("nickInput").value.trim();
  const err = document.getElementById("modalErr");
  if (!v || v.length < 2) { err.textContent = "En az 2 karakter!"; return; }

  document.getElementById("joinBtn").textContent = "Baglaniyor...";
  document.getElementById("joinBtn").disabled = true;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "join", name: v, roomId: ROOM })
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || "Katilma basarisiz"; document.getElementById("joinBtn").textContent = "Sohbete Baglan"; document.getElementById("joinBtn").disabled = false; return; }

    userId = data.userId;
    nick = data.userName;
    document.getElementById("modalOverlay").style.display = "none";
    initChat();
  } catch (e) {
    err.textContent = "Sunucuya baglanilamiyor!";
    document.getElementById("joinBtn").textContent = "Sohbete Baglan";
    document.getElementById("joinBtn").disabled = false;
  }
}
document.getElementById("nickInput").addEventListener("keydown", e => { if (e.key === "Enter") handleJoin(); });

function initChat() {
  connected = true;
  setConn("online");
  toast("Sohbete baglandiniz, " + nick + "!", "ok");
  startPolling();
  startHeartbeat();
}

function startPolling() { clearInterval(loadInterval); loadInterval = setInterval(load, POLL_MS); load(); }
function stopPolling() { clearInterval(loadInterval); loadInterval = null; }

async function load() {
  try {
    const res = await fetch(API + "?roomId=" + ROOM);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) cachedMsgs = data.messages;
    if (data.users && data.users.length > 0) cachedUsers = data.users;
    renderMsgs(cachedMsgs);
    renderUsers(cachedUsers);
    renderTyping(data.typing || []);
    if (!connected) { connected = true; setConn("online"); setMuted(isMuted); toast("Bağlantı yeniden kuruldu", "ok"); }
    failCount = 0;
  } catch (e) {
    if (e.message === "session_auto_rejoined") return;
    failCount++;
    if (failCount >= MAX_FAIL && connected) { connected = false; setConn("offline","Bağlantı koptu"); stopPolling(); scheduleReconnect(); }
    else if (failCount === 1) setConn("reconnecting","Bağlantı sorunlu...");
    renderMsgs(cachedMsgs); renderUsers(cachedUsers);
  }
}

function startHeartbeat() {
  clearInterval(hbInterval);
  hbInterval = setInterval(async () => {
    if (!userId || isRejoining) return;
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "heartbeat", userId }) });
      const data = await res.json();
      if (data.error === "user_not_found") { await autoRejoin(); return; }
      if (typeof data.isMuted === "boolean") setMuted(data.isMuted);
    } catch (e) {}
  }, HB_MS);
}

function scheduleReconnect() { clearTimeout(reconnectTimer); reconnectTimer = setTimeout(reconnect, RC_MS); }
async function reconnect() {
  if (isRejoining) return;
  setConn("reconnecting","Yeniden baglaniyor...");
  try {
    // Önce oturum hala var mı diye heartbeat atmayı dene
    if (userId) {
      const hbRes = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "heartbeat", userId }) });
      if (hbRes.ok) { connected = true; failCount = 0; setConn("online"); setMuted(isMuted); startPolling(); startHeartbeat(); toast("Bağlantı kuruldu","ok"); return; }
      if (hbRes.status === 404) { await autoRejoin(); return; }
    }
    // Olmadıysa doğrudan autoRejoin başlat
    await autoRejoin();
  } catch (e) { scheduleReconnect(); }
}
function manualReconnect() { clearTimeout(reconnectTimer); reconnect(); }

function setConn(state, text) {
  const bar = document.getElementById("connBar"), icon = document.getElementById("connIcon"), txt = document.getElementById("connText");
  const inp = document.getElementById("msgInput"), btn = document.getElementById("sendBtn");
  bar.className = "conn-bar";
  if (state === "online") { connected = true; bar.classList.remove("show"); inp.disabled = isMuted; btn.disabled = isMuted; }
  else if (state === "reconnecting") { connected = false; bar.classList.add("show","reconnecting"); icon.className = "fas fa-spinner fa-spin"; txt.textContent = text; inp.disabled = true; btn.disabled = true; }
  else if (state === "offline") { connected = false; bar.classList.add("show","offline"); icon.className = "fas fa-exclamation-triangle"; txt.textContent = text; inp.disabled = true; btn.disabled = true; }
}

function renderMsgs(msgs) {
  const box = document.getElementById("messages");
  const wasBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = "";
  if (!msgs.length) { box.innerHTML = '<div class="msg system">Henuz mesaj yok. Ilk mesaji sen yaz!</div>'; return; }
  msgs.forEach(m => {
    const div = document.createElement("div");
    if (m.type === "system" && m.userId === "__system__") { div.className = "msg system"; div.textContent = m.text; box.appendChild(div); return; }
    if (m.type === "system" && m.userId === "__bot__") { div.className = "msg bot"; div.innerHTML = `<div class="msg-head"><span class="bot-tag">BOT</span><b>${esc(m.userName)}</b><span class="msg-time">${fmtTime(m.createdAt)}</span></div><div class="msg-text">${esc(m.text)}</div>`; box.appendChild(div); return; }
    const self = m.userId === userId;
    div.className = "msg " + (self ? "self" : "other");
    let actions = "";
    if (self) { actions = `<div class="msg-actions">${RX_EMOJIS.map(e => `<button onclick="react('${m.id}','${e}')">${e}</button>`).join("")}<button onclick="startEdit('${m.id}','${escJS(m.text)}')" title="Duzenle"><i class="fas fa-pen"></i></button><button class="del" onclick="deleteMsg('${m.id}')" title="Sil"><i class="fas fa-trash"></i></button></div>`; }
    else { actions = `<div class="msg-actions">${RX_EMOJIS.map(e => `<button onclick="react('${m.id}','${e}')">${e}</button>`).join("")}</div>`; }
    let rxHtml = "";
    if (m.reactions && Object.keys(m.reactions).length > 0) { rxHtml = '<div class="msg-reactions">'; for (const [emoji, uids] of Object.entries(m.reactions)) { const act = uids.includes(userId) ? "active" : ""; rxHtml += `<button class="rx-btn ${act}" onclick="react('${m.id}','${emoji}')">${emoji}<span class="rx-count">${uids.length}</span></button>`; } rxHtml += "</div>"; }
    const edited = m.editedAt ? '<span class="msg-edited">(duzenlendi)</span>' : "";
    div.innerHTML = `${actions}<div class="msg-head"><b>${esc(m.userName||"?")}</b>${self?'<span class="user-tag tag-you">SEN</span>':''}<span class="msg-time">${fmtTime(m.createdAt)}</span>${edited}</div><div class="msg-text">${esc(m.text)}</div>${rxHtml}`;
    box.appendChild(div);
  });
  if (wasBottom) box.scrollTop = box.scrollHeight;
}

function renderUsers(users) {
  const box = document.getElementById("users");
  const now = Date.now(), ACT = 15000;
  const active = users.filter(u => now - (u.lastSeen||0) < ACT);
  document.getElementById("onlineCount").textContent = active.length;
  box.innerHTML = '<div class="users-title">Cevrimici</div>';
  if (!active.length) { box.innerHTML += '<div style="font-size:12px;color:var(--muted);padding:8px">Henuz kimse yok</div>'; return; }
  active.forEach(u => {
    const d = document.createElement("div"); d.className = "user";
    let tag = ""; if (u.id === userId) tag = '<span class="user-tag tag-you">SEN</span>'; else if (u.id === "__bot__") tag = '<span class="user-tag tag-bot">BOT</span>';
    d.innerHTML = `<span class="dot on"></span><span class="user-name">${esc(u.name)}</span>${tag}`;
    box.appendChild(d);
  });
}

function renderTyping(names) {
  const bar = document.getElementById("typingBar");
  const f = names.filter(n => n !== nick);
  if (!f.length) { bar.innerHTML = ""; return; }
  let t = ""; if (f.length === 1) t = f[0] + " yazıyor..."; else if (f.length === 2) t = f.join(" ve ") + " yazıyor..."; else t = f.length + " kişi yazıyor...";
  bar.innerHTML = `<span class="td"><span></span><span></span><span></span></span> ${esc(t)}`;
}

async function send() {
  if (!connected || isMuted || isRejoining) return;
  const inp = document.getElementById("msgInput");
  const text = inp.value.trim();
  if (!text) return;

  if (editingId) {
    try {
      const res = await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, text, userId }) });
      const d = await res.json();
      if (d.error === "invalid_user") { await autoRejoin(); return; }
      if (d.error === "forbidden") { toast("Bu mesajı düzenleyemezsiniz", "err"); return; }
      if (!d.ok) { toast(d.error || "Düzenleme başarısız", "err"); return; }
      cancelEdit(); load();
    } catch (e) { toast("Düzenleme başarısız", "err"); }
    return;
  }

  inp.value = ""; ep.classList.remove("open");
  try {
    await apiCall({ type: "message", userId, text, roomId: ROOM });
    load();
  } catch (e) {
    if (e.message === "muted" || e.message === "rate_limit" || e.message === "session_auto_rejoined") { if(e.message === "muted") inp.value = text; return; }
    inp.value = text; toast("Mesaj gönderilemedi", "err");
  }
}
document.getElementById("msgInput").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });

function startEdit(id, text) { editingId = id; const inp = document.getElementById("msgInput"); inp.value = text.replace(/\\`/g,"`").replace(/\\\$/g,"$").replace(/\\\\/g,"\\"); inp.focus(); document.getElementById("editLabel").style.display = "inline"; document.getElementById("cancelEdit").style.display = "flex"; document.getElementById("sendText").textContent = "Kaydet"; }
function cancelEdit() { editingId = null; document.getElementById("msgInput").value = ""; document.getElementById("editLabel").style.display = "none"; document.getElementById("cancelEdit").style.display = "none"; document.getElementById("sendText").textContent = "Gonder"; }

async function deleteMsg(id) { try { const res = await fetch(API, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, userId }) }); const d = await res.json(); if (d.error === "invalid_user") await autoRejoin(); load(); } catch (e) { toast("Silinemedi", "err"); } }

async function react(msgId, emoji) { if (!userId || isRejoining) return; try { await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "reaction", userId, messageId: msgId, emoji }) }); load(); } catch (e) {} }

let tTO;
document.getElementById("msgInput").addEventListener("input", () => {
  if (!userId || !connected || isRejoining) return;
  clearTimeout(tTO);
  tTO = setTimeout(async () => { try { await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "typing", userId, roomId: ROOM }) }); } catch (e) {} }, 300);
});

function toast(msg, type) {
  const w = document.getElementById("toastWrap"); const t = document.createElement("div"); t.className = "toast " + (type||"");
  const icons = {err:"fas fa-times-circle",ok:"fas fa-check-circle",warn:"fas fa-exclamation-circle"};
  t.innerHTML = `<i class="${icons[type]||"fas fa-info-circle"}"></i><span>${esc(msg)}</span>`;
  w.appendChild(t); setTimeout(() => { t.style.opacity="0"; t.style.transition="opacity .3s"; setTimeout(()=>t.remove(),300); }, 3500);
}

document.addEventListener("visibilitychange", () => { if (!document.hidden && connected && !loadInterval && !isRejoining) startPolling(); });

window.addEventListener("beforeunload", () => {
  if (!userId) return;
  const blob = new Blob([JSON.stringify({ type: "leave", userId, roomId: ROOM })], { type: "application/json" });
  navigator.sendBeacon(API, blob);
});
</script>
</body>
</html>

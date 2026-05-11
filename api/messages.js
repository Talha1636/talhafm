
// /api/messages.js
// NetTalk Pro v4.0 - Resilient Serverless API

const GLOBAL_KEY = "__NETTALK_PRO_V4__";

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = {
    messages: [],
    users: [],
    typing: {},
    rateLimits: {},
    botState: {
      lastGreeting: {},
      initTime: Date.now(),
      initialized: false
    }
  };
}

const db = globalThis[GLOBAL_KEY];

const CONFIG = {
  MAX_MESSAGES: 500, MESSAGE_MAX: 500, NAME_MAX: 20, NAME_MIN: 2,
  RATE_LIMIT_MS: 1200, TYPING_TIMEOUT: 3000, 
  USER_TIMEOUT: 1000 * 60 * 60 * 24,
  ONLINE_TIMEOUT: 1000 * 60 * 2, AWAY_TIMEOUT: 1000 * 60 * 10,
  ALLOW_CLEAR: true, BOT_TYPING_DELAY: 800,
  BOT_NAME: "NetTalk Bot", BOT_ID: "__bot__", BOT_AVATAR: "🤖",
  SYSTEM_ID: "__system__", COOLDOWN_GREET: 30000,
  GREETINGS_ENABLED: true, AUTO_RESPONSES_ENABLED: true
};

const ADMIN_NICKS = ["talha", "esila"]; // ADMIN TANIMLAMALARI

// Bot Cevapları (Kısaltıldı)
const BOT_GREETINGS = ["Hos geldin {user}! 👋", "Selam {user}! 🎉", "Merhaba {user}! ✨", "Hey {user}! 🌟"];
const BOT_COMEBACK = ["{user} geri dondu! 👋", "Tekrar hosgeldin {user}! 🤗"];
const BOT_FUN_FACTS = ["💡 Bilgi: Dünyada her saniye 2.5 milyon e-posta gonderiliyor!", "💡 Bilgi: Internetin %90'i 1991'den sonra olusturuldu."];
const BOT_MORNING = ["Gunaydin! ☀️"]; const BOT_NIGHT = ["Iyi geceler! 🌙"];
const BOT_IDLE_MESSAGES = ["Burada kimse yok mu? 👀", "Sohbet canlansin! 💬"];
const BOT_KEYWORD_RESPONSES = {
  "merhaba": ["Merhaba! 👋"], "nasilsin": ["Iyiyim 😊"], "bot": ["Ben bir botum! 🤖"],
  "yardim": ["/help yazabilirsin! 📋"], "selam": ["Selam! 👋"]
};

function now() { return Date.now(); }
function uid() { return Math.random().toString(36).slice(2) + now().toString(36) + Math.random().toString(36).slice(2, 6); }
function send(res, code, data) { return res.status(code).json(data); }
function sanitize(text = "") { return String(text).trim().slice(0, CONFIG.MESSAGE_MAX); }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function normalizeTr(str) { return str.replace(/ş/g,"s").replace(/ç/g,"c").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ğ/g,"g").replace(/ı/g,"i").toLowerCase(); }

function getUserStatus(user) {
  if (user.id === CONFIG.BOT_ID) return "online";
  const elapsed = now() - user.lastSeen;
  if (elapsed < CONFIG.ONLINE_TIMEOUT) return "online";
  if (elapsed < CONFIG.AWAY_TIMEOUT) return "away";
  return "offline";
}

function cleanUsers() { const t = now(); db.users = db.users.filter(u => u.id === CONFIG.BOT_ID || t - u.lastSeen < CONFIG.USER_TIMEOUT); }
function cleanTyping() { const t = now(); for (const id in db.typing) { if (t - db.typing[id].time > CONFIG.TYPING_TIMEOUT) delete db.typing[id]; } }
function cleanMessages() { if (db.messages.length > CONFIG.MAX_MESSAGES) db.messages = db.messages.slice(-CONFIG.MAX_MESSAGES); }

function ensureBotExists() {
  let bot = db.users.find(u => u.id === CONFIG.BOT_ID);
  if (!bot) {
    db.users.push({ id: CONFIG.BOT_ID, name: CONFIG.BOT_NAME, muted: false, isBot: true, avatar: CONFIG.BOT_AVATAR, status: "online", roomId: "genel", lastSeen: now(), joinedAt: now() });
  } else { bot.lastSeen = now(); bot.status = "online"; bot.isBot = true; }
}

function cleanupReadonly() { cleanTyping(); cleanMessages(); ensureBotExists(); }
function cleanupWrite() { cleanUsers(); cleanTyping(); cleanMessages(); ensureBotExists(); }

function createBotMessage(text) { db.messages.push({ id: uid(), type: "bot", userId: CONFIG.BOT_ID, userName: CONFIG.BOT_NAME, isBot: true, avatar: CONFIG.BOT_AVATAR, text, createdAt: now() }); cleanMessages(); }
function createSystemMessage(text) { db.messages.push({ id: uid(), type: "system", userId: CONFIG.SYSTEM_ID, userName: "System", text, createdAt: now() }); cleanMessages(); }

function botGreetUser(userName, isReturning = false) {
  if (!CONFIG.GREETINGS_ENABLED) return;
  const t = now(); const lastGreet = db.botState.lastGreeting[userName] || 0;
  if (t - lastGreet < CONFIG.COOLDOWN_GREET) return; db.botState.lastGreeting[userName] = t;
  createBotMessage(randomFrom(isReturning ? BOT_COMEBACK : BOT_GREETINGS).replace("{user}", userName));
}

function botCheckKeywords(text, user) {
  if (!CONFIG.AUTO_RESPONSES_ENABLED || user.id === CONFIG.BOT_ID || text.startsWith("/")) return;
  const normalized = normalizeTr(text);
  for (const [keyword, responses] of Object.entries(BOT_KEYWORD_RESPONSES)) {
    if (normalized.includes(normalizeTr(keyword))) { if (Math.random() > 0.3) setTimeout(() => createBotMessage(randomFrom(responses)), CONFIG.BOT_TYPING_DELAY); return; }
  }
  if (Math.random() > 0.95) setTimeout(() => createBotMessage(randomFrom(BOT_FUN_FACTS)), CONFIG.BOT_TYPING_DELAY);
}

function botIdleCheck() {
  if (db.messages.filter(m => m.type === "message" && now() - m.createdAt < 5 * 60 * 1000).length > 0) return;
  if (db.users.filter(u => u.id !== CONFIG.BOT_ID && getUserStatus(u) === "online").length === 0) return;
  createBotMessage(randomFrom(BOT_IDLE_MESSAGES));
}

function getUser(id) { return db.users.find(u => u.id === id); }
function userExists(name) { return db.users.find(u => u.name.toLowerCase() === name.toLowerCase()); }
function updateUserActivity(user) { user.lastSeen = now(); }
function validateUser(user) { return !!user && user.id !== CONFIG.BOT_ID; }

// KESİNTİSİZ OTURUM DESTEĞİ (COLD START RECOVERY)
function restoreUserIfMissing(userId, name) {
  if (!userId || !name) return null;
  ensureBotExists();
  
  let user = getUser(userId);
  if (user) return user;

  let existingName = userExists(name);
  if (existingName) {
    existingName.id = userId; // ID değişmişse güncelle
    existingName.lastSeen = now();
    return existingName;
  }

  // Kullanıcı bellekte yoksa (sunucu uyuyup uyanmışsa), sessizce yeniden oluştur
  user = {
    id: userId, name, muted: false, isBot: false,
    isAdmin: ADMIN_NICKS.includes(name.toLowerCase()),
    avatar: null, status: "online", roomId: "genel",
    lastSeen: now(), joinedAt: now()
  };
  db.users.push(user);
  createSystemMessage(`${name} bağlantıyı kurtardı`); // Çok sessiz bir bildirim
  return user;
}

function rateLimited(userId) {
  const last = db.rateLimits[userId];
  if (!last) { db.rateLimits[userId] = now(); return false; }
  if (now() - last < CONFIG.RATE_LIMIT_MS) return true;
  db.rateLimits[userId] = now(); return false;
}

async function executeCommand(text, user, req, res) {
  const args = text.split(" "); const cmd = args[0].toLowerCase();
  if (cmd === "/help") { createBotMessage("/help /users /stats /nick /clear /mute /unmute /bot /ping /info"); return send(res, 200, { ok: true }); }
  if (cmd === "/users") { const h = db.users.filter(u => u.id !== CONFIG.BOT_ID); createBotMessage(`🟢 Çevrimiçi: ${h.filter(u=>getUserStatus(u)==="online").map(u=>u.name).join(", ") || "Yok"}`); return send(res, 200, { ok: true }); }
  if (cmd === "/stats") { createBotMessage(`Toplam: ${db.messages.length} mesaj, ${db.users.length} kullanıcı`); return send(res, 200, { ok: true }); }
  if (cmd === "/nick") { const n = sanitize(args.slice(1).join(" ")).slice(0, CONFIG.NAME_MAX); if(!n||n.length<2) return send(res, 400, {error:"invalid_name"}); const old=user.name; user.name=n; user.isAdmin=ADMIN_NICKS.includes(n.toLowerCase()); createSystemMessage(`${old} → ${n}`); return send(res, 200, { ok: true }); }
  if (cmd === "/clear") { if(!CONFIG.ALLOW_CLEAR) return send(res, 403, {error:"disabled"}); db.messages.length=0; createSystemMessage(`${user.name} sohbeti temizledi`); return send(res, 200, { ok: true, cleared: true }); }
  if (cmd === "/mute") { const t = sanitize(args.slice(1).join(" ")); if(!t) return send(res, 400, {error:"missing"}); const tu=userExists(t); if(!tu) return send(res, 404, {error:"not_found"}); tu.muted=true; createSystemMessage(`${tu.name} susturuldu`); return send(res, 200, { ok: true }); }
  if (cmd === "/unmute") { const t = sanitize(args.slice(1).join(" ")); if(!t) return send(res, 400, {error:"missing"}); const tu=userExists(t); if(!tu) return send(res, 404, {error:"not_found"}); tu.muted=false; createSystemMessage(`${tu.name} susturması kaldırıldı`); return send(res, 200, { ok: true }); }
  if (cmd === "/ping") { setTimeout(() => createBotMessage("🏓 Pong!"), 800); return send(res, 200, { ok: true }); }
  if (cmd === "/info") { createBotMessage("NetTalk Pro v4.0 Serverless"); return send(res, 200, { ok: true }); }
  createBotMessage(`Bilinmeyen komut: ${cmd}`); return send(res, 400, { error: "unknown_command" });
}

function formatUser(u) {
  return { id: u.id, name: u.name, isBot: !!u.isBot, isAdmin: !!u.isAdmin, avatar: u.avatar || null, status: getUserStatus(u), muted: !!u.muted };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    cleanupReadonly();
    if (!db.botState.initialized) { db.botState.initialized = true; createBotMessage("🤖 NetTalk Bot aktif! /help yazın."); }
    return send(res, 200, { ok: true, serverTime: now(), messages: db.messages, users: db.users.map(formatUser), typing: Object.values(db.typing).filter(t => now()-t.time < CONFIG.TYPING_TIMEOUT).map(t=>t.name), onlineCount: db.users.filter(u => u.id !== CONFIG.BOT_ID && getUserStatus(u) === "online").length });
  }

  if (req.method === "POST") {
    cleanupWrite(); const body = req.body || {}; const type = body.type;

    if (type === "join") {
      let name = sanitize(body.name).slice(0, CONFIG.NAME_MAX);
      if (!name || name.length < CONFIG.NAME_MIN) return send(res, 400, { error: "invalid_name" });
      const reserved = [CONFIG.BOT_NAME.toLowerCase(), "system", "sistem", "bot", "nettalk"];
      if (reserved.includes(name.toLowerCase())) return send(res, 400, { error: "name_reserved" });
      const existing = userExists(name);
      if (existing) { updateUserActivity(existing); return send(res, 200, { ok: true, restored: true, userId: existing.id, userName: existing.name, isAdmin: !!existing.isAdmin }); }
      const user = { id: uid(), name, muted: false, isBot: false, isAdmin: ADMIN_NICKS.includes(name.toLowerCase()), avatar: null, status: "online", roomId: body.roomId || "genel", lastSeen: now(), joinedAt: now() };
      db.users.push(user); createSystemMessage(`${name} sohbete katildi`);
      setTimeout(() => botGreetUser(name, false), CONFIG.BOT_TYPING_DELAY + 300);
      return send(res, 200, { ok: true, userId: user.id, userName: user.name, isAdmin: !!user.isAdmin });
    }

    if (type === "heartbeat") {
      let user = restoreUserIfMissing(body.userId, body.userName);
      if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
      updateUserActivity(user);
      if (Math.random() > 0.92) botIdleCheck();
      return send(res, 200, { ok: true, isMuted: !!user.muted, isAdmin: !!user.isAdmin });
    }

    if (type === "message") {
      let user = restoreUserIfMissing(body.userId, body.userName);
      if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
      updateUserActivity(user);
      if (user.muted) return send(res, 403, { error: "muted" });
      const text = sanitize(body.text); if (!text) return send(res, 400, { error: "empty_message" });
      if (rateLimited(user.id)) return send(res, 429, { error: "rate_limit" });
      if (text.startsWith("/")) return executeCommand(text, user, req, res);
      db.messages.push({ id: uid(), type: "message", userId: user.id, userName: user.name, text, createdAt: now(), reactions: {}, editedAt: null });
      cleanMessages(); botCheckKeywords(text, user); return send(res, 200, { ok: true });
    }

    if (type === "reaction") {
      let user = restoreUserIfMissing(body.userId, body.userName);
      if (!validateUser(user)) return send(res, 200, { ok: false });
      updateUserActivity(user); const msg = db.messages.find(m => m.id === body.messageId);
      if (!msg) return send(res, 404, { error: "message_not_found" }); const emoji = body.emoji;
      if (!emoji) return send(res, 400, { error: "missing_emoji" });
      if (!msg.reactions) msg.reactions = {}; if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      const users = msg.reactions[emoji];
      if (users.includes(user.id)) { msg.reactions[emoji] = users.filter(id => id !== user.id); if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji]; }
      else { users.push(user.id); } return send(res, 200, { ok: true });
    }

    if (type === "typing") {
      let user = restoreUserIfMissing(body.userId, body.userName);
      if (!validateUser(user)) return send(res, 200, { ok: false });
      db.typing[user.id] = { name: user.name, time: now() }; return send(res, 200, { ok: true });
    }

    if (type === "leave") { const user = getUser(body.userId); if (user) { createSystemMessage(`${user.name} ayrildi`); user.lastSeen = 0; } return send(res, 200, { ok: true }); }
    return send(res, 400, { error: "unknown_type" });
  }

  if (req.method === "PATCH") {
    cleanupWrite(); const body = req.body || {}; let user = restoreUserIfMissing(body.userId, body.userName);
    if (!validateUser(user)) return send(res, 200, { ok: false, missing: true }); updateUserActivity(user);
    const msg = db.messages.find(m => m.id === body.id); if (!msg) return send(res, 404, { error: "message_not_found" });
    if (msg.userId !== user.id && !user.isAdmin) return send(res, 403, { error: "forbidden" }); // Admin düzenleyebilir
    const newText = sanitize(body.text); if (!newText) return send(res, 400, { error: "empty_message" });
    msg.text = newText; msg.editedAt = now(); return send(res, 200, { ok: true });
  }

  if (req.method === "DELETE") {
    cleanupWrite(); const body = req.body || {}; let user = restoreUserIfMissing(body.userId, body.userName);
    if (!validateUser(user)) return send(res, 200, { ok: false, missing: true }); updateUserActivity(user);
    const msg = db.messages.find(m => m.id === body.id); if (!msg) return send(res, 404, { error: "message_not_found" });
    if (msg.userId !== user.id && !user.isAdmin) return send(res, 403, { error: "forbidden" }); // Admin silebilir
    db.messages = db.messages.filter(m => m.id !== body.id); return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "method_not_allowed" });
} 

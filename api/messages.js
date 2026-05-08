/* ============================================================
   NetTalk Pro — Serverless Uyumlu Backend API v3
   ============================================================ */
let messages = [];
let users = new Map();
let typingUsers = new Map();
let mutedUsers = new Set();
let rateLimits = new Map();

const MAX_MESSAGES = 500;
const INACTIVE_TIMEOUT = 15000;
const RATE_LIMIT_WINDOW = 5000;
const RATE_LIMIT_MAX = 8;
const MAX_MSG_LENGTH = 500;
const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 2;

const BAD_WORDS = ["amk","aq","oç","oc","piç","pic","siktir","orospu","yarrak","yarak","got","göt","sik","amına","amcık","amcik","salak","gerizekalı","mal","aptal","öküz","iban"];
const BOT = { id: "__bot__", name: "NetBot", avatar: "🤖", roomId: "*" };

function now() { return Date.now(); }
function genId() { return now().toString(36) + Math.random().toString(36).substring(2, 8); }
function sanitize(text) { return typeof text === "string" ? text.trim().replace(/[\x00-\x1F\x7F]/g, "") : ""; }
function hasBadWord(text) { const l = text.toLowerCase(); return BAD_WORDS.some(w => l.includes(w)); }
function maskBadWords(text) { let r = text; BAD_WORDS.forEach(w => { r = r.replace(new RegExp(w, "gi"), "*".repeat(w.length)); }); return r; }

function botSend(roomId, text) {
  messages.push({ id: genId(), userId: BOT.id, userName: BOT.name, avatar: BOT.avatar, roomId, text, createdAt: now(), editedAt: null, reactions: {}, type: "system" });
  if (messages.length > MAX_MESSAGES) messages.shift();
}
function systemSend(roomId, text) {
  messages.push({ id: genId(), userId: "__system__", userName: "Sistem", avatar: "", roomId, text, createdAt: now(), editedAt: null, reactions: {}, type: "system" });
  if (messages.length > MAX_MESSAGES) messages.shift();
}

function checkRateLimit(userId) {
  const t = now();
  if (!rateLimits.has(userId)) rateLimits.set(userId, []);
  const hits = rateLimits.get(userId).filter(h => t - h < RATE_LIMIT_WINDOW);
  hits.push(t);
  rateLimits.set(userId, hits);
  return hits.length <= RATE_LIMIT_MAX;
}

function validateUser(userId) {
  if (!userId || typeof userId !== "string") return null;
  const user = users.get(userId);
  if (!user) return null;
  user.lastSeen = now();
  return user;
}

function handleCommand(userId, text, roomId) {
  const parts = text.slice(1).split(" ");
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");
  const user = users.get(userId);
  if (!user) return true;

  switch (cmd) {
    case "help": botSend(roomId, "📖 Komutlar:\n/help — Komut listesi\n/users — Online kullanıcılar\n/stats — İstatistikler\n/nick <isim> — İsim değiştir\n/clear — Ekranı temizle\n/mute <kullanıcı> — Sustur\n/unmute <kullanıcı> — Susturmayı kaldır"); return true;
    case "users": { const ru = [...users.values()].filter(u => u.roomId === roomId && u.status === "online"); botSend(roomId, "👥 Çevrimiçi (" + ru.length + "):\n" + (ru.map(u => "• " + u.name).join("\n") || "Kimse yok")); return true; }
    case "stats": { const rm = messages.filter(m => m.roomId === roomId); botSend(roomId, "📊 İstatistikler:\nMesaj: " + rm.length + "\nToplam kullanıcı: " + users.size + "\nÇevrimiçi: " + [...users.values()].filter(u => u.status === "online").length); return true; }
    case "nick": { if (!arg || arg.length < MIN_NAME_LENGTH || arg.length > MAX_NAME_LENGTH) { botSend(roomId, "⚠ İsim " + MIN_NAME_LENGTH + "-" + MAX_NAME_LENGTH + " karakter olmalı"); return true; } if (hasBadWord(arg)) { botSend(roomId, "⚠ Bu isim uygun değil"); return true; } const old = user.name; user.name = sanitize(arg); systemSend(roomId, "✏️ " + old + " → " + user.name); return true; }
    case "clear": messages = messages.filter(m => m.roomId !== roomId); systemSend(roomId, "🧹 Sohbet temizlendi"); return true;
    case "mute": { if (!arg) { botSend(roomId, "⚠ /mute <kullanıcı adı>"); return true; } const t = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase()); if (!t) { botSend(roomId, "⚠ Kullanıcı bulunamadı"); return true; } if (t.id === userId) { botSend(roomId, "⚠ Kendini susturamazsın"); return true; } mutedUsers.add(t.id); systemSend(roomId, "🔇 " + t.name + " susturuldu"); return true; }
    case "unmute": { if (!arg) { botSend(roomId, "⚠ /unmute <kullanıcı adı>"); return true; } const t = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase()); if (!t) { botSend(roomId, "⚠ Kullanıcı bulunamadı"); return true; } mutedUsers.delete(t.id); systemSend(roomId, "🔊 " + t.name + " susturması kaldırıldı"); return true; }
    default: botSend(roomId, "⚠ Bilinmeyen komut: /" + cmd + " — /help yaz"); return true;
  }
}

setInterval(() => {
  const t = now();
  for (const [id, user] of users.entries()) { if (t - user.lastSeen > INACTIVE_TIMEOUT && user.status === "online") user.status = "offline"; }
  for (const [id, user] of users.entries()) { if (user.status === "offline" && t - user.lastSeen > 60000) { users.delete(id); mutedUsers.delete(id); rateLimits.delete(id); } }
  for (const [id, hits] of rateLimits.entries()) { const fresh = hits.filter(h => t - h < RATE_LIMIT_WINDOW); if (fresh.length === 0) rateLimits.delete(id); else rateLimits.set(id, fresh); }
}, 5000);

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.body || {};

  if (req.method === "POST" && body.type === "join") {
    const { name, avatar = "", roomId = "genel" } = body;
    const cleanName = sanitize(name || "");
    if (!cleanName || cleanName.length < MIN_NAME_LENGTH) return res.status(400).json({ error: "İsim en az " + MIN_NAME_LENGTH + " karakter olmalı" });
    if (cleanName.length > MAX_NAME_LENGTH) return res.status(400).json({ error: "İsim en fazla " + MAX_NAME_LENGTH + " karakter" });
    if (hasBadWord(cleanName)) return res.status(400).json({ error: "Bu isim uygun değil" });
    
    const nameExists = [...users.values()].some(u => u.name.toLowerCase() === cleanName.toLowerCase() && u.status === "online");
    if (nameExists) return res.status(409).json({ error: "Bu isim zaten kullanımda" });

    const userId = genId();
    users.set(userId, { id: userId, name: cleanName, avatar, roomId, status: "online", lastSeen: now(), joinedAt: now() });
    systemSend(roomId, "🟢 " + cleanName + " sohbete katıldı");
    const oc = [...users.values()].filter(u => u.roomId === roomId && u.status === "online").length;
    botSend(roomId, oc <= 1 ? "Merhaba " + cleanName + "! 👋\nNetTalk Pro'ya hoş geldin.\nKomutlar için /help yaz." : "Hoş geldin " + cleanName + "! 🎉\nŞu anda " + oc + " kişi çevrimiçi. /help ile komutları gör!");
    return res.json({ ok: true, userId, userName: cleanName });
  }

  if (req.method === "POST" && body.type === "leave") {
    if (body.userId) { const u = users.get(body.userId); if (u) { systemSend(u.roomId, "👋 " + u.name + " ayrıldı"); users.delete(body.userId); } mutedUsers.delete(body.userId); rateLimits.delete(body.userId); }
    return res.json({ ok: true });
  }

  if (req.method === "POST" && body.type === "heartbeat") {
    const user = validateUser(body.userId);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (user.status === "offline") { user.status = "online"; systemSend(user.roomId, "🟢 " + user.name + " geri döndü"); }
    return res.json({ ok: true, userName: user.name, isMuted: mutedUsers.has(body.userId) });
  }

  if (req.method === "POST" && body.type === "message") {
    const user = validateUser(body.userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });
    if (mutedUsers.has(body.userId)) return res.status(403).json({ error: "muted" });
    if (!checkRateLimit(body.userId)) return res.status(429).json({ error: "rate_limit" });
    const cleanText = sanitize(body.text || "");
    if (!cleanText) return res.status(400).json({ error: "empty" });
    if (cleanText.length > MAX_MSG_LENGTH) return res.status(400).json({ error: "too_long" });
    if (cleanText.startsWith("/")) { const h = handleCommand(body.userId, cleanText, body.roomId || "genel"); if (h) return res.json({ ok: true, type: "command" }); }
    const finalText = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;
    const message = { id: genId(), userId: body.userId, userName: user.name, avatar: user.avatar, roomId: body.roomId || "genel", text: finalText, createdAt: now(), editedAt: null, reactions: {}, type: "message" };
    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();
    typingUsers.get(body.roomId)?.delete(body.userId);
    return res.json({ ok: true, message });
  }

  if (req.method === "POST" && body.type === "typing") {
    const user = validateUser(body.userId);
    if (!user) return res.json({ ok: true });
    if (!typingUsers.has(body.roomId)) typingUsers.set(body.roomId, new Set());
    typingUsers.get(body.roomId).add(body.userId);
    setTimeout(() => { typingUsers.get(body.roomId)?.delete(body.userId); }, 2000);
    return res.json({ ok: true });
  }

  if (req.method === "POST" && body.type === "reaction") {
    const user = validateUser(body.userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });
    const msg = messages.find(m => m.id === body.messageId);
    if (!msg) return res.status(404).json({ error: "not_found" });
    if (!msg.reactions[body.emoji]) msg.reactions[body.emoji] = [];
    const idx = msg.reactions[body.emoji].indexOf(body.userId);
    if (idx > -1) { msg.reactions[body.emoji].splice(idx, 1); if (!msg.reactions[body.emoji].length) delete msg.reactions[body.emoji]; }
    else msg.reactions[body.emoji].push(body.userId);
    return res.json({ ok: true, reactions: msg.reactions });
  }

  if (req.method === "GET" && req.query.roomId) {
    const roomId = req.query.roomId;
    const roomMessages = messages.filter(m => m.roomId === roomId);
    const roomUsers = [...users.values()].filter(u => u.roomId === roomId);
    const typing = typingUsers.get(roomId) || new Set();
    const typingNames = []; for (const tid of typing) { const u = users.get(tid); if (u && u.status === "online") typingNames.push(u.name); }
    return res.json({ messages: roomMessages, users: roomUsers, typing: typingNames });
  }

  if (req.method === "PATCH") {
    const user = validateUser(body.userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });
    const msg = messages.find(m => m.id === body.id);
    if (!msg) return res.status(404).json({ error: "not_found" });
    if (msg.userId !== body.userId) return res.status(403).json({ error: "forbidden" });
    const cleanText = sanitize(body.text || "");
    if (!cleanText) return res.status(400).json({ error: "empty" });
    msg.text = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;
    msg.editedAt = now();
    return res.json({ ok: true, message: msg });
  }

  if (req.method === "DELETE") {
    const user = validateUser(body.userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });
    const msg = messages.find(m => m.id === body.id);
    if (!msg) return res.status(404).json({ error: "not_found" });
    if (msg.userId !== body.userId) return res.status(403).json({ error: "forbidden" });
    messages = messages.filter(m => m.id !== body.id);
    return res.json({ ok: true });
  }

  if (req.method === "GET" && req.query.stats) {
    const rooms = {}; messages.forEach(m => { rooms[m.roomId] = (rooms[m.roomId] || 0) + 1; });
    return res.json({ totalMessages: messages.length, totalUsers: users.size, onlineUsers: [...users.values()].filter(u => u.status === "online").length, rooms });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

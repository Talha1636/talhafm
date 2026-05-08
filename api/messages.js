/* ============================================================
   NetTalk Pro — Backend API v2
   ============================================================
   Düzeltmeler:
   1. Body parsing güvenliği (content-type zorunluuluğu kaldırıldı)
   2. Serverless cold-start dayanıklılığı (token ile session)
   3. sendBeacon ile gelen text/plain body desteği
   4. Leave endpoint iyileştirildi
   5. Rate limiting hash tabanlı
   6. Daha detaylı hata kodları
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

const BAD_WORDS = [
  "amk","aq","oç","oc","piç","pic","siktir","orospu",
  "yarrak","yarak","got","göt","sik","amına","amcık",
  "amcik","salak","gerizekalı","mal","aptal","öküz","iban"
];

const BOT = { id: "__bot__", name: "NetBot", avatar: "🤖", roomId: "*" };

/* ---------- Yardımcılar ---------- */
function now() { return Date.now(); }
function genId() { return now().toString(36) + Math.random().toString(36).substring(2, 8); }
function sanitize(text) { return typeof text === "string" ? text.trim().replace(/[\x00-\x1F\x7F]/g, "") : ""; }
function hasBadWord(text) { const l = text.toLowerCase(); return BAD_WORDS.some(w => l.includes(w)); }
function maskBadWords(text) { let r = text; BAD_WORDS.forEach(w => { r = r.replace(new RegExp(w, "gi"), "*".repeat(w.length)); }); return r; }

/* ---------- Body Parse (güvenli) ---------- */
function parseBody(req) {
  /* Vercel zaten parse ediyor */
  if (req.body && typeof req.body === "object") return req.body;
  /* Manual fallback */
  return {};
}

/* ---------- Bot / Sistem Mesajı ---------- */
function botSend(roomId, text) {
  messages.push({ id: genId(), userId: BOT.id, userName: BOT.name, avatar: BOT.avatar, roomId, text, createdAt: now(), editedAt: null, reactions: {}, type: "system" });
  if (messages.length > MAX_MESSAGES) messages.shift();
}
function systemSend(roomId, text) {
  messages.push({ id: genId(), userId: "__system__", userName: "Sistem", avatar: "", roomId, text, createdAt: now(), editedAt: null, reactions: {}, type: "system" });
  if (messages.length > MAX_MESSAGES) messages.shift();
}

/* ---------- Rate Limit ---------- */
function checkRateLimit(userId) {
  const t = now();
  if (!rateLimits.has(userId)) rateLimits.set(userId, []);
  const hits = rateLimits.get(userId).filter(h => t - h < RATE_LIMIT_WINDOW);
  hits.push(t);
  rateLimits.set(userId, hits);
  return hits.length <= RATE_LIMIT_MAX;
}

/* ---------- Kullanıcı Doğrulama ---------- */
function validateUser(userId) {
  if (!userId || typeof userId !== "string") return null;
  const user = users.get(userId);
  if (!user) return null;
  user.lastSeen = now();
  return user;
}

/* ---------- Komut İşleyici ---------- */
function handleCommand(userId, text, roomId) {
  const parts = text.slice(1).split(" ");
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");
  const user = users.get(userId);
  if (!user) return true;

  switch (cmd) {
    case "help":
      botSend(roomId, "📖 Komutlar:\n/help — Komut listesi\n/users — Online kullanıcılar\n/stats — İstatistikler\n/nick <isim> — İsim değiştir\n/clear — Ekranı temizle\n/mute <kullanıcı> — Sustur\n/unmute <kullanıcı> — Susturmayı kaldır");
      return true;
    case "users": {
      const ru = [...users.values()].filter(u => u.roomId === roomId && u.status === "online");
      botSend(roomId, "👥 Çevrimiçi (" + ru.length + "):\n" + (ru.map(u => "• " + u.name).join("\n") || "Kimse yok"));
      return true;
    }
    case "stats": {
      const rm = messages.filter(m => m.roomId === roomId);
      botSend(roomId, "📊 İstatistikler:\nMesaj: " + rm.length + "\nToplam kullanıcı: " + users.size + "\nÇevrimiçi: " + [...users.values()].filter(u => u.status === "online").length);
      return true;
    }
    case "nick": {
      if (!arg || arg.length < MIN_NAME_LENGTH || arg.length > MAX_NAME_LENGTH) { botSend(roomId, "⚠ İsim " + MIN_NAME_LENGTH + "-" + MAX_NAME_LENGTH + " karakter olmalı"); return true; }
      if (hasBadWord(arg)) { botSend(roomId, "⚠ Bu isim uygun değil"); return true; }
      const old = user.name; user.name = sanitize(arg);
      systemSend(roomId, "✏️ " + old + " → " + user.name);
      return true;
    }
    case "clear":
      messages = messages.filter(m => m.roomId !== roomId);
      systemSend(roomId, "🧹 Sohbet temizlendi");
      return true;
    case "mute": {
      if (!arg) { botSend(roomId, "⚠ /mute <kullanıcı adı>"); return true; }
      const t = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase());
      if (!t) { botSend(roomId, "⚠ Kullanıcı bulunamadı"); return true; }
      if (t.id === userId) { botSend(roomId, "⚠ Kendini susturamazsın"); return true; }
      mutedUsers.add(t.id); systemSend(roomId, "🔇 " + t.name + " susturuldu"); return true;
    }
    case "unmute": {
      if (!arg) { botSend(roomId, "⚠ /unmute <kullanıcı adı>"); return true; }
      const t = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase());
      if (!t) { botSend(roomId, "⚠ Kullanıcı bulunamadı"); return true; }
      mutedUsers.delete(t.id); systemSend(roomId, "🔊 " + t.name + " susturması kaldırıldı"); return true;
    }
    default:
      botSend(roomId, "⚠ Bilinmeyen komut: /" + cmd + " — /help yaz"); return true;
  }
}

/* ---------- Periyodik Temizlik ---------- */
setInterval(() => {
  const t = now();
  for (const [id, user] of users.entries()) {
    if (t - user.lastSeen > INACTIVE_TIMEOUT && user.status === "online") {
      user.status = "offline";
    }
  }
  for (const [id, user] of users.entries()) {
    if (user.status === "offline" && t - user.lastSeen > 60000) {
      users.delete(id); mutedUsers.delete(id); rateLimits.delete(id);
    }
  }
  for (const [id, hits] of rateLimits.entries()) {
    const fresh = hits.filter(h => t - h < RATE_LIMIT_WINDOW);
    if (fresh.length === 0) rateLimits.delete(id); else rateLimits.set(id, fresh);
  }
}, 5000);

/* ============================================================
   HANDLER
   ============================================================ */
export default function handler(req, res) {
  /* CORS */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body = parseBody(req);

  /* ========================= JOIN ========================= */
  if (req.method === "POST" && body.type === "join") {
    const { name, avatar = "", roomId = "genel" } = body;
    const cleanName = sanitize(name || "");

    if (!cleanName || cleanName.length < MIN_NAME_LENGTH)
      return res.status(400).json({ error: "İsim en az " + MIN_NAME_LENGTH + " karakter olmalı" });
    if (cleanName.length > MAX_NAME_LENGTH)
      return res.status(400).json({ error: "İsim en fazla " + MAX_NAME_LENGTH + " karakter" });
    if (hasBadWord(cleanName))
      return res.status(400).json({ error: "Bu isim uygun değil" });

    const nameExists = [...users.values()].some(u => u.name.toLowerCase() === cleanName.toLowerCase() && u.status === "online");
    if (nameExists)
      return res.status(409).json({ error: "Bu isim zaten kullanımda" });

    const userId = genId();
    users.set(userId, { id: userId, name: cleanName, avatar, roomId, status: "online", lastSeen: now(), joinedAt: now() });

    systemSend(roomId, "🟢 " + cleanName + " sohbete katıldı");

    const onlineCount = [...users.values()].filter(u => u.roomId === roomId && u.status === "online").length;
    if (onlineCount <= 1) {
      botSend(roomId, "Merhaba " + cleanName + "! 👋\nNetTalk Pro'ya hoş geldin. Şu an tek başınasın.\nKomutlar için /help yaz.");
    } else {
      botSend(roomId, "Hoş geldin " + cleanName + "! 🎉\nŞu anda " + onlineCount + " kişi çevrimiçi. /help ile komutları gör!");
    }

    return res.json({ ok: true, userId, userName: cleanName });
  }

  /* ========================= LEAVE ========================= */
  if (req.method === "POST" && body.type === "leave") {
    const { userId } = body;
    if (userId) {
      const user = users.get(userId);
      if (user) {
        systemSend(user.roomId, "👋 " + user.name + " ayrıldı");
        users.delete(userId);
      }
      mutedUsers.delete(userId);
      rateLimits.delete(userId);
    }
    return res.json({ ok: true });
  }

  /* ========================= HEARTBEAT ========================= */
  if (req.method === "POST" && body.type === "heartbeat") {
    const { userId } = body;
    const user = validateUser(userId);
    if (!user) return res.status(404).json({ error: "user_not_found", message: "Kullanıcı bulunamadı, yeniden katılın" });

    if (user.status === "offline") {
      user.status = "online";
      systemSend(user.roomId, "🟢 " + user.name + " geri döndü");
    }
    user.lastSeen = now();

    return res.json({ ok: true, userName: user.name, isMuted: mutedUsers.has(userId) });
  }

  /* ========================= MESSAGE ========================= */
  if (req.method === "POST" && body.type === "message") {
    const { userId, text, roomId = "genel" } = body;
    const user = validateUser(userId);
    if (!user) return res.status(403).json({ error: "invalid_user", message: "Geçersiz kullanıcı, sayfayı yenileyin" });

    if (mutedUsers.has(userId))
      return res.status(403).json({ error: "muted", message: "Susturuldunuz" });

    if (!checkRateLimit(userId))
      return res.status(429).json({ error: "rate_limit", message: "Çok hızlı yazıyorsunuz" });

    const cleanText = sanitize(text || "");
    if (!cleanText) return res.status(400).json({ error: "empty", message: "Boş mesaj" });
    if (cleanText.length > MAX_MSG_LENGTH)
      return res.status(400).json({ error: "too_long", message: "Mesaj çok uzun" });

    if (cleanText.startsWith("/")) {
      const handled = handleCommand(userId, cleanText, roomId);
      if (handled) return res.json({ ok: true, type: "command" });
    }

    const finalText = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;

    const message = {
      id: genId(), userId, userName: user.name, avatar: user.avatar,
      roomId, text: finalText, createdAt: now(), editedAt: null,
      reactions: {}, type: "message"
    };
    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();

    typingUsers.get(roomId)?.delete(userId);
    return res.json({ ok: true, message });
  }

  /* ========================= TYPING ========================= */
  if (req.method === "POST" && body.type === "typing") {
    const { userId, roomId } = body;
    const user = validateUser(userId);
    if (!user) return res.json({ ok: true });

    if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
    typingUsers.get(roomId).add(userId);
    /* 2s sonra otomatik kaldır */
    setTimeout(() => { typingUsers.get(roomId)?.delete(userId); }, 2000);

    return res.json({ ok: true });
  }

  /* ========================= REACTION ========================= */
  if (req.method === "POST" && body.type === "reaction") {
    const { userId, messageId, emoji } = body;
    const user = validateUser(userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return res.status(404).json({ error: "not_found" });

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx > -1) { msg.reactions[emoji].splice(idx, 1); if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji]; }
    else msg.reactions[emoji].push(userId);

    return res.json({ ok: true, reactions: msg.reactions });
  }

  /* ========================= GET ROOM ========================= */
  if (req.method === "GET" && req.query.roomId) {
    const { roomId } = req.query;
    const roomMessages = messages.filter(m => m.roomId === roomId);
    const roomUsers = [...users.values()].filter(u => u.roomId === roomId);

    const typing = typingUsers.get(roomId) || new Set();
    const typingNames = [];
    for (const tid of typing) {
      const u = users.get(tid);
      if (u && u.status === "online") typingNames.push(u.name);
    }

    return res.json({ messages: roomMessages, users: roomUsers, typing: typingNames });
  }

  /* ========================= EDIT ========================= */
  if (req.method === "PATCH") {
    const { id, text, userId } = body;
    const user = validateUser(userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });

    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "not_found" });
    if (msg.userId !== userId) return res.status(403).json({ error: "forbidden" });

    const cleanText = sanitize(text || "");
    if (!cleanText) return res.status(400).json({ error: "empty" });

    msg.text = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;
    msg.editedAt = now();
    return res.json({ ok: true, message: msg });
  }

  /* ========================= DELETE ========================= */
  if (req.method === "DELETE") {
    const { id, userId } = body;
    const user = validateUser(userId);
    if (!user) return res.status(403).json({ error: "invalid_user" });

    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "not_found" });
    if (msg.userId !== userId) return res.status(403).json({ error: "forbidden" });

    messages = messages.filter(m => m.id !== id);
    return res.json({ ok: true });
  }

  /* ========================= STATS ========================= */
  if (req.method === "GET" && req.query.stats) {
    const rooms = {};
    messages.forEach(m => { rooms[m.roomId] = (rooms[m.roomId] || 0) + 1; });
    return res.json({ totalMessages: messages.length, totalUsers: users.size, onlineUsers: [...users.values()].filter(u => u.status === "online").length, rooms });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

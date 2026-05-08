/* ============================================================
   NetTalk Pro — Backend API Handler
   ============================================================
   Özellikler:
   1. Karşılama Botu (otomatik hoşgeldin mesajı)
   2. Rate Limiting (spam koruması)
   3. Mesaj doğrulama & sanitize
   4. Küfür filtresi
   5. Sistem mesajları (katılım, ayrılma, yeniden ad)
   6. Komut sistemi (/help, /users, /clear, /nick, /stats)
   7. Emoji reaksiyon sistemi
   8. Otomatik temizlik (inaktif user & eski typing)
   9. Moderasyon (mute / unmute)
   10. Kullanıcı ayrılma bildirimi (leave)
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

/* ---------- Küfür Listesi ---------- */
const BAD_WORDS = [
  "amk", "aq", "oç", "oc", "piç", "pic", "siktir",
  "orospu", "yarrak", "yarak", "got", "göt", "sik",
  "amına", "amcık", "amcik", "salak", "gerizekalı",
  "mal", "aptal", "öküz", "iban", "esek", "eşek"
];

/* ---------- Bot Konfigürasyonu ---------- */
const BOT = {
  id: "__bot__",
  name: "NetBot",
  avatar: "🤖",
  roomId: "*"
};

/* ---------- Yardımcı Fonksiyonlar ---------- */
function now() { return Date.now(); }
function genId() { return now().toString(36) + Math.random().toString(36).substring(2, 8); }

function sanitize(text) {
  if (typeof text !== "string") return "";
  return text.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

function hasBadWord(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

function maskBadWords(text) {
  let result = text;
  BAD_WORDS.forEach(w => {
    const re = new RegExp(w, "gi");
    result = result.replace(re, "*".repeat(w.length));
  });
  return result;
}

/* ---------- Bot Mesaj Gönder ---------- */
function botSend(roomId, text) {
  messages.push({
    id: genId(),
    userId: BOT.id,
    userName: BOT.name,
    avatar: BOT.avatar,
    roomId,
    text,
    createdAt: now(),
    editedAt: null,
    reactions: {},
    type: "system"
  });
  if (messages.length > MAX_MESSAGES) messages.shift();
}

/* ---------- Sistem Mesajı ---------- */
function systemSend(roomId, text) {
  messages.push({
    id: genId(),
    userId: "__system__",
    userName: "Sistem",
    avatar: "",
    roomId,
    text,
    createdAt: now(),
    editedAt: null,
    reactions: {},
    type: "system"
  });
  if (messages.length > MAX_MESSAGES) messages.shift();
}

/* ---------- Rate Limit Kontrol ---------- */
function checkRateLimit(userId) {
  const t = now();
  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, []);
  }
  const hits = rateLimits.get(userId).filter(h => t - h < RATE_LIMIT_WINDOW);
  hits.push(t);
  rateLimits.set(userId, hits);
  return hits.length <= RATE_LIMIT_MAX;
}

/* ---------- Komut İşleyici ---------- */
function handleCommand(userId, text, roomId) {
  const parts = text.slice(1).split(" ");
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");
  const user = users.get(userId);

  switch (cmd) {
    case "help":
      botSend(roomId,
        "📖 Komutlar:\n" +
        "/help — Komut listesi\n" +
        "/users — Online kullanıcılar\n" +
        "/stats — İstatistikler\n" +
        "/nick <isim> — İsim değiştir\n" +
        "/clear — Ekranı temizle\n" +
        "/mute <kullanıcı> — Sustur\n" +
        "/unmute <kullanıcı> — Susturmayı kaldır"
      );
      return true;

    case "users": {
      const roomUsers = [...users.values()].filter(u => u.roomId === roomId && u.status === "online");
      const list = roomUsers.map(u => "• " + u.name).join("\n");
      botSend(roomId, "👥 Çevrimiçi (" + roomUsers.length + "):\n" + (list || "Kimse yok"));
      return true;
    }

    case "stats": {
      const roomMsgs = messages.filter(m => m.roomId === roomId);
      const totalUsers = users.size;
      const onlineUsers = [...users.values()].filter(u => u.status === "online").length;
      botSend(roomId,
        "📊 İstatistikler:\n" +
        "Mesaj: " + roomMsgs.length + "\n" +
        "Toplam kullanıcı: " + totalUsers + "\n" +
        "Çevrimiçi: " + onlineUsers
      );
      return true;
    }

    case "nick": {
      if (!arg || arg.length < MIN_NAME_LENGTH || arg.length > MAX_NAME_LENGTH) {
        botSend(roomId, "⚠ İsim " + MIN_NAME_LENGTH + "-" + MAX_NAME_LENGTH + " karakter olmalı");
        return true;
      }
      if (hasBadWord(arg)) {
        botSend(roomId, "⚠ Bu isim uygun değil");
        return true;
      }
      const oldName = user.name;
      user.name = sanitize(arg);
      systemSend(roomId, "✏️ " + oldName + " → " + user.name + " olarak değiştirildi");
      return true;
    }

    case "clear":
      messages = messages.filter(m => m.roomId !== roomId);
      systemSend(roomId, "🧹 Sohbet temizlendi");
      return true;

    case "mute": {
      if (!arg) { botSend(roomId, "⚠ /mute <kullanıcı adı>"); return true; }
      const target = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase());
      if (!target) { botSend(roomId, "⚠ Kullanıcı bulunamadı: " + arg); return true; }
      if (target.id === userId) { botSend(roomId, "⚠ Kendini susturamazsın"); return true; }
      mutedUsers.add(target.id);
      systemSend(roomId, "🔇 " + target.name + " susturuldu");
      return true;
    }

    case "unmute": {
      if (!arg) { botSend(roomId, "⚠ /unmute <kullanıcı adı>"); return true; }
      const target = [...users.values()].find(u => u.name.toLowerCase() === arg.toLowerCase());
      if (!target) { botSend(roomId, "⚠ Kullanıcı bulunamadı: " + arg); return true; }
      mutedUsers.delete(target.id);
      systemSend(roomId, "🔊 " + target.name + " susturması kaldırıldı");
      return true;
    }

    default:
      botSend(roomId, "⚠ Bilinmeyen komut: /" + cmd + " — /help yaz");
      return true;
  }
}

/* ============================================================
   PERİYODİK TEMİZLİK
   ============================================================ */
setInterval(() => {
  const t = now();

  /* İnaktif kullanıcıları offline yap */
  for (const [id, user] of users.entries()) {
    if (t - user.lastSeen > INACTIVE_TIMEOUT) {
      if (user.status === "online") {
        systemSend(user.roomId, "👋 " + user.name + " ayrıldı");
      }
      user.status = "offline";
    }
  }

  /* 60 saniyedir offline olan kullanıcıları sil */
  for (const [id, user] of users.entries()) {
    if (user.status === "offline" && t - user.lastSeen > 60000) {
      users.delete(id);
      mutedUsers.delete(id);
      rateLimits.delete(id);
    }
  }

  /* Eski rate limit kayıtlarını temizle */
  for (const [id, hits] of rateLimits.entries()) {
    const fresh = hits.filter(h => t - h < RATE_LIMIT_WINDOW);
    if (fresh.length === 0) rateLimits.delete(id);
    else rateLimits.set(id, fresh);
  }

  /* Eski typing kayıtlarını temizle */
  for (const [roomId, set] of typingUsers.entries()) {
    if (set.size === 0) typingUsers.delete(roomId);
  }
}, 5000);


/* ============================================================
   ANA HANDLER
   ============================================================ */
export default function handler(req, res) {

  /* =========================
     1. JOIN
  ========================== */
  if (req.method === "POST" && req.body?.type === "join") {
    const { name, avatar = "", roomId = "genel" } = req.body;

    const cleanName = sanitize(name || "");

    if (!cleanName || cleanName.length < MIN_NAME_LENGTH) {
      return res.status(400).json({ error: "İsim en az " + MIN_NAME_LENGTH + " karakter olmalı" });
    }
    if (cleanName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: "İsim en fazla " + MAX_NAME_LENGTH + " karakter olmalı" });
    }
    if (hasBadWord(cleanName)) {
      return res.status(400).json({ error: "Bu isim uygun değil" });
    }

    /* Aynı isim kontrolü */
    const nameExists = [...users.values()].some(
      u => u.name.toLowerCase() === cleanName.toLowerCase() && u.status === "online"
    );
    if (nameExists) {
      return res.status(409).json({ error: "Bu isim zaten kullanımda" });
    }

    const userId = genId();

    users.set(userId, {
      id: userId,
      name: cleanName,
      avatar,
      roomId,
      status: "online",
      lastSeen: now(),
      joinedAt: now()
    });

    /* Karşılama mesajları */
    systemSend(roomId, "🟢 " + cleanName + " sohbete katıldı");

    const onlineCount = [...users.values()].filter(u => u.roomId === roomId && u.status === "online").length;

    if (onlineCount <= 1) {
      botSend(roomId,
        "Merhaba " + cleanName + "! 👋\n" +
        "NetTalk Pro'ya hoş geldin. Şu anda tek başınasın, yakında başkaları da katılır!\n" +
        "Komutları görmek için /help yaz."
      );
    } else {
      botSend(roomId,
        "Hoş geldin " + cleanName + "! 🎉\n" +
        "Şu anda " + onlineCount + " kişi çevrimiçi. /help ile komutları gör!"
      );
    }

    return res.json({ ok: true, userId, userName: cleanName });
  }

  /* =========================
     2. LEAVE
  ========================== */
  if (req.method === "POST" && req.body?.type === "leave") {
    const { userId } = req.body;
    const user = users.get(userId);
    if (!user) return res.json({ ok: true });

    systemSend(user.roomId, "👋 " + user.name + " ayrıldı");
    users.delete(userId);
    mutedUsers.delete(userId);
    rateLimits.delete(userId);

    return res.json({ ok: true });
  }

  /* =========================
     3. HEARTBEAT
  ========================== */
  if (req.method === "POST" && req.body?.type === "heartbeat") {
    const { userId } = req.body;
    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    /* Offline'dan geri dönüyorsa bildir */
    if (user.status === "offline") {
      user.status = "online";
      systemSend(user.roomId, "🟢 " + user.name + " geri döndü");
    }

    user.lastSeen = now();

    return res.json({ ok: true });
  }

  /* =========================
     4. SEND MESSAGE
  ========================== */
  if (req.method === "POST" && req.body?.type === "message") {
    const { userId, text, roomId = "genel" } = req.body;

    const user = users.get(userId);
    if (!user) return res.status(403).json({ error: "Geçersiz kullanıcı" });

    /* Mute kontrolü */
    if (mutedUsers.has(userId)) {
      return res.status(403).json({ error: "Susturuldunuz, mesaj gönderemezsiniz" });
    }

    /* Rate limit */
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: "Çok hızlı yazıyorsunuz, yavaşlayın" });
    }

    const cleanText = sanitize(text || "");
    if (!cleanText) return res.status(400).json({ error: "Boş mesaj" });
    if (cleanText.length > MAX_MSG_LENGTH) {
      return res.status(400).json({ error: "Mesaj en fazla " + MAX_MSG_LENGTH + " karakter" });
    }

    /* Komut kontrolü */
    if (cleanText.startsWith("/")) {
      const handled = handleCommand(userId, cleanText, roomId);
      if (handled) return res.json({ ok: true, type: "command" });
    }

    /* Küfür filtresi */
    const finalText = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;

    const message = {
      id: genId(),
      userId,
      userName: user.name,
      avatar: user.avatar,
      roomId,
      text: finalText,
      createdAt: now(),
      editedAt: null,
      reactions: {},
      type: "message"
    };

    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();

    /* Typing'den çıkar */
    typingUsers.get(roomId)?.delete(userId);

    return res.json({ ok: true, message });
  }

  /* =========================
     5. GET ROOM DATA
  ========================== */
  if (req.method === "GET" && req.query.roomId) {
    const { roomId } = req.query;

    const roomMessages = messages.filter(m => m.roomId === roomId);
    const roomUsers = [...users.values()].filter(u => u.roomId === roomId);
    const typing = typingUsers.get(roomId) || new Set();

    /* Typing'deki kullanıcı adlarını getir */
    const typingNames = [];
    for (const tid of typing) {
      const u = users.get(tid);
      if (u && u.status === "online") typingNames.push(u.name);
    }

    return res.json({
      messages: roomMessages,
      users: roomUsers,
      typing: typingNames
    });
  }

  /* =========================
     6. TYPING
  ========================== */
  if (req.method === "POST" && req.body?.type === "typing") {
    const { userId, roomId } = req.body;
    const user = users.get(userId);
    if (!user) return res.json({ ok: true });

    if (!typingUsers.has(roomId)) typingUsers.set(roomId, new Set());
    typingUsers.get(roomId).add(userId);

    return res.json({ ok: true });
  }

  /* =========================
     7. REACTION
  ========================== */
  if (req.method === "POST" && req.body?.type === "reaction") {
    const { userId, messageId, emoji } = req.body;

    const user = users.get(userId);
    if (!user) return res.status(403).json({ error: "Geçersiz kullanıcı" });

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return res.status(404).json({ error: "Mesaj bulunamadı" });

    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx > -1) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(userId);
    }

    return res.json({ ok: true, reactions: msg.reactions });
  }

  /* =========================
     8. EDIT MESSAGE
  ========================== */
  if (req.method === "PATCH") {
    const { id, text, userId } = req.body;

    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "Mesaj bulunamadı" });
    if (msg.userId !== userId) return res.status(403).json({ error: "Sadece kendi mesajınızı düzenleyebilirsiniz" });

    const cleanText = sanitize(text || "");
    if (!cleanText) return res.status(400).json({ error: "Boş mesaj" });

    msg.text = hasBadWord(cleanText) ? maskBadWords(cleanText) : cleanText;
    msg.editedAt = now();

    return res.json({ ok: true, message: msg });
  }

  /* =========================
     9. DELETE MESSAGE
  ========================== */
  if (req.method === "DELETE") {
    const { id, userId } = req.body;

    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "Mesaj bulunamadı" });
    if (msg.userId !== userId) return res.status(403).json({ error: "Sadece kendi mesajınızı silebilirsiniz" });

    messages = messages.filter(m => m.id !== id);

    return res.json({ ok: true });
  }

  /* =========================
     10. STATS
  ========================== */
  if (req.method === "GET" && req.query.stats) {
    const rooms = {};
    messages.forEach(m => { rooms[m.roomId] = (rooms[m.roomId] || 0) + 1; });

    return res.json({
      totalMessages: messages.length,
      totalUsers: users.size,
      onlineUsers: [...users.values()].filter(u => u.status === "online").length,
      mutedUsers: mutedUsers.size,
      rooms
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

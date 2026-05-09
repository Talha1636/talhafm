// /api/messages.js
// NetTalk Pro v3.1 - Professional Chat API

const GLOBAL_KEY = "__NETTALK_PRO_V31__";

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = {
    messages: [],
    users: [],
    typing: {},
    rateLimits: {},
    botState: {
      lastGreeting: {},
      initTime: Date.now()
    }
  };
}

const db = globalThis[GLOBAL_KEY];

const CONFIG = {
  MAX_MESSAGES: 500,
  MESSAGE_MAX: 500,
  NAME_MAX: 20,
  NAME_MIN: 2,
  RATE_LIMIT_MS: 1200,
  TYPING_TIMEOUT: 3000,
  USER_TIMEOUT: 1000 * 60 * 60 * 24,
  ONLINE_TIMEOUT: 1000 * 60 * 2,
  AWAY_TIMEOUT: 1000 * 60 * 10,
  ALLOW_CLEAR: true,
  BOT_TYPING_DELAY: 800,
  BOT_NAME: "NetTalk Bot",
  BOT_ID: "__bot__",
  BOT_AVATAR: "🤖",
  SYSTEM_ID: "__system__",
  COOLDOWN_GREET: 30000,
  GREETINGS_ENABLED: true,
  AUTO_RESPONSES_ENABLED: true
};

const BOT_GREETINGS = [
  "Hos geldin {user}! 👋 Sohbete katilmana sevindim.",
  "Selam {user}! 🎉 Burada olmana bayildim!",
  "Merhaba {user}! ✨ Seni gormek guzel.",
  "Hey {user}! 🌟 Hos geldin, keyifli sohbetler!",
  "{user} geldi! 🎊 Herkese merhaba deyin!",
  "Ah, {user} sonunda geldi! 💫 Hosgeldin!"
];

const BOT_COMEBACK = [
  "{user} geri dondu! 👋",
  "Tekrar hosgeldin {user}! 🤗",
  "{user} tekrar aramizda! 🎉"
];

const BOT_FUN_FACTS = [
  "💡 Bilgi: Dünyada her saniye 2.5 milyon e-posta gonderiliyor!",
  "💡 Bilgi: Bir gunde ortalama 16.000 kelime konusuyoruz.",
  "💡 Bilgi: Internetin %90'i 1991'den sonra olusturuldu.",
  "💡 Bilgi: Ilk emoji 1999'da Japonya'da yaratildi.",
  "💡 Bilgi: Dünyada 5 milyardan fazla internet kullanicisi var."
];

const BOT_MORNING = ["Gunaydin! ☀️ Bugun harika bir gun olacak!", "Sabahin hayirli olsun! 🌅"];
const BOT_NIGHT = ["Iyi geceler! 🌙 Tatli ruyalar!", "Uyku vakti! 😴 Yarin gorusmek uzere!"];

const BOT_IDLE_MESSAGES = [
  "Burada kimse yok mu? 👀 Biraz sessiz oldu...",
  "Sohbet canlansin! 💬 Ne konusalim?",
  "Biri bir sey soyleyecek mi? 🤔",
  "Ekip nerde? 🏳️ Ben buradayim!"
];

const BOT_KEYWORD_RESPONSES = {
  "merhaba": ["Merhaba! 👋 Nasilsin?", "Selam! 😊 Bugun nasil gidiyor?"],
  "nasilsin": ["Iyiyim, tesekkurler! Sen nasilsin? 😊", "Superim! Botlar her zaman iyidir 😄"],
  "bot": ["Evet, ben bir botum! 🤖 Ama kalbim sicak!", "🤖 Ben NetTalk Bot! Senin icin buradayim!"],
  "yardim": ["Yardima mi ihtiyacin var? /help yazabilirsin! 📋", "Tabii ki! Komutlari gormek icin /help yaz."],
  "selam": ["Selam! 👋 Aleykum selam!", "Selamun aleykum! 😊"],
  "tesekkur": ["Rica ederim! 😊", "Ne demek, her zaman! 🤗"],
  "komik": ["Haha! 😄 Ben de guluyorum!", "😂 Komikligine bayildim!"],
  "muzik": ["🎵 Muzik her derde devadir!", "🎶 Hangi tur muzik seversin?"],
  "oyun": ["🎮 Oyun oynamayi sever misin?", "🎮 Hangi oyunlari oynuyorsun?"]
};

function now() { return Date.now(); }
function uid() { return Math.random().toString(36).slice(2) + now().toString(36) + Math.random().toString(36).slice(2, 6); }
function send(res, code, data) { return res.status(code).json(data); }
function sanitize(text = "") { return String(text).trim().slice(0, CONFIG.MESSAGE_MAX); }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 23) return "evening";
  return "night";
}

function normalizeTr(str) {
  return str.replace(/ş/g,"s").replace(/ç/g,"c").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/İ/g,"I").toLowerCase();
}

function getUserStatus(user) {
  if (user.id === CONFIG.BOT_ID) return "online";
  const elapsed = now() - user.lastSeen;
  if (elapsed < CONFIG.ONLINE_TIMEOUT) return "online";
  if (elapsed < CONFIG.AWAY_TIMEOUT) return "away";
  return "offline";
}

function cleanUsers() {
  const t = now();
  db.users = db.users.filter(u => {
    if (u.id === CONFIG.BOT_ID) return true;
    return t - u.lastSeen < CONFIG.USER_TIMEOUT;
  });
}

function cleanTyping() {
  const t = now();
  for (const id in db.typing) {
    if (t - db.typing[id].time > CONFIG.TYPING_TIMEOUT) delete db.typing[id];
  }
}

function cleanMessages() {
  if (db.messages.length > CONFIG.MAX_MESSAGES) {
    db.messages = db.messages.slice(-CONFIG.MAX_MESSAGES);
  }
}

function ensureBotExists() {
  let bot = db.users.find(u => u.id === CONFIG.BOT_ID);
  if (!bot) {
    db.users.push({
      id: CONFIG.BOT_ID, name: CONFIG.BOT_NAME, muted: false,
      isBot: true, avatar: CONFIG.BOT_AVATAR, status: "online",
      roomId: "genel", lastSeen: now(), joinedAt: db.botState.initTime || now()
    });
  } else {
    bot.lastSeen = now();
    bot.status = "online";
    bot.isBot = true;
    bot.avatar = CONFIG.BOT_AVATAR;
  }
}

function cleanupReadonly() { cleanTyping(); cleanMessages(); ensureBotExists(); }
function cleanupWrite() { cleanUsers(); cleanTyping(); cleanMessages(); ensureBotExists(); }

function createBotMessage(text, extra = {}) {
  db.messages.push({
    id: uid(), type: "bot", userId: CONFIG.BOT_ID,
    userName: CONFIG.BOT_NAME, isBot: true, avatar: CONFIG.BOT_AVATAR,
    text, createdAt: now(), ...extra
  });
  cleanMessages();
}

function createSystemMessage(text, extra = {}) {
  db.messages.push({
    id: uid(), type: "system", userId: CONFIG.SYSTEM_ID,
    userName: "System", text, createdAt: now(), ...extra
  });
  cleanMessages();
}

function botGreetUser(userName, isReturning = false) {
  if (!CONFIG.GREETINGS_ENABLED) return;
  const t = now();
  const lastGreet = db.botState.lastGreeting[userName] || 0;
  if (t - lastGreet < CONFIG.COOLDOWN_GREET) return;
  db.botState.lastGreeting[userName] = t;

  if (isReturning) {
    createBotMessage(randomFrom(BOT_COMEBACK).replace("{user}", userName));
    return;
  }

  createBotMessage(randomFrom(BOT_GREETINGS).replace("{user}", userName));
  const tod = getTimeOfDay();
  if (tod === "morning" && Math.random() > 0.5) {
    setTimeout(() => createBotMessage(randomFrom(BOT_MORNING)), CONFIG.BOT_TYPING_DELAY);
  } else if (tod === "night" && Math.random() > 0.5) {
    setTimeout(() => createBotMessage(randomFrom(BOT_NIGHT)), CONFIG.BOT_TYPING_DELAY);
  }
}

function botCheckKeywords(text, user) {
  if (!CONFIG.AUTO_RESPONSES_ENABLED) return;
  if (user.id === CONFIG.BOT_ID) return;
  if (text.startsWith("/")) return;
  const normalized = normalizeTr(text);
  for (const [keyword, responses] of Object.entries(BOT_KEYWORD_RESPONSES)) {
    if (normalized.includes(normalizeTr(keyword))) {
      if (Math.random() > 0.3) {
        setTimeout(() => createBotMessage(randomFrom(responses)), CONFIG.BOT_TYPING_DELAY + Math.random() * 500);
      }
      return;
    }
  }
  if (Math.random() > 0.93) {
    setTimeout(() => createBotMessage(randomFrom(BOT_FUN_FACTS)), CONFIG.BOT_TYPING_DELAY + 1000);
  }
}

function botIdleCheck() {
  const recentHuman = db.messages.filter(m => m.type === "message" && now() - m.createdAt < 5 * 60 * 1000);
  if (recentHuman.length > 0) return;
  const onlineHumans = db.users.filter(u => u.id !== CONFIG.BOT_ID && getUserStatus(u) === "online");
  if (onlineHumans.length === 0) return;
  const lastBot = db.messages.filter(m => m.type === "bot").sort((a, b) => b.createdAt - a.createdAt)[0];
  if (lastBot && now() - lastBot.createdAt < 5 * 60 * 1000) return;
  createBotMessage(randomFrom(BOT_IDLE_MESSAGES));
}

function getUser(id) { return db.users.find(u => u.id === id); }
function userExists(name) { return db.users.find(u => u.name.toLowerCase() === name.toLowerCase()); }
function updateUserActivity(user) { user.lastSeen = now(); }
function validateUser(user) { if (!user) return false; if (user.id === CONFIG.BOT_ID) return false; return true; }

function rateLimited(userId) {
  const last = db.rateLimits[userId];
  if (!last) { db.rateLimits[userId] = now(); return false; }
  if (now() - last < CONFIG.RATE_LIMIT_MS) return true;
  db.rateLimits[userId] = now();
  return false;
}

async function executeCommand(text, user, req, res) {
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  if (cmd === "/help") {
    createBotMessage([
      "📋 Mevcut Komutlar:",
      "━━━━━━━━━━━━━━━━━━━",
      "/help - Bu mesaji gosterir",
      "/users - Aktif kullanicilari listeler",
      "/stats - Istatistikleri gosterir",
      "/nick <isim> - Isim degistir",
      "/clear - Sohbeti temizle",
      "/mute <isim> - Kullaniciyi sustur",
      "/unmute <isim> - Susturmayi kaldir",
      "/bot - Bot hakkinda bilgi",
      "/ping - Bot'u test et",
      "/info - Sunucu bilgisi"
    ].join("\n"));
    return send(res, 200, { ok: true });
  }

  if (cmd === "/users") {
    const humans = db.users.filter(u => u.id !== CONFIG.BOT_ID);
    const online = humans.filter(u => getUserStatus(u) === "online");
    const away = humans.filter(u => getUserStatus(u) === "away");
    createBotMessage([
      "👥 Aktif Kullanicilar",
      "━━━━━━━━━━━━━━━━━━━",
      `🟢 Cevrimici (${online.length}): ${online.map(u=>u.name).join(", ") || "Yok"}`,
      `🟡 Uzakta (${away.length}): ${away.map(u=>u.name).join(", ") || "Yok"}`,
      `🤖 ${CONFIG.BOT_NAME} (Her zaman aktif)`
    ].join("\n"));
    return send(res, 200, { ok: true });
  }

  if (cmd === "/stats") {
    const humans = db.users.filter(u => u.id !== CONFIG.BOT_ID);
    createBotMessage([
      "📊 Sunucu Istatistikleri",
      "━━━━━━━━━━━━━━━━━━━",
      `👥 Toplam Kullanici: ${humans.length}`,
      `🟢 Cevrimici: ${humans.filter(u => getUserStatus(u) === "online").length}`,
      `💬 Mesaj: ${db.messages.filter(m => m.type === "message").length}`,
      `🤖 Bot Mesaji: ${db.messages.filter(m => m.type === "bot").length}`,
      `📝 Toplam: ${db.messages.length}`
    ].join("\n"));
    return send(res, 200, { ok: true });
  }

  if (cmd === "/nick") {
    const newName = sanitize(args.slice(1).join(" ")).slice(0, CONFIG.NAME_MAX);
    if (!newName || newName.length < CONFIG.NAME_MIN) {
      createBotMessage("❌ Isim en az 2 karakter olmali!");
      return send(res, 400, { error: "invalid_name" });
    }
    const reserved = [CONFIG.BOT_NAME.toLowerCase(), "system", "sistem", "bot", "nettalk"];
    if (reserved.includes(newName.toLowerCase())) {
      createBotMessage("❌ Bu isim rezerve edilmis!");
      return send(res, 400, { error: "name_reserved" });
    }
    const exists = userExists(newName);
    if (exists && exists.id !== user.id) {
      createBotMessage("❌ Bu isim zaten kullaniliyor!");
      return send(res, 400, { error: "name_taken" });
    }
    const old = user.name;
    user.name = newName;
    createSystemMessage(`${old} → ${newName} olarak isim degistirdi`);
    setTimeout(() => createBotMessage(`✨ Yeni ismin: ${newName}! Guzel secim!`), CONFIG.BOT_TYPING_DELAY);
    return send(res, 200, { ok: true });
  }

  if (cmd === "/clear") {
    if (!CONFIG.ALLOW_CLEAR) { createBotMessage("❌ Sohbet temizleme devre disi!"); return send(res, 403, { error: "disabled" }); }
    db.messages.length = 0;
    createSystemMessage(`${user.name} sohbeti temizledi`);
    setTimeout(() => createBotMessage("🧹 Sohbet temizlendi! Yeni bir baslangic!"), CONFIG.BOT_TYPING_DELAY);
    return send(res, 200, { ok: true, cleared: true });
  }

  if (cmd === "/mute") {
    const target = sanitize(args.slice(1).join(" "));
    if (!target) { createBotMessage("❌ /mute <isim>"); return send(res, 400, { error: "missing" }); }
    const tu = userExists(target);
    if (!tu) { createBotMessage(`❌ "${target}" bulunamadi.`); return send(res, 404, { error: "not_found" }); }
    if (tu.id === CONFIG.BOT_ID) { createBotMessage("🤖 Beni susturamazsin! 😎"); return send(res, 403, { error: "no" }); }
    tu.muted = true;
    createSystemMessage(`${tu.name} susturuldu`);
    createBotMessage(`🔇 ${tu.name} susturuldu.`);
    return send(res, 200, { ok: true });
  }

  if (cmd === "/unmute") {
    const target = sanitize(args.slice(1).join(" "));
    if (!target) { createBotMessage("❌ /unmute <isim>"); return send(res, 400, { error: "missing" }); }
    const tu = userExists(target);
    if (!tu) { createBotMessage(`❌ "${target}" bulunamadi.`); return send(res, 404, { error: "not_found" }); }
    tu.muted = false;
    createSystemMessage(`${tu.name} susturmasi kaldirildi`);
    createBotMessage(`🔊 ${tu.name} artik konusabilir!`);
    return send(res, 200, { ok: true });
  }

  if (cmd === "/bot") {
    createBotMessage([
      "🤖 NetTalk Bot Bilgisi",
      "━━━━━━━━━━━━━━━━━━━",
      "Adim: NetTalk Bot",
      "Gorevim: Sohbeti yonlendirmek",
      "Ozelliklerim:",
      "  • Yeni kullanicilari karsilama",
      "  • Komutlara cevap verme",
      "  • Anahtar kelime algilama",
      "  • 7/24 aktif olma 😎",
      "",
      "Bana selam verebilirsin!"
    ].join("\n"));
    return send(res, 200, { ok: true });
  }

  if (cmd === "/ping") {
    const start = now();
    setTimeout(() => createBotMessage(`🏓 Pong! Gecikme: ${now() - start}ms`), CONFIG.BOT_TYPING_DELAY);
    return send(res, 200, { ok: true });
  }

  if (cmd === "/info") {
    const uptime = Math.floor((now() - (db.botState.initTime || now())) / 1000);
    const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
    createBotMessage([
      "ℹ️ Sunucu Bilgisi",
      "━━━━━━━━━━━━━━━━━━━",
      `Versiyon: 3.1.0`,
      `Aktif Kullanici: ${db.users.filter(u => u.id !== CONFIG.BOT_ID && getUserStatus(u) === "online").length}`,
      `Calisma: ${h}sa ${m}dk ${s}sn`,
      `Bot: 🟢 Aktif`
    ].join("\n"));
    return send(res, 200, { ok: true });
  }

  createBotMessage(`❌ Bilinmeyen komut: "${cmd}" — /help yaz`);
  return send(res, 400, { error: "unknown_command" });
}

function formatUser(u) {
  return {
    id: u.id, name: u.name, isBot: !!u.isBot,
    avatar: u.avatar || null, status: getUserStatus(u), muted: !!u.muted
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const serverTime = now();

  // GET — READ ONLY
  if (req.method === "GET") {
    cleanupReadonly();

    return send(res, 200, {
      ok: true,
      serverTime,
      messages: db.messages,
      users: db.users.map(formatUser),
      typing: Object.values(db.typing)
        .filter(t => serverTime - t.time < CONFIG.TYPING_TIMEOUT)
        .map(t => t.name),
      onlineCount: db.users.filter(u => u.id !== CONFIG.BOT_ID && getUserStatus(u) === "online").length,
      botInfo: { name: CONFIG.BOT_NAME, id: CONFIG.BOT_ID, avatar: CONFIG.BOT_AVATAR, online: true }
    });
  }

  // POST — WRITE
  if (req.method === "POST") {
    cleanupWrite();
    const body = req.body || {};
    const type = body.type;

    if (type === "join") {
      let name = sanitize(body.name).slice(0, CONFIG.NAME_MAX);
      if (!name || name.length < CONFIG.NAME_MIN) return send(res, 400, { error: "invalid_name" });
      const reserved = [CONFIG.BOT_NAME.toLowerCase(), "system", "sistem", "bot", "nettalk"];
      if (reserved.includes(name.toLowerCase())) return send(res, 400, { error: "name_reserved" });

      const existing = userExists(name);
      if (existing) {
        updateUserActivity(existing);
        setTimeout(() => botGreetUser(name, true), CONFIG.BOT_TYPING_DELAY + 300);
        return send(res, 200, { ok: true, restored: true, userId: existing.id, userName: existing.name });
      }

      const user = {
        id: uid(), name, muted: false, isBot: false, avatar: null,
        status: "online", roomId: body.roomId || "genel",
        lastSeen: now(), joinedAt: now()
      };
      db.users.push(user);
      createSystemMessage(`${name} sohbete katildi`);
      setTimeout(() => botGreetUser(name, false), CONFIG.BOT_TYPING_DELAY + 300);
      return send(res, 200, { ok: true, userId: user.id, userName: user.name });
    }

    if (type === "heartbeat") {
      const user = getUser(body.userId);
      if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
      updateUserActivity(user);
      if (Math.random() > 0.92) botIdleCheck();
      return send(res, 200, { ok: true, isMuted: !!user.muted });
    }

    if (type === "message") {
      const user = getUser(body.userId);
      if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
      updateUserActivity(user);
      if (user.muted) return send(res, 403, { error: "muted" });
      const text = sanitize(body.text);
      if (!text) return send(res, 400, { error: "empty_message" });
      if (rateLimited(user.id)) return send(res, 429, { error: "rate_limit" });
      if (text.startsWith("/")) return executeCommand(text, user, req, res);

      db.messages.push({
        id: uid(), type: "message", userId: user.id, userName: user.name,
        text, createdAt: now(), reactions: {}, editedAt: null
      });
      cleanMessages();
      botCheckKeywords(text, user);
      return send(res, 200, { ok: true });
    }

    if (type === "reaction") {
      const user = getUser(body.userId);
      if (!validateUser(user)) return send(res, 200, { ok: false });
      updateUserActivity(user);
      const msg = db.messages.find(m => m.id === body.messageId);
      if (!msg) return send(res, 404, { error: "message_not_found" });
      const emoji = body.emoji;
      if (!emoji) return send(res, 400, { error: "missing_emoji" });
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      const users = msg.reactions[emoji];
      if (users.includes(user.id)) {
        msg.reactions[emoji] = users.filter(id => id !== user.id);
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
      } else {
        users.push(user.id);
        if (msg.userId !== CONFIG.BOT_ID && Math.random() > 0.75) {
          const be = randomFrom(["👍","❤️","😊","🔥","😂"]);
          if (!msg.reactions[be]) msg.reactions[be] = [];
          if (!msg.reactions[be].includes(CONFIG.BOT_ID)) msg.reactions[be].push(CONFIG.BOT_ID);
        }
      }
      return send(res, 200, { ok: true });
    }

    if (type === "typing") {
      const user = getUser(body.userId);
      if (!validateUser(user)) return send(res, 200, { ok: false });
      db.typing[user.id] = { name: user.name, time: now() };
      return send(res, 200, { ok: true });
    }

    if (type === "leave") {
      const user = getUser(body.userId);
      if (user) {
        createSystemMessage(`${user.name} sohbetti ayrildi`);
        setTimeout(() => createBotMessage(randomFrom([`${user.name} sohbetten ayrildi. 👋`, `Gorusuruz ${user.name}! 👋`])), CONFIG.BOT_TYPING_DELAY);
        user.lastSeen = 0;
      }
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: "unknown_type" });
  }

  // PATCH
  if (req.method === "PATCH") {
    cleanupWrite();
    const body = req.body || {};
    const user = getUser(body.userId);
    if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
    updateUserActivity(user);
    const msg = db.messages.find(m => m.id === body.id);
    if (!msg) return send(res, 404, { error: "message_not_found" });
    if (msg.userId !== user.id) return send(res, 403, { error: "forbidden" });
    const newText = sanitize(body.text);
    if (!newText) return send(res, 400, { error: "empty_message" });
    msg.text = newText;
    msg.editedAt = now();
    return send(res, 200, { ok: true });
  }

  // DELETE
  if (req.method === "DELETE") {
    cleanupWrite();
    const body = req.body || {};
    const user = getUser(body.userId);
    if (!validateUser(user)) return send(res, 200, { ok: false, missing: true });
    updateUserActivity(user);
    const msg = db.messages.find(m => m.id === body.id);
    if (!msg) return send(res, 404, { error: "message_not_found" });
    if (msg.userId !== user.id) return send(res, 403, { error: "forbidden" });
    db.messages = db.messages.filter(m => m.id !== body.id);
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "method_not_allowed" });
}

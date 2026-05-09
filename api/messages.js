// /api/messages.js
// NetTalk Pro - Professional Chat API v2.0
// Persistent Welcome Bot & Enhanced Architecture

const GLOBAL_KEY = "__NETTALK_PRO_V2__";

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = {
    messages: [],
    users: [],
    typing: {},
    rateLimits: {},
    botState: {
      initialized: false,
      lastGreeting: {},
      lastAutoResponse: 0,
      funFactsGiven: {}
    }
  };
}

const db = globalThis[GLOBAL_KEY];

// ======================================================
// CONFIGURATION
// ======================================================

const CONFIG = {
  MAX_MESSAGES: 500,
  MESSAGE_MAX: 500,
  NAME_MAX: 20,
  NAME_MIN: 2,
  RATE_LIMIT_MS: 1200,
  TYPING_TIMEOUT: 3000,
  USER_TIMEOUT: 1000 * 60 * 60 * 24,
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

// ======================================================
// BOT RESPONSE DEFINITIONS
// ======================================================

const BOT_GREETINGS = [
  "Hoş geldin {user}! 👋 Sohbete katılmana sevindim.",
  "Selam {user}! 🎉 Burada olmana bayıldım!",
  "Merhaba {user}! ✨ Seni görmek güzel.",
  "Hey {user}! 🌟 Hoş geldin, keyifli sohbetler dilerim!",
  "{user} geldi! 🎊 Herkese merhaba deyin!",
  "Ah, {user} sonunda geldi! 💫 Hosgeldin!",
  "{user} katildi! 🙌 Merhaba, nasilsin?",
  "Welcome {user}! 🏠 Burasi senin evin."
];

const BOT_FUN_FACTS = [
  "💡 Bilgi: Dünyada her saniye 2.5 milyon e-posta gonderiliyor!",
  "💡 Bilgi: Bir gunte ortalama 16.000 kelime konusuyoruz.",
  "💡 Bilgi: Internetin %90'i 1991'den sonra olusturuldu.",
  "💡 Bilgi: Ilk emoji 1999'da Japonya'da yaratildi.",
  "💡 Bilgi: Dünyada 5 milyardan fazla internet kullanicisi var.",
  "💡 Bilgi: Her dakika 500 saat video YouTube'a yukleniyor.",
  "💡 Bilgi: Ilk sohbet programi 1988'de IRC olarak basladi."
];

const BOT_MORNING = [
  "Gunaydin! ☀️ Bugun harika bir gun olacak!",
  "Sabahin hayirli olsun! 🌅",
  "Gunaydin herkes! Kahveler alindi mi? ☕"
];

const BOT_NIGHT = [
  "Iyi geceler! 🌙 Tatli ruyalar!",
  "Uyku vakti! 😴 Yarin gorusmek uzere!",
  "Iyi geceler herkes! 🌜"
];

const BOT_IDLE_MESSAGES = [
  "Burada kimse yok mu? 👀 Biraz sessiz oldu...",
  "Sohbet canlansin! 💬 Ne konusalim?",
  "Biri bir sey soyleyecek mi? 🤔",
  "Ekip nerde? 🏳️ Ben buradayim!",
  "Hadi biraz muhabbet acalim! 🗣️"
];

const BOT_KEYWORD_RESPONSES = {
  "merhaba": [
    "Merhaba! 👋 Nasilsin?",
    "Selam! 😊 Bugun nasil gidiyor?",
    "Hey merhaba! Hosgeldin!"
  ],
  "nasılsın": [
    "Iyiyim, tesekkurler! Sen nasilsin? 😊",
    "Superim! Botlar her zaman iyidir 😄",
    "Cok iyiyim! Sen sohbet edince daha da iyiyim!"
  ],
  "nasılsın": [
    "Iyiyim, tesekkurler! Sen nasilsin? 😊",
    "Superim! Botlar her zaman iyidir 😄"
  ],
  "nasilsin": [
    "Iyiyim! Sen nasilsin? 😊",
    "Superim! Botlar her zaman iyidir 😄"
  ],
  "bot": [
    "Evet, ben bir botum! 🤖 Ama kalbim sicak!",
    "Bot mu dedin? 🤖 Guzel botlar evreninde yasiyorum!",
    "🤖 Ben NetTalk Bot! Senin icin buradayim!"
  ],
  "yardım": [
    "Yardima mi ihtiyacin var? /help yazabilirsin! 📋",
    "Tabii ki! Komutlari gormek icin /help yaz.",
    "Sana yardimci olmaktan mutluluk duyarim! 🤝"
  ],
  "yardim": [
    "Yardima mi ihtiyacin var? /help yazabilirsin! 📋",
    "Tabii ki! Komutlari gormek icin /help yaz."
  ],
  "selam": [
    "Selam! 👋 Aleykum selam!",
    "Selamun aleykum! 😊",
    "A.s! Hosgeldin! 🤗"
  ],
  "güle güle": [
    "Gule gule! 👋 Tekrar bekleriz!",
    "Gorusuruz! 👋 Kendine iyi bak!",
    "Hoscakal! 👋 Yarin gorusuruz!"
  ],
  "teşekkür": [
    "Rica ederim! 😊",
    "Ne demek, her zaman! 🤗",
    "Bisey degil! Memnun oldum! 💛"
  ],
  "tesekkur": [
    "Rica ederim! 😊",
    "Ne demek, her zaman! 🤗"
  ],
  "komik": [
    "Haha! 😄 Ben de guluyorum!",
    "😂 Komikligine bayildim!",
    "🤣 Dur gulmeyecem!"
  ],
  "muzik": [
    "🎵 Muzik her derde devadir!",
    "🎶 Hangi tur muzik seversin?",
    "🎵 Muzik ruhun gidasidir!"
  ],
  "oyun": [
    "🎮 Oyun oynamayi sever misin?",
    "🎮 E-spor mu, klasik mi?",
    "🎮 Hangi oyunlari oynuyorsun?"
  ]
};

// ======================================================
// UTILITY FUNCTIONS
// ======================================================

function now() {
  return Date.now();
}

function uid() {
  return (
    Math.random().toString(36).slice(2) +
    now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

function send(res, code, data) {
  return res.status(code).json(data);
}

function sanitize(text = "") {
  return String(text).trim().slice(0, CONFIG.MESSAGE_MAX);
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ======================================================
// CLEANUP OPERATIONS
// ======================================================

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
    if (t - db.typing[id].time > CONFIG.TYPING_TIMEOUT) {
      delete db.typing[id];
    }
  }
}

function cleanMessages() {
  if (db.messages.length > CONFIG.MAX_MESSAGES) {
    db.messages = db.messages.slice(-CONFIG.MAX_MESSAGES);
  }
}

function cleanup() {
  cleanUsers();
  cleanTyping();
  cleanMessages();
  ensureBotExists();
}

// ======================================================
// BOT CORE
// ======================================================

function ensureBotExists() {
  let bot = db.users.find(u => u.id === CONFIG.BOT_ID);

  if (!bot) {
    bot = {
      id: CONFIG.BOT_ID,
      name: CONFIG.BOT_NAME,
      muted: false,
      isBot: true,
      avatar: CONFIG.BOT_AVATAR,
      status: "online",
      roomId: "genel",
      lastSeen: now(),
      joinedAt: now()
    };
    db.users.push(bot);
  } else {
    bot.lastSeen = now();
    bot.status = "online";
    bot.isBot = true;
    bot.avatar = CONFIG.BOT_AVATAR;
  }
}

function createBotMessage(text, extra = {}) {
  db.messages.push({
    id: uid(),
    type: "bot",
    userId: CONFIG.BOT_ID,
    userName: CONFIG.BOT_NAME,
    isBot: true,
    avatar: CONFIG.BOT_AVATAR,
    text,
    createdAt: now(),
    ...extra
  });
  cleanMessages();
}

function createSystemMessage(text, extra = {}) {
  db.messages.push({
    id: uid(),
    type: "system",
    userId: CONFIG.SYSTEM_ID,
    userName: "System",
    text,
    createdAt: now(),
    ...extra
  });
  cleanMessages();
}

function botGreetUser(userName) {
  if (!CONFIG.GREETINGS_ENABLED) return;

  const t = now();
  const lastGreet = db.botState.lastGreeting[userName] || 0;

  if (t - lastGreet < CONFIG.COOLDOWN_GREET) return;

  db.botState.lastGreeting[userName] = t;

  const greeting = randomFrom(BOT_GREETINGS).replace(
    "{user}",
    userName
  );

  const timeOfDay = getTimeOfDay();
  let timeGreeting = "";

  if (timeOfDay === "morning") {
    timeGreeting = randomFrom(BOT_MORNING);
  } else if (timeOfDay === "night") {
    timeGreeting = randomFrom(BOT_NIGHT);
  }

  createBotMessage(greeting);

  if (timeGreeting && Math.random() > 0.5) {
    setTimeout(() => {
      createBotMessage(timeGreeting);
    }, CONFIG.BOT_TYPING_DELAY);
  }
}

function botCheckKeywords(text, user) {
  if (!CONFIG.AUTO_RESPONSES_ENABLED) return;
  if (user.id === CONFIG.BOT_ID) return;
  if (text.startsWith("/")) return;

  const lower = text.toLowerCase().replace(/[ıİ]/g, m => m === "ı" ? "i" : "I").toLowerCase();
  const normalizedLower = lower
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ğ/g, "g");

  for (const [keyword, responses] of Object.entries(BOT_KEYWORD_RESPONSES)) {
    const normalizedKeyword = keyword
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ğ/g, "g");

    if (
      normalizedLower.includes(normalizedKeyword) ||
      lower.includes(keyword)
    ) {
      if (Math.random() > 0.3) {
        const response = randomFrom(responses);
        setTimeout(() => {
          createBotMessage(response);
        }, CONFIG.BOT_TYPING_DELAY + Math.random() * 500);
      }
      return;
    }
  }

  // Fun facts on rare occasions
  if (Math.random() > 0.92) {
    setTimeout(() => {
      createBotMessage(randomFrom(BOT_FUN_FACTS));
    }, CONFIG.BOT_TYPING_DELAY + 1000);
  }
}

function botIdleCheck() {
  const recentMessages = db.messages.filter(
    m => now() - m.createdAt < 5 * 60 * 1000 && m.type === "message"
  );

  if (recentMessages.length === 0 && db.users.filter(u => u.id !== CONFIG.BOT_ID).length > 0) {
    const lastBotMsg = db.messages
      .filter(m => m.type === "bot")
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    if (lastBotMsg && now() - lastBotMsg.createdAt > 5 * 60 * 1000) {
      createBotMessage(randomFrom(BOT_IDLE_MESSAGES));
    }
  }
}

function botWelcomeSequence() {
  if (db.botState.initialized) return;
  db.botState.initialized = true;

  createBotMessage(
    "🤖 Merhaba! Ben NetTalk Bot! Sohbetinize renk katmak icin buradayim."
  );

  setTimeout(() => {
    createBotMessage(
      "Komutlari gormek icin /help yazabilirsiniz. Hos sohbetler! 💬"
    );
  }, 1200);
}

// ======================================================
// USER MANAGEMENT
// ======================================================

function getUser(id) {
  return db.users.find(u => u.id === id);
}

function userExists(name) {
  return db.users.find(
    u => u.name.toLowerCase() === name.toLowerCase()
  );
}

function updateUserActivity(user) {
  user.lastSeen = now();
}

function validateUser(user) {
  if (!user) return false;
  if (user.id === CONFIG.BOT_ID) return false;
  return true;
}

function rateLimited(userId) {
  const last = db.rateLimits[userId];

  if (!last) {
    db.rateLimits[userId] = now();
    return false;
  }

  if (now() - last < CONFIG.RATE_LIMIT_MS) {
    return true;
  }

  db.rateLimits[userId] = now();
  return false;
}

// ======================================================
// COMMAND ENGINE
// ======================================================

async function executeCommand(text, user, req, res) {
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  // /help
  if (cmd === "/help") {
    createBotMessage(
      [
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
      ].join("\n")
    );
    return send(res, 200, { ok: true });
  }

  // /users
  if (cmd === "/users") {
    const humans = db.users.filter(u => u.id !== CONFIG.BOT_ID);
    const bot = db.users.find(u => u.id === CONFIG.BOT_ID);
    const list = humans.map(u => {
      let badge = "";
      if (u.muted) badge += " 🔇";
      return `${u.name}${badge}`;
    }).join(", ");

    createBotMessage(
      `👥 Aktif Kullanicilar (${humans.length}): ${list || "Yok"}${bot ? `\n🤖 ${bot.name} (Her zaman aktif)` : ""}`
    );
    return send(res, 200, { ok: true });
  }

  // /stats
  if (cmd === "/stats") {
    const humans = db.users.filter(u => u.id !== CONFIG.BOT_ID);
    const botMsgs = db.messages.filter(m => m.type === "bot").length;
    const userMsgs = db.messages.filter(m => m.type === "message").length;
    const sysMsgs = db.messages.filter(m => m.type === "system").length;

    createBotMessage(
      [
        "📊 Sunucu Istatistikleri",
        "━━━━━━━━━━━━━━━━━━━",
        `👥 Kullanici: ${humans.length}`,
        `💬 Mesaj: ${userMsgs}`,
        `🤖 Bot Mesaji: ${botMsgs}`,
        `🔔 Sistem: ${sysMsgs}`,
        `📝 Toplam: ${db.messages.length}`
      ].join("\n")
    );
    return send(res, 200, { ok: true });
  }

  // /nick
  if (cmd === "/nick") {
    const newName = sanitize(args.slice(1).join(" ")).slice(0, CONFIG.NAME_MAX);

    if (!newName || newName.length < CONFIG.NAME_MIN) {
      createBotMessage("❌ Isim en az 2 karakter olmali!");
      return send(res, 400, { error: "invalid_name" });
    }

    const reserved = [CONFIG.BOT_NAME.toLowerCase(), "system", "sistem", "bot"];
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

    setTimeout(() => {
      createBotMessage(`✨ Yeni ismin: ${newName}! Guzel secim!`);
    }, CONFIG.BOT_TYPING_DELAY);

    return send(res, 200, { ok: true });
  }

  // /clear
  if (cmd === "/clear") {
    if (!CONFIG.ALLOW_CLEAR) {
      createBotMessage("❌ Sohbet temizleme devre disi!");
      return send(res, 403, { error: "disabled" });
    }

    db.messages.length = 0;
    createSystemMessage(`${user.name} sohbeti temizledi`);

    setTimeout(() => {
      createBotMessage("🧹 Sohbet temizlendi! Yeni bir baslangic!");
    }, CONFIG.BOT_TYPING_DELAY);

    return send(res, 200, { ok: true, cleared: true });
  }

  // /mute
  if (cmd === "/mute") {
    const target = sanitize(args.slice(1).join(" "));
    if (!target) {
      createBotMessage("❌ Kullanici ismi belirt: /mute <isim>");
      return send(res, 400, { error: "missing_target" });
    }

    const targetUser = userExists(target);
    if (!targetUser) {
      createBotMessage(`❌ "${target}" adli kullanici bulunamadi.`);
      return send(res, 404, { error: "user_not_found" });
    }

    if (targetUser.id === CONFIG.BOT_ID) {
      createBotMessage("🤖 Beni susturamazsin! Botlar her zaman konusur! 😎");
      return send(res, 403, { error: "cannot_mute_bot" });
    }

    if (targetUser.muted) {
      createBotMessage(`⚠️ ${targetUser.name} zaten susturulmus.`);
      return send(res, 200, { ok: true });
    }

    targetUser.muted = true;
    createSystemMessage(`${targetUser.name} susturuldu`);
    createBotMessage(`🔇 ${targetUser.name} susturuldu.`);
    return send(res, 200, { ok: true });
  }

  // /unmute
  if (cmd === "/unmute") {
    const target = sanitize(args.slice(1).join(" "));
    if (!target) {
      createBotMessage("❌ Kullanici ismi belirt: /unmute <isim>");
      return send(res, 400, { error: "missing_target" });
    }

    const targetUser = userExists(target);
    if (!targetUser) {
      createBotMessage(`❌ "${target}" adli kullanici bulunamadi.`);
      return send(res, 404, { error: "user_not_found" });
    }

    targetUser.muted = false;
    createSystemMessage(`${targetUser.name} susturmasi kaldirildi`);
    createBotMessage(`🔊 ${targetUser.name} artik konusabilir!`);
    return send(res, 200, { ok: true });
  }

  // /bot
  if (cmd === "/bot") {
    createBotMessage(
      [
        "🤖 NetTalk Bot Bilgisi",
        "━━━━━━━━━━━━━━━━━━━",
        "Adim: NetTalk Bot",
        "Gorevim: Sohbeti yonlendirmek ve yardimci olmak",
        "Ozelliklerim:",
        "  • Yeni kullanicilari karsilama",
        "  • Komutlara cevap verme",
        "  • Anahtar kelime algilama",
        "  • Istatistik sunma",
        "  • 7/24 aktif olma 😎",
        "",
        "Bana selam verebilirsin!"
      ].join("\n")
    );
    return send(res, 200, { ok: true });
  }

  // /ping
  if (cmd === "/ping") {
    const start = now();
    setTimeout(() => {
      createBotMessage(`🏓 Pong! Gecikme: ${now() - start}ms`);
    }, CONFIG.BOT_TYPING_DELAY);
    return send(res, 200, { ok: true });
  }

  // /info
  if (cmd === "/info") {
    const uptime = Math.floor((now() - (db.botState.initTime || now())) / 1000);
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = uptime % 60;

    createBotMessage(
      [
        "ℹ️ Sunucu Bilgisi",
        "━━━━━━━━━━━━━━━━━━━",
        `Versiyon: 2.0.0`,
        `Max Mesaj: ${CONFIG.MAX_MESSAGES}`,
        `Aktif Kullanici: ${db.users.filter(u => u.id !== CONFIG.BOT_ID).length}`,
        `Calisma Suresi: ${hours}sa ${mins}dk ${secs}sn`,
        `Bot Durumu: 🟢 Aktif`
      ].join("\n")
    );
    return send(res, 200, { ok: true });
  }

  createBotMessage(`❌ Bilinmeyen komut: "${cmd}" — /help yazarak komutlari gorebilirsin.`);
  return send(res, 400, { error: "unknown_command" });
}

// ======================================================
// MAIN API HANDLER
// ======================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Initialize bot state timestamp
  if (!db.botState.initTime) {
    db.botState.initTime = now();
  }

  cleanup();
  botWelcomeSequence();

  // ====================================================
  // GET - Fetch State
  // ====================================================

  if (req.method === "GET") {
    const activeTyping = Object.values(db.typing)
      .filter(t => now() - t.time < CONFIG.TYPING_TIMEOUT)
      .map(t => t.name);

    const onlineUsers = db.users.map(u => ({
      id: u.id,
      name: u.name,
      isBot: !!u.isBot,
      avatar: u.avatar || null,
      status: u.id === CONFIG.BOT_ID ? "online" : (now() - u.lastSeen < 60000 ? "online" : "away"),
      muted: !!u.muted
    }));

    return send(res, 200, {
      ok: true,
      messages: db.messages,
      users: onlineUsers,
      typing: activeTyping,
      botInfo: {
        name: CONFIG.BOT_NAME,
        id: CONFIG.BOT_ID,
        avatar: CONFIG.BOT_AVATAR,
        online: true
      }
    });
  }

  // ====================================================
  // POST - Actions
  // ====================================================

  if (req.method === "POST") {
    const body = req.body || {};
    const type = body.type;

    // JOIN
    if (type === "join") {
      let name = sanitize(body.name).slice(0, CONFIG.NAME_MAX);

      if (!name || name.length < CONFIG.NAME_MIN) {
        return send(res, 400, { error: "invalid_name", message: "Isim en az 2 karakter olmali" });
      }

      const reserved = [CONFIG.BOT_NAME.toLowerCase(), "system", "sistem", "bot"];
      if (reserved.includes(name.toLowerCase())) {
        return send(res, 400, { error: "name_reserved", message: "Bu isim rezerve edilmis" });
      }

      const existing = userExists(name);

      if (existing) {
        updateUserActivity(existing);

        setTimeout(() => {
          const comebackMessages = [
            `${name} geri dondu! 👋`,
            `Tekrar hosgeldin ${name}! 🤗`,
            `${name} tekrar aramizda! 🎉`
          ];
          createBotMessage(randomFrom(comebackMessages));
        }, CONFIG.BOT_TYPING_DELAY);

        return send(res, 200, {
          ok: true,
          restored: true,
          userId: existing.id,
          userName: existing.name,
          botInfo: {
            name: CONFIG.BOT_NAME,
            avatar: CONFIG.BOT_AVATAR
          }
        });
      }

      const user = {
        id: uid(),
        name,
        muted: false,
        isBot: false,
        avatar: null,
        status: "online",
        roomId: body.roomId || "genel",
        lastSeen: now(),
        joinedAt: now()
      };

      db.users.push(user);

      createSystemMessage(`${name} sohbete katildi`);

      // Bot greeting
      setTimeout(() => {
        botGreetUser(name);
      }, CONFIG.BOT_TYPING_DELAY + 300);

      return send(res, 200, {
        ok: true,
        userId: user.id,
        userName: user.name,
        botInfo: {
          name: CONFIG.BOT_NAME,
          avatar: CONFIG.BOT_AVATAR
        }
      });
    }

    // HEARTBEAT
    if (type === "heartbeat") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, { ok: false, missing: true });
      }

      updateUserActivity(user);

      // Periodic idle check
      if (Math.random() > 0.95) {
        botIdleCheck();
      }

      return send(res, 200, {
        ok: true,
        isMuted: !!user.muted,
        onlineCount: db.users.filter(u => u.id !== CONFIG.BOT_ID).length
      });
    }

    // MESSAGE
    if (type === "message") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, { ok: false, message: "Kullanici dogrulanamadi" });
      }

      updateUserActivity(user);

      if (user.muted) {
        return send(res, 403, { error: "muted", message: "Susturuldunuz, mesaj gonderemezsiniz" });
      }

      const text = sanitize(body.text);

      if (!text) {
        return send(res, 400, { error: "empty_message" });
      }

      if (rateLimited(user.id)) {
        return send(res, 429, { error: "rate_limit", message: "Cok hizli mesaj gonderiyorsunuz" });
      }

      // Command
      if (text.startsWith("/")) {
        return executeCommand(text, user, req, res);
      }

      // Normal message
      db.messages.push({
        id: uid(),
        type: "message",
        userId: user.id,
        userName: user.name,
        text,
        createdAt: now(),
        reactions: {},
        editedAt: null
      });

      cleanMessages();

      // Bot keyword response
      botCheckKeywords(text, user);

      return send(res, 200, { ok: true });
    }

    // REACTION
    if (type === "reaction") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, { ok: false });
      }

      updateUserActivity(user);

      const msg = db.messages.find(m => m.id === body.messageId);

      if (!msg) {
        return send(res, 404, { error: "message_not_found" });
      }

      if (!msg.reactions) msg.reactions = {};

      const emoji = body.emoji;
      if (!emoji) {
        return send(res, 400, { error: "missing_emoji" });
      }

      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

      const users = msg.reactions[emoji];

      if (users.includes(user.id)) {
        msg.reactions[emoji] = users.filter(id => id !== user.id);
        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
      } else {
        users.push(user.id);

        // Bot sometimes reacts back
        if (
          msg.userId !== CONFIG.BOT_ID &&
          Math.random() > 0.7
        ) {
          const botReactions = ["👍", "❤️", "😊", "🔥", "😂"];
          const botEmoji = randomFrom(botReactions);
          if (!msg.reactions[botEmoji]) msg.reactions[botEmoji] = [];
          if (!msg.reactions[botEmoji].includes(CONFIG.BOT_ID)) {
            msg.reactions[botEmoji].push(CONFIG.BOT_ID);
          }
        }
      }

      return send(res, 200, { ok: true });
    }

    // TYPING
    if (type === "typing") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, { ok: false });
      }

      db.typing[user.id] = {
        name: user.name,
        time: now()
      };

      return send(res, 200, { ok: true });
    }

    // LEAVE
    if (type === "leave") {
      const user = getUser(body.userId);

      if (user) {
        const leaveMessages = [
          `${user.name} sohbetten ayrildi. 👋`,
          `Gorusuruz ${user.name}! 👋`,
          `${user.name} cikti. Tekrar bekleriz! 🤗`
        ];

        createSystemMessage(`${user.name} sohbetti ayrildi`);
        createBotMessage(randomFrom(leaveMessages));

        user.lastSeen = 0;
      }

      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: "unknown_type" });
  }

  // ====================================================
  // PATCH - Edit Message
  // ====================================================

  if (req.method === "PATCH") {
    const body = req.body || {};
    const user = getUser(body.userId);

    if (!validateUser(user)) {
      return send(res, 200, { ok: false });
    }

    updateUserActivity(user);

    const msg = db.messages.find(m => m.id === body.id);

    if (!msg) {
      return send(res, 404, { error: "message_not_found" });
    }

    if (msg.userId !== user.id) {
      return send(res, 403, { error: "forbidden" });
    }

    const newText = sanitize(body.text);
    if (!newText) {
      return send(res, 400, { error: "empty_message" });
    }

    msg.text = newText;
    msg.editedAt = now();

    return send(res, 200, { ok: true });
  }

  // ====================================================
  // DELETE - Remove Message
  // ====================================================

  if (req.method === "DELETE") {
    const body = req.body || {};
    const user = getUser(body.userId);

    if (!validateUser(user)) {
      return send(res, 200, { ok: false });
    }

    updateUserActivity(user);

    const msg = db.messages.find(m => m.id === body.id);

    if (!msg) {
      return send(res, 404, { error: "message_not_found" });
    }

    if (msg.userId !== user.id) {
      return send(res, 403, { error: "forbidden" });
    }

    db.messages = db.messages.filter(m => m.id !== body.id);

    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: "method_not_allowed" });
}

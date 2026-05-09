// /api/messages.js
// Tek dosya stabil NetTalk API
// Auto rejoin sorununu minimize eder
// Vercel/serverless uyumlu global cache kullanır

const globalStore = globalThis.__NETTALK_STORE__;

if (!globalStore) {
  globalThis.__NETTALK_STORE__ = {
    messages: [],
    users: [],
    typingUsers: {},
    rateLimits: {}
  };
}

const store = globalThis.__NETTALK_STORE__;

const MAX_MESSAGES = 300;
const RATE_LIMIT_MS = 1200;
const USER_TIMEOUT = 1000 * 60 * 60 * 24; // 24 saat
const TYPING_TIMEOUT = 3000;

function uid() {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

function json(res, code, data) {
  res.status(code).json(data);
}

function cleanup() {
  const now = Date.now();

  // eski typing temizle
  for (const id in store.typingUsers) {
    if (now - store.typingUsers[id].time > TYPING_TIMEOUT) {
      delete store.typingUsers[id];
    }
  }

  // çok eski kullanıcı temizle
  store.users = store.users.filter(
    u => now - u.lastSeen < USER_TIMEOUT
  );

  // mesaj limiti
  if (store.messages.length > MAX_MESSAGES) {
    store.messages = store.messages.slice(-MAX_MESSAGES);
  }
}

function systemMessage(text) {
  store.messages.push({
    id: uid(),
    type: "system",
    userId: "__system__",
    userName: "System",
    text,
    createdAt: Date.now()
  });

  cleanup();
}

function findUser(id) {
  return store.users.find(u => u.id === id);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  cleanup();

  // =========================================================
  // GET
  // =========================================================

  if (req.method === "GET") {
    const typing = Object.values(store.typingUsers)
      .filter(t => Date.now() - t.time < TYPING_TIMEOUT)
      .map(t => t.name);

    return json(res, 200, {
      ok: true,
      messages: store.messages,
      users: store.users,
      typing
    });
  }

  // =========================================================
  // POST
  // =========================================================

  if (req.method === "POST") {
    const body = req.body || {};
    const type = body.type;

    // =====================================================
    // JOIN
    // =====================================================

    if (type === "join") {
      let name = String(body.name || "")
        .trim()
        .slice(0, 20);

      if (!name || name.length < 2) {
        return json(res, 400, {
          error: "invalid_name"
        });
      }

      // AYNI KULLANICIYI TEKRAR KULLAN
      // AUTO REJOIN SORUNUNU BÜYÜK ORANDA ÇÖZER

      let existing = store.users.find(
        u => u.name.toLowerCase() === name.toLowerCase()
      );

      if (existing) {
        existing.lastSeen = Date.now();

        return json(res, 200, {
          ok: true,
          userId: existing.id,
          userName: existing.name,
          restored: true
        });
      }

      const user = {
        id: uid(),
        name,
        roomId: body.roomId || "genel",
        muted: false,
        lastSeen: Date.now()
      };

      store.users.push(user);

      systemMessage(`${name} sohbete katildi`);

      return json(res, 200, {
        ok: true,
        userId: user.id,
        userName: user.name
      });
    }

    // =====================================================
    // HEARTBEAT
    // =====================================================

    if (type === "heartbeat") {
      const user = findUser(body.userId);

      // invalid_user döndürme
      // auto rejoin spamını engeller

      if (!user) {
        return json(res, 200, {
          ok: false,
          missing: true
        });
      }

      user.lastSeen = Date.now();

      return json(res, 200, {
        ok: true,
        isMuted: !!user.muted
      });
    }

    // =====================================================
    // MESSAGE
    // =====================================================

    if (type === "message") {
      const user = findUser(body.userId);

      // HATA FIRLATMA
      if (!user) {
        return json(res, 200, {
          ok: false,
          ignored: true
        });
      }

      user.lastSeen = Date.now();

      if (user.muted) {
        return json(res, 403, {
          error: "muted"
        });
      }

      const text = String(body.text || "")
        .trim()
        .slice(0, 500);

      if (!text) {
        return json(res, 400, {
          error: "empty_message"
        });
      }

      // rate limit
      const now = Date.now();

      if (
        store.rateLimits[user.id] &&
        now - store.rateLimits[user.id] < RATE_LIMIT_MS
      ) {
        return json(res, 429, {
          error: "rate_limit"
        });
      }

      store.rateLimits[user.id] = now;

      // ================= COMMANDS =================

      if (text.startsWith("/")) {
        const parts = text.split(" ");
        const cmd = parts[0].toLowerCase();

        // /help
        if (cmd === "/help") {
          store.messages.push({
            id: uid(),
            type: "system",
            userId: "__bot__",
            userName: "NetTalk Bot",
            text:
              "/help /users /stats /nick /clear /mute /unmute",
            createdAt: Date.now()
          });

          return json(res, 200, { ok: true });
        }

        // /users
        if (cmd === "/users") {
          const list = store.users
            .map(u => u.name)
            .join(", ");

          store.messages.push({
            id: uid(),
            type: "system",
            userId: "__bot__",
            userName: "NetTalk Bot",
            text: `Aktif kullanicilar: ${list}`,
            createdAt: Date.now()
          });

          return json(res, 200, { ok: true });
        }

        // /stats
        if (cmd === "/stats") {
          store.messages.push({
            id: uid(),
            type: "system",
            userId: "__bot__",
            userName: "NetTalk Bot",
            text: `Mesaj: ${store.messages.length} | Kullanici: ${store.users.length}`,
            createdAt: Date.now()
          });

          return json(res, 200, { ok: true });
        }

        // /nick
        if (cmd === "/nick") {
          const newNick = parts
            .slice(1)
            .join(" ")
            .trim()
            .slice(0, 20);

          if (!newNick || newNick.length < 2) {
            return json(res, 400, {
              error: "invalid_name"
            });
          }

          const old = user.name;

          user.name = newNick;

          systemMessage(
            `${old} nick degistirdi -> ${newNick}`
          );

          return json(res, 200, {
            ok: true
          });
        }

        // /clear
        if (cmd === "/clear") {
          store.messages = [];

          systemMessage("Sohbet temizlendi");

          return json(res, 200, {
            ok: true
          });
        }

        // /mute
        if (cmd === "/mute") {
          const target = parts
            .slice(1)
            .join(" ")
            .trim();

          const u = store.users.find(
            x =>
              x.name.toLowerCase() ===
              target.toLowerCase()
          );

          if (u) {
            u.muted = true;

            systemMessage(`${u.name} susturuldu`);
          }

          return json(res, 200, {
            ok: true
          });
        }

        // /unmute
        if (cmd === "/unmute") {
          const target = parts
            .slice(1)
            .join(" ")
            .trim();

          const u = store.users.find(
            x =>
              x.name.toLowerCase() ===
              target.toLowerCase()
          );

          if (u) {
            u.muted = false;

            systemMessage(
              `${u.name} susturmasi kaldirildi`
            );
          }

          return json(res, 200, {
            ok: true
          });
        }
      }

      // ================= NORMAL MESSAGE =================

      store.messages.push({
        id: uid(),
        type: "message",
        userId: user.id,
        userName: user.name,
        text,
        createdAt: Date.now(),
        reactions: {}
      });

      cleanup();

      return json(res, 200, {
        ok: true
      });
    }

    // =====================================================
    // REACTION
    // =====================================================

    if (type === "reaction") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 200, {
          ok: false
        });
      }

      const msg = store.messages.find(
        m => m.id === body.messageId
      );

      if (!msg) {
        return json(res, 404, {
          error: "message_not_found"
        });
      }

      if (!msg.reactions) {
        msg.reactions = {};
      }

      if (!msg.reactions[body.emoji]) {
        msg.reactions[body.emoji] = [];
      }

      const arr = msg.reactions[body.emoji];

      if (arr.includes(user.id)) {
        msg.reactions[body.emoji] = arr.filter(
          x => x !== user.id
        );

        if (msg.reactions[body.emoji].length === 0) {
          delete msg.reactions[body.emoji];
        }
      } else {
        arr.push(user.id);
      }

      return json(res, 200, {
        ok: true
      });
    }

    // =====================================================
    // TYPING
    // =====================================================

    if (type === "typing") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 200, {
          ok: false
        });
      }

      store.typingUsers[user.id] = {
        name: user.name,
        time: Date.now()
      };

      return json(res, 200, {
        ok: true
      });
    }

    // =====================================================
    // LEAVE
    // =====================================================

    if (type === "leave") {
      const user = findUser(body.userId);

      if (user) {
        // tamamen silme
        // sadece pasif yap
        user.lastSeen = 0;
      }

      return json(res, 200, {
        ok: true
      });
    }

    return json(res, 400, {
      error: "unknown_type"
    });
  }

  // =========================================================
  // PATCH
  // =========================================================

  if (req.method === "PATCH") {
    const body = req.body || {};

    const user = findUser(body.userId);

    if (!user) {
      return json(res, 200, {
        ok: false
      });
    }

    const msg = store.messages.find(
      m => m.id === body.id
    );

    if (!msg) {
      return json(res, 404, {
        error: "message_not_found"
      });
    }

    if (msg.userId !== user.id) {
      return json(res, 403, {
        error: "forbidden"
      });
    }

    msg.text = String(body.text || "")
      .trim()
      .slice(0, 500);

    msg.editedAt = Date.now();

    return json(res, 200, {
      ok: true
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  if (req.method === "DELETE") {
    const body = req.body || {};

    const user = findUser(body.userId);

    if (!user) {
      return json(res, 200, {
        ok: false
      });
    }

    const msg = store.messages.find(
      m => m.id === body.id
    );

    if (!msg) {
      return json(res, 404, {
        error: "message_not_found"
      });
    }

    if (msg.userId !== user.id) {
      return json(res, 403, {
        error: "forbidden"
      });
    }

    store.messages = store.messages.filter(
      m => m.id !== body.id
    );

    return json(res, 200, {
      ok: true
    });
  }

  return json(res, 405, {
    error: "method_not_allowed"
  });
}

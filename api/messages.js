// /api/messages.js
// NetTalk Pro API

let messages = [];
let users = [];
let typingUsers = {};
let rateLimits = {};

const MAX_MESSAGES = 200;
const TYPING_TIMEOUT = 3000;
const RATE_LIMIT_MS = 1200;

function json(res, code, data) {
  res.status(code).json(data);
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function systemMessage(text) {
  messages.push({
    id: uid(),
    type: "system",
    userId: "__system__",
    userName: "System",
    text,
    createdAt: Date.now()
  });

  trimMessages();
}

function trimMessages() {
  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
  }
}

function findUser(id) {
  return users.find(u => u.id === id);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ================= GET =================
  if (req.method === "GET") {
    const now = Date.now();

    const typing = Object.values(typingUsers)
      .filter(t => now - t.time < TYPING_TIMEOUT)
      .map(t => t.name);

    return json(res, 200, {
      ok: true,
      messages,
      users,
      typing
    });
  }

  // ================= POST =================
  if (req.method === "POST") {
    const body = req.body || {};
    const type = body.type;

    // ===== JOIN =====
    if (type === "join") {
      let name = String(body.name || "").trim();

      if (!name || name.length < 2) {
        return json(res, 400, {
          error: "invalid_name"
        });
      }

      name = name.slice(0, 20);

      // Nick çakışırsa otomatik düzelt
      let finalName = name;
      let count = 1;

      while (
        users.some(
          u => u.name.toLowerCase() === finalName.toLowerCase()
        )
      ) {
        count++;
        finalName = `${name}${count}`;
      }

      const user = {
        id: uid(),
        name: finalName,
        roomId: body.roomId || "genel",
        lastSeen: Date.now(),
        muted: false
      };

      users.push(user);

      systemMessage(`${finalName} sohbete katildi`);

      return json(res, 200, {
        ok: true,
        userId: user.id,
        userName: user.name
      });
    }

    // ===== HEARTBEAT =====
    if (type === "heartbeat") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 404, {
          error: "user_not_found"
        });
      }

      user.lastSeen = Date.now();

      return json(res, 200, {
        ok: true,
        isMuted: !!user.muted
      });
    }

    // ===== MESSAGE =====
    if (type === "message") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 404, {
          error: "invalid_user"
        });
      }

      user.lastSeen = Date.now();

      if (user.muted) {
        return json(res, 403, {
          error: "muted"
        });
      }

      const text = String(body.text || "").trim();

      if (!text) {
        return json(res, 400, {
          error: "empty_message"
        });
      }

      // Rate limit
      const now = Date.now();

      if (
        rateLimits[user.id] &&
        now - rateLimits[user.id] < RATE_LIMIT_MS
      ) {
        return json(res, 429, {
          error: "rate_limit"
        });
      }

      rateLimits[user.id] = now;

      // Commands
      if (text.startsWith("/")) {
        const parts = text.split(" ");
        const cmd = parts[0].toLowerCase();

        // /help
        if (cmd === "/help") {
          messages.push({
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
          const list = users.map(u => u.name).join(", ");

          messages.push({
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
          messages.push({
            id: uid(),
            type: "system",
            userId: "__bot__",
            userName: "NetTalk Bot",
            text: `Mesaj: ${messages.length} | Kullanici: ${users.length}`,
            createdAt: Date.now()
          });

          return json(res, 200, { ok: true });
        }

        // /nick yeniisim
        if (cmd === "/nick") {
          const newNick = parts.slice(1).join(" ").trim();

          if (!newNick || newNick.length < 2) {
            return json(res, 400, {
              error: "invalid_name"
            });
          }

          user.name = newNick.slice(0, 20);

          systemMessage(`${body.userId} nick degistirdi`);

          return json(res, 200, {
            ok: true
          });
        }

        // /clear
        if (cmd === "/clear") {
          messages = [];

          systemMessage("Sohbet temizlendi");

          return json(res, 200, {
            ok: true
          });
        }

        // /mute isim
        if (cmd === "/mute") {
          const target = parts.slice(1).join(" ").trim();

          const u = users.find(
            x => x.name.toLowerCase() === target.toLowerCase()
          );

          if (u) {
            u.muted = true;

            systemMessage(`${u.name} susturuldu`);
          }

          return json(res, 200, {
            ok: true
          });
        }

        // /unmute isim
        if (cmd === "/unmute") {
          const target = parts.slice(1).join(" ").trim();

          const u = users.find(
            x => x.name.toLowerCase() === target.toLowerCase()
          );

          if (u) {
            u.muted = false;

            systemMessage(`${u.name} susturmasi kaldirildi`);
          }

          return json(res, 200, {
            ok: true
          });
        }
      }

      // Normal mesaj
      messages.push({
        id: uid(),
        type: "message",
        userId: user.id,
        userName: user.name,
        text: text.slice(0, 500),
        createdAt: Date.now(),
        reactions: {}
      });

      trimMessages();

      return json(res, 200, {
        ok: true
      });
    }

    // ===== REACTION =====
    if (type === "reaction") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 404, {
          error: "invalid_user"
        });
      }

      const msg = messages.find(m => m.id === body.messageId);

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
        msg.reactions[body.emoji] =
          arr.filter(x => x !== user.id);

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

    // ===== TYPING =====
    if (type === "typing") {
      const user = findUser(body.userId);

      if (!user) {
        return json(res, 404, {
          error: "invalid_user"
        });
      }

      typingUsers[user.id] = {
        name: user.name,
        time: Date.now()
      };

      return json(res, 200, {
        ok: true
      });
    }

    // ===== LEAVE =====
    if (type === "leave") {
      const user = findUser(body.userId);

      if (user) {
        users = users.filter(u => u.id !== user.id);

        systemMessage(`${user.name} ayrildi`);
      }

      return json(res, 200, {
        ok: true
      });
    }

    return json(res, 400, {
      error: "unknown_type"
    });
  }

  // ================= PATCH =================
  if (req.method === "PATCH") {
    const body = req.body || {};

    const user = findUser(body.userId);

    if (!user) {
      return json(res, 404, {
        error: "invalid_user"
      });
    }

    const msg = messages.find(m => m.id === body.id);

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

    msg.text = String(body.text || "").slice(0, 500);
    msg.editedAt = Date.now();

    return json(res, 200, {
      ok: true
    });
  }

  // ================= DELETE =================
  if (req.method === "DELETE") {
    const body = req.body || {};

    const user = findUser(body.userId);

    if (!user) {
      return json(res, 404, {
        error: "invalid_user"
      });
    }

    const msg = messages.find(m => m.id === body.id);

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

    messages = messages.filter(m => m.id !== body.id);

    return json(res, 200, {
      ok: true
    });
  }

  return json(res, 405, {
    error: "method_not_allowed"
  });
}

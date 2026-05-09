// /api/messages.js
// NetTalk Pro - Professional Single File Chat API

const GLOBAL_KEY = "__NETTALK_PRO_STORE__";

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = {
    messages: [],
    users: [],
    typing: {},
    rateLimits: {}
  };
}

const db = globalThis[GLOBAL_KEY];

// ======================================================
// CONFIG
// ======================================================

const CONFIG = {
  MAX_MESSAGES: 500,
  MESSAGE_MAX: 500,
  NAME_MAX: 20,

  RATE_LIMIT_MS: 1200,

  TYPING_TIMEOUT: 3000,
  USER_TIMEOUT: 1000 * 60 * 60 * 24,

  ALLOW_CLEAR: true
};

// ======================================================
// HELPERS
// ======================================================

function now() {
  return Date.now();
}

function uid() {
  return (
    Math.random().toString(36).slice(2) +
    now().toString(36)
  );
}

function send(res, code, data) {
  return res.status(code).json(data);
}

function sanitize(text = "") {
  return String(text)
    .trim()
    .slice(0, CONFIG.MESSAGE_MAX);
}

function cleanUsers() {
  const t = now();

  db.users = db.users.filter(
    u => t - u.lastSeen < CONFIG.USER_TIMEOUT
  );
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
    db.messages = db.messages.slice(
      -CONFIG.MAX_MESSAGES
    );
  }
}

function cleanup() {
  cleanUsers();
  cleanTyping();
  cleanMessages();
}

function getUser(id) {
  return db.users.find(u => u.id === id);
}

function userExists(name) {
  return db.users.find(
    u =>
      u.name.toLowerCase() ===
      name.toLowerCase()
  );
}

function createSystemMessage(text) {
  db.messages.push({
    id: uid(),
    type: "system",
    userId: "__system__",
    userName: "System",
    text,
    createdAt: now()
  });

  cleanMessages();
}

function createBotMessage(text) {
  db.messages.push({
    id: uid(),
    type: "system",
    userId: "__bot__",
    userName: "NetTalk Bot",
    text,
    createdAt: now()
  });

  cleanMessages();
}

function updateUserActivity(user) {
  user.lastSeen = now();
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

function validateUser(user) {
  return !!user;
}

// ======================================================
// COMMANDS
// ======================================================

async function executeCommand(
  text,
  user,
  req,
  res
) {
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  // ====================================================
  // HELP
  // ====================================================

  if (cmd === "/help") {
    createBotMessage(
      [
        "/help",
        "/users",
        "/stats",
        "/nick <isim>",
        "/clear",
        "/mute <isim>",
        "/unmute <isim>"
      ].join(" | ")
    );

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // USERS
  // ====================================================

  if (cmd === "/users") {
    const active = db.users
      .map(u => u.name)
      .join(", ");

    createBotMessage(
      active || "Aktif kullanici yok"
    );

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // STATS
  // ====================================================

  if (cmd === "/stats") {
    createBotMessage(
      `Kullanici: ${db.users.length} | Mesaj: ${db.messages.length}`
    );

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // NICK
  // ====================================================

  if (cmd === "/nick") {
    const newName = sanitize(
      args.slice(1).join(" ")
    ).slice(0, CONFIG.NAME_MAX);

    if (!newName || newName.length < 2) {
      return send(res, 400, {
        error: "invalid_name"
      });
    }

    const exists = userExists(newName);

    if (exists && exists.id !== user.id) {
      return send(res, 400, {
        error: "name_taken"
      });
    }

    const old = user.name;

    user.name = newName;

    createSystemMessage(
      `${old} → ${newName}`
    );

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // CLEAR
  // ====================================================

  if (cmd === "/clear") {
    if (!CONFIG.ALLOW_CLEAR) {
      return send(res, 403, {
        error: "disabled"
      });
    }

    db.messages.length = 0;

    db.messages.push({
      id: uid(),
      type: "system",
      userId: "__system__",
      userName: "System",
      text: `${user.name} sohbeti temizledi`,
      createdAt: now()
    });

    return send(res, 200, {
      ok: true,
      cleared: true
    });
  }

  // ====================================================
  // MUTE
  // ====================================================

  if (cmd === "/mute") {
    const target = sanitize(
      args.slice(1).join(" ")
    );

    const targetUser = userExists(target);

    if (!targetUser) {
      return send(res, 404, {
        error: "user_not_found"
      });
    }

    targetUser.muted = true;

    createSystemMessage(
      `${targetUser.name} susturuldu`
    );

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // UNMUTE
  // ====================================================

  if (cmd === "/unmute") {
    const target = sanitize(
      args.slice(1).join(" ")
    );

    const targetUser = userExists(target);

    if (!targetUser) {
      return send(res, 404, {
        error: "user_not_found"
      });
    }

    targetUser.muted = false;

    createSystemMessage(
      `${targetUser.name} susturmasi kaldirildi`
    );

    return send(res, 200, {
      ok: true
    });
  }

  return send(res, 400, {
    error: "unknown_command"
  });
}

// ======================================================
// MAIN
// ======================================================

export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

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

  // ====================================================
  // GET
  // ====================================================

  if (req.method === "GET") {
    return send(res, 200, {
      ok: true,

      messages: db.messages,

      users: db.users,

      typing: Object.values(db.typing)
        .filter(
          t =>
            now() - t.time <
            CONFIG.TYPING_TIMEOUT
        )
        .map(t => t.name)
    });
  }

  // ====================================================
  // POST
  // ====================================================

  if (req.method === "POST") {
    const body = req.body || {};
    const type = body.type;

    // ==================================================
    // JOIN
    // ==================================================

    if (type === "join") {
      let name = sanitize(body.name).slice(
        0,
        CONFIG.NAME_MAX
      );

      if (!name || name.length < 2) {
        return send(res, 400, {
          error: "invalid_name"
        });
      }

      // restore session

      const existing = userExists(name);

      if (existing) {
        updateUserActivity(existing);

        return send(res, 200, {
          ok: true,
          restored: true,
          userId: existing.id,
          userName: existing.name
        });
      }

      const user = {
        id: uid(),
        name,
        muted: false,
        roomId: body.roomId || "genel",
        lastSeen: now()
      };

      db.users.push(user);

      createSystemMessage(
        `${name} sohbete katildi`
      );

      return send(res, 200, {
        ok: true,
        userId: user.id,
        userName: user.name
      });
    }

    // ==================================================
    // HEARTBEAT
    // ==================================================

    if (type === "heartbeat") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, {
          ok: false,
          missing: true
        });
      }

      updateUserActivity(user);

      return send(res, 200, {
        ok: true,
        isMuted: !!user.muted
      });
    }

    // ==================================================
    // MESSAGE
    // ==================================================

    if (type === "message") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, {
          ok: false
        });
      }

      updateUserActivity(user);

      if (user.muted) {
        return send(res, 403, {
          error: "muted"
        });
      }

      const text = sanitize(body.text);

      if (!text) {
        return send(res, 400, {
          error: "empty_message"
        });
      }

      if (rateLimited(user.id)) {
        return send(res, 429, {
          error: "rate_limit"
        });
      }

      // command

      if (text.startsWith("/")) {
        return executeCommand(
          text,
          user,
          req,
          res
        );
      }

      // normal message

      db.messages.push({
        id: uid(),
        type: "message",
        userId: user.id,
        userName: user.name,
        text,
        createdAt: now(),
        reactions: {}
      });

      cleanMessages();

      return send(res, 200, {
        ok: true
      });
    }

    // ==================================================
    // REACTION
    // ==================================================

    if (type === "reaction") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, {
          ok: false
        });
      }

      const msg = db.messages.find(
        m => m.id === body.messageId
      );

      if (!msg) {
        return send(res, 404, {
          error: "message_not_found"
        });
      }

      if (!msg.reactions) {
        msg.reactions = {};
      }

      const emoji = body.emoji;

      if (!msg.reactions[emoji]) {
        msg.reactions[emoji] = [];
      }

      const users = msg.reactions[emoji];

      if (users.includes(user.id)) {
        msg.reactions[emoji] = users.filter(
          id => id !== user.id
        );

        if (
          msg.reactions[emoji].length === 0
        ) {
          delete msg.reactions[emoji];
        }
      } else {
        users.push(user.id);
      }

      return send(res, 200, {
        ok: true
      });
    }

    // ==================================================
    // TYPING
    // ==================================================

    if (type === "typing") {
      const user = getUser(body.userId);

      if (!validateUser(user)) {
        return send(res, 200, {
          ok: false
        });
      }

      db.typing[user.id] = {
        name: user.name,
        time: now()
      };

      return send(res, 200, {
        ok: true
      });
    }

    // ==================================================
    // LEAVE
    // ==================================================

    if (type === "leave") {
      const user = getUser(body.userId);

      if (user) {
        user.lastSeen = 0;
      }

      return send(res, 200, {
        ok: true
      });
    }

    return send(res, 400, {
      error: "unknown_type"
    });
  }

  // ====================================================
  // PATCH
  // ====================================================

  if (req.method === "PATCH") {
    const body = req.body || {};

    const user = getUser(body.userId);

    if (!validateUser(user)) {
      return send(res, 200, {
        ok: false
      });
    }

    const msg = db.messages.find(
      m => m.id === body.id
    );

    if (!msg) {
      return send(res, 404, {
        error: "message_not_found"
      });
    }

    if (msg.userId !== user.id) {
      return send(res, 403, {
        error: "forbidden"
      });
    }

    msg.text = sanitize(body.text);

    msg.editedAt = now();

    return send(res, 200, {
      ok: true
    });
  }

  // ====================================================
  // DELETE
  // ====================================================

  if (req.method === "DELETE") {
    const body = req.body || {};

    const user = getUser(body.userId);

    if (!validateUser(user)) {
      return send(res, 200, {
        ok: false
      });
    }

    const msg = db.messages.find(
      m => m.id === body.id
    );

    if (!msg) {
      return send(res, 404, {
        error: "message_not_found"
      });
    }

    if (msg.userId !== user.id) {
      return send(res, 403, {
        error: "forbidden"
      });
    }

    db.messages = db.messages.filter(
      m => m.id !== body.id
    );

    return send(res, 200, {
      ok: true
    });
  }

  return send(res, 405, {
    error: "method_not_allowed"
  });
}

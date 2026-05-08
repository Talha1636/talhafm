let messages = [];
let users = new Map(); // userId -> user data
let typingUsers = new Map(); // roomId -> Set(userId)

const MAX_MESSAGES = 500;
const INACTIVE_TIMEOUT = 15000; // 15 sec

function now() {
  return Date.now();
}

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

/* ---------------------------
   CLEAN INACTIVE USERS
----------------------------*/
setInterval(() => {
  const t = now();

  for (const [id, user] of users.entries()) {
    if (t - user.lastSeen > INACTIVE_TIMEOUT) {
      user.status = "offline";
    }
  }
}, 5000);

/* ---------------------------
   HANDLER
----------------------------*/
export default function handler(req, res) {
  const { method } = req;

  /* =========================
     1. USER CONNECT / UPDATE
  ==========================*/
  if (method === "POST" && req.body.type === "join") {
    const { name, avatar = "", roomId = "global" } = req.body;

    const userId = genId();

    users.set(userId, {
      id: userId,
      name,
      avatar,
      roomId,
      status: "online",
      lastSeen: now(),
      joinedAt: now(),
    });

    return res.json({ ok: true, userId });
  }

  /* =========================
     2. HEARTBEAT (ONLINE TRACK)
  ==========================*/
  if (method === "POST" && req.body.type === "heartbeat") {
    const { userId } = req.body;

    const user = users.get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.lastSeen = now();
    user.status = "online";

    return res.json({ ok: true });
  }

  /* =========================
     3. SEND MESSAGE
  ==========================*/
  if (method === "POST" && req.body.type === "message") {
    const { userId, text, roomId = "global" } = req.body;

    const user = users.get(userId);
    if (!user) return res.status(403).json({ error: "Invalid user" });

    const message = {
      id: genId(),
      userId,
      userName: user.name,
      avatar: user.avatar,
      roomId,
      text,
      createdAt: now(),
      editedAt: null,
      reactions: {},
    };

    messages.push(message);

    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    return res.json({ ok: true, message });
  }

  /* =========================
     4. GET ROOM DATA
  ==========================*/
  if (method === "GET" && req.query.roomId) {
    const { roomId } = req.query;

    const roomMessages = messages.filter(m => m.roomId === roomId);

    const roomUsers = [...users.values()].filter(u => u.roomId === roomId);

    const typing = typingUsers.get(roomId) || new Set();

    return res.json({
      messages: roomMessages,
      users: roomUsers,
      typing: [...typing],
    });
  }

  /* =========================
     5. TYPING SYSTEM
  ==========================*/
  if (method === "POST" && req.body.type === "typing") {
    const { userId, roomId } = req.body;

    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Set());
    }

    typingUsers.get(roomId).add(userId);

    setTimeout(() => {
      typingUsers.get(roomId)?.delete(userId);
    }, 2000);

    return res.json({ ok: true });
  }

  /* =========================
     6. USER STATUS
  ==========================*/
  if (method === "GET" && req.query.users) {
    return res.json({
      users: [...users.values()],
      online: [...users.values()].filter(u => u.status === "online").length,
    });
  }

  /* =========================
     7. EDIT MESSAGE
  ==========================*/
  if (method === "PATCH") {
    const { id, text } = req.body;

    const msg = messages.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: "Not found" });

    msg.text = text;
    msg.editedAt = now();

    return res.json({ ok: true, message: msg });
  }

  /* =========================
     8. DELETE MESSAGE
  ==========================*/
  if (method === "DELETE") {
    const { id } = req.body;

    messages = messages.filter(m => m.id !== id);

    return res.json({ ok: true });
  }

  /* =========================
     9. ROOM STATS
  ==========================*/
  if (method === "GET" && req.query.stats) {
    const rooms = {};

    messages.forEach(m => {
      rooms[m.roomId] = (rooms[m.roomId] || 0) + 1;
    });

    return res.json({
      totalMessages: messages.length,
      totalUsers: users.size,
      rooms,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// PROFESYONEL SESSION RECOVERY
// Eski restoreUserIfMissing fonksiyonunu bununla değiştir

function restoreUserIfMissing(userId, name) {
  ensureBotExists();

  // geçersiz kullanıcı
  if (!userId) return null;

  // kullanıcı zaten mevcut
  let user = getUser(userId);

  if (user) {
    user.lastSeen = now();
    user.status = "online";
    return user;
  }

  // frontend userName göndermemişse
  // reconnect spamını engelle
  if (!name || typeof name !== "string") {
    return null;
  }

  // isimden kullanıcı kurtarma
  let existing = userExists(name);

  if (existing) {
    existing.id = userId;
    existing.lastSeen = now();
    existing.status = "online";

    return existing;
  }

  // cold start recovery
  user = {
    id: userId,
    name: sanitize(name).slice(0, CONFIG.NAME_MAX),

    muted: false,
    isBot: false,

    isAdmin: ADMIN_NICKS.includes(
      name.toLowerCase()
    ),

    avatar: null,

    status: "online",

    roomId: "genel",

    lastSeen: now(),

    joinedAt: now()
  };

  db.users.push(user);

  return user;
}

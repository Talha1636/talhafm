let messages = [];

export default function handler(req, res) {
  // MESAJ EKLE
  if (req.method === "POST") {
    messages.push(req.body);
    return res.json({ ok: true });
  }

  // MESAJLARI GETİR
  if (req.method === "GET") {
    return res.json(messages);
  }

  // MESAJLARI SİL (CLEAR ROOM)
  if (req.method === "DELETE") {
    messages = [];
    return res.json({ ok: true, cleared: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

let messages = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    messages.push(req.body);
    return res.json({ ok: true });
  }

  res.json(messages);
}

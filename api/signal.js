
// Vercel KV veya basit bir DB kullanmadığımız için 
// bu örnek demo amaçlıdır. Gerçek projede Vercel KV veya Upstash Redis kullanmalısın.
// Şimdilik sadece istekleri karşılayıp geçici bellekte tutuyoruz.

let signalData = [];

export default async function handler(req, res) {
  // CORS için
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const body = req.body;
    signalData.push(body);
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    // İsteğe bağlı sonrasını filtrele
    const after = req.query.after || 0;
    const newSignals = signalData.filter(s => s.id > parseInt(after));
    return res.status(200).json(newSignals);
  }
}

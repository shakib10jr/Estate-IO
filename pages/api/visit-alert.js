export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && ip.includes('198.52.147.77')) return res.status(200).json({ ok: true, skipped: true });
  const { business_name, slug } = req.body;

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const message = 'VISIT: ' + business_name + ' just opened their preview page.\nhttps://estate-io.vercel.app/preview/' + slug;

    await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_PHONE,
        To: process.env.YOUR_PHONE,
        Body: message
      }).toString()
    });

    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

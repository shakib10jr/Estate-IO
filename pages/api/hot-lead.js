export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip && ip.includes('198.52.147.77')) return res.status(200).json({ ok: true, skipped: true });
  const { business_name, slug, time_spent } = req.body;

  try {
    // Update lead stage in Supabase
    await fetch(process.env.SUPABASE_URL + '/rest/v1/Leads?slug=eq.' + encodeURIComponent(slug), {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ ghl_stage: 'Hot Lead' })
    });

    // Save to page_views
    await fetch(process.env.SUPABASE_URL + '/rest/v1/page_views', {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        slug: slug,
        business_name: business_name,
        time_spent_seconds: time_spent || 35,
        entered_at: new Date().toISOString()
      })
    });

    // Send SMS via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;
    const yourPhone = process.env.YOUR_PHONE;

    const message = '🔥 HOT LEAD: ' + business_name + ' just spent 35+ seconds on their preview page. Call them now.\n\nhttps://estate-io.vercel.app/preview/' + slug;

    const twilioRes = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: twilioPhone,
        To: yourPhone,
        Body: message
      }).toString()
    });

    const twilioData = await twilioRes.json();
    if (twilioData.sid) {
      console.log('SMS sent: ' + twilioData.sid);
    } else {
      console.log('Twilio error:', twilioData);
    }

    res.status(200).json({ ok: true });
  } catch(e) {
    console.log('Hot lead error:', e.message);
    res.status(500).json({ error: e.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { business_name, slug, time_spent } = req.body;

  try {
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

    console.log('HOT LEAD: ' + business_name + ' spent ' + time_spent + 's on page');
    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

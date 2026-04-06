export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { slug, business_name, time_spent, comparison_view, device_type } = body;

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
        time_spent_seconds: time_spent || 0,
        comparison_view: comparison_view || false,
        device_type: device_type || 'unknown',
        entered_at: new Date().toISOString()
      })
    });

    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}

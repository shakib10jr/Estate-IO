require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const YOUR_PHONE = process.env.YOUR_PHONE;

async function sendSMS(message) {
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ From: TWILIO_PHONE, To: YOUR_PHONE, Body: message }).toString()
  });
}

async function runAnalysis() {
  console.log('\n========= NIGHTLY ANALYSIS =========');
  console.log(new Date().toLocaleString());
  console.log('=====================================\n');

  // Pull all data
  const { data: leads } = await sb.from('Leads')
    .select('business_name, city, niche, situation_tag, star_rating, review_count, opening_line, ghl_stage, sent_to_instantly, created_at')
    .eq('Approved', true);

  const { data: pageViews } = await sb.from('page_views')
    .select('business_name, time_spent_seconds, created_at');

  // Build analysis data
  const nicheStats = {};
  const cityStats = {};
  const situationStats = {};
  const hotLeads = leads.filter(l => l.ghl_stage === 'Hot Lead');
  const sentLeads = leads.filter(l => l.sent_to_instantly === true);

  leads.forEach(l => {
    // Niche breakdown
    if (!nicheStats[l.niche]) nicheStats[l.niche] = { total: 0, hot: 0, views: 0 };
    nicheStats[l.niche].total++;
    if (l.ghl_stage === 'Hot Lead') nicheStats[l.niche].hot++;

    // City breakdown
    if (!cityStats[l.city]) cityStats[l.city] = { total: 0, hot: 0 };
    cityStats[l.city].total++;
    if (l.ghl_stage === 'Hot Lead') cityStats[l.city].hot++;

    // Situation breakdown
    if (!situationStats[l.situation_tag]) situationStats[l.situation_tag] = { total: 0, hot: 0 };
    situationStats[l.situation_tag].total++;
    if (l.ghl_stage === 'Hot Lead') situationStats[l.situation_tag].hot++;
  });

  // Add page view counts to niche stats
  pageViews.forEach(pv => {
    const lead = leads.find(l => l.business_name === pv.business_name);
    if (lead && lead.niche && nicheStats[lead.niche]) {
      nicheStats[lead.niche].views++;
    }
  });

  // Format data for Claude
  const dataForClaude = {
    summary: {
      total_approved: leads.length,
      total_sent: sentLeads.length,
      total_page_views: pageViews.length,
      total_hot_leads: hotLeads.length,
      hot_lead_rate: ((hotLeads.length / sentLeads.length) * 100).toFixed(1) + '%'
    },
    by_niche: nicheStats,
    by_city: cityStats,
    by_situation: situationStats,
    hot_leads: hotLeads.map(l => ({
      business: l.business_name,
      city: l.city,
      niche: l.niche,
      situation: l.situation_tag,
      stars: l.star_rating,
      reviews: l.review_count
    })),
    recent_page_views: pageViews
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(p => ({ business: p.business_name, seconds: p.time_spent_seconds }))
  };

  console.log('Data compiled. Sending to Claude for analysis...\n');

  // Send to Claude for analysis
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are analyzing cold email outreach data for EstateIO, a company that builds websites for trades businesses (roofers, electricians, HVAC, landscapers) in Canada.

Here is the current performance data:
${JSON.stringify(dataForClaude, null, 2)}

Give me exactly 5 short bullet points (max 15 words each) that tell me:
1. Which niche or city is performing best and why to double down
2. Which situation tag (dead_website, no_website, bad_website) converts to hot leads best
3. One thing I should do differently tomorrow
4. Any warning signs in the data
5. One specific city + niche combo I should scrape next based on the patterns

Be direct, specific, and actionable. No fluff. Format as 5 numbered points.`
    }]
  });

  const analysis = message.content[0].text;
  console.log('CLAUDE ANALYSIS:\n');
  console.log(analysis);

  // Send SMS
  const smsMessage = `🌙 EstateIO Nightly Analysis\n\n${analysis}\n\n---\nLeads: ${leads.length} | Views: ${pageViews.length} | Hot: ${hotLeads.length}`;
  await sendSMS(smsMessage);
  console.log('\nSMS sent.');
  console.log('=====================================\n');
}

runAnalysis().catch(console.error);

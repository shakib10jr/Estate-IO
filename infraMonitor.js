require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');


const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const YOUR_PHONE = process.env.YOUR_PHONE;
const INSTANTLY_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;

const BOUNCE_RATE_WARNING = 0.05;
const BOUNCE_RATE_CRITICAL = 0.10;

async function sendSMS(message) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ From: TWILIO_PHONE, To: YOUR_PHONE, Body: message }).toString()
  });
  const data = await res.json();
  if (data.sid) console.log('SMS sent:', data.sid);
  else console.log('SMS error:', data);
}

async function pauseCampaign() {
  const res = await fetch(`https://api.instantly.ai/api/v2/campaigns/${INSTANTLY_CAMPAIGN_ID}/pause`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + INSTANTLY_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const data = await res.json();
  console.log('Campaign pause result:', data);
}

async function getInstantlyStats() {
  const today = new Date().toISOString().split('T')[0];
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const res = await fetch(`https://api.instantly.ai/api/v2/campaigns/analytics/overview?id=${INSTANTLY_CAMPAIGN_ID}&start_date=${week}&end_date=${today}`, {
    headers: { 'Authorization': 'Bearer ' + INSTANTLY_KEY }
  });
  return await res.json();
}

async function checkBounceRate(stats) {
  const sent = stats.emails_sent_count || 0;
  const bounced = stats.bounced_count || 0;
  if (sent === 0) return { rate: 0, status: 'ok' };
  const rate = bounced / sent;
  console.log(`Bounce rate: ${(rate * 100).toFixed(1)}% (${bounced}/${sent})`);
  if (rate >= BOUNCE_RATE_CRITICAL) return { rate, status: 'critical' };
  if (rate >= BOUNCE_RATE_WARNING) return { rate, status: 'warning' };
  return { rate, status: 'ok' };
}

async function checkSupabaseHealth() {
  const { data, error } = await sb.from('Leads').select('id').eq('Approved', true).limit(1);
  if (error) return { status: 'error', message: error.message };
  return { status: 'ok' };
}

async function checkPageViewsHealth() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb.from('page_views').select('id').gte('created_at', since);
  if (error) return { count: 0, status: 'error' };
  return { count: data.length, status: 'ok' };
}

async function runMonitor() {
  console.log('\n========= INFRAMONITOR =========');
  console.log(new Date().toLocaleString());
  console.log('================================\n');

  const issues = [];
  const warnings = [];

  try {
    const stats = await getInstantlyStats();
    const bounce = await checkBounceRate(stats);
    console.log(`Emails sent: ${stats.emails_sent_count || 0}`);
    console.log(`Replies: ${stats.reply_count_unique || 0}`);
    console.log(`Clicks: ${stats.link_click_count_unique || 0}`);
    if (bounce.status === 'critical') {
      issues.push(`CRITICAL: Bounce rate at ${(bounce.rate * 100).toFixed(1)}% — campaign paused automatically`);
      await pauseCampaign();
    } else if (bounce.status === 'warning') {
      warnings.push(`WARNING: Bounce rate at ${(bounce.rate * 100).toFixed(1)}% — approaching danger zone`);
    } else {
      console.log(`Bounce rate OK: ${(bounce.rate * 100).toFixed(1)}%`);
    }
  } catch(e) {
    warnings.push(`Could not fetch Instantly stats: ${e.message}`);
  }

  try {
    const health = await checkSupabaseHealth();
    if (health.status === 'error') issues.push(`Supabase error: ${health.message}`);
    else console.log('Supabase OK');
  } catch(e) {
    issues.push(`Supabase unreachable: ${e.message}`);
  }

  try {
    const pv = await checkPageViewsHealth();
    console.log(`Page views last 24h: ${pv.count}`);
    if (pv.count === 0) warnings.push(`No page views in last 24 hours — preview pages may be down`);
    else console.log(`Page views OK: ${pv.count} in last 24h`);
  } catch(e) {
    warnings.push(`Could not check page views: ${e.message}`);
  }

  const tokenExpiry = new Date('2026-05-04');
  const daysUntilExpiry = Math.floor((tokenExpiry - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7) warnings.push(`GitHub token expires in ${daysUntilExpiry} days — renew now`);
  else console.log(`GitHub token OK: ${daysUntilExpiry} days until expiry`);

  console.log('\n======= MONITOR SUMMARY =======');
  if (issues.length > 0) {
    const msg = 'ESTATEIO ALERT\n\n' + issues.join('\n') + (warnings.length > 0 ? '\n\n' + warnings.join('\n') : '');
    console.log(msg);
    await sendSMS(msg);
  } else if (warnings.length > 0) {
    const msg = 'EstateIO Warning\n\n' + warnings.join('\n');
    console.log(msg);
    await sendSMS(msg);
  } else {
    const msg = 'EstateIO Infra: All systems healthy.';
    console.log(msg);
    await sendSMS(msg);
  }
  console.log('================================\n');
}

runMonitor();

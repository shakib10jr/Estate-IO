require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TEST_MODE = true;

const FAKE_URL_PATTERNS = [
  'facebook.com', 'fb.com', 'yelp.com', 'google.com/maps',
  'instagram.com', 'tripadvisor.com', 'yellowpages.com',
  'houzz.com', 'thumbtack.com', 'homestars.com', 'nextdoor.com'
];

const PLACEHOLDER_PATTERNS = [
  'coming soon', 'under construction', 'domain for sale',
  'parked domain', 'website coming', 'launching soon'
];

async function checkURL(url) {
  if (!url || url === null || url === undefined || url.toString().trim() === '') {
    return { situation: 'no_website', confidence: 0.99, reason: 'No URL provided' };
  }
  const urlLower = url.toLowerCase();
  for (const p of FAKE_URL_PATTERNS) {
    if (urlLower.includes(p)) return { situation: 'facebook_only', confidence: 0.97, reason: 'Social URL' };
  }
  try {
    const r = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' }, maxRedirects: 5 });
    const content = r.data.toLowerCase();
    for (const p of PLACEHOLDER_PATTERNS) {
      if (content.includes(p)) return { situation: 'coming_soon', confidence: 0.91, reason: p };
    }
    return { situation: 'real_website', confidence: 0.92, reason: 'HTTP 200' };
  } catch(e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.response?.status === 404) {
      return { situation: 'dead_website', confidence: 0.88, reason: e.code || '404' };
    }
    if (e.code === 'ECONNABORTED') return { situation: 'dead_website', confidence: 0.71, reason: 'Timeout' };
    return { situation: 'unclear', confidence: 0.50, reason: e.message };
  }
}

async function fetchReviews(businessName, city) {
  try {
    const searchResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          input: businessName + ' ' + city,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address',
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      }
    );
    if (!searchResponse.data.candidates.length) {
      console.log('  No Google listing found for ' + businessName);
      return null;
    }
    const placeId = searchResponse.data.candidates[0].place_id;
    const detailsResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews',
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      }
    );
    const place = detailsResponse.data.result;
    const topReviews = place.reviews
      ? place.reviews.slice(0, 5).map(function(r) {
          return { author: r.author_name, rating: r.rating, text: r.text };
        })
      : [];
    return {
      phone: place.formatted_phone_number || null,
      star_rating: place.rating || null,
      review_count: place.user_ratings_total || 0,
      top_reviews: JSON.stringify(topReviews)
    };
  } catch(e) {
    console.log('  Google fetch error: ' + e.message);
    return null;
  }
}

async function processLead(lead) {
  console.log('\nProcessing: ' + lead.business_name);
  const urlCheck = await checkURL(lead.website_url);
  console.log('  Situation: ' + urlCheck.situation + ' (' + Math.round(urlCheck.confidence * 100) + '%)');
  if (urlCheck.situation === 'real_website') {
    console.log('  FILTERED - real website');
    return null;
  }
  console.log('  Fetching Google reviews...');
  const googleData = await fetchReviews(lead.business_name, lead.city);
  if (googleData) {
    console.log('  Found: ' + googleData.star_rating + ' stars, ' + googleData.review_count + ' reviews');
  } else {
    console.log('  No Google data found');
  }
  const needsReview = urlCheck.confidence < 0.85;
  const fullLead = {
    business_name: lead.business_name,
    email: lead.email,
    phone: (googleData && googleData.phone) ? googleData.phone : lead.phone || null,
    address: lead.address,
    city: lead.city,
    niche: lead.niche,
    website_url: lead.website_url || null,
    situation_tag: urlCheck.situation,
    situation_confidence: urlCheck.confidence,
    star_rating: (googleData && googleData.star_rating) ? googleData.star_rating : null,
    review_count: (googleData && googleData.review_count) ? googleData.review_count : 0,
    top_reviews: (googleData && googleData.top_reviews) ? googleData.top_reviews : null,
    approved: !needsReview,
    ghl_stage: 'Scraped'
  };
  if (needsReview) console.log('  FLAGGED - needs cousin review');
  if (!TEST_MODE) {
    console.log('  Would save to Supabase');
  } else {
    console.log('  TEST MODE - Supabase skipped');
  }
  return fullLead;
}

async function runPipeline(leads) {
  console.log('Starting combined pipeline for ' + leads.length + ' leads...');
  const results = { total: leads.length, processed: 0, filtered: 0, flagged: 0, with_reviews: 0 };
  for (const lead of leads) {
    const processed = await processLead(lead);
    if (processed) {
      results.processed++;
      if (!processed.approved) results.flagged++;
      if (processed.star_rating) results.with_reviews++;
    } else {
      results.filtered++;
    }
  }
  console.log('\n========= RESULTS =========');
  console.log('Total: ' + results.total);
  console.log('Entered pipeline: ' + results.processed);
  console.log('Filtered out: ' + results.filtered);
  console.log('Flagged for review: ' + results.flagged);
  console.log('With Google reviews: ' + results.with_reviews);
  console.log('============================');
}

const testLeads = [
  { business_name: 'Leapfrog Landscaping', email: 'info@leapfrog.ca', phone: '', address: 'Toronto ON', city: 'Toronto', niche: 'landscaping', website_url: null },
  { business_name: 'Edmunds Landscaping', email: 'info@edmunds.ca', phone: '', address: 'Toronto ON', city: 'Toronto', niche: 'landscaping', website_url: 'https://www.edmundslandscaping.ca' },
  { business_name: 'Corepro Landscaping', email: 'info@corepro.ca', phone: '', address: 'Toronto ON', city: 'Toronto', niche: 'landscaping', website_url: 'https://coreprolandscaping.ca' }
];

runPipeline(testLeads);

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TEST_MODE = true;

const CRITERIA = {
  MIN_STAR_RATING: 3.5,
  MIN_REVIEW_COUNT: 5,
  MIN_CONFIDENCE: 0.85,
  VALID_SITUATIONS: ['no_website', 'facebook_only', 'dead_website', 'coming_soon']
};

function evaluateLead(lead) {
  const flags = [];
  let autoApprove = true;

  if (!lead.star_rating || lead.star_rating < CRITERIA.MIN_STAR_RATING) {
    flags.push('Low star rating: ' + lead.star_rating);
    autoApprove = false;
  }

  if (!lead.review_count || lead.review_count < CRITERIA.MIN_REVIEW_COUNT) {
    flags.push('Low review count: ' + lead.review_count);
    autoApprove = false;
  }

  if (!lead.situation_confidence || lead.situation_confidence < CRITERIA.MIN_CONFIDENCE) {
    flags.push('Low confidence: ' + Math.round((lead.situation_confidence || 0) * 100) + '%');
    autoApprove = false;
  }

  if (!CRITERIA.VALID_SITUATIONS.includes(lead.situation_tag)) {
    flags.push('Invalid situation: ' + lead.situation_tag);
    autoApprove = false;
  }

  if (!lead.opening_line || lead.opening_line.trim() === '') {
    flags.push('Missing opening line');
    autoApprove = false;
  }

  if (!lead.email || lead.email.trim() === '') {
    flags.push('Missing email');
    autoApprove = false;
  }

  return { autoApprove, flags };
}

async function processApprovalQueue(leads) {
  console.log('Running approval queue for ' + leads.length + ' leads...\n');

  const results = { total: leads.length, auto_approved: 0, flagged: 0 };

  for (const lead of leads) {
    console.log('Evaluating: ' + lead.business_name);
    const evaluation = evaluateLead(lead);

    if (evaluation.autoApprove) {
      console.log('  AUTO APPROVED');
      results.auto_approved++;
      if (!TEST_MODE) {
        await supabase.from('Leads').update({ approved: true, ghl_stage: 'Preview Approved' }).eq('business_name', lead.business_name);
      }
    } else {
      console.log('  FLAGGED FOR COUSIN REVIEW');
      console.log('  Reasons: ' + evaluation.flags.join(', '));
      results.flagged++;
      if (!TEST_MODE) {
        await supabase.from('Leads').update({ approved: false, ghl_stage: 'Needs Review' }).eq('business_name', lead.business_name);
      }
    }
    console.log('  TEST MODE - Supabase skipped\n');
  }

  console.log('========= APPROVAL RESULTS =========');
  console.log('Total: ' + results.total);
  console.log('Auto approved: ' + results.auto_approved);
  console.log('Flagged: ' + results.flagged);
  console.log('=====================================');
}

const testLeads = [
  { business_name: 'Leapfrog Landscaping', email: 'info@leapfrog.ca', situation_tag: 'no_website', situation_confidence: 0.99, star_rating: 4.8, review_count: 16, opening_line: 'I noticed Leapfrog has built an impressive reputation...' },
  { business_name: 'Edmunds Landscaping', email: 'info@edmunds.ca', situation_tag: 'dead_website', situation_confidence: 0.88, star_rating: 4.1, review_count: 14, opening_line: 'Your customers are raving about your garden transformations...' },
  { business_name: 'Low Rating Co', email: 'info@lowrating.ca', situation_tag: 'no_website', situation_confidence: 0.99, star_rating: 2.8, review_count: 4, opening_line: 'Some opening line...' },
  { business_name: 'Unclear Co', email: 'info@unclear.ca', situation_tag: 'unclear', situation_confidence: 0.50, star_rating: 4.5, review_count: 22, opening_line: 'Some opening line...' },
  { business_name: 'No Email Co', email: '', situation_tag: 'facebook_only', situation_confidence: 0.97, star_rating: 4.3, review_count: 31, opening_line: 'Some opening line...' }
];

processApprovalQueue(testLeads);

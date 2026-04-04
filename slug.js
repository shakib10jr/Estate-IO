import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const VARIANTS = {
  A: { heroElement: 'rating', ctaText: 'Claim Your Free Preview' },
  B: { heroElement: 'review', ctaText: 'See Your Full Site' }
};

const HEADLINES = {
  no_website: 'customers vouched for you. Here is where to send the next one.',
  facebook_only: 'Your followers deserve somewhere better to go.',
  dead_website: 'Your reputation is alive even if your website is not.',
  coming_soon: 'We fast-tracked it. Here is what it looks like already.'
};

export default function PreviewPage({ lead }) {
  const router = useRouter();
  const { v, compare } = router.query;
  const variant = VARIANTS[v] || VARIANTS.A;
  const showComparison = compare === 'true';
  const [sessionStart] = useState(Date.now());

  useEffect(() => {
    if (!lead) return;
    const timeSpent = Math.round((Date.now() - sessionStart) / 1000);
    return () => { console.log('Time spent: ' + timeSpent + 's'); };
  }, []);

  if (!lead) return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>;

  const reviews = lead.top_reviews ? JSON.parse(lead.top_reviews) : [];
  const positiveReviews = reviews.filter(function(r) { return r.rating >= 4; });
  const headline = HEADLINES[lead.situation_tag] || HEADLINES.no_website;
  const fullHeadline = lead.situation_tag === 'no_website' ? lead.review_count + ' ' + headline : headline;

  if (showComparison) {
    return <ComparisonView lead={lead} variant={variant} headline={fullHeadline} positiveReviews={positiveReviews} />;
  }
  return <StandardView lead={lead} variant={variant} headline={fullHeadline} positiveReviews={positiveReviews} />;
}

function StandardView({ lead, variant, headline, positiveReviews }) {
  return (
    <div style={{fontFamily:'Inter,system-ui,sans-serif',background:'#f8f9fa',minHeight:'100vh'}}>
      <Head>
        <title>{lead.business_name} - Your Digital Home</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{maxWidth:'680px',margin:'0 auto',padding:'40px 20px'}}>
        <div style={{background:'#fff',borderRadius:'16px',padding:'40px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',marginBottom:'32px'}}>
            <div style={{width:'64px',height:'64px',background:'#22c55e',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'28px'}}>
              🌿
            </div>
            <h1 style={{fontSize:'28px',fontWeight:'700',color:'#1a1a2e',margin:'0 0 8px'}}>{lead.business_name}</h1>
            <p style={{color:'#666',fontSize:'15px',margin:'0'}}>{lead.city}</p>
          </div>

          <div style={{textAlign:'center',background:'#f0fdf4',borderRadius:'12px',padding:'24px',marginBottom:'24px'}}>
            <div style={{fontSize:'48px',fontWeight:'800',color:'#16a34a',lineHeight:'1'}}>{lead.star_rating}</div>
            <div style={{fontSize:'24px',color:'#22c55e',margin:'8px 0'}}>★★★★★</div>
            <div style={{color:'#555',fontSize:'15px'}}>{lead.review_count} verified Google reviews</div>
          </div>

          <h2 style={{fontSize:'22px',fontWeight:'600',color:'#1a1a2e',lineHeight:'1.4',marginBottom:'24px',textAlign:'center'}}>{headline}}</h2>

          {positiveReviews.slice(0, 3).map(function(review, i) {
            return (
              <div key={i} style={{borderBottom:'1px solid #f0f0f0',padding:'16px 0'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <span style={{color:'#f59e0b',fontSize:'14px'}}>★★★★★</span>
                  <span style={{fontSize:'13px',color:'#888'}}>{review.author}</span>
                </div>
                <p style={{fontSize:'14px',color:'#555',lineHeight:'1.6',margin:'0'}}>
                  {review.text.substring(0, 150)}...
                </p>
              </div>
            );
          })}

          <div style={{marginTop:'32px',textAlign:'center'}}>
            <p style={{fontSize:'14px',color:'#888',marginBottom:'16px'}}>This is a preview of what your website could look like.</p>
            <a href={'mailto:shakib@getlocalbiz.co?subject=Preview - ' + lead.business_name} style={{display:'inline-block',background:'#1a1a2e',color:'#fff',padding:'16px 32px',borderRadius:'50px',fontSize:'16px',fontWeight:'600',textDecoration:'none'}}>
              {variant.ctaText}
            </a>
            <p style={{fontSize:'12px',color:'#aaa',marginTop:'12px'}}>No commitment. No credit card. Just a conversation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ lead, variant, headline, positiveReviews }) {
  return (
    <div style={{fontFamily:'Inter,system-ui,sans-serif',minHeight:'100vh'}}>
      <Head>
        <title>{lead.business_name} - Before and After</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{background:'#1a1a2e',color:'#fff',padding:'20px',textAlign:'center'}}>
        <h1 style={{fontSize:'24px',fontWeight:'700',margin:'0 0 8px'}}>{lead.business_name}</h1>
        <p style={{color:'#aaa',margin:'0',fontSize:'14px'}}>{headline}</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'calc(100vh - 80px)'}}>
        <div style={{background:'#f5f5f5',padding:'32px',borderRight:'3px solid #1a1a2e'}}>
          <div style={{textAlign:'center',marginBottom:'20px'}}>
            <span style={{background:'#e5e7eb',color:'#6b7280',padding:'6px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600'}}>BEFORE</span>
          </div>
          <div style={{background:'#fff',borderRadius:'8px',padding:'40px',textAlign:'center',border:'2px dashed #d1d5db',minHeight:'300px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>💔</div>
            <p style={{color:'#888',fontSize:'16px'}}>Website Not Found</p>
            <p style={{color:'#ef4444',fontSize:'13px',marginTop:'8px'}}>Customers get an error when they visit</p>
          </div>
        </div>
        <div style={{background:'#fff',padding:'32px'}}>
          <div style={{textAlign:'center',marginBottom:'20px'}}>
            <span style={{background:'#dcfce7',color:'#16a34a',padding:'6px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600'}}>AFTER</span>
          </div>
          <div style={{textAlign:'center',marginBottom:'20px'}}>
            <div style={{fontSize:'36px',fontWeight:'800',color:'#16a34a'}}>{lead.star_rating} ★</div>
            <div style={{color:'#555',fontSize:'14px'}}>{lead.review_count} Google reviews</div>
          </div>
          <h2 style={{fontSize:'20px',fontWeight:'600',color:'#1a1a2e',marginBottom:'16px'}}>{lead.business_name}</h2>
          {positiveReviews.slice(0, 2).map(function(review, i) {
            return (
              <div key={i} style={{background:'#f0fdf4',borderRadius:'8px',padding:'12px',marginBottom:'10px'}}>
                <div style={{color:'#f59e0b',fontSize:'12px',marginBottom:'4px'}}>★★★★★</div>
                <p style={{fontSize:'13px',color:'#555',lineHeight:'1.5',margin:'0 0 4px'}}>"{review.text.substring(0, 120)}..."</p>
                <p style={{fontSize:'12px',color:'#aaa',margin:'0'}}>— {review.author}</p>
              </div>
            );
          })}
          <div style={{textAlign:'center',marginTop:'20px'}}>
            <a href={'mailto:shakib@getlocalbiz.co?subject=Preview - ' + lead.business_name} style={{display:'inline-block',background:'#1a1a2e',color:'#fff',padding:'14px 28px',borderRadius:'50px',fontSize:'15px',fontWeight:'600',textDecoration:'none'}}>
              {variant.ctaText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params.slug;
  const mockLeads = {
    'leapfrog-landscaping': {
      business_name: 'Leapfrog Landscaping',
      city: 'Toronto',
      situation_tag: 'no_website',
      star_rating: 4.8,
      review_count: 16,
      website_url: null,
      top_reviews: JSON.stringify([
        { author: 'John S', rating: 5, text: 'Amazing service, showed up on time and did a fantastic job on our backyard. Will definitely hire again.' },
        { author: 'Sarah M', rating: 5, text: 'Best landscaper in the area. Very professional and fair pricing. Our lawn has never looked better.' },
        { author: 'Mike T', rating: 4, text: 'Great work on our front lawn. The team was friendly and efficient. Highly recommend.' }
      ])
    },
    'edmunds-landscaping': {
      business_name: 'Edmunds Landscaping',
      city: 'Toronto',
      situation_tag: 'dead_website',
      star_rating: 4.1,
      review_count: 14,
      website_url: 'https://www.edmundslandscaping.ca',
      top_reviews: JSON.stringify([
        { author: 'Lisa K', rating: 5, text: 'Edmunds transformed our garden completely. The attention to detail was incredible and the team was so professional.' },
        { author: 'David R', rating: 4, text: 'Reliable and hardworking team. Good communication throughout the whole project.' }
      ])
    }
  };
  const lead = mockLeads[slug] || null;
  return { props: { lead } };
}

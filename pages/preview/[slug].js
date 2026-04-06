import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

// PAGE VIEW TRACKER
function usePageTracking(lead, variant) {
  const startTime = useRef(Date.now());
  const hotFired = useRef(false);

  useEffect(() => {
    if (!lead) return;

    // Log page view to Supabase
    async function logView() {
      try {
        await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/page_views', {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            lead_id: lead.id,
            business_name: lead.business_name,
            slug: lead.slug,
            variant: variant || 'standard',
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            visited_at: new Date().toISOString()
          })
        });
      } catch(e) {
        console.log('Tracking error:', e.message);
      }
    }

    logView();

    // Hot lead trigger - 35 seconds on page
    const hotTimer = setTimeout(async function() {
      if (hotFired.current) return;
      hotFired.current = true;
      try {
        await fetch('/api/hot-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: lead.business_name, slug: lead.slug, time_spent: 35 })
        });
      } catch(e) {}
    }, 35000);

    // Log time spent on page unload
    function handleUnload() {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      navigator.sendBeacon('/api/page-time', JSON.stringify({ slug: lead.slug, business_name: lead.business_name, time_spent: timeSpent }));
    }

    window.addEventListener('beforeunload', handleUnload);

    return function() {
      clearTimeout(hotTimer);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [lead, variant]);
}

export default function PreviewPage({ lead }) {
  const router = useRouter();
  const { v, compare } = router.query;
  const ctaText = "Claim This Site";
  const showComparison = compare === "true";
  const variant = showComparison ? 'comparison' : (v || 'standard');

  usePageTracking(lead, variant);

  if (!lead) return <div style={{padding:"40px",textAlign:"center",fontFamily:"Inter,sans-serif",color:"#666"}}>This preview page is not available.</div>;
  const reviews = lead.top_reviews ? JSON.parse(lead.top_reviews) : [];
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const headlines = {
    no_website: "Your reputation is real. Your customers deserve somewhere to send their friends.",
    facebook_only: "Your followers are loyal. They deserve a real destination.",
    dead_website: "Your reputation is very much alive. Your website just needs to catch up.",
    coming_soon: "You have been getting ready long enough. Here is what it looks like."
  };
  const headline = headlines[lead.situation_tag] || headlines.no_website;
  if (showComparison) return <ComparisonView lead={lead} headline={headline} positiveReviews={positiveReviews} ctaText={ctaText} />;
  return <StandardView lead={lead} headline={headline} positiveReviews={positiveReviews} ctaText={ctaText} />;
}

function StandardView({ lead, headline, positiveReviews, ctaText }) {
  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#fff",minHeight:"100vh",color:"#111"}}>
      <Head>
        <title>{lead.business_name}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <nav style={{background:"#fff",borderBottom:"1px solid #f0f0f0",padding:"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"60px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
          <div style={{fontWeight:"800",fontSize:"16px",letterSpacing:"-0.3px"}}>{lead.business_name}</div>
          {lead.phone && <a href={"tel:"+lead.phone} style={{fontSize:"13px",color:"#22c55e",fontWeight:"600",textDecoration:"none"}}>{lead.phone}</a>}
        </div>
        <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",textDecoration:"none"}}>Get a Quote</a>
      </nav>
      <div style={{padding:"64px 48px 56px",maxWidth:"900px",margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:"50px",padding:"5px 14px",fontSize:"13px",color:"#444",marginBottom:"28px",fontWeight:"500"}}>
          <span style={{color:"#f59e0b",fontSize:"14px"}}>★</span>
          <span style={{fontWeight:"700",color:"#111"}}>{lead.star_rating}</span>
          <span style={{color:"#ccc",margin:"0 2px"}}>·</span>
          <span>{lead.review_count} verified Google reviews</span>
        </div>
        <h1 style={{fontSize:"clamp(36px,5vw,64px)",fontWeight:"900",color:"#111",lineHeight:"1.05",marginBottom:"20px",letterSpacing:"-2px"}}>{lead.business_name}</h1>
        <p style={{fontSize:"clamp(16px,2vw,19px)",color:"#555",maxWidth:"540px",lineHeight:"1.65",marginBottom:"36px"}}>{headline}</p>
        <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
          <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"14px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:"700",textDecoration:"none",display:"inline-block"}}>{ctaText}</a>
          <div style={{fontSize:"14px",color:"#888",fontWeight:"500"}}>No commitment required</div>
        </div>
      </div>
      <div style={{background:"#f7f7f7",borderTop:"1px solid #eee",borderBottom:"1px solid #eee",padding:"48px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"32px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#999",textTransform:"uppercase"}}>CUSTOMER REVIEWS</div>
            <div style={{flex:1,height:"1px",background:"#e8e8e8"}}></div>
            <div style={{fontSize:"13px",color:"#888",fontWeight:"500"}}>{lead.review_count} total reviews</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
            {positiveReviews.slice(0,3).map((review,i) => (
              <div key={i} style={{background:"#fff",borderRadius:"12px",padding:"24px",border:"1px solid #ebebeb"}}>
                <div style={{color:"#f59e0b",fontSize:"14px",marginBottom:"12px"}}>★★★★★</div>
                <p style={{fontSize:"14px",color:"#333",lineHeight:"1.7",margin:"0 0 16px",fontStyle:"italic"}}>"{review.text.substring(0,150)}..."</p>
                <div style={{display:"flex",alignItems:"center",gap:"10px",paddingTop:"12px",borderTop:"1px solid #f5f5f5"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#111",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"12px",fontWeight:"700",flexShrink:0}}>{review.author.charAt(0)}</div>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:"600",color:"#111"}}>{review.author}</div>
                    <div style={{fontSize:"11px",color:"#aaa",marginTop:"1px"}}>Verified Google Review</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:"#fff",padding:"64px 48px",maxWidth:"900px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"40px",flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#999",textTransform:"uppercase",marginBottom:"12px"}}>YOUR REPUTATION IN NUMBERS</div>
          <div style={{display:"flex",gap:"40px"}}>
            <div><div style={{fontSize:"48px",fontWeight:"900",color:"#111",letterSpacing:"-2px",lineHeight:"1"}}>{lead.star_rating}</div><div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Star rating</div></div>
            <div style={{width:"1px",background:"#eee"}}></div>
            <div><div style={{fontSize:"48px",fontWeight:"900",color:"#111",letterSpacing:"-2px",lineHeight:"1"}}>{lead.review_count}</div><div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Reviews</div></div>
          </div>
        </div>
        <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"16px 32px",borderRadius:"10px",fontSize:"15px",fontWeight:"700",textDecoration:"none",flexShrink:0}}>{ctaText}</a>
      </div>
    </div>
  );
}

function ComparisonView({ lead, headline, positiveReviews, ctaText }) {
  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#fff",minHeight:"100vh",color:"#111"}}>
      <Head>
        <title>{lead.business_name} — Your New Site Preview</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <nav style={{background:"#fff",borderBottom:"1px solid #f0f0f0",padding:"0 48px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"60px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
          <div style={{fontWeight:"800",fontSize:"16px",letterSpacing:"-0.3px"}}>{lead.business_name}</div>
          {lead.phone && <a href={"tel:"+lead.phone} style={{fontSize:"13px",color:"#22c55e",fontWeight:"600",textDecoration:"none"}}>{lead.phone}</a>}
        </div>
        <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",textDecoration:"none"}}>Get a Quote</a>
      </nav>
      <div style={{padding:"56px 48px 40px",maxWidth:"960px",margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:"50px",padding:"5px 14px",fontSize:"13px",color:"#444",marginBottom:"20px",fontWeight:"500"}}>
          <span style={{color:"#f59e0b",fontSize:"14px"}}>★</span>
          <span style={{fontWeight:"700",color:"#111"}}>{lead.star_rating}</span>
          <span style={{color:"#ccc",margin:"0 2px"}}>·</span>
          <span>{lead.review_count} verified Google reviews</span>
        </div>
        <h1 style={{fontSize:"clamp(32px,4vw,56px)",fontWeight:"900",color:"#111",lineHeight:"1.05",marginBottom:"12px",letterSpacing:"-2px"}}>{lead.business_name}</h1>
        <p style={{fontSize:"clamp(15px,2vw,18px)",color:"#555",maxWidth:"560px",lineHeight:"1.65",marginBottom:"40px"}}>{headline}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"40px"}}>
          <div style={{background:"#fff5f5",border:"1px solid #fecaca",borderRadius:"12px",padding:"28px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#ef4444",textTransform:"uppercase",marginBottom:"16px"}}>RIGHT NOW</div>
            <div style={{fontSize:"15px",color:"#666",lineHeight:"1.9"}}>
              <div style={{marginBottom:"8px"}}>✗ Broken or missing website</div>
              <div style={{marginBottom:"8px"}}>✗ No way to book online</div>
              <div style={{marginBottom:"8px"}}>✗ Reviews buried on Google</div>
              <div>✗ Losing jobs to competitors</div>
            </div>
          </div>
          <div style={{background:"#f0fdf4",border:"2px solid #22c55e",borderRadius:"12px",padding:"28px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#16a34a",textTransform:"uppercase",marginBottom:"16px"}}>WITH YOUR NEW SITE</div>
            <div style={{fontSize:"15px",color:"#333",lineHeight:"1.9"}}>
              <div style={{marginBottom:"8px"}}>✓ Professional online presence</div>
              <div style={{marginBottom:"8px"}}>✓ One-click booking</div>
              <div style={{marginBottom:"8px"}}>✓ Reviews front and center</div>
              <div>✓ New customers find you</div>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",marginBottom:"56px"}}>
          <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"16px 40px",borderRadius:"10px",fontSize:"16px",fontWeight:"700",textDecoration:"none",display:"inline-block"}}>{ctaText}</a>
          <p style={{fontSize:"13px",color:"#aaa",marginTop:"12px"}}>No commitment required</p>
        </div>
        {positiveReviews.length > 0 && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#999",textTransform:"uppercase"}}>WHAT YOUR CUSTOMERS SAY</div>
              <div style={{flex:1,height:"1px",background:"#e8e8e8"}}></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px",marginBottom:"48px"}}>
              {positiveReviews.slice(0,3).map((review,i) => (
                <div key={i} style={{background:"#f9f9f9",borderRadius:"12px",padding:"24px",border:"1px solid #ebebeb"}}>
                  <div style={{color:"#f59e0b",fontSize:"14px",marginBottom:"12px"}}>★★★★★</div>
                  <p style={{fontSize:"14px",color:"#333",lineHeight:"1.7",margin:"0 0 16px",fontStyle:"italic"}}>"{review.text.substring(0,150)}..."</p>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",paddingTop:"12px",borderTop:"1px solid #e8e8e8"}}>
                    <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#111",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"12px",fontWeight:"700",flexShrink:0}}>{review.author.charAt(0)}</div>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:"600",color:"#111"}}>{review.author}</div>
                      <div style={{fontSize:"11px",color:"#aaa",marginTop:"1px"}}>Verified Google Review</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{background:"#f7f7f7",borderRadius:"12px",padding:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"32px",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#999",textTransform:"uppercase",marginBottom:"12px"}}>YOUR REPUTATION IN NUMBERS</div>
            <div style={{display:"flex",gap:"32px"}}>
              <div><div style={{fontSize:"40px",fontWeight:"900",color:"#111",letterSpacing:"-1.5px",lineHeight:"1"}}>{lead.star_rating}</div><div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Star rating</div></div>
              <div style={{width:"1px",background:"#ddd"}}></div>
              <div><div style={{fontSize:"40px",fontWeight:"900",color:"#111",letterSpacing:"-1.5px",lineHeight:"1"}}>{lead.review_count}</div><div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Reviews</div></div>
            </div>
          </div>
          <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"14px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:"700",textDecoration:"none",flexShrink:0}}>{ctaText}</a>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params.slug;
  try {
    const res = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/Leads?slug=eq.' + encodeURIComponent(slug) + '&select=*',
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY
        }
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { props: { lead: data[0] } };
    }
  } catch(e) {
    console.log('Supabase fetch error:', e.message);
  }
  return { props: { lead: null } };
}

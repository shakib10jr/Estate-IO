import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function PreviewPage({ lead }) {
  const router = useRouter();
  const { v, compare } = router.query;
  const ctaText = "Claim This Site";
  const showComparison = compare === "true";
  if (!lead) return <div style={{padding:"40px",textAlign:"center"}}>Loading...</div>;
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
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}><div style={{fontWeight:"800",fontSize:"16px",letterSpacing:"-0.3px"}}>{lead.business_name}</div>{lead.phone && <a href={"tel:"+lead.phone} style={{fontSize:"13px",color:"#22c55e",fontWeight:"600",textDecoration:"none"}}>{lead.phone}</a>}</div>
        <div style={{display:"flex",gap:"32px",fontSize:"14px",color:"#666",fontWeight:"500"}}>
          <span style={{cursor:"pointer"}}>Services</span>
          <span style={{cursor:"pointer"}}>Reviews</span>
          <span style={{cursor:"pointer"}}>About</span>
          <span style={{cursor:"pointer"}}>Contact</span>
        </div>
        <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:"600",textDecoration:"none",letterSpacing:"-0.2px"}}>Get a Quote</a>
      </nav>

      <div style={{padding:"64px 48px 56px",maxWidth:"900px",margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#f9f9f9",border:"1px solid #e8e8e8",borderRadius:"50px",padding:"5px 14px",fontSize:"13px",color:"#444",marginBottom:"28px",fontWeight:"500"}}>
          <span style={{color:"#f59e0b",fontSize:"14px"}}>★</span>
          <span style={{fontWeight:"700",color:"#111"}}>{lead.star_rating}</span>
          <span style={{color:"#ccc",margin:"0 2px"}}>·</span>
          <span>{lead.review_count} verified Google reviews</span>
        </div>
        <h1 style={{fontSize:"clamp(36px,5vw,64px)",fontWeight:"900",color:"#111",lineHeight:"1.05",marginBottom:"20px",letterSpacing:"-2px"}}>{lead.business_name}</h1>
        <p style={{fontSize:"clamp(16px,2vw,19px)",color:"#555",maxWidth:"540px",lineHeight:"1.65",marginBottom:"36px",fontWeight:"400"}}>{headline}</p>
        <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
          <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"14px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:"700",textDecoration:"none",letterSpacing:"-0.3px",display:"inline-block"}}>{ctaText}</a>
          <div style={{fontSize:"14px",color:"#888",fontWeight:"500"}}>No commitment required</div>
        </div>
      </div>

      <div style={{background:"#f7f7f7",borderTop:"1px solid #eee",borderBottom:"1px solid #eee",padding:"48px 48px",maxWidth:"100%"}}>
        <div style={{maxWidth:"900px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"32px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#999",textTransform:"uppercase"}}>CUSTOMER REVIEWS</div>
            <div style={{flex:1,height:"1px",background:"#e8e8e8"}}></div>
            <div style={{fontSize:"13px",color:"#888",fontWeight:"500"}}>{lead.review_count} total reviews</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
            {positiveReviews.slice(0,3).map((review,i) => (
              <div key={i} style={{background:"#fff",borderRadius:"12px",padding:"24px",border:"1px solid #ebebeb"}}>
                <div style={{color:"#f59e0b",fontSize:"14px",marginBottom:"12px",letterSpacing:"1px"}}>★★★★★</div>
                <p style={{fontSize:"14px",color:"#333",lineHeight:"1.7",margin:"0 0 16px",fontStyle:"italic",fontWeight:"400"}}>"{review.text.substring(0,150)}..."</p>
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
            <div>
              <div style={{fontSize:"48px",fontWeight:"900",color:"#111",letterSpacing:"-2px",lineHeight:"1"}}>{lead.star_rating}</div>
              <div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Star rating</div>
            </div>
            <div style={{width:"1px",background:"#eee"}}></div>
            <div>
              <div style={{fontSize:"48px",fontWeight:"900",color:"#111",letterSpacing:"-2px",lineHeight:"1"}}>{lead.review_count}</div>
              <div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Reviews</div>
            </div>
            <div style={{width:"1px",background:"#eee"}}></div>
            <div>
              <div style={{fontSize:"48px",fontWeight:"900",color:"#111",letterSpacing:"-2px",lineHeight:"1"}}>0</div>
              <div style={{fontSize:"13px",color:"#888",marginTop:"4px"}}>Website visitors</div>
            </div>
          </div>
        </div>
        <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{background:"#111",color:"#fff",padding:"16px 32px",borderRadius:"10px",fontSize:"16px",fontWeight:"700",textDecoration:"none",letterSpacing:"-0.3px",whiteSpace:"nowrap",display:"inline-block"}}>{ctaText}</a>
      </div>

      <div style={{background:"#111",color:"#fff",padding:"56px 48px",textAlign:"center"}}>
        <div style={{maxWidth:"560px",margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(24px,3vw,38px)",fontWeight:"900",marginBottom:"12px",letterSpacing:"-1px"}}>This is what your site could look like.</h2>
          <p style={{fontSize:"16px",color:"#777",marginBottom:"32px",lineHeight:"1.6"}}>Custom built for {lead.business_name}. Live in 7 days.</p>
          <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{display:"inline-block",background:"#fff",color:"#111",padding:"16px 36px",borderRadius:"10px",fontSize:"16px",fontWeight:"700",textDecoration:"none",letterSpacing:"-0.3px"}}>{ctaText}</a>
          <p style={{fontSize:"12px",color:"#444",marginTop:"16px"}}>No commitment. No credit card. Just a conversation.</p>
        </div>
      </div>

      <footer style={{borderTop:"1px solid #f0f0f0",padding:"20px 48px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:"700",fontSize:"14px"}}>{lead.business_name}</div>
        <div style={{fontSize:"13px",color:"#aaa"}}>{lead.city}</div>
      </footer>
    </div>
  );
}

function ComparisonView({ lead, headline, positiveReviews, ctaText }) {
  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh"}}>
      <Head>
        <title>{lead.business_name} - Before and After</title>
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{background:"#111",color:"#fff",padding:"28px 48px",textAlign:"center"}}>
        <div style={{fontSize:"11px",fontWeight:"700",letterSpacing:"2px",color:"#22c55e",textTransform:"uppercase",marginBottom:"10px"}}>WEBSITE PREVIEW</div>
        <h1 style={{fontSize:"clamp(20px,3vw,32px)",fontWeight:"900",margin:"0 0 8px",letterSpacing:"-1px"}}>{lead.business_name}</h1>
        <p style={{color:"#666",margin:"0",fontSize:"15px",fontWeight:"400"}}>{headline}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:"calc(100vh - 120px)"}}>
        <div style={{background:"#fafafa",padding:"40px",borderRight:"2px solid #111"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <span style={{background:"#fef2f2",color:"#dc2626",padding:"5px 18px",borderRadius:"50px",fontSize:"12px",fontWeight:"700",letterSpacing:"1px"}}>BEFORE</span>
          </div>
          <div style={{background:"#fff",borderRadius:"12px",padding:"48px 32px",textAlign:"center",border:"1px solid #fee2e2",minHeight:"380px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"12px"}}>
            <div style={{fontSize:"52px"}}>{lead.situation_tag === "facebook_only" ? "📘" : lead.situation_tag === "coming_soon" ? "🚧" : "💔"}</div>
            <div style={{fontSize:"17px",fontWeight:"700",color:"#dc2626"}}>{lead.situation_tag === "facebook_only" ? "Facebook Page Only" : lead.situation_tag === "coming_soon" ? "Coming Soon Page" : "Website Not Found"}</div>
            <div style={{fontSize:"13px",color:"#999",maxWidth:"220px",lineHeight:"1.6"}}>{lead.situation_tag === "facebook_only" ? "Customers cannot find what they need" : lead.situation_tag === "coming_soon" ? "Customers are waiting but nothing is there" : "Customers get an error when they visit"}</div>
          </div>
          <div style={{marginTop:"20px",background:"#fef2f2",borderRadius:"8px",padding:"14px 16px"}}>
            <div style={{fontSize:"13px",color:"#dc2626",fontWeight:"600",marginBottom:"2px"}}>What customers experience now</div>
            <div style={{fontSize:"12px",color:"#999"}}>Confusion, dead links, no way to reach you</div>
          </div>
        </div>
        <div style={{background:"#fff",padding:"40px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <span style={{background:"#f0fdf4",color:"#16a34a",padding:"5px 18px",borderRadius:"50px",fontSize:"12px",fontWeight:"700",letterSpacing:"1px"}}>AFTER</span>
          </div>
          <div style={{background:"#f9f9f9",borderRadius:"12px",overflow:"hidden",border:"1px solid #ebebeb"}}>
            <div style={{background:"#111",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontWeight:"700",fontSize:"13px",color:"#fff"}}>{lead.business_name}</div>
              <div style={{display:"flex",gap:"14px",fontSize:"11px",color:"#666"}}><span>Services</span><span>Reviews</span><span>Contact</span></div>
            </div>
            <div style={{padding:"28px",textAlign:"center",background:"linear-gradient(135deg,#f9f9f9,#f0fdf4)"}}>
              <div style={{fontSize:"22px",fontWeight:"900",color:"#111",letterSpacing:"-0.5px"}}>{lead.business_name}</div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#fff",borderRadius:"50px",padding:"4px 12px",marginTop:"10px",fontSize:"12px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}>
                <span style={{color:"#f59e0b"}}>★</span><span style={{fontWeight:"700"}}>{lead.star_rating}</span><span style={{color:"#aaa"}}>({lead.review_count} reviews)</span>
              </div>
            </div>
            {positiveReviews.slice(0,2).map((review,i) => (
              <div key={i} style={{padding:"14px 18px",borderTop:"1px solid #f0f0f0"}}>
                <div style={{color:"#f59e0b",fontSize:"11px",marginBottom:"4px"}}>★★★★★</div>
                <p style={{fontSize:"12px",color:"#555",lineHeight:"1.55",margin:"0 0 4px",fontStyle:"italic"}}>"{review.text.substring(0,100)}..."</p>
                <p style={{fontSize:"11px",color:"#bbb",margin:"0"}}>- {review.author}</p>
              </div>
            ))}
          </div>
          <div style={{marginTop:"20px",background:"#f0fdf4",borderRadius:"8px",padding:"14px 16px"}}>
            <div style={{fontSize:"13px",color:"#16a34a",fontWeight:"600",marginBottom:"2px"}}>What customers experience after</div>
            <div style={{fontSize:"12px",color:"#777"}}>Professional, credible, easy to contact</div>
          </div>
          <div style={{textAlign:"center",marginTop:"20px"}}>
            <a href={"https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x"} style={{display:"inline-block",background:"#111",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"14px",fontWeight:"700",textDecoration:"none"}}>{ctaText}</a>
            <p style={{fontSize:"12px",color:"#bbb",marginTop:"8px"}}>No commitment. Just a conversation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const slug = params.slug;
  const mockLeads = {
    "leapfrog-landscaping": {
      business_name: "Leapfrog Landscaping",
      city: "Toronto",
      situation_tag: "no_website", phone: "(416) 555-0192",
      star_rating: 4.8,
      review_count: 16,
      website_url: null,
      top_reviews: JSON.stringify([
        { author: "John S", rating: 5, text: "Amazing service, showed up on time and did a fantastic job on our backyard. Will definitely hire again." },
        { author: "Sarah M", rating: 5, text: "Best landscaper in the area. Very professional and fair pricing. Our lawn has never looked better." },
        { author: "Mike T", rating: 4, text: "Great work on our front lawn. The team was friendly and efficient. Highly recommend." }
      ])
    },
    "edmunds-landscaping": {
      business_name: "Edmunds Landscaping",
      city: "Toronto",
      situation_tag: "dead_website", phone: "(416) 555-0847",
      star_rating: 4.1,
      review_count: 14,
      website_url: "https://www.edmundslandscaping.ca",
      top_reviews: JSON.stringify([
        { author: "Lisa K", rating: 5, text: "Edmunds transformed our garden completely. The attention to detail was incredible and the team was so professional." },
        { author: "David R", rating: 4, text: "Reliable and hardworking team. Good communication throughout the whole project. Would hire again." }
      ])
    }
  };
  const lead = mockLeads[slug] || null;
  return { props: { lead } };
}

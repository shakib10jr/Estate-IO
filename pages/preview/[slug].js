import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

// ─── Page tracking (unchanged) ───────────────────────────────────────────────
function usePageTracking(lead, isComparison, urlSlug) {
  const startTime = useRef(Date.now());
  const hotFired = useRef(false);
  const viewLogged = useRef(false);

  useEffect(() => {
    if (!lead || viewLogged.current) return;
    viewLogged.current = true;
    const slug = urlSlug || lead.slug || lead.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

    const visitTimer = setTimeout(async () => {
      try {
        await fetch('/api/visit-alert', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: lead.business_name, slug })
        });
      } catch(e) {}
    }, 3000);

    const hotTimer = setTimeout(async () => {
      if (hotFired.current) return;
      hotFired.current = true;
      try {
        await fetch('/api/hot-lead', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: lead.business_name, slug, time_spent: 35 })
        });
      } catch(e) {}
    }, 35000);

    function handleUnload() {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      navigator.sendBeacon('/api/page-time', JSON.stringify({
        slug, business_name: lead.business_name,
        time_spent: timeSpent, comparison_view: isComparison, device_type: device
      }));
    }

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearTimeout(visitTimer);
      clearTimeout(hotTimer);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [lead, isComparison, urlSlug]);
}

// ─── Niche detection ──────────────────────────────────────────────────────────
function getNiche(lead) {
  const n = (lead.niche || '').toLowerCase();
  if (n.includes('landscap') || n.includes('lawn') || n.includes('garden')) return 'landscaping';
  if (n.includes('electric')) return 'electrician';
  if (n.includes('roof')) return 'roofing';
  if (n.includes('plumb')) return 'plumbing';
  if (n.includes('hvac') || n.includes('heating') || n.includes('cooling')) return 'hvac';
  return 'default';
}

// ─── Niche config — colours, fonts, urgency copy ─────────────────────────────
const NICHE_CONFIG = {
  electrician: {
    bg: '#09090f',
    bgSecondary: '#0e0e18',
    accent: '#e8c547',
    accentText: '#09090f',
    textPrimary: '#f5f5f5',
    textMuted: 'rgba(245,245,245,0.45)',
    border: 'rgba(255,255,255,0.07)',
    reviewBg: 'rgba(255,255,255,0.04)',
    displayFont: "'Bebas Neue', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: 'Bebas+Neue&family=DM+Sans:wght@300;400;500;600',
    badge: '24/7 EMERGENCY LINE',
    urgency: 'Same-week availability — limited openings',
    ctaLabel: 'Get a Free Quote',
    trustItems: ['Licensed & Insured', 'Free Estimates', 'Same-Day Service'],
  },
  landscaping: {
    bg: '#111a0b',
    bgSecondary: '#161f0e',
    accent: '#7ab648',
    accentText: '#ffffff',
    textPrimary: '#eef4e4',
    textMuted: 'rgba(238,244,228,0.45)',
    border: 'rgba(122,182,72,0.1)',
    reviewBg: 'rgba(122,182,72,0.04)',
    displayFont: "'Playfair Display', serif",
    bodyFont: "'Outfit', sans-serif",
    googleFonts: 'Playfair+Display:wght@400;700&family=Outfit:wght@300;400;500;600',
    badge: 'NOW BOOKING',
    urgency: 'Booking projects now — spots fill fast',
    ctaLabel: 'Request a Quote',
    trustItems: ['Licensed & Insured', 'Free Consultations', 'Local & Trusted'],
  },
  roofing: {
    bg: '#100d09',
    bgSecondary: '#18140e',
    accent: '#d4721a',
    accentText: '#ffffff',
    textPrimary: '#f5f0e8',
    textMuted: 'rgba(245,240,232,0.45)',
    border: 'rgba(212,114,26,0.12)',
    reviewBg: 'rgba(212,114,26,0.04)',
    displayFont: "'Bebas Neue', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: 'Bebas+Neue&family=DM+Sans:wght@300;400;500;600',
    badge: 'FREE INSPECTIONS',
    urgency: 'Free inspections available — book before the rush',
    ctaLabel: 'Get a Free Estimate',
    trustItems: ['Licensed & Insured', 'Free Inspections', 'Warranty Included'],
  },
  default: {
    bg: '#09090f',
    bgSecondary: '#0e0e18',
    accent: '#e8c547',
    accentText: '#09090f',
    textPrimary: '#f5f5f5',
    textMuted: 'rgba(245,245,245,0.45)',
    border: 'rgba(255,255,255,0.07)',
    reviewBg: 'rgba(255,255,255,0.04)',
    displayFont: "'Bebas Neue', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    googleFonts: 'Bebas+Neue&family=DM+Sans:wght@300;400;500;600',
    badge: 'TRUSTED LOCAL BUSINESS',
    urgency: 'Limited availability — book now',
    ctaLabel: 'Get a Free Quote',
    trustItems: ['Licensed & Insured', 'Free Estimates', 'Local & Trusted'],
  }
};

// ─── Headline map ─────────────────────────────────────────────────────────────
const HEADLINES = {
  no_website: "Your reputation is real. Your customers deserve somewhere to send their friends.",
  facebook_only: "Your followers are loyal. They deserve a real destination.",
  dead_website: "Your reputation is very much alive. Your website just needs to catch up.",
  coming_soon: "You have been getting ready long enough. Here is what it looks like.",
  bad_website: "Your work speaks for itself. Your website should too.",
};

// ─── CTA url ──────────────────────────────────────────────────────────────────
const CTA_URL = "https://api.leadconnectorhq.com/widget/booking/Ky0LANieHvhRSBg3v24x";

// ─── Main page component ──────────────────────────────────────────────────────
export default function PreviewPage({ lead }) {
  const router = useRouter();
  const { compare } = router.query;
  const urlSlug = router.query.slug;
  const showComparison = compare === "true";
  const niche = getNiche(lead || {});
  const config = NICHE_CONFIG[niche] || NICHE_CONFIG.default;

  usePageTracking(lead, showComparison, urlSlug);

  if (!lead) return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif", color: "#666" }}>
      This preview page is not available.
    </div>
  );

  const reviews = lead.top_reviews ? JSON.parse(lead.top_reviews) : [];
  const positiveReviews = reviews.filter(r => r.rating >= 4);
  const headline = HEADLINES[lead.situation_tag] || HEADLINES.no_website;
  const city = lead.city || '';

  if (showComparison) {
    return <ComparisonView lead={lead} headline={headline} positiveReviews={positiveReviews} config={config} city={city} />;
  }
  return <StandardView lead={lead} headline={headline} positiveReviews={positiveReviews} config={config} city={city} />;
}

// ─── Shared Nav ───────────────────────────────────────────────────────────────
function Nav({ lead, config }) {
  const s = {
    nav: {
      background: config.bg,
      borderBottom: `0.5px solid ${config.border}`,
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontFamily: config.displayFont,
      fontSize: '18px',
      color: config.textPrimary,
      letterSpacing: '1px',
      maxWidth: '280px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    phone: {
      fontSize: '12px',
      color: config.textMuted,
      fontFamily: config.bodyFont,
      textDecoration: 'none',
    },
    cta: {
      background: config.accent,
      color: config.accentText,
      fontFamily: config.bodyFont,
      fontSize: '12px',
      fontWeight: '600',
      padding: '8px 18px',
      borderRadius: '3px',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    }
  };
  return (
    <nav style={s.nav}>
      <div style={s.logo}>{lead.business_name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {lead.phone && <a href={`tel:${lead.phone}`} style={s.phone}>{lead.phone}</a>}
        <a href={CTA_URL} style={s.cta}>{lead.niche?.toLowerCase().includes('landscap') ? 'REQUEST QUOTE' : 'GET A QUOTE'}</a>
      </div>
    </nav>
  );
}

// ─── Shared Review Cards ──────────────────────────────────────────────────────
function ReviewCards({ reviews, config }) {
  if (!reviews.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
      {reviews.slice(0, 3).map((review, i) => (
        <div key={i} style={{
          background: config.reviewBg,
          border: `0.5px solid ${config.border}`,
          borderLeft: `2px solid ${config.accent}`,
          borderRadius: '6px',
          padding: '16px',
        }}>
          <div style={{ color: config.accent, fontSize: '11px', marginBottom: '8px' }}>★★★★★</div>
          <p style={{
            fontFamily: config.bodyFont,
            fontSize: '12px',
            color: config.textMuted,
            lineHeight: '1.65',
            margin: '0 0 10px',
            fontStyle: 'italic',
            fontWeight: '300',
          }}>
            "{review.text.substring(0, 140)}..."
          </p>
          <div style={{ fontFamily: config.bodyFont, fontSize: '11px', color: config.textMuted, opacity: 0.6 }}>
            — {review.author}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Standard View ────────────────────────────────────────────────────────────
function StandardView({ lead, headline, positiveReviews, config, city }) {
  const heroHeadline = city
    ? `${city}'s Trusted ${lead.niche || 'Business'}`
    : lead.business_name;

  return (
    <div style={{ fontFamily: config.bodyFont, background: config.bg, minHeight: '100vh', color: config.textPrimary }}>
      <Head>
        <title>{lead.business_name}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href={`https://fonts.googleapis.com/css2?family=${config.googleFonts}&display=swap`} rel="stylesheet" />
      </Head>

      <Nav lead={lead} config={config} />

      {/* Hero */}
      <div style={{ padding: '56px 32px 48px', maxWidth: '860px', margin: '0 auto' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: `${config.accent}18`, border: `0.5px solid ${config.accent}44`,
          borderRadius: '20px', padding: '5px 14px', marginBottom: '24px',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.accent }} />
          <span style={{ fontFamily: config.bodyFont, fontSize: '10px', color: config.accent, fontWeight: '600', letterSpacing: '1px' }}>
            {config.badge}
          </span>
        </div>

        {/* City headline */}
        <h1 style={{
          fontFamily: config.displayFont,
          fontSize: 'clamp(42px, 7vw, 72px)',
          lineHeight: '0.95',
          color: config.textPrimary,
          marginBottom: '8px',
          letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
          fontWeight: config.displayFont.includes('Playfair') ? '700' : '400',
        }}>
          {city ? (
            <>
              {city}&apos;s<br />
              <span style={{ color: config.accent }}>Trusted</span><br />
              {lead.niche || 'Business'}
            </>
          ) : (
            lead.business_name
          )}
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: config.bodyFont,
          fontSize: '14px',
          color: config.textMuted,
          maxWidth: '440px',
          lineHeight: '1.7',
          margin: '20px 0 28px',
          fontWeight: '300',
        }}>
          {headline}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          <a href={CTA_URL} style={{
            background: config.accent, color: config.accentText,
            fontFamily: config.bodyFont, fontSize: '13px', fontWeight: '600',
            padding: '13px 24px', borderRadius: '3px', textDecoration: 'none',
          }}>
            {config.ctaLabel}
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{
              background: 'transparent', color: config.textPrimary,
              fontFamily: config.bodyFont, fontSize: '13px', fontWeight: '400',
              padding: '13px 24px', borderRadius: '3px', textDecoration: 'none',
              border: `0.5px solid ${config.border}`,
            }}>
              Call Now
            </a>
          )}
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          {config.trustItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: config.bodyFont, fontSize: '11px', color: config.textMuted, fontWeight: '300',
            }}>
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', background: config.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', color: config.accentText, flexShrink: 0, fontWeight: '700',
              }}>✓</div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        background: config.bgSecondary,
        borderTop: `0.5px solid ${config.border}`,
        borderBottom: `0.5px solid ${config.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
      }}>
        {[
          { num: lead.star_rating || '5.0', label: 'Star Rating' },
          { num: lead.review_count || '—', label: 'Google Reviews' },
          { num: city || 'Local', label: 'Serving' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '24px 20px', textAlign: 'center',
            borderRight: i < 2 ? `0.5px solid ${config.border}` : 'none',
          }}>
            <div style={{
              fontFamily: config.displayFont,
              fontSize: '36px',
              color: config.accent,
              letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
              lineHeight: '1',
            }}>
              {stat.num}
            </div>
            <div style={{
              fontFamily: config.bodyFont, fontSize: '10px',
              color: config.textMuted, textTransform: 'uppercase',
              letterSpacing: '1px', marginTop: '4px', fontWeight: '300',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      {positiveReviews.length > 0 && (
        <div style={{ padding: '40px 32px', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{
            fontFamily: config.displayFont,
            fontSize: config.displayFont.includes('Bebas') ? '22px' : '20px',
            color: config.textPrimary,
            letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
            marginBottom: '20px',
          }}>
            {config.displayFont.includes('Playfair') ? 'What clients say' : 'WHAT CUSTOMERS SAY'}
          </div>
          <ReviewCards reviews={positiveReviews} config={config} />
        </div>
      )}

      {/* Bottom CTA banner */}
      <div style={{
        background: config.accent,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: config.displayFont,
            fontSize: config.displayFont.includes('Bebas') ? '22px' : '20px',
            color: config.accentText,
            letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
            fontWeight: config.displayFont.includes('Playfair') ? '700' : '400',
          }}>
            This site is ready to launch
          </div>
          <div style={{
            fontFamily: config.bodyFont, fontSize: '12px',
            color: `${config.accentText}88`, marginTop: '3px', fontWeight: '300',
          }}>
            {config.urgency}
          </div>
        </div>
        <a href={CTA_URL} style={{
          background: config.bg, color: config.accent,
          fontFamily: config.bodyFont, fontSize: '13px', fontWeight: '600',
          padding: '13px 28px', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Book a 15 Min Call
        </a>
      </div>
    </div>
  );
}

// ─── Comparison View ──────────────────────────────────────────────────────────
function ComparisonView({ lead, headline, positiveReviews, config, city }) {
  return (
    <div style={{ fontFamily: config.bodyFont, background: config.bg, minHeight: '100vh', color: config.textPrimary }}>
      <Head>
        <title>{lead.business_name} — Your New Site Preview</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href={`https://fonts.googleapis.com/css2?family=${config.googleFonts}&display=swap`} rel="stylesheet" />
      </Head>

      <Nav lead={lead} config={config} />

      <div style={{ padding: '56px 32px 48px', maxWidth: '860px', margin: '0 auto' }}>

        {/* Star badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: `${config.accent}18`, border: `0.5px solid ${config.accent}44`,
          borderRadius: '20px', padding: '5px 14px', marginBottom: '24px',
        }}>
          <span style={{ color: config.accent, fontSize: '12px' }}>★</span>
          <span style={{ fontFamily: config.bodyFont, fontWeight: '700', color: config.textPrimary, fontSize: '13px' }}>
            {lead.star_rating}
          </span>
          <span style={{ color: config.textMuted, fontSize: '12px' }}>·</span>
          <span style={{ fontFamily: config.bodyFont, fontSize: '12px', color: config.textMuted }}>
            {lead.review_count} verified Google reviews
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: config.displayFont,
          fontSize: 'clamp(36px, 6vw, 64px)',
          lineHeight: '0.95',
          color: config.textPrimary,
          marginBottom: '16px',
          letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
          fontWeight: config.displayFont.includes('Playfair') ? '700' : '400',
        }}>
          {lead.business_name}
        </h1>

        <p style={{
          fontFamily: config.bodyFont, fontSize: '14px',
          color: config.textMuted, maxWidth: '500px',
          lineHeight: '1.7', marginBottom: '36px', fontWeight: '300',
        }}>
          {headline}
        </p>

        {/* Before / After comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '36px' }}>
          {/* Before */}
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '0.5px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '24px',
          }}>
            <div style={{
              fontFamily: config.bodyFont, fontSize: '10px', fontWeight: '700',
              letterSpacing: '2px', color: '#ef4444', marginBottom: '16px',
            }}>
              RIGHT NOW
            </div>
            {[
              'Broken or missing website',
              'No way to book online',
              'Reviews buried on Google',
              'Losing jobs to competitors',
            ].map((item, i) => (
              <div key={i} style={{
                fontFamily: config.bodyFont, fontSize: '13px',
                color: config.textMuted, marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '300',
              }}>
                <span style={{ color: '#ef4444', fontSize: '14px' }}>✗</span> {item}
              </div>
            ))}
          </div>

          {/* After */}
          <div style={{
            background: `${config.accent}0a`,
            border: `2px solid ${config.accent}`,
            borderRadius: '8px', padding: '24px',
          }}>
            <div style={{
              fontFamily: config.bodyFont, fontSize: '10px', fontWeight: '700',
              letterSpacing: '2px', color: config.accent, marginBottom: '16px',
            }}>
              WITH YOUR NEW SITE
            </div>
            {[
              'Professional online presence',
              'One-click booking form',
              'Reviews front and center',
              'New customers find you first',
            ].map((item, i) => (
              <div key={i} style={{
                fontFamily: config.bodyFont, fontSize: '13px',
                color: config.textPrimary, marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '400',
              }}>
                <span style={{ color: config.accent, fontSize: '14px' }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <a href={CTA_URL} style={{
            background: config.accent, color: config.accentText,
            fontFamily: config.bodyFont, fontSize: '15px', fontWeight: '700',
            padding: '15px 36px', borderRadius: '3px', textDecoration: 'none', display: 'inline-block',
          }}>
            Claim This Site
          </a>
          <p style={{ fontFamily: config.bodyFont, fontSize: '12px', color: config.textMuted, marginTop: '10px', fontWeight: '300' }}>
            No commitment required
          </p>
        </div>

        {/* Stats */}
        <div style={{
          background: config.bgSecondary,
          border: `0.5px solid ${config.border}`,
          borderRadius: '8px', padding: '28px 32px',
          display: 'flex', alignItems: 'center', gap: '40px',
          marginBottom: '32px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: config.displayFont, fontSize: '48px', color: config.accent, lineHeight: '1' }}>
              {lead.star_rating}
            </div>
            <div style={{ fontFamily: config.bodyFont, fontSize: '11px', color: config.textMuted, marginTop: '4px', fontWeight: '300' }}>
              Star rating
            </div>
          </div>
          <div style={{ width: '0.5px', height: '48px', background: config.border }} />
          <div>
            <div style={{ fontFamily: config.displayFont, fontSize: '48px', color: config.accent, lineHeight: '1' }}>
              {lead.review_count}
            </div>
            <div style={{ fontFamily: config.bodyFont, fontSize: '11px', color: config.textMuted, marginTop: '4px', fontWeight: '300' }}>
              Google reviews
            </div>
          </div>
          {city && (
            <>
              <div style={{ width: '0.5px', height: '48px', background: config.border }} />
              <div>
                <div style={{ fontFamily: config.displayFont, fontSize: '36px', color: config.accent, lineHeight: '1' }}>
                  {city}
                </div>
                <div style={{ fontFamily: config.bodyFont, fontSize: '11px', color: config.textMuted, marginTop: '4px', fontWeight: '300' }}>
                  Service area
                </div>
              </div>
            </>
          )}
        </div>

        {/* Reviews */}
        {positiveReviews.length > 0 && (
          <div>
            <div style={{
              fontFamily: config.displayFont,
              fontSize: config.displayFont.includes('Bebas') ? '20px' : '18px',
              color: config.textPrimary, marginBottom: '16px',
              letterSpacing: config.displayFont.includes('Bebas') ? '1px' : '0',
            }}>
              {config.displayFont.includes('Playfair') ? 'What clients say' : 'WHAT YOUR CUSTOMERS SAY'}
            </div>
            <ReviewCards reviews={positiveReviews} config={config} />
          </div>
        )}
      </div>

      {/* Bottom banner */}
      <div style={{
        background: config.accent, padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '24px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontFamily: config.displayFont,
            fontSize: config.displayFont.includes('Bebas') ? '22px' : '20px',
            color: config.accentText,
            fontWeight: config.displayFont.includes('Playfair') ? '700' : '400',
          }}>
            This site is ready to launch
          </div>
          <div style={{ fontFamily: config.bodyFont, fontSize: '12px', color: `${config.accentText}88`, marginTop: '3px', fontWeight: '300' }}>
            {config.urgency}
          </div>
        </div>
        <a href={CTA_URL} style={{
          background: config.bg, color: config.accent,
          fontFamily: config.bodyFont, fontSize: '13px', fontWeight: '600',
          padding: '13px 28px', borderRadius: '3px', textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Book a 15 Min Call
        </a>
      </div>
    </div>
  );
}

// ─── Server-side data fetch (unchanged) ──────────────────────────────────────
export async function getServerSideProps({ params }) {
  const slug = params.slug;
  try {
    const res = await fetch(
      process.env.SUPABASE_URL + '/rest/v1/Leads?slug=eq.' + encodeURIComponent(slug) + '&select=*',
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
        }
      }
    );
    const data = await res.json();
    if (data && data.length > 0) return { props: { lead: data[0] } };
  } catch(e) {
    console.log('Supabase fetch error:', e.message);
  }
  return { props: { lead: null } };
}

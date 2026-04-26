// ── generateZipBuilders.js ────────────────────────────────────────────────────
// Bonus file builders: LAUNCH_PLAN, READINESS, UPSELL, NEXT_PRODUCTS
// Imported by generateZip via base44.functions.invoke is NOT used here —
// these are pure functions exported for direct use inside generateZip.
// This file is intentionally kept separate to stay under the 2000-line limit.

export const hr = (c='─',n=60) => c.repeat(n);

const BANNED = [
  'content pending','todo','coming soon','day ?','empty hook','[bonus feature]',
  '[companion ','placeholder','undefined','null','nan','\bnull\b',
];
export function hasBannedContent(text) {
  const lower = text.toLowerCase();
  return BANNED.some(b => lower.includes(b));
}

export function isTemplatePack(n) {
  const t = (n.type || '').toLowerCase();
  return t.includes('template') || t.includes('template pack') || t === 'templates';
}

export function socialCtx(n) {
  const audience = n.audience || `independent ${n.niche} professionals`;
  const promise = n.promise || `transform your ${n.niche} brand from amateur to premium`;
  const pain = n.pa?.painPoint || `losing clients to competitors with more polished ${n.niche} materials`;
  const transformation = n.pa?.transformation || `go from looking like everyone else to commanding premium fees in ${n.niche}`;
  const hook = n.pa?.emotionalHook || `confidence and authority in every client-facing moment`;
  const mechanism = n.pa?.uniqueMechanism || `professionally designed ${n.niche} templates you can customize in minutes`;
  const angle = n.pa?.finalAngle || n.title;
  const kw = n.keywords.length > 0 ? n.keywords : [n.niche.replace(/\s+/g,''), n.type.replace(/\s+/g,''), 'digitalproduct', 'templates'];
  const audShort = audience.split(' ').slice(0,4).join(' ');
  const isLuxury = /luxury|premium|high.end|bespoke|editorial/i.test(n.niche + n.title);
  const isRealEstate = /real.estate|realt|property|listing|agent/i.test(n.niche + n.title);
  const isFitness = /fitness|gym|workout|training|coach/i.test(n.niche);
  const isCoach = /coach|consult|mentor|advisor/i.test(n.niche);
  const isMarketing = /market|brand|social|content|copy/i.test(n.niche);
  let clientWord = 'clients', competitorPhrase = 'bigger firms', materialWord = 'materials', resultVerb = 'close';
  if (isRealEstate) { clientWord = 'sellers'; competitorPhrase = 'big-team agencies'; materialWord = 'listing presentations'; resultVerb = 'win listings'; }
  if (isFitness) { clientWord = 'clients'; competitorPhrase = 'big gyms'; materialWord = 'client programs'; resultVerb = 'sign clients'; }
  if (isCoach) { clientWord = 'clients'; competitorPhrase = 'established coaches'; materialWord = 'proposals and decks'; resultVerb = 'close discovery calls'; }
  if (isMarketing) { clientWord = 'clients'; competitorPhrase = 'big agencies'; materialWord = 'campaign assets'; resultVerb = 'win retainers'; }
  return { audience, audShort, promise, pain, transformation, hook, mechanism, angle, kw, clientWord, competitorPhrase, materialWord, resultVerb, isLuxury, isRealEstate };
}

export const LAUNCH_PLAN = (p, n) => {
  const c = socialCtx(n);
  const mat = c.materialWord;
  return `7-DAY LAUNCH PLAN — ${n.title}
${'═'.repeat(60)}
Product: ${n.title}
Type: ${n.type} | Niche: ${n.niche} | Platform: ${n.platform}
Price: $${n.priceMin} (launch) → $${n.priceMax} (post-launch)
Generated: ${new Date().toLocaleDateString()}
${'═'.repeat(60)}

DAY 1 — LAUNCH
${'═'.repeat(60)}
OBJECTIVE: Go live and capture first-buyer momentum

TASKS:
□ Publish product on ${n.platform} — verify purchase link works end-to-end
□ Update bio link on all social platforms to the product URL
□ Send Email 1 (Announcement) to your full list

PLATFORM ACTION:
□ Instagram: Post Caption 4 (Launch Announcement) — static image with product cover
□ LinkedIn: Post 4 (Launch post) — announce availability to professional network
□ Stories: Share a "It's live" story with product link sticker

CONTENT TO PUBLISH:
→ File: Instagram_Captions.txt → Caption 4
→ File: LinkedIn_Posts.txt → Post 4
→ File: Email_1_Announcement.txt

CTA: "Download instantly at [LINK] — launch price is $${n.priceMin}, going up [DATE]"

SUCCESS METRIC: At least 3 sales by end of day. 50+ link clicks on Instagram bio.

${hr()}

DAY 2 — EDUCATION + REACH
${'═'.repeat(60)}
OBJECTIVE: Reach new audience through value-first content — no hard selling

TASKS:
□ Post a short-form video (30–45 seconds) on TikTok or Instagram Reels
□ Reply to every comment and DM from Day 1 within 2 hours
□ Share a behind-the-scenes story showing the product contents

PLATFORM ACTION:
□ TikTok / Reels: Video 1 (Before/After Reveal) — no selling, pure value
□ Instagram Stories: Open the ZIP and film a 15-second scroll of the templates

CONTENT TO PUBLISH:
→ File: TikTok_Reel_Ideas.txt → Video 1 (Before/After Reveal)

CTA: "Save this post — then grab the full pack at the link in bio"

SUCCESS METRIC: 500+ video views. At least 10 saves or shares.

${hr()}

DAY 3 — VALUE + EMAIL
${'═'.repeat(60)}
OBJECTIVE: Build trust and overcome "what is this exactly?" objections

TASKS:
□ Send Email 2 (Educational Value) to your list
□ Post a "What's Inside" carousel on Instagram and LinkedIn
□ Reply to all DMs asking about the product

PLATFORM ACTION:
□ Instagram: Carousel 2 (What's Inside) — show every template with preview screenshots
□ LinkedIn: Post 2 (Value — 3 things premium brands do differently)

CONTENT TO PUBLISH:
→ File: Email_2_Educational_Value.txt
→ File: Carousel_Post_Outlines.txt → Carousel 2 (What's Inside)
→ File: LinkedIn_Posts.txt → Post 2

CTA: "Last slide has the link. $${n.priceMin} for the full pack."

SUCCESS METRIC: 3% email click rate above baseline. 5+ carousel saves.

${hr()}

DAY 4 — AUTHORITY + PROFESSIONAL REACH
${'═'.repeat(60)}
OBJECTIVE: Build credibility with the professional community; reach the B2B segment

TASKS:
□ Post LinkedIn authority post — peer-to-peer tone, no hype
□ Post TikTok/Reels video (pain-point direct address)
□ Engage in 2–3 relevant ${n.niche} communities or groups

PLATFORM ACTION:
□ LinkedIn: Post 1 (Authority — visual brand problem in ${n.niche})
□ TikTok / Reels: Video 3 (Pain Point Direct Address)
□ Community: Share a relevant educational comment linking back to your content

CONTENT TO PUBLISH:
→ File: LinkedIn_Posts.txt → Post 1
→ File: TikTok_Reel_Ideas.txt → Video 3

CTA: "Link in comments" (LinkedIn) | "Comment TEMPLATES" (TikTok)

SUCCESS METRIC: 10+ LinkedIn post reactions. 1 new sale from LinkedIn traffic.

${hr()}

DAY 5 — STORY + SOCIAL PROOF
${'═'.repeat(60)}
OBJECTIVE: Create emotional connection and harvest social proof from early buyers

TASKS:
□ Send Email 3 (Problem Aware) to your list
□ Post a story-based feed caption (personal narrative)
□ Run an Instagram Stories poll to generate engagement
□ Message Day 1–3 buyers to ask for a quick testimonial

PLATFORM ACTION:
□ Instagram Feed: Caption 7 (Story — Why I Built This)
□ Instagram Stories: Poll — "Does your current ${mat} represent your brand at its best?" Yes / No
□ DM: "Thanks for purchasing — can I ask what made you decide to buy today?"

CONTENT TO PUBLISH:
→ File: Email_3_Problem_Aware.txt
→ File: Instagram_Captions.txt → Caption 7

CTA: "Full story in the caption. Grab the pack at the link in bio."

SUCCESS METRIC: 40%+ poll response rate. At least 1 usable buyer testimonial.

${hr()}

DAY 6 — OFFER + URGENCY
${'═'.repeat(60)}
OBJECTIVE: Convert fence-sitters with a clear deadline and complete offer breakdown

TASKS:
□ Send Email 4 (The Offer) — full breakdown of every template included
□ Post urgency-focused content on Instagram and LinkedIn
□ Announce publicly that the price goes up tomorrow

PLATFORM ACTION:
□ Instagram: Caption 9 (Urgency — Launch Price Ending)
□ LinkedIn: Post 5 (ROI of looking premium in ${n.niche})
□ Stories: "Price goes to $${n.priceMax} tomorrow at [TIME]" — countdown sticker

CONTENT TO PUBLISH:
→ File: Email_4_Offer.txt
→ File: Instagram_Captions.txt → Caption 9
→ File: LinkedIn_Posts.txt → Post 5

CTA: "$${n.priceMin} tonight. $${n.priceMax} from tomorrow. Link in bio."

SUCCESS METRIC: Highest single-day sales of the launch. 20%+ email click rate.

${hr()}

DAY 7 — FINAL PUSH + CLOSE
${'═'.repeat(60)}
OBJECTIVE: Capture last-minute buyers, raise price, and close the launch window

TASKS:
□ Send Email 5 (Last Call) — morning send, direct and brief
□ Post final urgency content across all platforms simultaneously
□ Raise price to $${n.priceMax} at [TIME] — do not delay
□ Send a thank-you message to every buyer from Days 1–6

PLATFORM ACTION:
□ Instagram: Caption 10 (Last Chance — midnight countdown)
□ TikTok / Reels: Video 7 (Launch Urgency — price increase today)
□ LinkedIn: Brief last-call post ("This is the last time I'll mention it")
□ Stories: Final countdown + "price goes up in X hours" update

CONTENT TO PUBLISH:
→ File: Email_5_Last_Call.txt
→ File: Instagram_Captions.txt → Caption 10
→ File: TikTok_Reel_Ideas.txt → Video 7

CTA: "Link in bio. Last chance at $${n.priceMin}. Going to $${n.priceMax} at [TIME]."

SUCCESS METRIC: 10+ total sales across the 7 days. Price successfully raised by end of day.

${'═'.repeat(60)}
POST-LAUNCH PRIORITIES (Week 2+)
${'═'.repeat(60)}
□ Collect and publish buyer testimonials
□ Set up an automated email welcome sequence for new buyers
□ Repurpose buyer results into social proof content
□ Plan your first bundle or upsell product
□ List on additional platforms if launched on only one

Generated by Launchora | ${new Date().toLocaleDateString()}`;
};

export const READINESS = (p, n) => {
  const sectionsWithContent = n.sections.filter(s => s.body && s.body.trim().length > 50);
  const sectionsTotal = n.sections.length;
  const sectionBodiesText = n.sections.map(s => s.body || '').join(' ');
  const hasPlaceholdersInSections = hasBannedContent(sectionBodiesText);
  const hasRealSections = sectionsWithContent.length >= 2;
  const hasSufficientSections = sectionsTotal >= 3;

  const isTP = isTemplatePack(n);
  const templateAssetCheck = !isTP || n.sections.length >= 3;

  const listingDesc = n.ma.listing_description || '';
  const listingTitle = n.ma.listing_title || n.title || '';
  const hasRealListingDesc = listingDesc.length > 120 && !hasBannedContent(listingDesc);
  const hasListingTitle = listingTitle.length > 10 && listingTitle !== 'Untitled Product';
  const hasRealKeywords = n.keywords.length >= 5 && n.keywords.every(k => k && k.length > 2);
  const hasSEOMeta = !!(n.ma.seo_meta_description && n.ma.seo_meta_description.length > 30);

  const igCaps = Array.isArray(p.social_media_kit?.instagram_captions) ? p.social_media_kit.instagram_captions : [];
  const hasRealSocialKit = igCaps.length >= 3 && igCaps.every(c => c && c.length > 40 && !hasBannedContent(c));
  const hasSocialCalendar = Array.isArray(p.social_media_kit?.content_calendar) && p.social_media_kit.content_calendar.length >= 3;
  const hasVideoScripts = Array.isArray(p.social_media_kit?.video_scripts) && p.social_media_kit.video_scripts.length >= 1;

  const hasEmailSourceData = !!(n.promise && n.audience && n.sections.length >= 1);
  const hasRealLaunchPlan = n.launchPlan && n.launchPlan.length > 300;

  const allText = [n.title, n.subtitle, n.promise, n.audience, listingDesc, listingTitle, sectionBodiesText, ...igCaps, n.launchPlan].join(' ');
  const hasGlobalPlaceholders = hasBannedContent(allText);
  const placeholderInstances = BANNED.filter(b => allText.toLowerCase().includes(b));

  const hasPlatformGuides = !!(p.platform_guides?.why_this_platform && p.platform_guides?.pricing_strategy);
  const hasNicheSpecificity = n.niche !== 'General' && n.audience && n.audience.length > 10;

  const isPricedCorrectly = n.priceMin > 0 && n.priceMax >= n.priceMin;
  const hasPriceRationale = !!(n.ma.price_rationale && n.ma.price_rationale.length > 10);

  const hasProductAngle = !!(n.pa.finalAngle || n.pa.painPoint);
  const hasSubtitle = !!(p.subtitle && p.subtitle.length > 10);
  const hasPromise = !!(p.promise && p.promise.length > 20);

  const checks = [
    { category: 'CONTENT',   l: 'Product title — specific, non-generic',                              ok: !!(p.title && p.title.length > 5 && p.title !== 'Untitled Product'), fix: 'Set a descriptive product title in Studio → Content tab.' },
    { category: 'CONTENT',   l: 'Content sections generated (3+ minimum)',                             ok: hasSufficientSections, fix: `Only ${sectionsTotal} sections found. Use Studio → regenerate sections.` },
    { category: 'CONTENT',   l: 'Section bodies have real content (2+ sections, 50+ chars each)',      ok: hasRealSections, fix: `Only ${sectionsWithContent.length}/${sectionsTotal} sections have meaningful content. Retry section expansion.` },
    { category: 'CONTENT',   l: 'No banned placeholders in product content',                           ok: !hasPlaceholdersInSections, fix: 'Sections contain placeholder text. Review and replace in Studio.' },
    { category: 'TEMPLATES', l: isTP ? 'Template pack has sufficient assets (3+ templates)' : 'Template asset check (N/A)',  ok: templateAssetCheck, fix: 'Regenerate product sections — fewer than 3 template assets found.' },
    { category: 'SALES',     l: 'Listing title present and specific',                                  ok: hasListingTitle, fix: 'Retry Sales Copy generation in Studio.' },
    { category: 'SALES',     l: 'Listing description — 120+ chars, no placeholders',                  ok: hasRealListingDesc, fix: listingDesc.length < 120 ? 'Listing description too short — retry Sales Copy step.' : 'Contains placeholder text — retry Sales Copy.' },
    { category: 'SALES',     l: 'Keywords bank — 5+ meaningful phrases',                              ok: hasRealKeywords, fix: 'Need 5+ buyer-intent keywords. Retry Sales Copy generation.' },
    { category: 'SALES',     l: 'SEO meta description present',                                        ok: hasSEOMeta, fix: 'SEO meta description missing — retry Sales Copy step.' },
    { category: 'SOCIAL',    l: 'Instagram captions — 3+ real captions (no placeholders)',             ok: hasRealSocialKit, fix: igCaps.length < 3 ? 'Too few captions. Retry Social Kit step.' : 'Captions contain placeholder text — retry Social Kit.' },
    { category: 'SOCIAL',    l: 'Content calendar — 3+ scheduled posts',                               ok: hasSocialCalendar, fix: 'Content calendar incomplete. Retry Social Kit step.' },
    { category: 'SOCIAL',    l: 'Video scripts — at least 1 script present',                           ok: hasVideoScripts, fix: 'No video scripts generated. Retry Social Kit step.' },
    { category: 'EMAILS',    l: 'Email source data complete (promise + audience + sections)',           ok: hasEmailSourceData, fix: 'Product is missing promise, audience, or sections — complete generation first.' },
    { category: 'LAUNCH',    l: 'Launch plan generated (300+ chars)',                                  ok: hasRealLaunchPlan, fix: 'Launch plan too short. Retry Launch Plan step.' },
    { category: 'QUALITY',   l: 'No global placeholder text across all fields',                        ok: !hasGlobalPlaceholders, fix: `Placeholder found: "${placeholderInstances.slice(0,3).join('", "')}" — regenerate affected sections.` },
    { category: 'PLATFORM',  l: 'Platform guides generated (why + pricing strategy)',                  ok: hasPlatformGuides, fix: 'Platform guides incomplete. Retry Platform Guides step.' },
    { category: 'PLATFORM',  l: 'Target audience is niche-specific',                                   ok: hasNicheSpecificity, fix: 'Set a specific audience in Studio — not just a category name.' },
    { category: 'PRICING',   l: 'Price range is valid (min > 0, max ≥ min)',                           ok: isPricedCorrectly, fix: `Price error — min: $${n.priceMin}, max: $${n.priceMax}. Fix in Studio → Metadata.` },
    { category: 'PRICING',   l: 'Price rationale documented',                                          ok: hasPriceRationale, fix: 'Price rationale missing. Retry Sales Copy.' },
    { category: 'EXPORT',    l: 'Product angle / positioning defined',                                 ok: hasProductAngle, fix: 'Product angle missing. Re-run generation from the Create page.' },
    { category: 'EXPORT',    l: 'Subtitle / tagline present',                                          ok: hasSubtitle, fix: 'Add a subtitle in Studio → Content tab.' },
    { category: 'EXPORT',    l: 'Product promise defined (20+ chars)',                                 ok: hasPromise, fix: 'Define the product promise in Studio → Metadata.' },
  ];

  const passed = checks.filter(c => c.ok);
  const failed = checks.filter(c => !c.ok);
  const score = passed.length;
  const total = checks.length;
  const pct = Math.round((score / total) * 100);

  const failedByCategory = {};
  for (const f of failed) {
    if (!failedByCategory[f.category]) failedByCategory[f.category] = [];
    failedByCategory[f.category].push(f);
  }

  const failedBlock = failed.length > 0
    ? `\nFAILED CHECKS — ACTION REQUIRED\n${hr()}\n` +
      Object.entries(failedByCategory).map(([cat, items]) =>
        `[${cat}]\n` + items.map((c, i) => `  ${i+1}. ❌ ${c.l}\n     → Fix: ${c.fix}`).join('\n')
      ).join('\n\n') + '\n'
    : '\n✅ All checks passed — no issues detected.\n';

  const categories = [...new Set(checks.map(c => c.category))];
  const allChecksBlock = categories.map(cat => {
    const catChecks = checks.filter(c => c.category === cat);
    const catPassed = catChecks.filter(c => c.ok).length;
    return `[${cat}] ${catPassed}/${catChecks.length} passed\n` + catChecks.map(c => (c.ok ? '  ✅' : '  ❌') + ' ' + c.l).join('\n');
  }).join('\n\n');

  const bar = pct === 100 ? '████████████████████ 100%' : pct >= 85 ? `█████████████████░░░ ${pct}%` : pct >= 65 ? `█████████████░░░░░░░ ${pct}%` : `████████░░░░░░░░░░░░ ${pct}%`;

  const verdict = pct === 100
    ? `🚀 PERFECT — READY TO LAUNCH\nAll ${total} checks passed. Follow the 7-Day Launch Plan.`
    : pct >= 85
    ? `✅ READY TO LAUNCH (with minor gaps)\n${failed.length} non-critical item${failed.length > 1 ? 's' : ''} flagged. Safe to launch — fix these after launch.`
    : pct >= 65
    ? `⚠️ ALMOST READY — ${total - score} items remaining\nAddress the failed checks above before launching.`
    : `🛠 NOT READY — DO NOT LAUNCH YET\n${failed.length} critical items need attention. Complete in Launchora Studio before re-exporting.`;

  return `LAUNCH READINESS REPORT — ${n.title}
${'═'.repeat(60)}
Generated: ${new Date().toLocaleDateString()}
${'═'.repeat(60)}

OVERALL READINESS: ${pct}% (${score}/${total} checks passed)
${bar}

${'═'.repeat(60)}
CHECKS BY CATEGORY
${'═'.repeat(60)}
${allChecksBlock}
${failedBlock}
${'═'.repeat(60)}
PRODUCT SUMMARY
${hr()}
Title:    ${n.title}
Type:     ${n.type}
Niche:    ${n.niche}
Platform: ${n.platform}
Price:    $${n.priceMin} (launch) → $${n.priceMax} (post-launch)
Sections: ${sectionsTotal} total | ${sectionsWithContent.length} with substantial content
Keywords: ${n.keywords.length}
Has Product Angle: ${hasProductAngle ? 'Yes' : 'No'}
Placeholder Issues: ${hasGlobalPlaceholders ? 'Yes — ' + placeholderInstances.length + ' instance(s) found' : 'None detected'}

${'═'.repeat(60)}
VERDICT
${hr()}
${verdict}
`;
};

export const UPSELL = (p, n) => {
  const isRE = /real.estate|realt|property|listing|agent/i.test(n.niche + n.title);
  const basePrice = Math.max(n.priceMax, n.priceMin, 17);
  const upsellPrice = Math.max(basePrice + 20, Math.round(basePrice * 1.8));
  const bundlePrice = Math.round(basePrice * 1.5);
  const orderBumpPrice = Math.max(9, Math.round(basePrice * 0.3));
  const membershipPrice = Math.max(12, Math.round(basePrice * 0.4));

  let upsellProduct, upsellPitch, bundle1, bundle1Pitch, bundle2, bundle2Pitch, orderBump, orderBumpPitch, membership, membershipPitch;

  if (isRE) {
    upsellProduct = `Luxury Agent Brand System Vol. 2 — 10 Advanced Presentation Templates`;
    upsellPitch = `"Vol. 2 adds 10 bespoke templates for expired listing pitch decks, investor portfolio pages, luxury rental brochures, and a full open house signage suite."`;
    bundle1 = `Luxury Real Estate Copywriting Swipe File — 50 Proven Listing Description Formulas`;
    bundle1Pitch = `"Beautiful templates sell better with professional copy. Gives you 50 luxury listing descriptions ready to adapt for penthouses, estates, and high-rise condos."`;
    bundle2 = `Listing Appointment Conversion Toolkit — Seller Scripts, Pre-Listing Package, Objection Handlers`;
    bundle2Pitch = `"You walk in with great-looking materials. Now close. Includes verbal scripts and a full pre-listing package PDF to send before every appointment."`;
    orderBump = `Luxury Color & Font Pairing Guide — 5 Editorial Palettes for Real Estate`;
    orderBumpPitch = `"5 tested luxury color systems with exact hex codes, font pairings, and usage rules — upgrade your template colors immediately."`;
    membership = `Monthly Luxury Real Estate Design Drop — 2 New Templates Every Month`;
    membershipPitch = `"Every month: 2 fresh templates, 1 new copywriting formula, and a seasonal marketing calendar — your brand never gets stale."`;
  } else {
    upsellProduct = `${n.title} — Extended Pack (10 Additional Templates)`;
    upsellPitch = `"Adds 10 more templates for ${n.niche} professionals covering advanced use cases and seasonal campaigns."`;
    bundle1 = `${n.niche} Copywriting Swipe File — 40 Proven Copy Formulas`;
    bundle1Pitch = `"Great-looking templates perform better with great copy — 40 ready-to-adapt formulas for listings, emails, and social posts in ${n.niche}."`;
    bundle2 = `${n.niche} Client Conversion Toolkit — Scripts, Intake Forms, and Follow-Up Templates`;
    bundle2Pitch = `"From first contact to closed deal — scripts and documents to convert more leads into signed clients in ${n.niche}."`;
    orderBump = `${n.niche} Brand Style Guide — Color, Font, and Layout Rules (1-Page Reference)`;
    orderBumpPitch = `"Know exactly which colors, fonts, and spacing rules to apply to every template — no guessing."`;
    membership = `Monthly ${n.niche} Design & Copy Drop — 2 New Templates + 1 Swipe File`;
    membershipPitch = `"New ${n.niche}-specific templates and copy resources every month — stay current."`;
  }

  return `UPSELL & BUNDLE IDEAS — ${n.title}
${'═'.repeat(60)}
All prices are suggestions. Adjust based on your audience and platform.
${'═'.repeat(60)}

IMMEDIATE UPSELL — Show on Thank-You Page (1-click)
${hr()}
Product: ${upsellProduct}
Price: $${upsellPrice}
Pitch: ${upsellPitch}
Tip: Show on the thank-you/download page — not in a follow-up email. Strike while intent is highest.

${'─'.repeat(60)}

BUNDLE IDEAS
${hr()}
Bundle 1: "${n.title}" + "${bundle1}"
→ Bundle Price: $${bundlePrice} (saves ~25% vs buying separately)
→ Pitch: ${bundle1Pitch}
→ Best platform: Gumroad (Bundle product type) or Payhip (manual bundle)

Bundle 2: "${n.title}" + "${bundle2}"
→ Bundle Price: $${Math.round(bundlePrice * 1.3)}
→ Pitch: ${bundle2Pitch}
→ Best platform: Payhip or ThriveCart (one-click upsell flow)

${'─'.repeat(60)}

ORDER BUMP — Checkbox at Checkout
${hr()}
Product: ${orderBump}
Price: $${orderBumpPrice} (added to cart at checkout)
Pitch: ${orderBumpPitch}
Tip: Keep order bumps under $${Math.round(basePrice * 0.4)}. Must feel like an obvious add-on.

${'─'.repeat(60)}

SUBSCRIPTION / MEMBERSHIP
${hr()}
Product: ${membership}
Price: $${membershipPrice}/month
Pitch: ${membershipPitch}
Tip: Offer 1 free month to ${n.title} buyers to build the habit before the first charge.
Best platform: Payhip (membership) | Gumroad (subscription product)

${'─'.repeat(60)}

WHERE TO ADD UPSELLS
${hr()}
• Gumroad: Use "Recommended" products panel on product page
• Payhip: Configure thank-you page redirect with upsell URL
• ThriveCart / SamCart: Native one-click upsell post-checkout
• Email: Send upsell offer in a Day 3 follow-up (48hrs after purchase)

Generated by Launchora | ${new Date().toLocaleDateString()}`;
};

export const NEXT_PRODUCTS = (p, n) => {
  const base = Math.max(n.priceMax, n.priceMin, 17);

  // All ranges guaranteed low → high
  const t1a_lo = 9;
  const t1a_hi = Math.max(17, Math.round(base * 0.5));
  const t1b_lo = Math.max(17, Math.round(base * 0.5));
  const t1b_hi = Math.max(t1b_lo + 5, Math.round(base * 0.7));
  const t1c_lo = Math.max(t1b_hi, Math.round(base * 0.6));
  const t1c_hi = Math.max(t1c_lo + 5, Math.round(base * 0.9));
  const t2a_lo = Math.round(base * 1.2);
  const t2a_hi = Math.round(base * 1.8);
  const t2b_lo = Math.round(base * 1.5);
  const t2b_hi = Math.round(base * 2.2);
  const t3_lo = Math.round(base * 2.5);
  const t3_hi = Math.round(base * 4);

  const isRE = /real.estate|realt|property|listing|agent/i.test(n.niche + n.title);

  const idea1 = isRE
    ? `"Luxury Listing Description Swipe File — 30 Proven Formulas for High-End Properties"`
    : `"${n.niche} Quick-Start Checklist — Launch-Ready in 24 Hours"`;
  const idea2 = isRE
    ? `"Agent Brand Voice Guide — Tone, Language, and Copy Rules for Luxury Positioning"`
    : `"${n.keywords[0] || n.niche} Swipe File — 40 Ready-to-Use Copy Formulas"`;
  const idea3 = isRE
    ? `"Pre-Listing Seller Consultation Package — Scripts, Questions, and Leave-Behind PDF"`
    : `"${n.niche} 30-Day Action Journal"`;
  const idea4 = isRE
    ? `"${n.title} Vol. 2 — 10 Advanced Templates for Investor, Rental, and Off-Market Properties"`
    : `"Advanced ${n.title} — Extended Edition"`;
  const idea5 = isRE
    ? `"Luxury Agent Content System — 90 Days of Social Posts, Stories, and Email Scripts"`
    : `"${n.niche} Masterclass Workbook"`;
  const idea6 = isRE
    ? `"The Complete Luxury Listing System — Templates + Copy + Scripts + Conversion Toolkit"`
    : `"The Complete ${n.niche} System — Full Bundle"`;

  return `NEXT PRODUCT IDEAS — ${n.title}
${'═'.repeat(60)}
Build your product ecosystem after ${n.title}.
All price ranges go from low (launch) to high (mature positioning).
${'═'.repeat(60)}

TIER 1 — EASY WINS (1–3 days to create)
${hr()}
IDEA 1: ${idea1}
→ Format: PDF / Swipe File | Price: $${t1a_lo}–$${t1a_hi}
→ Why: Complements your templates. Buyers who want better copy for your layouts will buy this next.

IDEA 2: ${idea2}
→ Format: PDF Guide | Price: $${t1b_lo}–$${t1b_hi}
→ Why: Addresses the most common question from ${n.niche} buyers: "What do I actually write?"

IDEA 3: ${idea3}
→ Format: PDF Workbook | Price: $${t1c_lo}–$${t1c_hi}
→ Why: Gives buyers a system to use alongside your templates over time.

TIER 2 — MEDIUM EFFORT (1–2 weeks to create)
${hr()}
IDEA 4: ${idea4}
→ Format: Template Pack | Price: $${t2a_lo}–$${t2a_hi}
→ Why: Natural upgrade for buyers who loved the core pack and want more use cases covered.

IDEA 5: ${idea5}
→ Format: Digital System / Bundle | Price: $${t2b_lo}–$${t2b_hi}
→ Why: Positions you as the authority for the full ${n.niche} workflow — not just one tool.

TIER 3 — PREMIUM PRODUCT (2–4 weeks to create)
${hr()}
IDEA 6: ${idea6}
→ Format: Premium Bundle | Price: $${t3_lo}–$${t3_hi}
→ Why: Combines your best products into one definitive offer for serious buyers.

PRODUCT ROADMAP
${hr()}
Month 1: ${n.title} — launched ✅
Month 2: Idea 1 (fast add-on, immediate revenue)
Month 3: Bundle ${n.title} + Idea 1 for $${Math.round(base * 1.4)}
Month 4: Idea 4 (Vol. 2 / Advanced version)
Month 5: Idea 5 (authority positioning)
Month 6+: Idea 6 (full premium system — flagship offer)

Use Launchora to generate any of these next products instantly.
Generated by Launchora | ${new Date().toLocaleDateString()}`;
};
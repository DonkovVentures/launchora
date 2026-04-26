import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Lightweight ZIP builder (no compression, stored mode) ────────────────────
function buildZip(files) {
  const enc = new TextEncoder();
  const toBytes = (d) => typeof d === 'string' ? enc.encode(d) : new Uint8Array(d);

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();

  const crc32 = (data) => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  const u16 = (n) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
  const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
  const concat = (...arrays) => {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) { out.set(a, off); off += a.length; }
    return out;
  };

  const entries = [];
  let offset = 0;
  const now = new Date();
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);

  for (const { name, data } of files) {
    const nameBytes = enc.encode(name);
    const fileData = toBytes(data);
    const crc = crc32(fileData);
    const localHeader = concat(
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
      u16(20), u16(0), u16(0),
      u16(dosTime), u16(dosDate),
      u32(crc), u32(fileData.length), u32(fileData.length),
      u16(nameBytes.length), u16(0), nameBytes,
    );
    entries.push({ nameBytes, crc, size: fileData.length, offset, dosTime, dosDate, localHeader, fileData });
    offset += localHeader.length + fileData.length;
  }

  const cdParts = entries.map(e => concat(
    new Uint8Array([0x50, 0x4B, 0x01, 0x02]),
    u16(20), u16(20), u16(0), u16(0),
    u16(e.dosTime), u16(e.dosDate),
    u32(e.crc), u32(e.size), u32(e.size),
    u16(e.nameBytes.length), u16(0), u16(0), u16(0), u16(0),
    u32(0), u32(e.offset), e.nameBytes,
  ));

  const centralDir = concat(...cdParts);
  const eocd = concat(
    new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
    u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(centralDir.length), u32(offset), u16(0),
  );

  return concat(...entries.flatMap(e => [e.localHeader, e.fileData]), centralDir, eocd);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const hr = (char = '─', len = 60) => char.repeat(len);
const section = (title, body) => `${title}\n${hr()}\n${body}`;

// ── Content Generators ────────────────────────────────────────────────────────

function buildReadme(p, { title, subtitle, promise, priceMin, priceMax }) {
  return `╔══════════════════════════════════════════════════════════╗
║          LAUNCHORA DIGITAL PRODUCT LAUNCH KIT            ║
╚══════════════════════════════════════════════════════════╝

PRODUCT: ${title}
${subtitle ? `SUBTITLE: ${subtitle}` : ''}
${promise ? `PROMISE: ${promise}` : ''}

TYPE:      ${p.product_type || 'Digital Product'}
PLATFORM:  ${p.platform || 'Multi-Platform'}
NICHE:     ${p.niche || 'General'}
PRICE:     $${priceMin}–$${priceMax}

GENERATED: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
POWERED BY: Launchora (launchora.com)

${hr('═')}
WHAT'S INSIDE THIS ZIP
${hr('═')}

📁 01_Product/
   • Product.txt          — Full product metadata, positioning & buyer profile
   • Product_Content.html — Complete product content as a styled HTML page

📁 02_Sales_Page/
   • Gumroad_Listing.txt      — Optimised title + description for Gumroad
   • Etsy_Listing.txt         — Ready-to-paste Etsy listing copy
   • Payhip_Listing.txt       — Payhip product description
   • Shopify_Listing.txt      — Shopify store copy
   • Product_Description.txt  — Universal long-form product description
   • Pricing_Strategy.txt     — Recommended pricing rationale & strategy

📁 03_Social_Media/
   • Instagram_Captions.txt   — 5 caption variations with hooks
   • LinkedIn_Posts.txt       — 3 professional LinkedIn posts
   • TikTok_Video_Ideas.txt   — 5 short-form video concepts & scripts
   • Hashtags.txt             — Platform-specific hashtag sets

📁 04_Email_Launch/
   • Email_1_Announcement.txt     — Launch announcement email
   • Email_2_Educational_Value.txt — Value-based nurture email
   • Email_3_Final_Push.txt       — Urgency / closing email

📁 05_Launch_Plan/
   • 7_Day_Launch_Plan.txt        — Day-by-day launch roadmap
   • Launch_Checklist.txt         — Pre-launch checklist
   • Platform_Recommendation.txt  — Why this platform, tips & best practices

README.txt — You are here!

${hr()}
HOW TO USE
${hr()}

1. Start with 01_Product/ to review your product positioning.
2. Pick the right Sales Page copy from 02_Sales_Page/ for your platform.
3. Schedule your social posts using 03_Social_Media/.
4. Send the 04_Email_Launch/ sequence to your list on Days 1, 3, and 6.
5. Follow the 05_Launch_Plan/ day-by-day for a structured rollout.

Good luck with your launch! 🚀
`;
}

function buildProductTxt(p, { title, subtitle, promise, targetAudience, buyerProfile, problemSolved, priceMin, priceMax, keywords }) {
  const ma = p.marketing_assets || {};
  return `${section('PRODUCT OVERVIEW', '')}

TITLE:           ${title}
SUBTITLE:        ${subtitle || '—'}
PROMISE:         ${promise || '—'}
TYPE:            ${p.product_type || '—'}
PLATFORM:        ${p.platform || '—'}
NICHE:           ${p.niche || '—'}
TONE:            ${p.tone || '—'}
LANGUAGE:        ${p.language || 'English'}
PRICE RANGE:     $${priceMin} – $${priceMax}

${hr()}
TARGET AUDIENCE
${hr()}
${targetAudience || '—'}

${hr()}
BUYER PROFILE
${hr()}
${buyerProfile || '—'}

${hr()}
PROBLEM THIS SOLVES
${hr()}
${problemSolved || '—'}

${hr()}
TRANSFORMATION / OUTCOME PROMISED
${hr()}
${promise || '—'}

${hr()}
UNIQUE ANGLE
${hr()}
${p.product_angle || ma.platform_cta || '—'}

${hr()}
SEO KEYWORDS
${hr()}
${keywords.length ? keywords.join(', ') : '—'}

${hr()}
SEO META DESCRIPTION
${hr()}
${ma.seo_meta_description || '—'}

${hr()}
CALL TO ACTION
${hr()}
${ma.cta || ma.platform_cta || '—'}
`;
}

function buildProductHtml(p, { title, subtitle, promise, targetAudience, sections, priceMin, priceMax, keywords }) {
  const accentColor = '#ea580c';
  const sectionsHtml = sections.map(s => `
    <section style="margin-bottom: 2.5rem;">
      <h2 style="font-size:1.4rem;font-weight:700;color:#1a1a1a;border-left:4px solid ${accentColor};padding-left:0.75rem;margin-bottom:0.75rem;">${s.title || s.heading || ''}</h2>
      <div style="font-size:1rem;line-height:1.8;color:#374151;white-space:pre-wrap;">${s.body || s.content?.body || ''}</div>
    </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: 'Georgia', serif; max-width: 780px; margin: 0 auto; padding: 2rem 1.5rem; background: #fafaf9; color: #1a1a1a; }
    h1 { font-size: 2.4rem; font-weight: 800; color: #111; margin-bottom: 0.5rem; }
    .subtitle { font-size: 1.2rem; color: #6b7280; margin-bottom: 1.5rem; font-style: italic; }
    .promise-box { background: linear-gradient(135deg,#fff7ed,#ffedd5); border: 2px solid ${accentColor}; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
    .promise-box p { margin: 0; font-size: 1.05rem; font-weight: 600; color: #9a3412; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; }
    .badge { background: #f3f4f6; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.8rem; color: #374151; font-family: sans-serif; }
    .price-badge { background: ${accentColor}; color: white; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.85rem; font-weight: 700; font-family: sans-serif; }
    .audience { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 2rem; font-family: sans-serif; font-size: 0.9rem; color: #166534; }
    .keywords { font-family: sans-serif; font-size: 0.8rem; color: #6b7280; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    .footer { text-align: center; font-family: sans-serif; font-size: 0.75rem; color: #9ca3af; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  ${promise ? `<div class="promise-box"><p>✦ ${promise}</p></div>` : ''}
  <div class="meta-row">
    ${p.product_type ? `<span class="badge">${p.product_type}</span>` : ''}
    ${p.platform ? `<span class="badge">${p.platform}</span>` : ''}
    ${p.niche ? `<span class="badge">${p.niche}</span>` : ''}
    ${priceMin ? `<span class="price-badge">$${priceMin}–$${priceMax}</span>` : ''}
  </div>
  ${targetAudience ? `<div class="audience"><strong>For:</strong> ${targetAudience}</div>` : ''}
  <hr />
  ${sectionsHtml}
  ${keywords.length ? `<div class="keywords"><strong>Keywords:</strong> ${keywords.join(' · ')}</div>` : ''}
  <div class="footer">Generated by Launchora · ${new Date().getFullYear()}</div>
</body>
</html>`;
}

function buildGumroadListing(p, { title, subtitle, promise, targetAudience, priceMin, priceMax, listingDescription, keywords }) {
  return `GUMROAD LISTING
${hr()}

PRODUCT TITLE (max 80 chars):
${title}${subtitle ? ' — ' + subtitle : ''}

PRICE: $${priceMin}  (or use "Pay What You Want", minimum $${priceMin})

DESCRIPTION (paste directly into Gumroad):
${hr('-')}
${promise ? `✦ ${promise}\n\n` : ''}${listingDescription || ''}

WHO IS THIS FOR?
${targetAudience || ''}

WHAT YOU'LL GET:
• Instant digital download
• ${p.product_type || 'Complete digital product'}
• Ready to use immediately

TAGS (comma-separated):
${keywords.slice(0, 10).join(', ')}

TIPS:
• Upload a clean cover image (1280×720px recommended)
• Enable "Let buyers pay more" to increase average order value
• Set a "Thank You" redirect to your email opt-in page
`;
}

function buildEtsyListing(p, { title, subtitle, promise, targetAudience, priceMin, keywords, listingDescription }) {
  const tags = keywords.slice(0, 13);
  return `ETSY LISTING
${hr()}

TITLE (max 140 chars — front-load keywords):
${keywords[0] ? keywords[0] + ' — ' : ''}${title}${subtitle ? ' | ' + subtitle : ''}

PRICE: $${priceMin}

DESCRIPTION:
${hr('-')}
${promise ? `✦ ${promise}\n\n` : ''}${listingDescription || ''}

Perfect for: ${targetAudience || ''}

────────────────────
✅ INSTANT DOWNLOAD
✅ No physical item shipped
✅ ${p.product_type || 'Digital file'}
────────────────────

TAGS (exactly 13, each max 20 chars):
${tags.map((t, i) => `${i + 1}. ${t.slice(0, 20)}`).join('\n')}

CATEGORY SUGGESTIONS:
• Digital Downloads > ${p.product_type || 'Documents'}

TIPS:
• Use all 10 product photos — include mockups, screenshots and lifestyle images
• Fill in all attributes to improve search placement
• Price just below round numbers (e.g. $9.99 instead of $10)
`;
}

function buildPayhipListing(p, { title, subtitle, promise, targetAudience, priceMin, priceMax, listingDescription, keywords }) {
  return `PAYHIP LISTING
${hr()}

PRODUCT NAME:
${title}

TAGLINE / SUBTITLE:
${subtitle || promise || ''}

PRICE: $${priceMin}

DESCRIPTION:
${hr('-')}
${promise ? `✦ ${promise}\n\n` : ''}${listingDescription || ''}

FOR: ${targetAudience || ''}

PRODUCT TYPE: ${p.product_type || 'Digital Download'}

SEARCH KEYWORDS:
${keywords.join(', ')}

PAYHIP-SPECIFIC TIPS:
• Enable "Pay What You Want" to let fans support you more
• Add an affiliate programme (Payhip offers 30–50% commissions)
• Use the built-in email marketing to follow up with buyers
• Offer a bundle discount to increase cart value
`;
}

function buildShopifyListing(p, { title, subtitle, promise, targetAudience, priceMin, priceMax, listingDescription, keywords }) {
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `SHOPIFY LISTING
${hr()}

PRODUCT TITLE:
${title}

HANDLE / URL SLUG:
/products/${handle}

PRICE: $${priceMin}   COMPARE AT PRICE: $${priceMax}

SHORT DESCRIPTION (for product card):
${subtitle || promise || ''}

FULL DESCRIPTION (paste into Description editor):
${hr('-')}
<h2>${promise || title}</h2>
<p>${listingDescription || ''}</p>
<p><strong>Perfect for:</strong> ${targetAudience || ''}</p>
<ul>
  <li>✅ Instant digital download</li>
  <li>✅ ${p.product_type || 'Complete digital resource'}</li>
  <li>✅ Works immediately after purchase</li>
</ul>
${hr('-')}

SEO TITLE (max 70 chars):
${title} — ${p.niche || 'Digital Download'}

SEO META DESCRIPTION (max 160 chars):
${(p.marketing_assets?.seo_meta_description || `${promise || subtitle || title}. Buy now and download instantly.`).slice(0, 160)}

TAGS:
${keywords.join(', ')}

COLLECTIONS SUGGESTION:
Digital Downloads, ${p.niche || 'Resources'}, ${p.product_type || 'Products'}
`;
}

function buildProductDescription(p, { title, subtitle, promise, targetAudience, buyerProfile, problemSolved, sections, priceMin, priceMax, listingDescription, keywords }) {
  return `UNIVERSAL PRODUCT DESCRIPTION — ${title}
${hr()}

This is your long-form product description for use on any platform,
landing page, email, or sales post.

${hr('-')}
THE BIG IDEA
${hr('-')}
${promise || subtitle || title}

${hr('-')}
WHO THIS IS FOR
${hr('-')}
${targetAudience || ''}

${buyerProfile ? `\nBUYER PROFILE:\n${buyerProfile}\n` : ''}

${hr('-')}
THE PROBLEM WE SOLVE
${hr('-')}
${problemSolved || ''}

${hr('-')}
WHAT'S INSIDE
${hr('-')}
${sections.slice(0, 8).map((s, i) => `${i + 1}. ${s.title || s.heading || 'Module ' + (i + 1)}`).join('\n')}

${hr('-')}
FULL DESCRIPTION
${hr('-')}
${listingDescription || ''}

${hr('-')}
PRICING
${hr('-')}
Recommended price: $${priceMin} – $${priceMax}

${hr('-')}
KEYWORDS
${hr('-')}
${keywords.join(', ')}
`;
}

function buildPricingStrategy(p, { title, priceMin, priceMax, targetAudience }) {
  const ma = p.marketing_assets || {};
  return `PRICING STRATEGY — ${title}
${hr()}

RECOMMENDED PRICE RANGE: $${priceMin} – $${priceMax}

${ma.price_rationale ? `RATIONALE:\n${ma.price_rationale}\n\n` : ''}

${hr('-')}
PRICING FRAMEWORKS
${hr('-')}

OPTION A — VALUE-BASED ENTRY ($${priceMin})
Best for: New audiences, first-time buyers, building trust fast.
• Lower barrier to impulse buying
• Works well on Gumroad and Etsy
• Great for list-building campaigns

OPTION B — STANDARD PRICE ($${Math.round((priceMin + priceMax) / 2)})
Best for: Warm audiences who already follow you.
• Positions the product as credible and professional
• Works on all platforms

OPTION C — PREMIUM PRICE ($${priceMax})
Best for: Existing customers, niche experts, coaching audiences.
• Signals high quality
• Works best with a strong landing page and testimonials

${hr('-')}
DISCOUNT & URGENCY TACTICS
${hr('-')}
• Launch discount: Offer 30% off for the first 72 hours
• Bundle deal: Pair with a complementary product for 20% more
• "Pay What You Want" (PWYW): Set $${priceMin} as minimum on Gumroad/Payhip

${hr('-')}
AUDIENCE NOTE
${hr('-')}
${targetAudience || ''}

${hr('-')}
PLATFORM PRICING TIPS
${hr('-')}
• Gumroad:  Set a minimum; enable "Pay What You Want"
• Etsy:     Price just below round numbers ($9.99 vs $10)
• Payhip:   Use affiliate commissions to drive volume
• Shopify:  Add a "Compare At" price to show a discount
`;
}

function buildInstagramCaptions(p, { title, promise, targetAudience, keywords }) {
  const niche = p.niche || 'your niche';
  const type = p.product_type || 'digital product';
  return `INSTAGRAM CAPTIONS — ${title}
${hr()}
5 ready-to-post captions. Choose one, add your image, and go.

${hr('-')}
CAPTION 1 — HOOK + VALUE
${hr('-')}
Stop scrolling if you're a ${targetAudience || niche + ' enthusiast'}.

${promise || `I just launched something that will change how you approach ${niche}.`}

This ${type} covers everything you need:
${keywords.slice(0, 4).map(k => `✅ ${k}`).join('\n')}

Grab it now → link in bio 🔗

${keywords.slice(0, 5).map(k => '#' + k.replace(/\s+/g, '')).join(' ')}

${hr('-')}
CAPTION 2 — STORY / PERSONAL
${hr('-')}
I used to struggle with this too.

Then I built ${title} — and everything changed.

It's a ${type} for ${targetAudience || 'people who want results'}.
No fluff. Just what works.

Get it today → link in bio 👆

${keywords.slice(0, 6).map(k => '#' + k.replace(/\s+/g, '')).join(' ')}

${hr('-')}
CAPTION 3 — PROBLEM / SOLUTION
${hr('-')}
If you're tired of:
❌ Wasting time on the wrong things
❌ Starting over from scratch
❌ Feeling stuck in ${niche}

${title} is your answer.

${promise || ''}

Link in bio to download instantly ⬆️

${keywords.slice(0, 5).map(k => '#' + k.replace(/\s+/g, '')).join(' ')}

${hr('-')}
CAPTION 4 — SOCIAL PROOF / RESULTS
${hr('-')}
What if you could get [result] in [timeframe]?

That's exactly what ${title} helps you do.

→ ${promise || 'Real results, real fast.'}
→ Built for: ${targetAudience || niche}
→ Available now — link in bio

${keywords.slice(0, 6).map(k => '#' + k.replace(/\s+/g, '')).join(' ')}

${hr('-')}
CAPTION 5 — DIRECT / URGENCY
${hr('-')}
New drop: ${title} 🔥

${promise || ''}

⏳ Launch price ends soon.
📥 Download instantly.
🎯 Made for ${targetAudience || 'you'}.

Link in bio → grab it now.

${keywords.slice(0, 8).map(k => '#' + k.replace(/\s+/g, '')).join(' ')}
`;
}

function buildLinkedInPosts(p, { title, promise, targetAudience, problemSolved, priceMin, keywords }) {
  const type = p.product_type || 'digital resource';
  const niche = p.niche || 'your field';
  return `LINKEDIN POSTS — ${title}
${hr()}
3 posts optimised for LinkedIn's professional audience.

${hr('-')}
POST 1 — ANNOUNCEMENT / INSIGHT-LED
${hr('-')}
After working in ${niche} for a while, I noticed the same pattern:

${problemSolved || 'People kept hitting the same wall, over and over.'}

So I built something to fix it.

Introducing: ${title}

${promise || ''}

It's a ${type} designed for ${targetAudience || 'professionals who want real results'}.

If you're serious about getting ahead in ${niche}, this is for you.

→ Available now at $${priceMin}
→ Instant download
→ No fluff, just results

Drop a 🙌 if you want the link.

#${keywords.slice(0, 3).map(k => k.replace(/\s+/g, '')).join(' #')}

${hr('-')}
POST 2 — EDUCATIONAL VALUE
${hr('-')}
3 things I wish I knew before starting in ${niche}:

1. ${keywords[0] ? 'The importance of ' + keywords[0] : 'Having a clear system matters more than tools.'}
2. ${keywords[1] ? keywords[1] + ' is a game-changer.' : 'Consistency beats creativity every time.'}
3. ${keywords[2] ? keywords[2] + ' is often overlooked.' : 'Simple always beats complex.'}

I've packaged everything I know into ${title}.

${promise || ''}

Built for: ${targetAudience || 'driven professionals'}

Check it out → [link]

#${keywords.slice(0, 4).map(k => k.replace(/\s+/g, '')).join(' #')}

${hr('-')}
POST 3 — LAUNCH STORY
${hr('-')}
Today I'm officially launching ${title}.

This ${type} is for ${targetAudience || 'anyone who wants to get better results'}.

Here's what makes it different:
• ${promise || 'A clear, actionable framework — not theory.'}
• Structured for fast results
• Priced at $${priceMin} — accessible for everyone

I poured everything I know into this. I hope it helps you as much as building it helped me.

Grab it here → [link in comments]

#${keywords.slice(0, 5).map(k => k.replace(/\s+/g, '')).join(' #')}
`;
}

function buildTikTokIdeas(p, { title, promise, targetAudience, keywords, sections }) {
  const niche = p.niche || 'this niche';
  const type = p.product_type || 'digital product';
  return `TIKTOK VIDEO IDEAS — ${title}
${hr()}
5 short-form video concepts with hooks and scripts.
Target: 30–60 seconds each.

${hr('-')}
VIDEO 1 — "POV" FORMAT
${hr('-')}
Hook (on-screen text): "POV: You finally stopped wasting time on ${niche}"

Script:
"Okay so I just dropped my new ${type} and it's literally everything I wish existed when I started.
It's called ${title} and it covers [topic 1], [topic 2], and [topic 3].
If you're into ${niche}, you NEED this.
Link in bio — it's only $${p.marketing_assets?.price_min || '—'}."

CTA: "Link in bio 👆 | Comment 'LINK' and I'll DM you"

${hr('-')}
VIDEO 2 — "I TRIED IT" FORMAT
${hr('-')}
Hook: "I tested this method for 30 days and here's what happened…"

Script:
"I built ${title} after realising that most ${niche} resources were either too vague or too expensive.
So I made one that actually works.
Here's what's inside: [show screen / slides]
${sections.slice(0, 3).map(s => '• ' + (s.title || s.heading || '')).join('\n')}
Grab it — link in bio."

CTA: "Save this video if you want the link later"

${hr('-')}
VIDEO 3 — PAIN POINT FORMAT
${hr('-')}
Hook: "Stop doing this if you're serious about ${niche} 🚫"

Script:
"The biggest mistake people make in ${niche}? [relatable mistake]
I made it too. Until I figured out [solution linked to promise].
I broke it all down in ${title}. It's a ${type} for ${targetAudience || 'people like us'}.
Comment 'INFO' and I'll send you the link."

CTA: "Comment 'INFO' for the link 👇"

${hr('-')}
VIDEO 4 — VALUE DROP FORMAT
${hr('-')}
Hook: "3 things you need to know about ${niche} (save this)"

Script:
"Number 1: ${keywords[0] || 'Know your audience deeply'}
Number 2: ${keywords[1] || 'Focus on one platform first'}
Number 3: ${keywords[2] || 'Consistency always wins'}
I go deep on all of these in my new ${type}, ${title}.
Link in bio."

CTA: "Follow for more ${niche} tips"

${hr('-')}
VIDEO 5 — LAUNCH ANNOUNCEMENT
${hr('-')}
Hook: "It's finally here 🎉 ${title}"

Script:
"I've been working on this for a while and it's finally live.
${promise || ''}
It's a ${type} built for ${targetAudience || 'you'}.
Dropping the link in bio right now — go grab it."

CTA: "Link in bio NOW 🔗"
`;
}

function buildHashtags(p, { keywords }) {
  const niche = (p.niche || 'digital').replace(/\s+/g, '');
  const type = (p.product_type || 'digitalproduct').replace(/\s+/g, '');
  const platform = (p.platform || 'gumroad').replace(/\s+/g, '');

  const kwTags = keywords.map(k => '#' + k.replace(/\s+/g, ''));

  return `HASHTAGS — ${p.title || 'Product'}
${hr()}

INSTAGRAM (30 tags — mix of sizes)
${hr('-')}
NICHE TAGS (high relevance):
${kwTags.slice(0, 8).join(' ')} #${niche} #${type}

COMMUNITY TAGS (mid-size):
#digitalproduct #passiveincome #onlinebusiness #sidehustle #digitaldownload #etsy #gumroad #${platform}

BROAD REACH TAGS:
#entrepreneur #smallbusiness #makemoneyonline #workfromhome #creativeentrepreneur #businessowner #solopreneur #contentcreator #digitalmarketing #onlinestore

${hr('-')}
TIKTOK (5–8 tags recommended)
${hr('-')}
${kwTags.slice(0, 3).join(' ')} #digitalproducts #${niche} #sidehustle #passiveincome

${hr('-')}
LINKEDIN (3–5 tags)
${hr('-')}
#${niche} #${type} #digitalproducts #entrepreneurship #onlinebusiness

${hr('-')}
TWITTER / X (2–3 tags)
${hr('-')}
#${niche} #digitalproduct #${type}

${hr('-')}
PINTEREST (keyword-style tags)
${hr('-')}
${keywords.join(', ')}, digital product, ${p.product_type || 'digital download'}, ${p.platform || 'online business'}
`;
}

function buildEmail1(p, { title, promise, targetAudience, priceMin, priceMax }) {
  return `EMAIL 1 — LAUNCH ANNOUNCEMENT
${hr()}
Send this on: LAUNCH DAY (Day 1)

SUBJECT LINE OPTIONS:
A) 🚀 It's here — ${title}
B) I built this for you: ${title}
C) New: ${promise || title}

PREVIEW TEXT:
${promise || `Introducing ${title} — built for ${targetAudience || 'you'}`}

${hr('-')}
EMAIL BODY:
${hr('-')}

Hey [First Name],

Today's the day.

${title} is officially live.

${promise ? `Here's the promise I'm making you:\n\n"${promise}"\n` : ''}

I built this for ${targetAudience || 'people like you'} who are ready to stop guessing and start getting results.

Inside, you'll find:
• A complete ${p.product_type || 'digital resource'} designed around your needs
• Step-by-step structure you can actually follow
• Everything in one place — no more hunting across the internet

Right now, you can grab it for just $${priceMin}.

→ [DOWNLOAD NOW — INSERT LINK HERE]

This is the launch price — it won't last forever.

Talk soon,
[Your Name]

P.S. Forward this to a friend who's been struggling with ${p.niche || 'this topic'}. They'll thank you for it.
`;
}

function buildEmail2(p, { title, promise, targetAudience, problemSolved, sections, priceMin }) {
  return `EMAIL 2 — EDUCATIONAL VALUE
${hr()}
Send this on: Day 3 (2 days after launch)

SUBJECT LINE OPTIONS:
A) The real reason most people fail at ${p.niche || 'this'}
B) 3 lessons I learned the hard way
C) What I wish I knew before I started

PREVIEW TEXT:
Inside: a key insight that changes everything about ${p.niche || 'your work'}

${hr('-')}
EMAIL BODY:
${hr('-')}

Hey [First Name],

I want to share something with you today — no pitch, just value.

${problemSolved ? `Here's the problem I kept seeing:\n\n${problemSolved}\n` : `A lot of people in ${p.niche || 'this space'} make the same mistake.`}

Through a lot of trial and error, I figured out what actually works. And I broke it down into 3 core insights:

1. ${sections[0]?.title || sections[0]?.heading || 'Clarity beats complexity every time.'}
   The biggest wins come from simplifying, not adding more.

2. ${sections[1]?.title || sections[1]?.heading || 'Systems outperform willpower.'}
   When you have the right structure, you remove the need for motivation.

3. ${sections[2]?.title || sections[2]?.heading || 'Action over perfection.'}
   An imperfect start beats a perfect plan that never launches.

These are the principles I've built ${title} around.

If you haven't grabbed it yet, now's a great time:
→ [GET ${title.toUpperCase()} — INSERT LINK HERE] — $${priceMin}

See you in a couple of days,
[Your Name]
`;
}

function buildEmail3(p, { title, promise, targetAudience, priceMin, priceMax }) {
  return `EMAIL 3 — FINAL PUSH
${hr()}
Send this on: Day 6–7 (before closing launch price)

SUBJECT LINE OPTIONS:
A) Last chance — ${title} launch price ends tonight
B) Closing this out tomorrow (final email)
C) ⏳ Hours left at this price

PREVIEW TEXT:
Don't miss this — the launch price disappears soon.

${hr('-')}
EMAIL BODY:
${hr('-')}

Hey [First Name],

This is my last email about ${title}.

I know — nobody likes "last chance" emails. So I'll keep this short.

If you've been thinking about grabbing it, now is genuinely the best time.

After [DATE/TIME], the price goes from $${priceMin} to $${priceMax}.

${promise ? `Remember what this is about:\n"${promise}"\n` : ''}

This was built for ${targetAudience || 'people who are ready to take action'}.

If that's you → [GRAB IT NOW — INSERT LINK HERE]

If it's not for you right now, no worries. I'll be back soon with more good stuff.

Thanks for being on my list.

[Your Name]

P.S. Questions? Just reply to this email. I read everything.
`;
}

function build7DayPlan(p, { title, promise, platform, targetAudience }) {
  return `7-DAY LAUNCH PLAN — ${title}
${hr()}

This plan is designed to create momentum from day one.
Adapt timing to your audience and schedule.

${hr('-')}
DAY 1 — LAUNCH DAY 🚀
${hr('-')}
□ Publish your product on ${platform || 'your chosen platform'}
□ Send Email 1 (Announcement) to your list
□ Post on Instagram (Caption 1 or 2)
□ Post on LinkedIn (Post 1)
□ Share in relevant Facebook/Reddit/community groups
□ Pin the product link to your social bio

GOAL: Get your first 5–10 sales and social proof.

${hr('-')}
DAY 2 — AMPLIFY
${hr('-')}
□ Reply to every comment and DM personally
□ Share a "behind the scenes" story on Instagram/TikTok
□ Post TikTok Video 1 or 2
□ Ask 3 friends/peers to share or review

GOAL: Build buzz and early word-of-mouth.

${hr('-')}
DAY 3 — VALUE DROP
${hr('-')}
□ Send Email 2 (Educational Value)
□ Post educational content related to your product topic
□ Post LinkedIn Post 2
□ Share a testimonial or early buyer reaction (if you have one)

GOAL: Re-engage people who haven't bought yet with value.

${hr('-')}
DAY 4 — SOCIAL PROOF
${hr('-')}
□ Screenshot or quote any positive feedback you've received
□ Post TikTok Video 3 (Pain Point format)
□ Share a "results" or "process" Instagram post
□ Engage in 2–3 communities where your buyers hang out

GOAL: Build trust and reduce purchase objections.

${hr('-')}
DAY 5 — COMMUNITY & PARTNERSHIPS
${hr('-')}
□ Reach out to 3 complementary creators for a cross-promotion
□ Post in online communities with genuine value + soft mention
□ Post TikTok Video 4 (Value Drop)
□ Run a poll or question related to your product topic

GOAL: Expand reach beyond your existing audience.

${hr('-')}
DAY 6 — URGENCY
${hr('-')}
□ Announce that the launch price ends tomorrow
□ Post Instagram Caption 5 (urgency)
□ Post LinkedIn Post 3
□ Post TikTok Video 5 (Launch Announcement)

GOAL: Convert fence-sitters with a clear deadline.

${hr('-')}
DAY 7 — FINAL DAY
${hr('-')}
□ Send Email 3 (Final Push) in the morning
□ Post a final Instagram story/post ("last few hours")
□ Raise the price at end of day as promised
□ Send a thank-you message to all buyers

GOAL: Close the launch strong with urgency and gratitude.

${hr('-')}
POST-LAUNCH (Week 2 onwards)
${hr('-')}
□ Collect testimonials from early buyers
□ Repurpose one buyer result into a social post
□ Set up an email automation for future buyers
□ Consider a bundle or upsell for existing customers
□ Review your analytics and adjust pricing if needed

${hr()}
PROMISE: ${promise || title}
FOR: ${targetAudience || 'Your target audience'}
`;
}

function buildLaunchChecklist(p, { title, platform }) {
  return `LAUNCH CHECKLIST — ${title}
${hr()}

Complete these before you hit publish.

${hr('-')}
PRODUCT PREPARATION
${hr('-')}
□ Product file is finalised and tested
□ File opens correctly on Mac, Windows, and mobile
□ File name is professional (no "final_v2_FINAL.pdf")
□ Product delivers on every promise made in the listing
□ Thank-you page or delivery email is set up

${hr('-')}
LISTING & PRICING
${hr('-')}
□ Listing title includes primary keyword
□ Description is complete with benefits, not just features
□ Price is set (use the Pricing Strategy file for guidance)
□ Cover image is uploaded (high quality, 1280×720px minimum)
□ Tags / keywords are filled in

${hr('-')}
PLATFORM SETUP (${platform || 'your platform'})
${hr('-')}
□ Account is verified and payment method connected
□ Payout details are configured
□ Product preview or sample is included (where possible)
□ Refund policy is written and visible
□ Product URL is clean and shareable

${hr('-')}
EMAIL & MARKETING
${hr('-')}
□ Email sequence is scheduled (use the Email Launch files)
□ Bio link is updated on all platforms
□ Social posts are scheduled for Days 1–7
□ Friends / warm audience have been given a heads-up
□ Hashtags are ready (use the Hashtags file)

${hr('-')}
ANALYTICS & TRACKING
${hr('-')}
□ Platform analytics are enabled
□ You know how many sales = a successful launch for you
□ A follow-up plan is in place for after the 7-day launch

${hr('-')}
DAY-OF LAUNCH
${hr('-')}
□ Product is live and purchase link works
□ Email 1 is sent
□ First social post is live
□ You are available to reply to comments and DMs for 2–3 hours

${hr()}
You're ready. Go launch. 🚀
`;
}

function buildPlatformRecommendation(p, { title, platform, targetAudience, priceMin }) {
  const pg = p.platform_guides || p.generated_data?.platform_guidance || {};
  return `PLATFORM RECOMMENDATION — ${title}
${hr()}

RECOMMENDED PLATFORM: ${platform || 'See guidance below'}

${pg.why_this_platform ? `WHY THIS PLATFORM:\n${pg.why_this_platform}\n` : ''}
${pg.platform_audience ? `\nPLATFORM AUDIENCE:\n${pg.platform_audience}\n` : ''}
${pg.pricing_strategy ? `\nPLATFORM PRICING STRATEGY:\n${pg.pricing_strategy}\n` : ''}
${pg.thumbnail_guidance ? `\nTHUMBNAIL / COVER GUIDANCE:\n${pg.thumbnail_guidance}\n` : ''}

${hr('-')}
GENERAL PLATFORM COMPARISON
${hr('-')}

GUMROAD
Best for:   Creators with an existing audience
Fee:        10% (free plan) or $10/month (no transaction fee)
Strengths:  Simple setup, "Pay What You Want", email list built-in
Best price: $${priceMin}–$${Math.round(Number(priceMin) * 1.5) || 15}

ETSY
Best for:   Discovery-based sales (search traffic)
Fee:        ~6.5% + $0.20 listing fee
Strengths:  Built-in search audience, trusted brand
Best price: $${Math.max(3, Number(priceMin) - 2) || 7}.99 (just under round numbers)

PAYHIP
Best for:   Affiliate-driven sales and email list growth
Fee:        5% (free plan) or $0 (paid plans)
Strengths:  Built-in affiliates, email marketing, memberships
Best price: $${priceMin}

SHOPIFY
Best for:   Scaling with a branded storefront
Fee:        $29+/month + payment fees
Strengths:  Full control, SEO, upsells, professional brand
Best price: $${priceMin} (with "Compare At" set to $${priceMax})

${hr('-')}
${pg.launch_plan ? `PLATFORM LAUNCH PLAN:\n${pg.launch_plan}\n` : ''}

${pg.pro_tips && pg.pro_tips.length ? `PRO TIPS:\n${pg.pro_tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` : ''}

${pg.mistakes_to_avoid && pg.mistakes_to_avoid.length ? `MISTAKES TO AVOID:\n${pg.mistakes_to_avoid.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n` : ''}

${pg.tags && pg.tags.length ? `PLATFORM TAGS:\n${pg.tags.join(', ')}\n` : ''}

${hr()}
FOR: ${targetAudience || 'Your target audience'}
`;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let productId = null;
  const exportStart = Date.now();
  const exportTimings = { exportStartedAt: new Date().toISOString(), errors: [] };

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    productId = body.productId;
    const stylePreset = body.stylePreset || 'minimal';

    console.log('[generateZip] ▶ START productId:', productId, '| stylePreset:', stylePreset);

    if (!productId) {
      return Response.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    // Mark export as in-progress
    await base44.asServiceRole.entities.Product.update(productId, {
      export_status: 'generating',
      export_error: null,
      exportTimings,
    });

    // Fetch the product record
    const fetchStart = Date.now();
    const product = await base44.asServiceRole.entities.Product.get(productId);
    exportTimings.productFetchedAt = new Date().toISOString();
    exportTimings.productFetchDurationMs = Date.now() - fetchStart;
    console.log(`[generateZip] ⏱ product fetch: ${exportTimings.productFetchDurationMs}ms`);

    if (!product) {
      await base44.asServiceRole.entities.Product.update(productId, { export_status: 'failed', export_error: 'Product not found', exportTimings });
      return Response.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // ── Normalize all data sources ──────────────────────────────────────────
    const d = product.generated_data || {};
    const title = product.title || d.title || '';
    const subtitle = product.subtitle || d.subtitle || '';
    const promise = product.promise || d.promise || '';
    const targetAudience = product.target_audience || d.audience || '';
    const buyerProfile = product.buyer_profile || d.buyer_profile || '';
    const problemSolved = product.problem_solved || d.problem_solved || '';

    // ── Validate required fields (only hard-block on missing title) ─────────
    if (!title.trim()) {
      const errMsg = 'Product title is missing — cannot export';
      await base44.asServiceRole.entities.Product.update(productId, { export_status: 'failed', export_error: errMsg, exportTimings });
      return Response.json({ success: false, error: errMsg }, { status: 422 });
    }

    const sections = (product.sections?.length > 0)
      ? product.sections
      : (d.sections?.length > 0)
        ? d.sections
        : (product.pages?.filter(b => b.type === 'section') || []);

    // ── Marketing assets (with fallbacks for partially-generated products) ──
    const ma = product.marketing_assets || {};
    const pa = product.product_angle || {};
    const listingTitle = ma.listing_title || d.listing_title || title;
    const listingDescription = ma.listing_description || d.listing_description ||
      `${promise || subtitle || title}\n\nBuilt for ${targetAudience || product.niche || 'professionals'} who want real results.\n\nThis ${product.product_type || 'digital product'} covers everything you need to get started and succeed.\n\n✅ Instant digital download\n✅ Professionally structured\n✅ Ready to use immediately\n\n${pa.finalAngle || ''}`;
    const keywords = (ma.keywords?.length ? ma.keywords : d.keywords) || [product.niche, product.product_type, 'digital product', 'download'].filter(Boolean);
    const priceMin = ma.price_min ?? d.price_min ?? 17;
    const priceMax = ma.price_max ?? d.price_max ?? 37;
    const platform = product.platform || '';

    const vars = {
      title, subtitle, promise, targetAudience, buyerProfile,
      problemSolved, sections, listingTitle, listingDescription,
      keywords, priceMin, priceMax, platform,
    };

    console.log('[generateZip] Building ZIP with', sections.length, 'sections,', keywords.length, 'keywords');

    // ── Assemble all files (pure CPU — should be <100ms) ───────────────────
    // ✅ No PDF generation here — PDF is client-side only (exportProductPDF).
    // ✅ ZIP export does NOT auto-run during generation — only on explicit user click.
    const zipBuildStart = Date.now();
    exportTimings.zipStartedAt = new Date().toISOString();

    const files = [
      // 01_Product
      { name: '01_Product/Product.txt',         data: buildProductTxt(product, vars) },
      { name: '01_Product/Product_Content.html', data: buildProductHtml(product, vars) },

      // 02_Sales_Page
      { name: '02_Sales_Page/Gumroad_Listing.txt',     data: buildGumroadListing(product, vars) },
      { name: '02_Sales_Page/Etsy_Listing.txt',        data: buildEtsyListing(product, vars) },
      { name: '02_Sales_Page/Payhip_Listing.txt',      data: buildPayhipListing(product, vars) },
      { name: '02_Sales_Page/Shopify_Listing.txt',     data: buildShopifyListing(product, vars) },
      { name: '02_Sales_Page/Product_Description.txt', data: buildProductDescription(product, vars) },
      { name: '02_Sales_Page/Pricing_Strategy.txt',    data: buildPricingStrategy(product, vars) },

      // 03_Social_Media
      { name: '03_Social_Media/Instagram_Captions.txt',   data: buildInstagramCaptions(product, vars) },
      { name: '03_Social_Media/LinkedIn_Posts.txt',        data: buildLinkedInPosts(product, vars) },
      { name: '03_Social_Media/TikTok_Video_Ideas.txt',    data: buildTikTokIdeas(product, vars) },
      { name: '03_Social_Media/Hashtags.txt',              data: buildHashtags(product, vars) },

      // 04_Email_Launch
      { name: '04_Email_Launch/Email_1_Announcement.txt',      data: buildEmail1(product, vars) },
      { name: '04_Email_Launch/Email_2_Educational_Value.txt',  data: buildEmail2(product, vars) },
      { name: '04_Email_Launch/Email_3_Final_Push.txt',         data: buildEmail3(product, vars) },

      // 05_Launch_Plan
      { name: '05_Launch_Plan/7_Day_Launch_Plan.txt',          data: build7DayPlan(product, vars) },
      { name: '05_Launch_Plan/Launch_Checklist.txt',            data: buildLaunchChecklist(product, vars) },
      { name: '05_Launch_Plan/Platform_Recommendation.txt',     data: buildPlatformRecommendation(product, vars) },

      // README
      { name: 'README.txt', data: buildReadme(product, vars) },
    ];

    const zipBytes = buildZip(files);
    exportTimings.zipFinishedAt = new Date().toISOString();
    exportTimings.zipBuildDurationMs = Date.now() - zipBuildStart;
    console.log(`[generateZip] ⏱ ZIP build: ${exportTimings.zipBuildDurationMs}ms | files: ${files.length} | size: ${zipBytes.length} bytes`);

    if (!zipBytes || zipBytes.length < 100) {
      throw new Error('ZIP generation produced an invalid or empty file');
    }

    // ── Upload (main bottleneck for export — depends on file size + network) ─
    // ⚠️ Upload is typically 1-5s but can spike to 15s+ for large products.
    const uploadStart = Date.now();
    exportTimings.uploadStartedAt = new Date().toISOString();
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    const fileName = `${safeTitle}_launch_kit.zip`;

    const zipFile = new File([zipBytes], fileName, { type: 'application/zip' });
    const uploadResult = await base44.integrations.Core.UploadFile({ file: zipFile });
    exportTimings.uploadFinishedAt = new Date().toISOString();
    exportTimings.uploadDurationMs = Date.now() - uploadStart;
    console.log(`[generateZip] ⏱ upload: ${exportTimings.uploadDurationMs}ms | result:`, JSON.stringify(uploadResult));

    if (!uploadResult?.file_url) {
      throw new Error('File uploaded but no download URL returned: ' + JSON.stringify(uploadResult));
    }

    // ── Finalise timings ────────────────────────────────────────────────────
    exportTimings.exportFinishedAt = new Date().toISOString();
    exportTimings.totalDurationMs = Date.now() - exportStart;
    const stepDurations = {
      productFetch: exportTimings.productFetchDurationMs,
      zipBuild: exportTimings.zipBuildDurationMs,
      upload: exportTimings.uploadDurationMs,
    };
    exportTimings.slowestStep = Object.entries(stepDurations).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    console.log(`[generateZip] ⏱ SUMMARY — total: ${exportTimings.totalDurationMs}ms | slowest: ${exportTimings.slowestStep}`);
    console.log(`[generateZip] Step durations:`, JSON.stringify(stepDurations));

    if (exportTimings.totalDurationMs > 45000) {
      console.warn(`[generateZip] ⚠️ Export took >45s (${exportTimings.totalDurationMs}ms). Likely bottleneck: ${exportTimings.slowestStep}`);
    }

    // ── Persist export metadata ─────────────────────────────────────────────
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.Product.update(productId, {
      export_status: 'ready',
      last_exported_at: now,
      export_error: null,
      exportTimings,
      export_files: [{
        name: fileName,
        url: uploadResult.file_url,
        type: 'zip',
        generated_at: now,
        size: zipBytes.length,
      }],
    });

    console.log('[generateZip] ✅ Done fileUrl:', uploadResult.file_url);

    return Response.json({
      success: true,
      fileUrl: uploadResult.file_url,
      fileName,
      fileSize: zipBytes.length,
      generatedAt: now,
      timings: { totalDurationMs: exportTimings.totalDurationMs, slowestStep: exportTimings.slowestStep, stepDurations },
    });

  } catch (error) {
    console.error('[generateZip] ❌ Fatal error:', error.message, error.stack);
    exportTimings.errors.push({ error: error.message, at: new Date().toISOString() });
    exportTimings.totalDurationMs = Date.now() - exportStart;
    try {
      if (productId) {
        await base44.asServiceRole.entities.Product.update(productId, {
          export_status: 'failed',
          export_error: error.message || 'Unknown error during ZIP generation',
          exportTimings,
        });
      }
    } catch (_) { /* best-effort */ }
    return Response.json({ success: false, error: error.message, details: error.stack || '' }, { status: 500 });
  }
});
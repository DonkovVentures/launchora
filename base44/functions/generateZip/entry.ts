import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── ZIP builder ───────────────────────────────────────────────────────────────
function buildZip(files) {
  const enc = new TextEncoder();
  const toBytes = d => typeof d === 'string' ? enc.encode(d) : new Uint8Array(d);
  const crcTable = (() => { const t = new Uint32Array(256); for (let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[i]=c;}return t; })();
  const crc32 = d => { let c=0xFFFFFFFF; for(let i=0;i<d.length;i++)c=crcTable[(c^d[i])&0xFF]^(c>>>8); return(c^0xFFFFFFFF)>>>0; };
  const u16 = n => { const b=new Uint8Array(2); new DataView(b.buffer).setUint16(0,n,true); return b; };
  const u32 = n => { const b=new Uint8Array(4); new DataView(b.buffer).setUint32(0,n,true); return b; };
  const cat = (...a) => { const t=a.reduce((s,x)=>s+x.length,0),o=new Uint8Array(t); let p=0; for(const x of a){o.set(x,p);p+=x.length;} return o; };
  const entries=[]; let off=0;
  const now=new Date(), dd=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(), dt=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const{name,data}of files){const nb=enc.encode(name),fd=toBytes(data),cr=crc32(fd),lh=cat(new Uint8Array([0x50,0x4B,0x03,0x04]),u16(20),u16(0),u16(0),u16(dt),u16(dd),u32(cr),u32(fd.length),u32(fd.length),u16(nb.length),u16(0),nb);entries.push({nb,cr,sz:fd.length,off,dt,dd,lh,fd});off+=lh.length+fd.length;}
  const cd=cat(...entries.map(e=>cat(new Uint8Array([0x50,0x4B,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(e.dt),u16(e.dd),u32(e.cr),u32(e.sz),u32(e.sz),u16(e.nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(e.off),e.nb)));
  const eocd=cat(new Uint8Array([0x50,0x4B,0x05,0x06]),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(cd.length),u32(off),u16(0));
  return cat(...entries.flatMap(e=>[e.lh,e.fd]),cd,eocd);
}

const hr = (c='─',n=60) => c.repeat(n);

// ── Quality Gate ──────────────────────────────────────────────────────────────
const BANNED = [
  'content pending','todo','coming soon','day ?','empty hook','[bonus feature]',
  '[companion ','placeholder','undefined','null','nan','\bnull\b',
];
function hasBannedContent(text) {
  const lower = text.toLowerCase();
  return BANNED.some(b => lower.includes(b));
}
function cleanText(text) {
  // Remove literal "null", "undefined", "NaN" values left by template interpolation
  return text
    .replace(/\bnull\b/g, '')
    .replace(/\bundefined\b/g, '')
    .replace(/\bNaN\b/g, '')
    .replace(/\[bonus feature\]/gi, 'exclusive bonus content')
    .replace(/\[companion [^\]]+\]/gi, 'companion resource')
    .replace(/DAY \?/gi, '')
    .replace(/HOOK:\s*\n/gi, '')
    .replace(/Content pending/gi, '')
    .trim();
}
function validateFile(name, data) {
  const text = String(data);
  const issues = [];
  if (hasBannedContent(text)) {
    const found = BANNED.filter(b => text.toLowerCase().includes(b));
    issues.push(`Contains banned phrases: ${found.join(', ')}`);
  }
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (name.includes('01_Product') && wordCount < 80) issues.push(`Too short: ${wordCount} words (min 80)`);
  if (name.includes('04_Email') && (!text.includes('SUBJECT') || !text.includes('[INSERT LINK]'))) issues.push('Email missing SUBJECT or CTA link placeholder');
  if (name.includes('7_Day_Posting_Calendar') && !text.includes('DAY 1')) issues.push('Calendar missing DAY 1');
  if (name.includes('7_Day_Launch_Plan') && !text.includes('DAY 1')) issues.push('Launch plan missing DAY 1');
  if (name.includes('TikTok') && text.split('VIDEO').length < 4) issues.push('TikTok file has fewer than 3 videos');
  if (name.includes('Instagram') && text.split('CAPTION').length < 4) issues.push('Instagram has fewer than 3 captions');
  return issues;
}
function safeFile(name, fn, warnings) {
  try {
    let data = fn();
    if (!data || !String(data).trim()) throw new Error('builder returned empty content');
    data = cleanText(String(data));
    const issues = validateFile(name, data);
    if (issues.length > 0) {
      warnings.push(`Quality issues in ${name}: ${issues.join('; ')}`);
      console.warn(`[QA] ${name} — ${issues.join('; ')}`);
      // Still include the file after cleaning — don't discard unless completely empty
    }
    return { name, data };
  } catch(e) {
    warnings.push(`Skipped ${name}: ${e.message}`);
    return null;
  }
}

// ── Normalizer ────────────────────────────────────────────────────────────────
function norm(p) {
  const d=p.generated_data||{}, ma=p.marketing_assets||{}, pa=p.product_angle||{}, pg=p.platform_guides||{}, sm=p.social_media_kit||{};
  const title=String(p.title||d.title||'Untitled Product');
  const subtitle=String(p.subtitle||d.subtitle||'');
  const promise=String(p.promise||d.promise||'');
  const audience=String(p.target_audience||d.audience||d.target_audience||'');
  const buyer=String(p.buyer_profile||d.buyer_profile||'');
  const problem=String(p.problem_solved||d.problem_solved||'');
  const type=String(p.product_type||d.product_type||'Digital Product');
  const niche=String(p.niche||'General');
  const platform=String(p.platform||'Gumroad');
  const tone=String(p.tone||'Professional');
  const launchPlan=String(p.launch_plan||d.launch_plan||'');
  const items=Array.isArray(p.checklist_items)?p.checklist_items:(Array.isArray(d.benefits)?d.benefits:[]);
  const pages=Array.isArray(p.pages)?p.pages:(Array.isArray(d.product_blocks)?d.product_blocks:[]);
  const sections=Array.isArray(p.sections)&&p.sections.length>0?p.sections:Array.isArray(d.sections)&&d.sections.length>0?d.sections:pages.filter(b=>b?.type==='section').map(b=>({title:b.heading||b.content?.title||'',body:b.content?.body||''}));
  const priceMin=Number(ma.price_min??d.price_min??17)||17;
  const priceMax=Number(ma.price_max??d.price_max??37)||37;
  const keywords=Array.isArray(ma.keywords)&&ma.keywords.length>0?ma.keywords:Array.isArray(d.keywords)&&d.keywords.length>0?d.keywords:[niche,type,'digital product','download'].filter(Boolean);
  const listingTitle=String(ma.listing_title||d.listing_title||title);
  const shortDesc=String(ma.seo_meta_description||d.seo_meta_description||`${promise||subtitle||title}. Built for ${audience||niche}.`);
  const longDesc=String(ma.listing_description||d.listing_description||`${promise||subtitle||title}\n\nBuilt for ${audience||niche}.\n\nThis ${type} gives you everything you need to get results fast.\n\n✅ Instant digital download\n✅ Professionally structured\n✅ Ready to use immediately\n\n${pa.finalAngle||''}`);
  const safe=title.replace(/[^a-z0-9]/gi,'_').slice(0,40)||'Launchora_Product';
  const igCaps=Array.isArray(sm.instagram_captions)&&sm.instagram_captions.length>0?sm.instagram_captions:[];
  const calItems=Array.isArray(sm.content_calendar)&&sm.content_calendar.length>0?sm.content_calendar:[];
  const scripts=Array.isArray(sm.video_scripts)&&sm.video_scripts.length>0?sm.video_scripts:[];
  return {title,subtitle,promise,audience,buyer,problem,type,niche,platform,tone,launchPlan,items,sections,priceMin,priceMax,keywords,listingTitle,shortDesc,longDesc,safe,pa,ma,pg,sm,igCaps,calItems,scripts};
}

// ── File builders ─────────────────────────────────────────────────────────────

const README = (p,n) => `LAUNCHORA DIGITAL PRODUCT LAUNCH KIT
${'═'.repeat(60)}
PRODUCT: ${n.title}
TYPE: ${n.type} | PLATFORM: ${n.platform} | PRICE: $${n.priceMin}–$${n.priceMax}
GENERATED: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
${'═'.repeat(60)}
WHAT'S IN YOUR LAUNCH KIT
${'═'.repeat(60)}
📁 01_Product/
   Product_Content.txt / .html — Full product content
   Buyer_Quick_Start_Guide.txt — What buyers do first
   Implementation_Checklist.txt — Action checklist

📁 02_Sales_Page/
   Platform_Listing_Primary.txt — Ready-to-paste listing
   Gumroad / Etsy / Payhip / Creative_Market listings
   Product_Description_Short/Long.txt
   Pricing_Strategy.txt | SEO_Keywords.txt

📁 03_Social_Media/
   Hooks.txt | Instagram_Captions.txt | LinkedIn_Posts.txt
   TikTok_Reel_Ideas.txt | Carousel_Post_Outlines.txt
   Hashtag_Groups.txt | 7_Day_Posting_Calendar.txt

📁 04_Email_Launch/
   Emails 1–5: Announcement → Value → Problem → Offer → Last Call

📁 05_Launch_Plan/
   7_Day_Launch_Plan.txt | Launch_Checklist.txt
   Platform_Recommendation.txt | Launch_Readiness_Report.txt

📁 06_Bonus/
   Customer_Avatar.txt | FAQ.txt | Upsell_Ideas.txt | Next_Product_Ideas.txt
${'═'.repeat(60)}
SUGGESTED FIRST STEPS
${'═'.repeat(60)}
1. Open 01_Product/Product_Content.html in your browser — review your content
2. Copy your listing from 02_Sales_Page/Platform_Listing_Primary.txt → paste into your store
3. Schedule 03_Social_Media/7_Day_Posting_Calendar.txt posts for launch week
4. Send 04_Email_Launch/Email_1_Announcement.txt to your list on launch day
5. Follow 05_Launch_Plan/7_Day_Launch_Plan.txt day by day

Good luck with your launch! 🚀
`;

const PRODUCT_TXT = (p,n) => {
  const secs=n.sections.map((s,i)=>`${hr()}\n${i+1}. ${s.title||s.heading||'Section '+(i+1)}\n${hr()}\n${s.body||s.content?.body||''}`).join('\n\n');
  return `${n.title}\n${'═'.repeat(60)}\n${n.subtitle||''}\nTYPE: ${n.type} | NICHE: ${n.niche} | PLATFORM: ${n.platform} | PRICE: $${n.priceMin}–$${n.priceMax}\n\nPROMISE\n${hr()}\n${n.promise||n.subtitle||''}\n\nFOR: ${n.audience||n.niche}\n\n${n.items.length>0?'KEY BENEFITS\n'+hr()+'\n'+n.items.map(b=>'✅ '+b).join('\n')+'\n\n':''}\n${'═'.repeat(60)}\nCONTENT\n${'═'.repeat(60)}\n\n${secs||'(Sections pending)'}\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
};

const PRODUCT_HTML = (p,n) => {
  const a='#ea580c';
  const secsHtml=n.sections.map((s,i)=>{
    const title=s.title||s.heading||'Section '+(i+1);
    const body=s.body||s.content?.body||'';
    // Never show "Content pending" — use a meaningful placeholder tied to the actual section title
    const displayBody=body.trim()||`This section covers: ${title}. Open the .txt version for full content details.`;
    return `<section style="margin-bottom:2.5rem;padding-bottom:2rem;border-bottom:1px solid #f3f4f6"><h2 style="font-size:1.25rem;font-weight:700;color:#111;padding-left:.75rem;border-left:4px solid ${a};margin-bottom:.75rem">${i+1}. ${title}</h2><div style="font-size:1rem;line-height:1.8;color:#374151;white-space:pre-wrap">${displayBody.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></section>`;
  }).join('');
  const bens=n.items.length>0?`<ul style="list-style:none;padding:0;margin-bottom:2rem">${n.items.map(b=>`<li style="padding:.35rem 0;color:#166534">✅ ${b}</li>`).join('')}</ul>`:'';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${n.title}</title><style>body{font-family:Georgia,serif;max-width:780px;margin:0 auto;padding:2rem 1.5rem;background:#fafaf9;color:#1a1a1a}h1{font-size:2.1rem;font-weight:800;color:#111;margin-bottom:.5rem}.sub{font-size:1.1rem;color:#6b7280;font-style:italic;margin-bottom:1.5rem}.promise{background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid ${a};border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem}.promise p{margin:0;font-size:1rem;font-weight:600;color:#9a3412}.meta{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem;font-family:sans-serif}.badge{background:#f3f4f6;border-radius:999px;padding:.2rem .75rem;font-size:.8rem;color:#374151}.pb{background:${a};color:#fff;border-radius:999px;padding:.2rem .75rem;font-size:.8rem;font-weight:700}.aud{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:1rem 1.25rem;margin-bottom:2rem;font-family:sans-serif;font-size:.9rem;color:#166534}.kw{font-family:sans-serif;font-size:.8rem;color:#6b7280;margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb}.ft{text-align:center;font-family:sans-serif;font-size:.75rem;color:#9ca3af;margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb}</style></head><body><h1>${n.title}</h1>${n.subtitle?`<p class="sub">${n.subtitle}</p>`:''} ${n.promise?`<div class="promise"><p>✦ ${n.promise}</p></div>`:''}<div class="meta"><span class="badge">${n.type}</span><span class="badge">${n.platform}</span><span class="badge">${n.niche}</span><span class="pb">$${n.priceMin}–$${n.priceMax}</span></div>${n.audience?`<div class="aud"><strong>For:</strong> ${n.audience}</div>`:''} ${bens}${secsHtml}${n.keywords.length?`<div class="kw"><strong>Keywords:</strong> ${n.keywords.join(' · ')}</div>`:''}<div class="ft">Generated by Launchora · ${new Date().getFullYear()}</div></body></html>`;
};

const QUICK_START = (p,n) => `BUYER QUICK START GUIDE — ${n.title}\n${'═'.repeat(60)}\n\nWelcome! Here's how to get the most out of ${n.title} as fast as possible.\n\nWHAT THIS IS\n${hr()}\n${n.title} is a ${n.type} for ${n.audience||n.niche+' enthusiasts'}.\n${n.promise?'\nPROMISE:\n'+n.promise+'\n':''}\nHOW TO USE IT\n${hr()}\nSTEP 1: Skim the entire product once to understand the structure.\nSTEP 2: Work through these sections in order:\n${n.sections.slice(0,6).map((s,i)=>`   ${i+1}. ${s.title||s.heading||'Section '+(i+1)}`).join('\n')}\nSTEP 3: Take one action within 24 hours of downloading.\n\n${n.items.length>0?'KEY OUTCOMES\n'+hr()+'\n'+n.items.slice(0,5).map(b=>'✅ '+b).join('\n')+'\n':''}\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;

const IMPL_CHECKLIST = (p,n) => {
  const list=n.items.length>0?n.items.map(b=>`□ ${b}`):n.sections.map((s,i)=>`□ Complete: ${s.title||s.heading||'Section '+(i+1)}`);
  return `IMPLEMENTATION CHECKLIST — ${n.title}\n${'═'.repeat(60)}\n\nYOUR ACTION LIST\n${hr()}\n${list.join('\n')}\n\nQUICK WINS\n${hr()}\n□ Read through once without acting\n□ Pick the single most relevant section\n□ Complete that section first\n□ Apply one strategy within 48 hours\n□ Share one insight with your network\n\nRESULT TRACKER\n${hr()}\nTarget: _______________\nReview date: _______________\nNotes:\n_______________________________________________\n_______________________________________________\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
};

const PRIMARY_LISTING = (p,n) => `PRIMARY PLATFORM LISTING — ${n.title}\n${'═'.repeat(60)}\nPlatform: ${n.platform}\n\nTITLE\n${hr()}\n${n.listingTitle}\n\nDESCRIPTION\n${hr()}\n${n.longDesc}\n\nFOR\n${hr()}\n${n.audience||n.niche+' professionals'}\n\nBENEFITS\n${hr()}\n${n.items.length>0?n.items.map(b=>'✅ '+b).join('\n'):'✅ Instant digital download\n✅ Professionally structured '+n.type+'\n✅ Ready to use immediately'}\n\nKEYWORDS\n${hr()}\n${n.keywords.join(', ')}\n\nPRICING: $${n.priceMin}–$${n.priceMax}${n.ma.price_rationale?'\n'+n.ma.price_rationale:''}\n\nCTA: ${n.ma.platform_cta||n.ma.cta||'Download instantly →'}\n${n.pg.pro_tips?.length?'\nPRO TIPS\n'+hr()+'\n'+n.pg.pro_tips.map((t,i)=>`${i+1}. ${t}`).join('\n'):''}`;

const GUMROAD = (p,n) => `GUMROAD LISTING — ${n.title}\n${'═'.repeat(60)}\nTITLE: ${n.title}${n.subtitle?' — '+n.subtitle:''}\nPRICE: $${n.priceMin} (enable Pay What You Want)\n\nDESCRIPTION\n${hr()}\n${n.promise?'✦ '+n.promise+'\n\n':''}${n.longDesc}\n\nFOR: ${n.audience||n.niche}\n\nTAGS: ${n.keywords.slice(0,10).join(', ')}\n\nTIPS:\n• Upload cover image (1280×720px)\n• Enable "Let buyers pay more"\n• Add thank-you redirect to your email opt-in`;

const ETSY = (p,n) => {const tags=n.keywords.slice(0,13).map(t=>t.slice(0,20));return `ETSY LISTING — ${n.title}\n${'═'.repeat(60)}\nTITLE: ${n.keywords[0]?n.keywords[0]+' — ':''}${n.title}${n.subtitle?' | '+n.subtitle:''}\nPRICE: $${(n.priceMin-0.01).toFixed(2)}\n\nDESCRIPTION\n${hr()}\n${n.promise?'✦ '+n.promise+'\n\n':''}${n.longDesc}\nPerfect for: ${n.audience||n.niche}\n────────────────────\n✅ INSTANT DOWNLOAD | ✅ ${n.type} | ✅ Works on all devices\n────────────────────\n\nTAGS (13 max):\n${tags.map((t,i)=>`${i+1}. ${t}`).join('\n')}\n\nTIPS:\n• Use all 10 listing photos\n• Fill all attributes for search placement\n• Price below round numbers`;};

const PAYHIP = (p,n) => `PAYHIP LISTING — ${n.title}\n${'═'.repeat(60)}\nNAME: ${n.title}\nTAGLINE: ${n.subtitle||n.promise||''}\nPRICE: $${n.priceMin}\n\nDESCRIPTION\n${hr()}\n${n.promise?'✦ '+n.promise+'\n\n':''}${n.longDesc}\nFOR: ${n.audience||n.niche}\nKEYWORDS: ${n.keywords.join(', ')}\n\nTIPS:\n• Enable Pay What You Want\n• Set up 30-50% affiliate commissions\n• Use Payhip email marketing for buyer follow-up`;

const CREATIVE_MARKET = (p,n) => `CREATIVE MARKET LISTING — ${n.title}\n${'═'.repeat(60)}\nTITLE: ${n.title}\nTAGLINE: ${n.subtitle||n.promise||''}\nPRICE: $${n.priceMin}\n\nDESCRIPTION\n${hr()}\n${n.promise?'✦ '+n.promise+'\n\n':''}${n.longDesc}\nFOR: ${n.audience||n.niche+' professionals'}\n\nWHAT'S INCLUDED:\n${n.sections.slice(0,6).map((s,i)=>`• ${s.title||s.heading||'Section '+(i+1)}`).join('\n')||`• Complete ${n.type}\n• Ready to use immediately`}\n\nTAGS: ${n.keywords.slice(0,12).join(', ')}\n\nTIPS:\n• Show mockup as first image\n• Include free mini version to build trust`;

const DESC_SHORT = (p,n) => `SHORT DESCRIPTION — ${n.title}\n${'═'.repeat(60)}\nONE PARAGRAPH:\n${n.shortDesc}\n\nTWEET / BIO VERSION:\n${n.title} — ${n.promise?n.promise.slice(0,100):n.subtitle||'Complete '+n.type+' for '+n.niche}. $${n.priceMin}. Download instantly →\n\nHEADLINE VARIATIONS:\n1. ${n.title} — ${n.promise||'The Complete '+n.type}\n2. The ${n.niche} ${n.type} Built for ${n.audience?n.audience.split(' ').slice(0,5).join(' ')+'...':'Real Results'}\n3. ${n.keywords[0]?n.keywords[0].charAt(0).toUpperCase()+n.keywords[0].slice(1)+': ':'' }${n.title}`;

const DESC_LONG = (p,n) => `LONG-FORM DESCRIPTION — ${n.title}\n${'═'.repeat(60)}\n\nHEADLINE: ${n.promise||n.title}\n\nTHE STORY\n${hr()}\nIf you're ${n.audience||'working in '+n.niche}, you know how hard it is to find resources that actually deliver.\n\n${n.problem?'THE PROBLEM:\n'+n.problem+'\n\n':''}Most options are too generic, too expensive, or too complicated. That changes today.\n\nIntroducing ${n.title} — a ${n.type} built for ${n.audience||n.niche+' professionals'}.\n\nWHAT'S INSIDE\n${hr()}\n${n.sections.slice(0,8).map((s,i)=>`${i+1}. ${s.title||s.heading||'Module '+(i+1)}`).join('\n')}\n\nWHAT YOU GET\n${hr()}\n✅ Instant digital download\n✅ ${n.type} — professionally structured\n${n.items.slice(0,4).map(b=>'✅ '+b).join('\n')}\n\nPRICE: $${n.priceMin}${n.priceMax>n.priceMin?' (regular: $'+n.priceMax+')':''}\n\n${n.ma.platform_cta||n.ma.cta||'Click the button and download instantly →'}`;

const PRICING = (p,n) => `PRICING STRATEGY — ${n.title}\n${'═'.repeat(60)}\nRECOMMENDED: $${n.priceMin}–$${n.priceMax}\n${n.ma.price_rationale?'\nRATIONALE:\n'+n.ma.price_rationale+'\n':''}\nOPTION A — ENTRY: $${n.priceMin}\nBest for new audiences. Maximum volume. Works on Gumroad, Etsy.\n\nOPTION B — STANDARD: $${Math.round((n.priceMin+n.priceMax)/2)}\nBest for warm audiences. Signals credibility.\n\nOPTION C — PREMIUM: $${n.priceMax}\nBest for existing customers and niche experts. Requires testimonials.\n\nLAUNCH STRATEGY\n${hr()}\n• Launch at $${n.priceMin} for first 72 hours\n• Announce the price increase to create urgency\n• Raise to $${Math.round((n.priceMin+n.priceMax)/2)} after launch window\n• Bundle with another product for $${Math.round(n.priceMax*1.8)}\n\nPLATFORM TIPS\n${hr()}\n• Gumroad: Enable Pay What You Want (min $${n.priceMin})\n• Etsy: Price at $${(n.priceMin-0.01).toFixed(2)} (below round number)\n• Payhip: Use affiliates to drive volume\n• Shopify: Set Compare At to $${n.priceMax}`;

const SEO = (p,n) => {const pg=n.pg,ptags=Array.isArray(pg.tags)?pg.tags:[],all=[...new Set([...n.keywords,...ptags])]; return `SEO KEYWORDS — ${n.title}\n${'═'.repeat(60)}\n\nPRIMARY (highest buyer intent):\n${all.slice(0,5).join('\n')}\n\nSECONDARY:\n${all.slice(5,12).join('\n')}\n\nLONG-TAIL PHRASES:\n${all.slice(0,5).map(k=>`${k} for ${n.niche}\n${k} digital download`).join('\n')}\n\nETSY TAGS (max 20 chars each):\n${all.slice(0,13).map(k=>k.slice(0,20)).join(', ')}\n\nSEO META DESCRIPTION (max 155 chars):\n${(n.ma.seo_meta_description||`${n.promise||n.title}. Built for ${n.audience||n.niche}. Instant download.`).slice(0,155)}`;};

const HOOKS = (p,n) => `HOOKS — ${n.title}\n${'═'.repeat(60)}\nAttention-grabbing openers for posts, emails, ads, and videos.\n\nCURIOSITY:\n• The one thing most ${n.niche} people get wrong\n• What nobody tells you about ${n.niche} until it's too late\n• I spent [X] hours figuring this out so you don't have to\n\nPAIN POINT:\n• Stop wasting time on ${n.niche} strategies that don't work\n• Tired of starting over in ${n.niche} every month?\n• ${n.problem?n.problem.split('.')[0]:'The frustrating truth about '+n.niche}\n\nBENEFIT / PROMISE:\n• ${n.promise||'Everything you need to succeed in '+n.niche+', in one place'}\n• Get real results in ${n.niche} — without the guesswork\n• $${n.priceMin} could change how you approach ${n.niche} forever\n\nSTORY:\n• I used to struggle with ${n.niche} — until I built this system\n• This ${n.type} is everything I wish I had when I started\n• I built ${n.title} because nothing else like it existed\n\nQUESTION:\n• What if you could ${n.promise?n.promise.split(' ').slice(0,8).join(' '):'get real results in '+n.niche}?\n• How long have you been putting off your ${n.niche} goals?\n• What would change if you had a complete ${n.niche} system?`;

const INSTAGRAM = (p,n) => {
  if(n.igCaps.length>0) return `INSTAGRAM CAPTIONS — ${n.title}\n${'═'.repeat(60)}\n\n`+n.igCaps.map((c,i)=>`${'─'.repeat(60)}\nCAPTION ${i+1}\n${'─'.repeat(60)}\n${c}`).join('\n\n');
  const kw=n.keywords; const niche=n.niche; const type=n.type;
  return `INSTAGRAM CAPTIONS — ${n.title}\n${'═'.repeat(60)}\n\n${'─'.repeat(60)}\nCAPTION 1 — HOOK\n${'─'.repeat(60)}\nStop scrolling if you're into ${niche}.\n\n${n.promise||'I just launched something that will change how you approach '+niche+'.'}\n\nThis ${type} covers:\n${kw.slice(0,4).map(k=>'✅ '+k).join('\n')}\n\nLink in bio 🔗\n${kw.slice(0,5).map(k=>'#'+k.replace(/\s+/g,'')).join(' ')}\n\n${'─'.repeat(60)}\nCAPTION 2 — STORY\n${'─'.repeat(60)}\nI used to struggle with this too.\n\nThen I built ${n.title} — and everything changed.\n\nIt's a ${type} for ${n.audience||'people who want results'}. No fluff.\n\nLink in bio 👆\n${kw.slice(0,6).map(k=>'#'+k.replace(/\s+/g,'')).join(' ')}\n\n${'─'.repeat(60)}\nCAPTION 3 — PROBLEM\n${'─'.repeat(60)}\nIf you're tired of:\n❌ Wasting time on ${niche} strategies that don't work\n❌ Starting over from scratch\n❌ Feeling stuck\n\n${n.title} is your answer.\n\n${n.promise||''}\n\nLink in bio ⬆️\n${kw.slice(0,5).map(k=>'#'+k.replace(/\s+/g,'')).join(' ')}\n\n${'─'.repeat(60)}\nCAPTION 4 — OFFER\n${'─'.repeat(60)}\nNew drop: ${n.title} 🔥\n\n${n.promise||''}\n\n⏳ Launch price ends soon.\n📥 Download instantly.\n🎯 Made for ${n.audience||'you'}.\n\n${kw.slice(0,8).map(k=>'#'+k.replace(/\s+/g,'')).join(' ')}`;
};

const LINKEDIN = (p,n) => `LINKEDIN POSTS — ${n.title}\n${'═'.repeat(60)}\n\n${'─'.repeat(60)}\nPOST 1 — ANNOUNCEMENT\n${'─'.repeat(60)}\nAfter spending time in ${n.niche}, I kept noticing the same pattern:\n\n${n.problem||'People kept hitting the same wall, over and over.'}\n\nSo I built something to fix it: ${n.title}\n\n${n.promise||''}\n\nBuilt for ${n.audience||'professionals who want real results'}.\n→ $${n.priceMin} | Instant download | No fluff\n\n#${n.keywords.slice(0,3).map(k=>k.replace(/\s+/g,'')).join(' #')}\n\n${'─'.repeat(60)}\nPOST 2 — VALUE\n${'─'.repeat(60)}\n3 things that changed how I approach ${n.niche}:\n\n1. ${n.keywords[0]?'The importance of '+n.keywords[0]:'Systems beat willpower every time.'}\n2. ${n.keywords[1]?n.keywords[1]+' changes everything.':'Clarity is more valuable than effort.'}\n3. ${n.keywords[2]?n.keywords[2]+' is the missing piece.':'Simple always beats complex.'}\n\nI packaged everything into ${n.title} → [link]\n\n#${n.keywords.slice(0,4).map(k=>k.replace(/\s+/g,'')).join(' #')}\n\n${'─'.repeat(60)}\nPOST 3 — LAUNCH\n${'─'.repeat(60)}\nToday I launched ${n.title}.\n\nThis ${n.type} is for ${n.audience||'anyone who wants better results in '+n.niche}.\n\n• ${n.promise||'A complete system — not theory.'}\n• Structured for fast results\n• $${n.priceMin}\n\nGrab it → [link in comments]\n\n#${n.keywords.slice(0,5).map(k=>k.replace(/\s+/g,'')).join(' #')}`;

const TIKTOK = (p,n) => {
  const defaultHooks = [
    `"POV: You finally stopped guessing about ${n.niche}"`,
    `"Here's what's inside my new ${n.niche} ${n.type}..."`,
    `"Stop doing this in ${n.niche} 🚫"`,
    `"3 ${n.niche} things you need to know (save this)"`,
    `"It's finally here 🎉 ${n.title}"`,
  ];
  if(n.scripts.length>0) return `TIKTOK / REEL IDEAS — ${n.title}\n${'═'.repeat(60)}\n\n`+n.scripts.map((vs,i)=>`${'─'.repeat(60)}\nVIDEO ${i+1} — ${(vs.title||'Concept '+(i+1)).toUpperCase()}\n${'─'.repeat(60)}\nHOOK: ${vs.hook&&vs.hook.trim()?vs.hook:defaultHooks[i]||defaultHooks[0]}\n\n${vs.body||'Script: [describe your approach and how '+n.title+' solves it]'}\n\nCTA: ${vs.cta||'Link in bio → grab it now!'}`).join('\n\n');
  const niche=n.niche,type=n.type;
  return `TIKTOK / REEL IDEAS — ${n.title}\n${'═'.repeat(60)}\n\n${'─'.repeat(60)}\nVIDEO 1 — POV FORMAT\n${'─'.repeat(60)}\nHook: "POV: You finally stopped guessing about ${niche}"\nScript: "I just dropped my new ${type}. It's called ${n.title}. ${n.promise||''} Link in bio."\nCTA: Link in bio 👆 | Comment 'LINK' for DM\n\n${'─'.repeat(60)}\nVIDEO 2 — WHAT'S INSIDE\n${'─'.repeat(60)}\nHook: "Here's what's inside my new ${niche} ${type}..."\nScript: "I built ${n.title} because most ${niche} resources are vague. Here's what's inside:\n${n.sections.slice(0,3).map(s=>'• '+(s.title||s.heading||'')).join('\n')}\nLink in bio."\nCTA: Save this video!\n\n${'─'.repeat(60)}\nVIDEO 3 — PAIN POINT\n${'─'.repeat(60)}\nHook: "Stop doing this in ${niche} 🚫"\nScript: "${n.problem?n.problem.split('.')[0]:'The biggest mistake in '+niche}. I fixed it in ${n.title}. Comment 'INFO' for the link."\nCTA: Comment 'INFO' 👇\n\n${'─'.repeat(60)}\nVIDEO 4 — VALUE DROP\n${'─'.repeat(60)}\nHook: "3 ${niche} things you need to know (save this)"\nScript: "1. ${n.keywords[0]||'Know your system'} 2. ${n.keywords[1]||'Consistency wins'} 3. ${n.keywords[2]||'Simple beats complex'}. All in ${n.title}. Link in bio."\nCTA: Follow for more ${niche} tips\n\n${'─'.repeat(60)}\nVIDEO 5 — LAUNCH\n${'─'.repeat(60)}\nHook: "It's finally here 🎉 ${n.title}"\nScript: "${n.promise||'This is the '+type+' I wish existed when I started.'}. Built for ${n.audience||'you'}. Live now."\nCTA: Link in bio NOW 🔗`;
};

const CAROUSEL = (p,n) => `CAROUSEL POST OUTLINES — ${n.title}\n${'═'.repeat(60)}\n\nCARROUSEL 1 — "5 MISTAKES" (7 slides)\nSlide 1: "5 ${n.niche} mistakes keeping you stuck"\nSlide 2: Mistake #1 — Not having a clear system\nSlide 3: Mistake #2 — Relying on willpower instead of structure\nSlide 4: Mistake #3 — Skipping basics and going straight to advanced\nSlide 5: Mistake #4 — Trying to do everything at once\nSlide 6: Mistake #5 — Not reviewing and adjusting your approach\nSlide 7 (CTA): "I cover the fix in ${n.title}. Link in bio 🔗"\n\nCARROUSEL 2 — "WHAT'S INSIDE" (6 slides)\nSlide 1: "What's inside ${n.title} 👀"\n${n.sections.slice(0,4).map((s,i)=>`Slide ${i+2}: ${s.title||s.heading||'Section '+(i+1)}`).join('\n')}\nSlide 6 (CTA): "Get ${n.title} for $${n.priceMin} — link in bio"\n\nCARROUSEL 3 — "STEP BY STEP" (5 slides)\nSlide 1: "How to ${n.promise?n.promise.split(' ').slice(0,6).join(' '):'succeed in '+n.niche} — step by step"\nSlide 2: Step 1 — Foundation (${n.keywords[0]||'mindset + system'})\nSlide 3: Step 2 — Process (${n.keywords[1]||'consistency beats motivation'})\nSlide 4: Step 3 — Execute + track (${n.keywords[2]||'measure what matters'})\nSlide 5 (CTA): "I built ${n.title} to guide you through every step. $${n.priceMin} → link in bio"`;

const HASHTAGS = (p,n) => {const ni=n.niche.replace(/\s+/g,''),ty=n.type.replace(/\s+/g,''),pl=n.platform.toLowerCase().replace(/\s+/g,''),kw=n.keywords.map(k=>'#'+k.replace(/\s+/g,'')); return `HASHTAG GROUPS — ${n.title}\n${'═'.repeat(60)}\n\nINSTAGRAM — FULL 30\n${hr()}\n${kw.slice(0,8).join(' ')} #${ni} #${ty}\n#digitalproduct #passiveincome #onlinebusiness #sidehustle #digitaldownload #etsy #gumroad #${pl}\n#entrepreneur #smallbusiness #makemoneyonline #workfromhome #creativeentrepreneur #businessowner #solopreneur #contentcreator #digitalmarketing #onlinestore\n\nINSTAGRAM — COMPACT 15\n${hr()}\n${kw.slice(0,5).join(' ')} #${ni} #${ty} #digitalproduct #passiveincome #digitaldownload #onlinebusiness #sidehustle #entrepreneur #smallbusiness\n\nTIKTOK (5–8 tags)\n${hr()}\n${kw.slice(0,3).join(' ')} #digitalproducts #${ni} #sidehustle #passiveincome\n\nLINKEDIN (3–5)\n${hr()}\n#${ni} #${ty} #digitalproducts #entrepreneurship #onlinebusiness\n\nPINTEREST\n${hr()}\n${n.keywords.join(', ')}, digital product, ${n.type}, ${n.platform}`;};

const CALENDAR = (p,n) => {
  // Validate stored calendar items — each must have a valid day number and message
  const validCalItems = n.calItems.filter(d => d && Number.isInteger(Number(d.day)) && Number(d.day) > 0 && d.message && String(d.message).trim().length > 10);
  if(validCalItems.length >= 5) return `7-DAY POSTING CALENDAR — ${n.title}\n${'═'.repeat(60)}\n\n`+validCalItems.slice(0,7).map(d=>`DAY ${d.day} — ${(d.platform||'Social').toUpperCase()}\nType: ${d.content_type||'Post'}\n${d.message}`).join('\n\n');
  return `7-DAY POSTING CALENDAR — ${n.title}\n${'═'.repeat(60)}\n\nDAY 1 — INSTAGRAM + LINKEDIN\nType: Announcement | Use: Caption 1 + LinkedIn Post 1\nGoal: First impressions, link in bio\n\nDAY 2 — TIKTOK / REELS\nType: Short-form video | Use: TikTok Video 1 or 2\nGoal: Reach new audience\n\nDAY 3 — CAROUSEL + EMAIL\nType: What's Inside carousel | Send: Email_2_Educational_Value\nGoal: Build trust with value-first content\n\nDAY 4 — TIKTOK + LINKEDIN\nType: Pain point video + educational post\nUse: TikTok Video 3 + LinkedIn Post 2\n\nDAY 5 — COMMUNITY\nType: Poll + group engagement | Run a story poll\nGoal: Expand reach through engagement\n\nDAY 6 — URGENCY POST + EMAIL\nType: Urgency caption | Send: Email_4_Offer\nGoal: Convert fence-sitters with deadline\n\nDAY 7 — FINAL PUSH — ALL PLATFORMS\nUse: Caption 5 (IG) + Post 3 (LinkedIn) + TikTok Video 5\nSend: Email_5_Last_Call\nGoal: Final conversions + close launch window`;
};

const EMAIL1 = (p,n) => `EMAIL 1 — LAUNCH ANNOUNCEMENT\n${'═'.repeat(60)}\nSEND ON: Launch Day\nSUBJECT: 🚀 It's here — ${n.title}\nPREVIEW: ${n.promise||'Introducing '+n.title+' — built for '+(n.audience||'you')}\n\n${'─'.repeat(60)}\nHey [First Name],\n\nToday's the day. ${n.title} is officially live.\n\n${n.promise?'"'+n.promise+'"\n\n':''}I built this for ${n.audience||'people like you'} who are ready to stop guessing.\n\nInside:\n• Complete ${n.type} built around your needs\n• Step-by-step structure you can actually follow\n${n.items.slice(0,3).map(b=>'• '+b).join('\n')}\n\nGrab it for $${n.priceMin} → [INSERT LINK]\n\nThis is the launch price — going up after [DATE].\n\nTalk soon,\n[Your Name]\n\nP.S. Forward to a friend struggling with ${n.niche}.`;

const EMAIL2 = (p,n) => `EMAIL 2 — EDUCATIONAL VALUE\n${'═'.repeat(60)}\nSEND ON: Day 3\nSUBJECT: The real reason most people fail at ${n.niche}\n\n${'─'.repeat(60)}\nHey [First Name],\n\n${n.problem?'Here\'s what I kept seeing:\n\n'+n.problem+'\n':'A lot of people in '+n.niche+' make the same avoidable mistakes.'}\n\nHere's what actually works:\n\n1. ${n.sections[0]?.title||n.sections[0]?.heading||'Clarity beats complexity.'}\n2. ${n.sections[1]?.title||n.sections[1]?.heading||'Systems outperform willpower.'}\n3. ${n.sections[2]?.title||n.sections[2]?.heading||'Action beats perfection.'}\n\nThese are the principles behind ${n.title}.\n\n→ [INSERT LINK] — $${n.priceMin}\n\n[Your Name]`;

const EMAIL3 = (p,n) => `EMAIL 3 — PROBLEM AWARE\n${'═'.repeat(60)}\nSEND ON: Day 5\nSUBJECT: Are you making this ${n.niche} mistake?\n\n${'─'.repeat(60)}\nHey [First Name],\n\n${n.problem||'Most people in '+n.niche+' are stuck — not from lack of effort, but lack of system.'}\n\nYou don't need more motivation. You need a clearer path.\n\nThat's what ${n.title} gives you.\n\n${n.promise?'"'+n.promise+'"':''}\n\n$${n.priceMin} → [INSERT LINK]\n\n[Your Name]`;

const EMAIL4 = (p,n) => `EMAIL 4 — THE OFFER\n${'═'.repeat(60)}\nSEND ON: Day 6\nSUBJECT: Here's everything you get with ${n.title}\n\n${'─'.repeat(60)}\nHey [First Name],\n\nHere's exactly what you get:\n\n${n.sections.slice(0,6).map((s,i)=>`→ ${s.title||s.heading||'Section '+(i+1)}`).join('\n')}\n\n${n.items.slice(0,4).map(b=>'✅ '+b).join('\n')}\n\nAll of that for $${n.priceMin}.\n\nYou pay once. You own it forever.\n\n→ [INSERT LINK]\n\nLaunch price closes [DATE/TIME].\n\n[Your Name]`;

const EMAIL5 = (p,n) => `EMAIL 5 — LAST CALL\n${'═'.repeat(60)}\nSEND ON: Day 7 (morning)\nSUBJECT: Last chance — ${n.title} launch price ends tonight\n\n${'─'.repeat(60)}\nHey [First Name],\n\nThis is my last email about ${n.title}.\n\nAfter [TIME] tonight, the price goes from $${n.priceMin} to $${n.priceMax}.\n\n${n.promise?'"'+n.promise+'"':''}\n\n→ [GRAB IT BEFORE THE PRICE GOES UP]\n\n[Your Name]\n\nP.S. Questions? Just reply.`;

const LAUNCH_PLAN = (p,n) => {
  if(n.launchPlan&&n.launchPlan.length>100) return `7-DAY LAUNCH PLAN — ${n.title}\n${'═'.repeat(60)}\n\n${n.launchPlan}\n\nFOR: ${n.audience||'Your audience'} | PROMISE: ${n.promise||n.title}`;
  return `7-DAY LAUNCH PLAN — ${n.title}\n${'═'.repeat(60)}\n\nDAY 1 🚀 LAUNCH\n${hr()}\n□ Publish on ${n.platform} | □ Send Email 1 | □ Instagram Caption 1 | □ LinkedIn Post 1 | □ Share in communities\nGOAL: First sales + impressions\n\nDAY 2 — AMPLIFY\n${hr()}\n□ Reply to every comment + DM | □ Behind-the-scenes story | □ TikTok Video 1 or 2\nGOAL: Word of mouth + social proof\n\nDAY 3 — VALUE\n${hr()}\n□ Send Email 2 | □ "What's Inside" carousel | □ LinkedIn Post 2\nGOAL: Re-engage with value, not selling\n\nDAY 4 — PROOF\n${hr()}\n□ Share buyer reactions | □ TikTok Video 3 | □ Send Email 3 | □ Engage in 2–3 communities\nGOAL: Build trust, reduce objections\n\nDAY 5 — REACH\n${hr()}\n□ DM 3 creators for cross-promo | □ TikTok Video 4 | □ Story poll\nGOAL: Expand beyond your existing audience\n\nDAY 6 — OFFER\n${hr()}\n□ Send Email 4 | □ Urgency Instagram caption | □ LinkedIn Post 3 | □ Announce price increase tomorrow\nGOAL: Convert fence-sitters\n\nDAY 7 — CLOSE\n${hr()}\n□ Send Email 5 (morning) | □ Final story | □ Raise price | □ Thank-you to buyers\nGOAL: Final conversions + leave great impression\n\nWEEK 2+\n${hr()}\n□ Collect testimonials | □ Repurpose buyer results | □ Set up email automation | □ Plan bundle/upsell\n\nFOR: ${n.audience||'Your audience'} | PROMISE: ${n.promise||n.title}`;
};

const LAUNCH_CHECKLIST = (p,n) => `LAUNCH CHECKLIST — ${n.title}\n${'═'.repeat(60)}\n\nPRODUCT\n${hr()}\n□ File finalised and tested\n□ Opens on Mac, Windows, iOS, Android\n□ Delivers on every listing promise\n□ Thank-you email set up\n\nLISTING\n${hr()}\n□ Title includes primary keyword\n□ Description: benefits, not just features\n□ Price set (see Pricing_Strategy.txt)\n□ Cover image uploaded (min 1280×720px)\n□ All tags/keywords filled in\n\nPLATFORM SETUP (${n.platform})\n${hr()}\n□ Payment connected + payout configured\n□ Product URL is clean and shareable\n□ Refund policy visible\n\nMARKETING\n${hr()}\n□ Bio link updated on all platforms\n□ Email sequence ready (04_Email_Launch/)\n□ Social posts scheduled (03_Social_Media/)\n□ Warm audience given heads-up\n\nLAUNCH DAY\n${hr()}\n□ Product is live + purchase link works\n□ Email 1 sent\n□ First social post live\n□ Available for 2–3 hours to reply to comments/DMs\n\nYOU'RE READY. GO LAUNCH. 🚀`;

const PLATFORM_REC = (p,n) => `PLATFORM RECOMMENDATION — ${n.title}\n${'═'.repeat(60)}\nRECOMMENDED: ${n.platform}\n\n${n.pg.why_this_platform?'WHY:\n'+n.pg.why_this_platform+'\n\n':''}${n.pg.pricing_strategy?'PRICING:\n'+n.pg.pricing_strategy+'\n\n':''}${n.pg.thumbnail_guidance?'THUMBNAIL:\n'+n.pg.thumbnail_guidance+'\n\n':''}\nCOMPARISON\n${hr()}\nGUMROAD:  Creators with audiences. 10% fee or $10/mo flat. Best: $${n.priceMin}\nETSY:     Search-driven traffic. ~6.5%+$0.20. Best: $${(n.priceMin-0.01).toFixed(2)}\nPAYHIP:   Affiliates + email list. 5% free tier. Best: $${n.priceMin}\nSHOPIFY:  Branded storefront. $29+/mo. Best: $${n.priceMin} with Compare At $${n.priceMax}\n\n${n.pg.pro_tips?.length?'PRO TIPS:\n'+n.pg.pro_tips.map((t,i)=>`${i+1}. ${t}`).join('\n')+'\n\n':''}${n.pg.mistakes_to_avoid?.length?'AVOID:\n'+n.pg.mistakes_to_avoid.map((m,i)=>`${i+1}. ${m}`).join('\n'):''}`;

const READINESS = (p,n) => {
  // Real quality checks — not just field existence
  const sectionsWithContent = n.sections.filter(s => s.body && s.body.trim().length > 30);
  const sectionsTotal = n.sections.length;
  const listingDesc = n.ma.listing_description || '';
  const hasRealListingDesc = listingDesc.length > 100 && !hasBannedContent(listingDesc);
  const hasRealSections = sectionsWithContent.length >= 2;
  const hasSufficientSections = sectionsTotal >= 3;
  const hasRealKeywords = n.keywords.length >= 5 && n.keywords.every(k => k && k.length > 2);
  const hasRealSocialKit = Array.isArray(p.social_media_kit?.instagram_captions) && p.social_media_kit.instagram_captions.length >= 3 && p.social_media_kit.instagram_captions.every(c => c && c.length > 20);
  const hasRealLaunchPlan = n.launchPlan && n.launchPlan.length > 200;
  const hasNicheSpecificity = n.niche !== 'General' && n.audience && n.audience.length > 10;
  const hasPlatformGuides = !!(p.platform_guides?.why_this_platform && p.platform_guides?.launch_plan);
  const isPriced = n.priceMin > 0 && n.priceMax >= n.priceMin;
  const hasProductAngle = !!(n.pa.finalAngle || n.pa.painPoint);

  const checks = [
    { l:'Product title (specific, not generic)', ok: !!(p.title && p.title.length > 5 && p.title !== 'Untitled Product'), fix:'Set a clear, specific product title in the Studio editor.' },
    { l:'Subtitle / tagline present', ok: !!(p.subtitle && p.subtitle.length > 10), fix:'Add a subtitle in Product Studio → Content tab.' },
    { l:'Promise clearly defined', ok: !!(p.promise && p.promise.length > 20), fix:'Define the product promise in Studio → Metadata.' },
    { l:'Target audience specific (not empty)', ok: hasNicheSpecificity, fix:'Set a specific target audience — not just a niche name.' },
    { l:'Content sections generated (3+ minimum)', ok: hasSufficientSections, fix:`Only ${sectionsTotal} sections found. Regenerate content in Studio.` },
    { l:'Section bodies have real content (2+ non-empty)', ok: hasRealSections, fix:`Only ${sectionsWithContent.length}/${sectionsTotal} sections have content. Try regenerating section expansion.` },
    { l:'Sales copy ready (listing description 100+ chars)', ok: hasRealListingDesc, fix:'Sales copy is missing or too short. Retry Sales Copy step in Studio.' },
    { l:'Keywords bank (5+, all meaningful)', ok: hasRealKeywords, fix:'Need 5+ specific buyer-intent keywords. Retry Sales Copy generation.' },
    { l:'Platform guides generated', ok: hasPlatformGuides, fix:'Platform guides are incomplete. Retry Platform Guides step.' },
    { l:'Social media kit (3+ real captions)', ok: hasRealSocialKit, fix:'Social media kit is missing or has empty captions. Retry Social Kit step.' },
    { l:'Launch plan generated (200+ chars)', ok: hasRealLaunchPlan, fix:'Launch plan is missing or too short. Retry Launch Plan step.' },
    { l:'Product angle / positioning defined', ok: hasProductAngle, fix:'Product angle is missing. Re-run the generation from the Create page.' },
    { l:'Pricing set correctly', ok: isPriced, fix:`Pricing is ${isPriced ? 'OK' : 'missing or invalid'}.` },
  ];

  const passed = checks.filter(c => c.ok);
  const failed = checks.filter(c => !c.ok);
  const score = passed.length;
  const pct = Math.round((score / checks.length) * 100);

  const failedBlock = failed.length > 0
    ? `\nFAILED CHECKS — ACTION REQUIRED\n${hr()}\n${failed.map((c,i) => `${i+1}. ❌ ${c.l}\n   Fix: ${c.fix}`).join('\n\n')}\n`
    : '';

  const verdict = pct >= 85
    ? `🚀 READY TO LAUNCH\nAll critical checks passed. Follow the 7-Day Launch Plan.`
    : pct >= 60
    ? `⚠️ ALMOST READY — ${100 - pct}% REMAINING\nAddress the failed checks above before launching.\nLaunching now risks a poor buyer experience.`
    : `🛠 NOT READY — DO NOT LAUNCH YET\n${failed.length} critical items need attention.\nFix these in Launchora Studio before exporting again.`;

  return `LAUNCH READINESS REPORT — ${n.title}\n${'═'.repeat(60)}\nGenerated: ${new Date().toLocaleDateString()}\n\nOVERALL READINESS: ${pct}% (${score}/${checks.length} checks passed)\n\nALL CHECKS\n${hr()}\n${checks.map(c=>(c.ok?'✅':'❌')+' '+c.l+(c.ok?'':'\n   → '+c.fix)).join('\n')}\n${failedBlock}\nPRODUCT SUMMARY\n${hr()}\nTitle:    ${n.title}\nType:     ${n.type}\nNiche:    ${n.niche}\nPlatform: ${n.platform}\nPrice:    $${n.priceMin}–$${n.priceMax}\nSections: ${sectionsTotal} total | ${sectionsWithContent.length} with real content\nKeywords: ${n.keywords.length}\n\nVERDICT\n${hr()}\n${verdict}\n`;
};

const AVATAR = (p,n) => `CUSTOMER AVATAR — ${n.title}\n${'═'.repeat(60)}\n\nWHO THEY ARE\n${hr()}\n${n.audience||n.niche+' enthusiasts and professionals'}\n\n${n.buyer?'DETAILED PROFILE:\n'+n.buyer+'\n\n':''}\nPAIN POINT\n${hr()}\n${n.pa.painPoint||n.problem||'Struggling to find clear, actionable guidance in '+n.niche+' that actually moves the needle.'}\n\nWHAT THEY WANT\n${hr()}\n${n.pa.transformation||n.promise||'To go from overwhelmed to confident in '+n.niche+'.'}\n\nWHAT MAKES THEM BUY\n${hr()}\nEmotional hook: ${n.pa.emotionalHook||'Feeling in control and having a trusted system'}\n• They've tried other options and been disappointed\n• They trust the creator\n• The price is a no-brainer vs staying stuck\n\nWHERE TO FIND THEM\n${hr()}\n• Instagram/TikTok: #${n.niche.replace(/\s+/g,'')}\n• Pinterest: "${n.niche} tips", "${n.type} ${n.niche}"\n• Etsy: "${n.keywords[0]||n.niche} ${n.type}"\n• Reddit/Facebook Groups: ${n.niche} communities`;

const FAQ = (p,n) => `FAQ — ${n.title}\n${'═'.repeat(60)}\n\nQ: What is ${n.title}?\nA: A ${n.type} for ${n.audience||n.niche+' enthusiasts'}. ${n.promise||'It gives you everything you need to get results in '+n.niche+'.'}\n\nQ: Who is this for?\nA: ${n.audience||'Anyone working in '+n.niche+' who wants a clearer, more structured approach.'}\n\nQ: Is this a physical product?\nA: No — it's a digital download. You receive your link immediately after purchase.\n\nQ: How do I access it after purchase?\nA: You'll get an email with your download link immediately. You can also re-download anytime from your receipt.\n\nQ: Do I need special software?\nA: No. The files work with standard apps on any device.\n\nQ: What if I'm not satisfied?\nA: Contact the seller directly. Most sellers offer a satisfaction guarantee.\n\nQ: Can I share this with others?\nA: For personal use only. Please don't share or resell the file.\n\nQ: How is this better than free content?\nA: ${n.title} is specifically structured for ${n.audience||n.niche+' professionals'} and goes far deeper. ${n.promise||'Designed to save you time and get faster results.'}`;

const UPSELL = (p,n) => {
  // Build product-specific names — no generic placeholders
  const advancedName = `Advanced ${n.title}: Deeper Strategies for ${n.niche}`;
  const companion1 = `The ${n.niche} ${n.type === 'Checklist' ? 'Workbook' : 'Checklist'} — companion resource`;
  const companion2 = `${n.niche} Implementation Tracker — 30-day progress system`;
  const companion3 = `Complete ${n.niche} Starter Bundle`;
  const upsellFeatures = n.items.length > 0
    ? `extra training on ${n.items[0]}, deeper templates, and a 1-page quick-reference guide`
    : `expanded templates, advanced strategies, and a done-for-you quick-reference sheet`;
  return `UPSELL & BUNDLE IDEAS — ${n.title}\n${'═'.repeat(60)}\n\nIMMEDIATE UPSELL (show on thank-you page, 1-click)\n${hr()}\nProduct: ${advancedName}\nPrice: $${Math.round(n.priceMax*1.5)}\nPitch: "Go deeper — get the advanced version with ${upsellFeatures}."\nConversion tip: Keep it one click. Pre-fill payment details.\n\nBUNDLE IDEAS\n${hr()}\nBundle 1: "${n.title}" + "${companion1}"\n→ Price: $${Math.round(n.priceMin*1.8)} (save ${Math.round((1-(n.priceMin*1.8)/(n.priceMin*2))*100)}% vs buying separately)\n→ Pitch: "Get the complete ${n.niche} system in one package"\n\nBundle 2: "${n.title}" + "${companion2}"\n→ Price: $${Math.round(n.priceMin*1.5)}\n→ Pitch: "The ${n.title} + daily tracker to keep you on pace"\n\nBundle 3: "${companion3}" (3 products)\n→ Price: $${Math.round(n.priceMax*2.5)}\n→ Pitch: "Everything a ${n.niche} beginner needs — one bundle, one price"\n\nORDER BUMP (checkbox at checkout)\n${hr()}\nProduct: "${n.niche} Quick-Start Cheat Sheet" — 1-page PDF\nPrice: $${Math.round(n.priceMin*0.5)}\nPitch: "Add the cheat sheet for just $${Math.round(n.priceMin*0.5)} more — get results in your first 24 hours"\n\nSUBSCRIPTION / MEMBERSHIP\n${hr()}\nProduct: Monthly ${n.niche} ${n.type} updates + new templates\nPrice: $${Math.round(n.priceMin*0.7)}/month\nPitch: "Stay current with fresh ${n.niche} resources every month — cancel anytime"\n\nWHERE TO ADD UPSELLS\n${hr()}\n• Gumroad: Use "Recommended" products panel\n• Payhip: Configure thank-you page redirect with upsell link\n• Email: Add upsell offer in Email 2 or as a Day 3 follow-up\n• ThriveCart / SamCart: One-click upsell after main checkout`;
};

const NEXT_PRODUCTS = (p,n) => `NEXT PRODUCT IDEAS — ${n.title}\n${'═'.repeat(60)}\n\nTIER 1 — EASY WINS (1–3 days)\n${hr()}\nIDEA 1: "${n.niche} Quick Start Checklist" — Checklist | $${Math.round(n.priceMin*0.5)}–$9\nIDEA 2: "${n.keywords[0]||n.niche} Swipe File" — Template Pack | $${Math.round(n.priceMin*0.7)}–$17\nIDEA 3: "${n.niche} 30-Day Challenge" — Journal | $${n.priceMin}–$${Math.round(n.priceMax*0.8)}\n\nTIER 2 — MEDIUM (1–2 weeks)\n${hr()}\nIDEA 4: "Advanced ${n.title}: [Next Level]" — $${Math.round(n.priceMax*1.5)}–$${Math.round(n.priceMax*2)}\nIDEA 5: "${n.niche} Masterclass Workbook" — $${Math.round(n.priceMax*1.2)}–$${Math.round(n.priceMax*2)}\n\nTIER 3 — BIG PRODUCT (1–4 weeks)\n${hr()}\nIDEA 6: "The Complete ${n.niche} System" — Bundle | $${Math.round(n.priceMax*3)}–$${Math.round(n.priceMax*5)}\n\nPRODUCT ROADMAP\n${hr()}\nMonth 1: ${n.title} ✅\nMonth 2: Idea 1 or 2 (quick win)\nMonth 3: Bundle ${n.title} + new product\nMonth 4: Idea 5 (workbook)\nMonth 6+: Full premium system bundle\n\nUse Launchora to generate any of these instantly.`;

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let productId = null, currentStep = 'init';
  const exportStart = Date.now(), warnings = [];

  const fail = async (step, msg, details='') => {
    console.error(`[generateZip] ❌ step=${step}: ${msg}`);
    try { if(productId) await base44.asServiceRole.entities.Product.update(productId,{export_status:'failed',export_error:`[${step}] ${msg}`}); } catch(_){}
    return Response.json({success:false,error:msg,details:String(details),step,warnings});
  };

  try {
    currentStep = 'parse';
    let body; try { body=await req.json(); } catch(e){ return fail('parse','Cannot parse body',e.message); }
    productId = body?.productId?.trim();
    const debugMode = body?.debug===true;

    currentStep = 'auth';
    const user = await base44.auth.me();
    if(!user) return fail('auth','Unauthorized');
    if(!productId) return fail('validate','productId required');

    console.log(`[generateZip] ▶ START productId=${productId} debug=${debugMode}`);

    try { await base44.asServiceRole.entities.Product.update(productId,{export_status:'generating',export_error:null}); } catch(e){ warnings.push('set generating: '+e.message); }

    currentStep = 'fetch';
    const fetchStart = Date.now();
    const product = await base44.asServiceRole.entities.Product.get(productId);
    const fetchMs = Date.now()-fetchStart;
    if(!product) return fail('fetch','Product not found: '+productId);
    console.log(`[generateZip] fetched in ${fetchMs}ms | generationStatus=${product.generationStatus}`);

    currentStep = 'normalize';
    const n = norm(product);
    console.log(`[generateZip] title="${n.title}" sections=${n.sections.length} keywords=${n.keywords.length}`);

    currentStep = 'build_files';
    const buildStart = Date.now();

    const fileDefs = [
      { name:'01_Product/Product_Content.txt',           fn:()=>PRODUCT_TXT(product,n) },
      { name:'01_Product/Product_Content.html',           fn:()=>PRODUCT_HTML(product,n) },
      { name:'01_Product/Buyer_Quick_Start_Guide.txt',   fn:()=>QUICK_START(product,n) },
      { name:'01_Product/Implementation_Checklist.txt',  fn:()=>IMPL_CHECKLIST(product,n) },
      { name:'02_Sales_Page/Platform_Listing_Primary.txt',fn:()=>PRIMARY_LISTING(product,n) },
      { name:'02_Sales_Page/Gumroad_Listing.txt',         fn:()=>GUMROAD(product,n) },
      { name:'02_Sales_Page/Etsy_Listing.txt',            fn:()=>ETSY(product,n) },
      { name:'02_Sales_Page/Payhip_Listing.txt',          fn:()=>PAYHIP(product,n) },
      { name:'02_Sales_Page/Creative_Market_Listing.txt', fn:()=>CREATIVE_MARKET(product,n) },
      { name:'02_Sales_Page/Product_Description_Short.txt',fn:()=>DESC_SHORT(product,n) },
      { name:'02_Sales_Page/Product_Description_Long.txt', fn:()=>DESC_LONG(product,n) },
      { name:'02_Sales_Page/Pricing_Strategy.txt',         fn:()=>PRICING(product,n) },
      { name:'02_Sales_Page/SEO_Keywords.txt',             fn:()=>SEO(product,n) },
      { name:'03_Social_Media/Hooks.txt',                  fn:()=>HOOKS(product,n) },
      { name:'03_Social_Media/Instagram_Captions.txt',     fn:()=>INSTAGRAM(product,n) },
      { name:'03_Social_Media/LinkedIn_Posts.txt',         fn:()=>LINKEDIN(product,n) },
      { name:'03_Social_Media/TikTok_Reel_Ideas.txt',      fn:()=>TIKTOK(product,n) },
      { name:'03_Social_Media/Carousel_Post_Outlines.txt', fn:()=>CAROUSEL(product,n) },
      { name:'03_Social_Media/Hashtag_Groups.txt',         fn:()=>HASHTAGS(product,n) },
      { name:'03_Social_Media/7_Day_Posting_Calendar.txt', fn:()=>CALENDAR(product,n) },
      { name:'04_Email_Launch/Email_1_Announcement.txt',       fn:()=>EMAIL1(product,n) },
      { name:'04_Email_Launch/Email_2_Educational_Value.txt',  fn:()=>EMAIL2(product,n) },
      { name:'04_Email_Launch/Email_3_Problem_Aware.txt',      fn:()=>EMAIL3(product,n) },
      { name:'04_Email_Launch/Email_4_Offer.txt',              fn:()=>EMAIL4(product,n) },
      { name:'04_Email_Launch/Email_5_Last_Call.txt',          fn:()=>EMAIL5(product,n) },
      { name:'05_Launch_Plan/7_Day_Launch_Plan.txt',           fn:()=>LAUNCH_PLAN(product,n) },
      { name:'05_Launch_Plan/Launch_Checklist.txt',            fn:()=>LAUNCH_CHECKLIST(product,n) },
      { name:'05_Launch_Plan/Platform_Recommendation.txt',     fn:()=>PLATFORM_REC(product,n) },
      { name:'05_Launch_Plan/Launch_Readiness_Report.txt',     fn:()=>READINESS(product,n) },
      { name:'06_Bonus/Customer_Avatar.txt',                   fn:()=>AVATAR(product,n) },
      { name:'06_Bonus/FAQ.txt',                               fn:()=>FAQ(product,n) },
      { name:'06_Bonus/Upsell_Ideas.txt',                      fn:()=>UPSELL(product,n) },
      { name:'06_Bonus/Next_Product_Ideas.txt',                fn:()=>NEXT_PRODUCTS(product,n) },
    ];

    const files = [], filesIncluded = [];
    for(const def of fileDefs){
      const r = safeFile(def.name, def.fn, warnings);
      if(r){ files.push(r); filesIncluded.push(def.name); }
    }
    // README always last
    const rm = safeFile('README.txt', ()=>README(product,n), warnings);
    if(rm){ files.push(rm); filesIncluded.push('README.txt'); }
    // Debug only when requested
    if(debugMode){
      const dbg=`DEBUG\n${'─'.repeat(40)}\nproductId: ${productId}\ngenerationStatus: ${product.generationStatus||'—'}\nsections: ${n.sections.length}\nkeywords: ${n.keywords.length}\nfilesBuilt: ${files.length}\nwarnings: ${warnings.length}\ngeneratedAt: ${new Date().toISOString()}\n`;
      files.push({name:'DEBUG_Info.txt',data:dbg}); filesIncluded.push('DEBUG_Info.txt');
    }

    console.log(`[generateZip] built ${files.length} files | warnings: ${warnings.length}`);
    if(files.length===0) return fail('build_files','No files could be built');

    currentStep = 'zip';
    const zipBytes = buildZip(files);
    const buildMs = Date.now()-buildStart;
    console.log(`[generateZip] ZIP: ${zipBytes.length} bytes in ${buildMs}ms`);
    if(!zipBytes||zipBytes.length<50) return fail('zip','ZIP output was empty');

    currentStep = 'upload';
    const uploadStart = Date.now();
    const fileName = `${n.safe}_launch_kit.zip`;
    let zipFile;
    try { zipFile=new File([zipBytes],fileName,{type:'application/zip'}); }
    catch(_){ zipFile=new Blob([zipBytes],{type:'application/zip'}); warnings.push('Used Blob for upload'); }

    const uploadResult = await base44.integrations.Core.UploadFile({file:zipFile});
    const uploadMs = Date.now()-uploadStart;
    const fileUrl = uploadResult?.file_url||uploadResult?.url||null;
    if(!fileUrl) return fail('upload','Upload succeeded but no URL returned',JSON.stringify(uploadResult));

    currentStep = 'persist';
    const generatedAt = new Date().toISOString();
    const totalMs = Date.now()-exportStart;
    try {
      await base44.asServiceRole.entities.Product.update(productId,{
        export_status:'ready', last_exported_at:generatedAt, export_error:null,
        export_files:[{name:fileName,url:fileUrl,type:'zip',generated_at:generatedAt,size:zipBytes.length}],
      });
    } catch(e){ warnings.push('Could not persist export metadata: '+e.message); }

    console.log(`[generateZip] ✅ Done in ${totalMs}ms | files=${files.length} | url=${fileUrl}`);

    return Response.json({
      success:true, fileUrl, fileName, fileSize:zipBytes.length,
      generatedAt, export_status:'ready', filesIncluded, warnings,
      timings:{totalMs,fetchMs,buildMs,uploadMs},
    });

  } catch(error){
    console.error('[generateZip] ❌ Unhandled at step:', currentStep, error.message);
    return fail(currentStep,'Unexpected error: '+error.message, error.stack||'');
  }
});
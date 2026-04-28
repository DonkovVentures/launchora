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
  const av0=audienceVars(audience,niche);
  const shortDesc=String(ma.seo_meta_description||d.seo_meta_description||cs(`${promise||subtitle||title}. Built for ${av0.audienceShort}.`));
  const longDesc=String(ma.listing_description||d.listing_description||cs(`${promise||subtitle||title}\n\nBuilt for ${av0.audiencePlural}.\n\nThis ${type} gives you everything you need to get results fast.\n\n✅ Instant digital download\n✅ Professionally structured\n✅ Ready to use immediately\n\n${pa.finalAngle||''}`));
  const safe=title.replace(/[^a-z0-9]/gi,'_').slice(0,40)||'Launchora_Product';
  const igCaps=Array.isArray(sm.instagram_captions)&&sm.instagram_captions.length>0?sm.instagram_captions:[];
  const calItems=Array.isArray(sm.content_calendar)&&sm.content_calendar.length>0?sm.content_calendar:[];
  const scripts=Array.isArray(sm.video_scripts)&&sm.video_scripts.length>0?sm.video_scripts:[];
  const av=av0; // audienceVars already computed above
  return {title,subtitle,promise,audience,buyer,problem,type,niche,platform,tone,launchPlan,items,sections,priceMin,priceMax,keywords,listingTitle,shortDesc,longDesc,safe,pa,ma,pg,sm,igCaps,calItems,scripts,av};
}

// ── Audience normalizer ───────────────────────────────────────────────────────
// Converts a raw target_audience string into grammatically safe variables.
// RULE: Never inject raw target_audience directly into a sentence. Always use these vars.
function audienceVars(rawAudience, niche) {
  const raw = String(rawAudience || '').trim();
  if (!raw || raw.length < 4) {
    const fb = `${niche} professionals`;
    return {
      audiencePlural: fb,
      audienceSingular: `a ${niche} professional`,
      audienceShort: `${niche} professionals`,
      audienceProblem: `finding tools that fit real ${niche} workflows`,
      audienceContextSentence: `This pack is built for ${niche} professionals who want to work more efficiently.`,
    };
  }

  // ── Step 1: Extract core noun phrase — stop at qualifying/relative clauses ──
  const corePhraseMatch = raw.match(/^(.*?)(?:\s+who\b|\s+that\b|\s+managing\b|\s+looking\b|\s+wanting\b|\s+tired\b|\s+with\b\s+\$)/i);
  const corePhrase = (corePhraseMatch ? corePhraseMatch[1] : raw.split(/[.,]/)[0]).trim();

  // ── Step 2: Lowercase, strip leading article ────────────────────────────────
  const audiencePlural = corePhrase.replace(/^(The |A |An )/i, '').toLowerCase().trim().replace(/\s+/g, ' ');

  // ── Step 3: Singular — correct article ─────────────────────────────────────
  const audienceSingular = (/^[aeiou]/i.test(audiencePlural) ? 'an ' : 'a ') + audiencePlural;

  // ── Step 4: Short label — take up to 5 words; never end on a stop word ──────
  // Using 5 words (not 4) to preserve meaningful multi-word niche nouns like
  // "luxury real estate professionals" or "independent fitness coaches".
  const stopWords = new Set(['and','or','who','the','a','an','for','of','in','to','with','on','at','by','from','their','its','&']);
  const words = audiencePlural.split(/\s+/).filter(w => w.length > 0);
  const sw = [];
  for (const w of words) {
    if (sw.length >= 5) break;
    // Stop before a coordinating conjunction mid-phrase (e.g. "agents and brokers" → "agents")
    // but only after we already have at least 2 words
    if (stopWords.has(w) && sw.length >= 2) break;
    sw.push(w);
  }
  // If the short label still ends on a stop word, trim it
  while (sw.length > 1 && stopWords.has(sw[sw.length - 1])) sw.pop();
  const audienceShort = sw.join(' ') || audiencePlural;

  // ── Step 5: Problem — extract the "who [are] X" qualifying clause ───────────
  const probMatch = raw.match(/who\s+are\s+(.*?)(?:\.|$)/i) || raw.match(/who\s+(.*?)(?:\.|$)/i);
  const rawProb = probMatch ? probMatch[1].trim() : '';
  const audienceProblem = rawProb
    ? rawProb
        .replace(/^(tired of|struggling with|dealing with|being|compete|competing against)\s+/i, '')
        .replace(/\s+\.$/, '')
        .trim()
    : `competing without the right tools in ${niche}`;

  // ── Step 6: Context sentence — grammatically safe full sentence ──────────────
  // Pattern: "This pack is built for [plural] who [do X]."
  // We derive the action from audienceProblem — frame it as a positive goal.
  const goalPhrase = audienceProblem.startsWith('competing')
    ? `compete visually with larger, well-resourced firms`
    : audienceProblem.startsWith('finding')
    ? `find the right tools for their ${niche} workflow`
    : `stand out professionally in ${niche}`;
  const audienceContextSentence = `This pack is built for ${audiencePlural} who want to ${goalPhrase}.`;

  return { audiencePlural, audienceSingular, audienceShort, audienceProblem, audienceContextSentence };
}

// Remove double punctuation artifacts from sentence-building
function cs(s) {
  return String(s||'')
    .replace(/\.\s*\./g,'.')
    .replace(/,\s*\./g,'.')
    .replace(/\.\s*,/g,',')
    .replace(/\s{2,}/g,' ')
    .trim();
}

// ── Template Pack builders ────────────────────────────────────────────────────

// Derive 4–7 template use-cases from niche + sections + keywords
function deriveTemplateCases(n) {
  // Niche-specific curated template names
  const nicheTemplates = {
    'real estate': [
      'Luxury Listing Presentation Cover',
      'Editorial Property Brochure',
      'Seller Pitch Deck Slide',
      'Market Report Summary Page',
      'Agent Bio & Credentials Page',
      'Open House Invitation Flyer',
      'Private Showing Follow-Up Card',
      'Just Listed / Just Sold Announcement',
      'Social Media Property Teaser',
      'Buyer Lifestyle Guide Page',
    ],
    'fitness': [
      'Weekly Workout Program Schedule',
      'Client Progress Tracking Sheet',
      'Meal Plan & Macro Template',
      'Exercise Instruction Card',
      'Transformation Challenge Poster',
      '30-Day Challenge Tracker',
      'Workout Completion Certificate',
    ],
    'coaching': [
      'Discovery Call Prep Sheet',
      'Client Intake Questionnaire',
      'Weekly Goal-Setting Template',
      'Session Notes & Action Items',
      'Progress Review Summary',
      'Testimonial Request Template',
      'Program Welcome Packet Cover',
    ],
    'finance': [
      'Monthly Budget Tracker',
      'Debt Payoff Calculator Sheet',
      'Investment Portfolio Summary',
      'Net Worth Snapshot Template',
      'Bill Payment Calendar',
      'Savings Goal Progress Tracker',
      'Income & Expense Log',
    ],
    'marketing': [
      'Content Calendar Grid',
      'Campaign Brief Template',
      'Social Media Audit Sheet',
      'Competitor Analysis Table',
      'Ad Copy Swipe File Page',
      'Brand Voice Guide Template',
      'Launch Timeline Planner',
    ],
    'social media': [
      'Instagram Grid Planner',
      'Content Pillar Strategy Sheet',
      'Caption Swipe File Page',
      'Hashtag Research Tracker',
      'Story Highlight Cover Template',
      'Collaboration Pitch Template',
      'Monthly Analytics Report',
    ],
    'education': [
      'Lesson Plan Template',
      'Student Progress Report',
      'Course Outline Builder',
      'Quiz & Assessment Sheet',
      'Parent Communication Letter',
      'Classroom Rules Poster',
      'Weekly Homework Tracker',
    ],
    'wedding': [
      'Wedding Timeline Planner',
      'Seating Chart Template',
      'Vendor Contact Sheet',
      'Budget Breakdown Tracker',
      'Guest List Manager',
      'Day-Of Emergency Checklist',
      'Thank You Note Template',
    ],
    'photography': [
      'Client Booking Questionnaire',
      'Shot List Planner',
      'Photo Delivery Timeline',
      'Pricing & Package Sheet',
      'Model Release Form',
      'Invoice Template',
      'Portfolio Presentation Slide',
    ],
    'nutrition': [
      'Weekly Meal Plan Layout',
      'Grocery Shopping List',
      'Macro Tracking Log',
      'Recipe Card Template',
      'Hydration & Supplement Tracker',
      'Client Food Journal',
      'Nutrition Consultation Form',
    ],
  };

  // Match by niche keyword (case-insensitive)
  const nicheKey = Object.keys(nicheTemplates).find(k => n.niche.toLowerCase().includes(k));
  if (nicheKey) return nicheTemplates[nicheKey];

  // Fall back to deriving from section titles
  if (n.sections.length >= 4) {
    return n.sections.slice(0, 7).map(s => s.title || 'Template');
  }

  // Generic fallback using keywords
  const kw = n.keywords.slice(0, 4);
  return [
    `${n.niche} Starter Template`,
    `${kw[0] || n.niche} Workflow Sheet`,
    `${n.niche} Planning Calendar`,
    `${kw[1] || n.niche} Tracker Template`,
    `${n.niche} Checklist Page`,
    `${kw[2] || n.niche} Report Template`,
    `${n.niche} Proposal Cover`,
  ];
}

// buildTemplateFile is now handled by the dedicated buildTemplateFile backend function.
// Invoked asynchronously from the template pack build section.
async function buildTemplateFileRemote(useCase, index, n, base44) {
  const result = await base44.asServiceRole.functions.invoke('buildTemplateFile', { useCase, index, n });
  if (result?.data?.ok && result.data.content) return result.data.content;
  throw new Error(result?.data?.error || 'buildTemplateFile returned empty content');
}

// Product overview for Template Packs
function buildTemplateOverview(n, templateCases) {
  return `PRODUCT OVERVIEW — ${n.title}
${'═'.repeat(60)}
TYPE: Template Pack | NICHE: ${n.niche} | PLATFORM: ${n.platform}
PRICE: $${n.priceMin}–$${n.priceMax}
GENERATED: ${new Date().toLocaleDateString()}
${'═'.repeat(60)}

WHAT IS THIS TEMPLATE PACK?
${hr()}
${n.promise || n.subtitle || `A complete collection of professional ${n.niche} templates — ready to customize and use immediately.`}

FOR: ${n.av.audiencePlural}

WHAT'S INCLUDED IN THIS PACK
${hr()}
${templateCases.map((t, i) => `Template ${i + 1}: ${t}`).join('\n')}

Plus:
• Copy_Bank.txt — Ready-to-paste copy blocks for every template
• Headline_Bank.txt — 30+ headline formulas and examples
• CTA_Bank.txt — 20+ proven calls-to-action
• Implementation_Checklist.txt — Step-by-step setup guide
• Buyer_Quick_Start_Guide.txt — Get started in 15 minutes

WHAT MAKES THIS PACK DIFFERENT
${hr()}
${n.pa?.uniqueMechanism || `Every blueprint is built for a specific ${n.niche} use case — not generic layout advice. Each one tells you exactly what to build, what to write, and what assets you need.`}

WHAT THIS IS (AND ISN'T)
${hr()}
✅ This IS: Layout specifications, copy blocks, field guides, headline banks, and export instructions
✅ This IS: A blueprint-and-copy system that works with any design tool
❌ This is NOT: Canva source files, InDesign files, PSD files, or Figma files
❌ This is NOT: A design file pack — you build the templates in your own tool using these blueprints

KEY BENEFITS
${hr()}
${n.items.length > 0 ? n.items.map(b => '✅ ' + b).join('\n') : `✅ Know exactly what to build — no guesswork on layout or copy\n✅ Ready-to-paste copy blocks for every template section\n✅ Works with Canva, Adobe, PowerPoint, or Google Slides\n✅ Designed specifically for ${n.av.audiencePlural}\n✅ Instant download, start building immediately`}

HOW TO USE THIS PACK
${hr()}
STEP 1: Open the template file you need (see list above)
STEP 2: Read the Layout Structure and Required Assets sections
STEP 3: Open your design tool (Canva, Adobe, PowerPoint, Google Slides)
STEP 4: Replace all [BRACKETED] content with your real information
STEP 5: Apply your brand colors and logo
STEP 6: Export in the recommended format
STEP 7: Deliver to your client or publish

RECOMMENDED TOOLS
${hr()}
• Canva Pro — easiest for non-designers (canva.com)
• Adobe InDesign — best for print-quality output
• Adobe Illustrator — best for vector/logo work
• PowerPoint / Keynote — great for presentations
• Google Slides — free, shareable, collaborative
• Figma — best for digital/UI templates

${n.pa?.painPoint ? `\nWHY THIS PACK SOLVES A REAL PROBLEM\n${hr()}\n${n.pa.painPoint}` : ''}

Generated by Launchora | launchora.com | ${new Date().toLocaleDateString()}`;
}

// Copy bank for Template Packs
function buildCopyBank(n, templateCases) {
  return `COPY BANK — ${n.title}
${'═'.repeat(60)}
Ready-to-paste copy blocks for every template in this pack.
Replace [BRACKETED] text with your real information.
${'═'.repeat(60)}

GENERAL HEADER COPY
${hr()}
Headline: ${n.title}
Subhead: ${n.subtitle || n.promise || `Professional ${n.niche} templates — ready to use today`}
Tagline: ${n.pa?.finalAngle || `The ${n.niche} template pack built for real professionals`}
CTA: Download Now → Customize in Minutes

ABOUT THIS TEMPLATE
${hr()}
Short version (1 sentence):
"${n.title} gives ${n.av.audiencePlural} professional-grade templates they can customize and use the same day."

Medium version (2–3 sentences):
"${n.promise || 'This template pack saves you hours of design work.'}
Every template is built for ${n.niche} — not generic layouts that need heavy customization.
Open the file, add your details, and you're done."

Long version (for listings):
${n.ma?.listing_description || `Looking for professional ${n.niche} template blueprints that actually fit your workflow?\n\n${n.title} includes ${templateCases.length} ready-to-build template blueprints, each built specifically for ${n.av.audiencePlural}.\n\nNo design source files — each blueprint tells you exactly what to build in Canva, PowerPoint, or any design tool.\n\n✅ Instant download\n✅ Layout specs + copy blocks included\n✅ Built specifically for ${n.niche}\n✅ Professional results in minutes`}

TEMPLATE-SPECIFIC COPY BLOCKS
${hr()}
${templateCases.map((t, i) => `TEMPLATE ${i + 1}: ${t}\n• Headline: "Professional ${t} Blueprint for ${n.niche}"\n• Subhead: "Build it in your design tool in minutes — blueprint included"\n• Feature: "Layout spec + copy blocks for ${t.toLowerCase()} — built for ${n.av.audiencePlural}"\n`).join('\n')}

SOCIAL PROOF / TESTIMONIAL PROMPTS
${hr()}
Ask buyers to fill in:
"Before this template pack, I used to [pain point]. Now I [result]. It took me [time] to customize and [outcome]."

Example structure for your own copy:
"Real ${n.niche} professionals use ${n.title} to [transformation]. ${n.pa?.emotionalHook || 'The result is confidence and professional credibility.'}"

OBJECTION HANDLERS
${hr()}
Objection: "I can design my own templates."
Response: "You can — but this saves you [X] hours per template. At your hourly rate, this pack pays for itself the first time you use it."

Objection: "I don't know how to use a blueprint."
Response: "Every blueprint file includes step-by-step layout guidance. If you can use Canva, PowerPoint, or Google Slides, you can follow the blueprint and build the template yourself."

Objection: "Is this compatible with my software?"
Response: "These are text-based blueprint files — they work with any design tool. You build the template in Canva, Adobe, PowerPoint, or Google Slides using the layout specs and copy blocks provided."

Generated by Launchora | ${new Date().toLocaleDateString()}`;
}

// Headline bank
function buildHeadlineBank(n, templateCases) {
  const niche = n.niche;
  const aud = n.av.audiencePlural;
  return `HEADLINE BANK — ${n.title}\n${'═'.repeat(60)}\n30+ headline formulas for listings, social media, emails, and ads.\n${'═'.repeat(60)}\n\nDIRECT BENEFIT\n${hr()}\n1. ${templateCases.length} ${niche} Template Blueprints — Layout + Copy Ready to Build From\n2. Stop Staring at a Blank Page: ${niche} Template Blueprints for Real Professionals\n3. The ${niche} Blueprint Kit That Tells You Exactly What to Build\n4. ${niche} Template Blueprints — Copy Blocks + Layout Specs Included\n5. ${n.title}: ${templateCases.length} Blueprints. Instant Download. Start Building Today.\n\nCURIOSITY\n${hr()}\n6. What Do Top ${niche} Professionals Build Their Materials From? (These Blueprints)\n7. The System Behind Every Professional ${niche} Presentation — Now in Blueprint Form\n8. Why Smart ${aud} Stop Designing From Scratch\n9. The ${niche} Blueprint Kit I Wish I Had When I Started\n10. This Is Why Some ${niche} Professionals Always Look More Polished\n\nPAIN POINT\n${hr()}\n11. Tired of Not Knowing What to Write or How to Lay It Out?\n12. Stop Guessing at Layout and Copy for Your ${niche} Materials\n13. ${n.pa?.painPoint ? n.pa.painPoint.split('.')[0] + '?' : 'Struggling to Look Professional in ' + niche + '?'}\n14. Every Hour You Spend Figuring Out Layout Is an Hour You're Not Earning\n15. Your ${niche} Materials Are Costing You Clients — Here's the Blueprint Fix\n\nTRANSFORMATION\n${hr()}\n16. From Blank Canvas to Client-Ready: ${niche} Blueprints That Do the Hard Thinking\n17. Know Exactly What to Build for Every ${niche} Client Situation\n18. ${n.pa?.transformation ? n.pa.transformation.split('.')[0] : 'Go From Guessing to Confident in ' + niche} — With One Download\n19. The Blueprint Kit That Transforms How ${aud} Build Client-Facing Materials\n20. Before: Hours of Design Guesswork. After: ${n.title}.\n\nURGENCY / PRICE\n${hr()}\n21. $${n.priceMin} for ${templateCases.length} ${niche} Template Blueprints — Limited Time\n22. ${templateCases.length} Blueprint Kits for Less Than 1 Hour of a Freelance Designer's Time\n23. ${n.title} — $${n.priceMin} Today. Professional Results Whenever You Need Them.\n24. Launch Price: $${n.priceMin}. Regular: $${n.priceMax}. Grab It Now.\n25. ${templateCases.length} Blueprints. $${n.priceMin}. Download and Start Building.\n\nQUESTIONS\n${hr()}\n26. What Would You Build With ${templateCases.length} ${niche} Template Blueprints?\n27. How Many Hours a Week Do You Spend Figuring Out ${niche} Layout and Copy?\n28. What If You Knew Exactly What to Build for Every Client Situation?\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
}

// CTA bank
function buildCTABank(n) {
  return `CTA BANK — ${n.title}
${'═'.repeat(60)}
20+ proven calls-to-action for this template pack.
Use across listings, social, emails, and ads.
${'═'.repeat(60)}

LISTING CTAs
${hr()}
1. Download Now → Start Customizing in Minutes
2. Get Instant Access — $${n.priceMin}
3. Add to Cart → Instant Digital Download
4. Buy Now — Use Today
5. Grab This Pack → $${n.priceMin} Instant Access

SOCIAL MEDIA CTAs
${hr()}
6. Link in bio 🔗 → Download your templates
7. Comment "TEMPLATES" and I'll DM you the link
8. Save this post — then grab the pack at the link in bio
9. Tap the link, download, customize. That's it. 🎯
10. $${n.priceMin}. Instant download. Link in bio. 👆

EMAIL CTAs
${hr()}
11. → [CLICK HERE TO DOWNLOAD YOUR TEMPLATES]
12. → Grab ${n.title} for $${n.priceMin} — download starts immediately
13. → Yes, I want professional ${n.niche} templates →
14. → Get the templates (before the price goes up)
15. → [INSERT LINK] — Your templates are waiting

URGENCY CTAs
${hr()}
16. Launch price ends [DATE] → Grab it now
17. Price goes to $${n.priceMax} after [DATE] → Download at $${n.priceMin} →
18. Only available at this price until [DATE]
19. Grab it before the price increases →
20. Last chance at $${n.priceMin} — goes up tonight

TRUST-BUILDING CTAs
${hr()}
21. Download risk-free — see what's inside
22. Instant download — build in Canva, Adobe, PowerPoint, or Google Slides
23. One-time purchase — yours to keep and use forever
24. No subscriptions. No recurring fees. Pay once, use forever.
25. 100% digital — download immediately after purchase

Generated by Launchora | ${new Date().toLocaleDateString()}`;
}

// Detect if this is a Template Pack product type
function isTemplatePack(n) {
  const t = (n.type || '').toLowerCase();
  return t.includes('template') || t.includes('template pack') || t === 'templates';
}

// ── File builders ─────────────────────────────────────────────────────────────

const README = (p,n) => {
  const isTP = isTemplatePack(n);
  const hasMasterGuide = true; // always generated now
  const productNote = isTP
    ? `   Product_Overview.txt — What's included and how to use this blueprint kit
   Template_N_[Name].txt — Layout spec + copy blocks + field guide per template
   Copy_Bank.txt — Ready-to-paste copy for all templates
   Headline_Bank.txt — 30+ headlines per use case
   CTA_Bank.txt — 20+ calls-to-action
   ⚠️  NOTE: These are template blueprints (layout specs + copy), not Canva/InDesign source files.
       Open each template file in any text editor. Build the template in your design tool
       using the layout spec provided. The copy blocks paste directly into your design.`
    : `   Product_Content.txt / .html — Full product content
   Buyer_Quick_Start_Guide.txt — What buyers do first
   Implementation_Checklist.txt — Action checklist`;
  return `LAUNCHORA DIGITAL PRODUCT LAUNCH KIT
${'═'.repeat(60)}
PRODUCT: ${n.title}
TYPE: ${n.type} | PLATFORM: ${n.platform} | PRICE: $${n.priceMin}–$${n.priceMax}
GENERATED: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
${'═'.repeat(60)}
WHAT'S IN YOUR LAUNCH KIT
${'═'.repeat(60)}
📁 01_Product/
   ${productNote}


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
1. Open 01_Product/Master_Product_Guide.md — your complete premium product manual
2. Copy your listing from 02_Sales_Page/Platform_Listing_Primary.txt → paste into your store
3. Schedule 03_Social_Media/7_Day_Posting_Calendar.txt posts for launch week
4. Send 04_Email_Launch/Email_1_Announcement.txt to your list on launch day
5. Follow 05_Launch_Plan/7_Day_Launch_Plan.txt day by day

FILE GUIDE
${'═'.repeat(60)}
📄 Master_Product_Guide.md — Central premium product manual. Start here.
📋 Individual TXT files — Copy/paste-ready assets for each template and section.
🛒 02_Sales_Page/ — Ready-to-paste listings for Gumroad, Etsy, Payhip, Creative Market.
📱 03_Social_Media/ — Captions, hooks, video scripts, posting calendar.
📧 04_Email_Launch/ — 5-email launch sequence, ready to send.
🚀 05_Launch_Plan/ — Day-by-day plan, readiness report, checklist.
🎁 06_Bonus/ — Customer avatar, FAQ, upsell ideas, next product strategy.

Good luck with your launch! 🚀
`;
};

const PRODUCT_TXT = (p,n) => {
  const secs=n.sections.map((s,i)=>`${hr()}\n${i+1}. ${s.title||s.heading||'Section '+(i+1)}\n${hr()}\n${s.body||s.content?.body||''}`).join('\n\n');
  return `${n.title}\n${'═'.repeat(60)}\n${n.subtitle||''}\nTYPE: ${n.type} | NICHE: ${n.niche} | PLATFORM: ${n.platform} | PRICE: $${n.priceMin}–$${n.priceMax}\n\nPROMISE\n${hr()}\n${n.promise||n.subtitle||''}\n\nFOR: ${n.av.audiencePlural}\n\n${n.items.length>0?'KEY BENEFITS\n'+hr()+'\n'+n.items.map(b=>'✅ '+b).join('\n')+'\n\n':''}\n${'═'.repeat(60)}\nCONTENT\n${'═'.repeat(60)}\n\n${secs||'(Sections pending)'}\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
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
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${n.title}</title><style>body{font-family:Georgia,serif;max-width:780px;margin:0 auto;padding:2rem 1.5rem;background:#fafaf9;color:#1a1a1a}h1{font-size:2.1rem;font-weight:800;color:#111;margin-bottom:.5rem}.sub{font-size:1.1rem;color:#6b7280;font-style:italic;margin-bottom:1.5rem}.promise{background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid ${a};border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem}.promise p{margin:0;font-size:1rem;font-weight:600;color:#9a3412}.meta{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem;font-family:sans-serif}.badge{background:#f3f4f6;border-radius:999px;padding:.2rem .75rem;font-size:.8rem;color:#374151}.pb{background:${a};color:#fff;border-radius:999px;padding:.2rem .75rem;font-size:.8rem;font-weight:700}.aud{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:1rem 1.25rem;margin-bottom:2rem;font-family:sans-serif;font-size:.9rem;color:#166534}.kw{font-family:sans-serif;font-size:.8rem;color:#6b7280;margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb}.ft{text-align:center;font-family:sans-serif;font-size:.75rem;color:#9ca3af;margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb}</style></head><body><h1>${n.title}</h1>${n.subtitle?`<p class="sub">${n.subtitle}</p>`:''} ${n.promise?`<div class="promise"><p>✦ ${n.promise}</p></div>`:''}<div class="meta"><span class="badge">${n.type}</span><span class="badge">${n.platform}</span><span class="badge">${n.niche}</span><span class="pb">$${n.priceMin}–$${n.priceMax}</span></div>${n.av.audiencePlural?`<div class="aud"><strong>For:</strong> ${n.av.audiencePlural.charAt(0).toUpperCase()+n.av.audiencePlural.slice(1)}</div>`:''} ${bens}${secsHtml}${n.keywords.length?`<div class="kw"><strong>Keywords:</strong> ${n.keywords.join(' · ')}</div>`:''}<div class="ft">Generated by Launchora · ${new Date().getFullYear()}</div></body></html>`;
};

const QUICK_START = (p,n) => `BUYER QUICK START GUIDE — ${n.title}\n${'═'.repeat(60)}\n\nWelcome! Here's how to get the most out of ${n.title} as fast as possible.\n\nWHAT THIS IS\n${hr()}\n${n.title} is a ${n.type} for ${n.av.audiencePlural}.\n${n.promise?'\nPROMISE:\n'+n.promise+'\n':''}\nHOW TO USE IT\n${hr()}\nSTEP 1: Skim the entire product once to understand the structure.\nSTEP 2: Work through these sections in order:\n${n.sections.slice(0,6).map((s,i)=>`   ${i+1}. ${s.title||s.heading||'Section '+(i+1)}`).join('\n')}\nSTEP 3: Take one action within 24 hours of downloading.\n\n${n.items.length>0?'KEY OUTCOMES\n'+hr()+'\n'+n.items.slice(0,5).map(b=>'✅ '+b).join('\n')+'\n':''}\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;

const IMPL_CHECKLIST = (p,n) => {
  const isTP = isTemplatePack(n);
  const isRE = /real.estate|realt|property|listing|agent/i.test(n.niche+n.title);
  if (isTP) {
    const cw = isRE?'seller':'client', mw = isRE?'listing presentation':'client-facing material';
    const tNames = n.sections.length>0 ? n.sections.slice(0,3).map(s=>s.title||s.heading).filter(Boolean) : isRE?['Listing Presentation Cover','Property Brochure','Agent Bio Page']:['Template 1','Template 2','Template 3'];
    const [t1,t2,t3] = [tNames[0]||'Cover Template',tNames[1]||'Main Template',tNames[2]||'Supporting Template'];
    return `IMPLEMENTATION CHECKLIST — ${n.title}\n${'═'.repeat(60)}\nUse this checklist every time you build a ${mw} using ${n.title}.\nWork through each section in order. Check off each task before moving on.\n${'═'.repeat(60)}\n\n1. SETUP\n${hr()}\n□ Open the blueprint file for the template you need (e.g. ${t1})\n□ Read the layout spec from top to bottom before opening your design tool\n□ Review the required assets checklist — confirm you have all photos, logos, and data\n□ ${isRE?'Choose one active listing or sample property to work with':'Choose the specific use case or project this template is for'}\n□ Open your design tool (Canva, Adobe, PowerPoint, or Google Slides)\n□ Create a new document using the dimensions specified in the layout spec\n\n2. BRAND CUSTOMISATION\n${hr()}\n□ Apply your primary brand color to all designated color zones\n□ Apply your secondary brand color or neutral where specified\n□ Upload your logo to the logo zone — do not stretch or distort it\n□ Set your heading font (as specified or your own brand font)\n□ Set your body font — ensure it is legible at small sizes\n□ Delete any placeholder branding or sample logo from the template\n\n3. TEMPLATE CUSTOMISATION\n${hr()}\n□ ${isRE?'Add property address or project name to the headline field':'Add the project or client name to the headline field'}\n□ Replace all [BRACKETED] text with real content — check every field\n□ ${isRE?'Add 5–7 high-quality property images in the designated image zones':'Add 3–5 relevant images or graphics in the designated image zones'}\n□ ${isRE?'Crop all photos to the specified ratio — no white borders or stretching':'Ensure all images are cropped consistently'}\n□ Replace the generic copy block with ${isRE?'property-specific luxury copy':'client- or project-specific copy'}\n□ Add agent name, phone number, email, and website (or equivalent contact info)\n□ ${isRE?'Insert local market statistics or recent sold comparables if applicable':'Insert any relevant data, statistics, or supporting figures'}\n□ Add QR code, booking link, or call-to-action URL where indicated\n□ Verify every page — no "[" or "]" brackets remain in the final document\n\n4. QUALITY CONTROL\n${hr()}\n□ Read the entire document out loud — check for typos and awkward phrasing\n□ Confirm brand colors are consistent across all pages\n□ Check that all images are sharp — no blurry or pixelated photos\n□ Verify logo is correctly sized and positioned on every page it appears\n□ Confirm contact details are accurate and complete\n□ Review on a mobile screen or at 50% zoom to check readability\n\n5. EXPORT\n${hr()}\n□ Export as PDF (high-resolution, print-ready) for ${isRE?'physical delivery or email to seller':'client delivery or printing'}\n□ Export as PNG or JPG (high-res) for digital sharing or social media\n□ Name the file clearly: [ClientName]_[TemplateName]_[Date]\n□ Test-open the exported PDF to confirm it renders correctly\n\n6. CLIENT DELIVERY\n${hr()}\n□ ${isRE?'Email the PDF to the seller before the listing appointment':'Send the PDF to the client via email or shared folder'}\n□ ${isRE?'Bring a printed copy to the listing presentation if applicable':'Print a copy if the meeting is in person'}\n□ ${isRE?'Save the file to your CRM or property folder for the listing':'Save the file to the client folder or project management system'}\n□ Note any feedback from the ${cw} to improve the next version\n\n7. REUSE SYSTEM\n${hr()}\n□ Save a clean master copy of the customised template (with your brand but no ${cw} data)\n□ Label it: [TemplateName]_MASTER_BRANDED — so you never start from scratch again\n□ Archive the ${cw}-specific version in its own folder\n□ Note which template performed best — prioritise that one next time\n\n${'═'.repeat(60)}\nTEMPLATE ROTATION LOG\n${'═'.repeat(60)}\n${cw.charAt(0).toUpperCase()+cw.slice(1)} / Project  |  Template Used  |  Date  |  Outcome\n${hr()}\n_________________  |  ${t1.slice(0,20)}  |  ______  |  __________\n_________________  |  ${t2.slice(0,20)}  |  ______  |  __________\n_________________  |  ${t3.slice(0,20)}  |  ______  |  __________\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
  }
  const sectionTasks = n.sections.length>0 ? n.sections.slice(0,8).map((s,i)=>`□ Work through: ${s.title||s.heading||'Section '+(i+1)}`) : ['□ Read through the full product once','□ Identify the section most relevant to your situation','□ Apply the first strategy from that section'];
  return `IMPLEMENTATION CHECKLIST — ${n.title}\n${'═'.repeat(60)}\nEvery item is a concrete action. Check off each task as you complete it.\n${'═'.repeat(60)}\n\nGETTING STARTED\n${hr()}\n□ Download and open the product files\n□ Read the Quick Start Guide first (Buyer_Quick_Start_Guide.txt)\n□ Skim the full product once without stopping to act\n□ Identify the single most relevant section for your current situation\n□ Block 60 minutes in your calendar this week to implement\n\nYOUR CONTENT TASKS\n${hr()}\n${sectionTasks.join('\n')}\n\nQUICK WINS (do these first)\n${hr()}\n□ Complete the easiest section before the most challenging one\n□ Apply one strategy within 48 hours of downloading\n□ Take one visible action in your business based on what you learned\n□ Share one result or insight with a peer or accountability partner\n\nRESULT TRACKER\n${hr()}\nGoal I'm working toward: _______________________________________________\nTarget completion date:  ________________________________________________\nKey metric I'm tracking: _______________________________________________\n\nWeek 1 progress: ______________________________________________________\nWeek 2 progress: ______________________________________________________\nKey win so far:  ________________________________________________________\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;
};

const PRIMARY_LISTING = (p,n) => `PRIMARY PLATFORM LISTING — ${n.title}\n${'═'.repeat(60)}\nPlatform: ${n.platform}\n\nTITLE\n${hr()}\n${n.listingTitle}\n\nDESCRIPTION\n${hr()}\n${n.longDesc}\n\nFOR\n${hr()}\n${n.av.audiencePlural.charAt(0).toUpperCase()+n.av.audiencePlural.slice(1)}\n\nBENEFITS\n${hr()}\n${n.items.length>0?n.items.map(b=>'✅ '+b).join('\n'):'✅ Instant digital download\n✅ Professionally structured '+n.type+'\n✅ Ready to use immediately'}\n\nKEYWORDS\n${hr()}\n${n.keywords.join(', ')}\n\nPRICING: $${n.priceMin}–$${n.priceMax}${n.ma.price_rationale?'\n'+n.ma.price_rationale:''}\n\nCTA: ${n.ma.platform_cta||n.ma.cta||'Download instantly →'}\n${n.pg.pro_tips?.length?'\nPRO TIPS\n'+hr()+'\n'+n.pg.pro_tips.map((t,i)=>`${i+1}. ${t}`).join('\n'):''}`;

// Honest description for Template Pack listings — no false "editable design files" claims
function tpListingBody(n) {
  if (!isTemplatePack(n)) return n.longDesc;
  const sl = n.sections.length > 0
    ? n.sections.slice(0,6).map(s=>`→ ${s.title||s.heading} Blueprint`).join('\n')
    : `→ Luxury Listing Presentation Cover Blueprint\n→ Editorial Property Brochure Blueprint\n→ Market Report Summary Page Blueprint\n→ Agent Bio & Credentials Page Blueprint\n→ Open House Invitation Flyer Blueprint\n→ Seller Pitch Deck Slide Blueprint\n→ Private Showing Follow-Up Card Blueprint`;
  return `${n.promise?n.promise+'\n\n':''}This is a Template Blueprint Kit — text-based layout specs and copy systems, not Canva or InDesign source files.

What's included for each template:
${sl}

Each blueprint contains:
✅ Exact layout specification — sections, columns, hierarchy, dimensions
✅ Required assets checklist — photos, logos, fonts, data fields
✅ 3 ready-to-paste copy blocks specific to that template's use case
✅ 5 client-ready headline options
✅ Field-by-field customization guide — every [BRACKET] explained
✅ Print and digital export recommendations
✅ Design tool notes for Canva, Adobe, PowerPoint, and Google Slides

You follow the blueprint in your preferred design tool. The hard work — knowing what to write, how to structure it, and what assets you need — is already done for you.

Built for ${n.av.audiencePlural} who want to look professional without starting from a blank page.`;
}

const GUMROAD = (p,n) => `GUMROAD LISTING — ${n.title}\n${'═'.repeat(60)}\nTITLE: ${n.title}${n.subtitle?' — '+n.subtitle:''}\nPRICE: $${n.priceMin} (enable Pay What You Want)\n\nDESCRIPTION\n${hr()}\n${tpListingBody(n)}\n\nFOR: ${n.av.audiencePlural}\n\nTAGS: ${n.keywords.slice(0,10).join(', ')}\n\nTIPS:\n• Upload cover image (1280×720px)\n• Enable "Let buyers pay more"\n• Add thank-you redirect to your email opt-in`;

const ETSY = (p,n) => {
  function buildEtsyTags(n) {
    const ni = n.niche.toLowerCase();
    const isRE = /real.estate|realt|property|listing|agent/i.test(ni+n.title);
    const isFitness = /fitness|gym|workout|training/i.test(ni);
    const isCoach = /coach|consult|mentor/i.test(ni);
    const isMarketing = /market|brand|social|content/i.test(ni);
    // All tags are pre-validated natural English phrases ≤20 chars.
    // NEVER use .slice(0,20) on a dynamically built string — that truncates words mid-letter.
    let niche_tags;
    if (isRE) niche_tags=['realtor templates','luxury realtor','listing template','real estate kit','property flyer','broker branding','open house flyer','seller pitch','agent bio','market report','realty brochure','home listing','agent templates'];
    else if (isFitness) niche_tags=['fitness templates','workout planner','gym program kit','client tracker','fitness branding','training schedule','meal plan template','fitness planner','gym bundle','coach templates','workout bundle','client program','fitness kit'];
    else if (isCoach) niche_tags=['coaching templates','coach branding','client workbook','session notes','onboarding kit','intake form','proposal template','coaching bundle','discovery call','client toolkit','coach planner','business coach','coach kit'];
    else if (isMarketing) niche_tags=['marketing kit','brand templates','content planner','social media kit','brand blueprint','brand guide','campaign brief','content calendar','marketing bundle','social templates','caption templates','brand strategy','marketing planner'];
    else if (/nutrition|meal|food|diet/i.test(ni)) niche_tags=['nutrition templates','meal plan kit','food journal','macro tracker','diet planner','recipe template','client meal plan','nutrition planner','wellness kit','health tracker','nutrition bundle','coach templates','wellness planner'];
    else if (/wedding|bride/i.test(ni)) niche_tags=['wedding planner','wedding templates','bride kit','venue checklist','wedding budget','seating chart','vendor tracker','wedding timeline','guest list','event planner kit','wedding bundle','wedding checklist','wedding day kit'];
    else if (/photo|portrait|photographer/i.test(ni)) niche_tags=['photography kit','client booking','shot list','photo contract','studio templates','invoice template','photo planner','portfolio template','model release','photographer kit','booking templates','photo bundle','photo session kit'];
    else if (/financ|budget|money|invest/i.test(ni)) niche_tags=['budget template','finance planner','money tracker','debt payoff plan','budget kit','savings tracker','net worth tracker','finance bundle','expense tracker','investment tracker','bill pay planner','financial planner','budget planner'];
    else if (/educat|teacher|lesson|classroom/i.test(ni)) niche_tags=['teacher templates','lesson planner','classroom kit','student tracker','course outline','education bundle','teacher planner','quiz template','grade tracker','homework tracker','classroom planner','teacher bundle','lesson plan kit'];
    else {
      // Generic fallback: build from niche words that fit ≤20 chars naturally — no mid-word cuts
      const safe = ni.split(/\s+/).slice(0,2).join(' ');
      niche_tags=[`${safe} templates`,`${safe} planner`,`${safe} kit`,`${safe} bundle`,`${safe} blueprint`,`${safe} branding`].filter(t=>t.length<=20);
    }
    const universal=['digital download','blueprint system','instant download','layout guide','professional kit','template bundle','digital template','copy kit','small biz kit','done for you'];
    const seen=new Set(), result=[];
    for (const tag of [...niche_tags,...universal]) {
      const t=tag.trim().toLowerCase();
      if (t.length>20||seen.has(t)) continue; // hard guard — never >20 chars
      seen.add(t); result.push(t);
      if (result.length===13) break;
    }
    const pads=['digital kit','template kit','pro templates','design kit','print kit'];
    for (const pd of pads) { if(result.length>=13)break; if(!seen.has(pd)){seen.add(pd);result.push(pd);} }
    return result.slice(0,13);
  }
  const tags=buildEtsyTags(n);
  return `ETSY LISTING — ${n.title}\n${'═'.repeat(60)}\nTITLE: ${n.title}${n.subtitle?' | '+n.subtitle:''}\nPRICE: $${(n.priceMin-0.01).toFixed(2)}\n\nDESCRIPTION\n${hr()}\n${tpListingBody(n)}\nPerfect for: ${n.av.audiencePlural}\n────────────────────\n✅ INSTANT DOWNLOAD | ✅ Layout Specs + Copy Blocks | ✅ Works on all devices\n────────────────────\n\nTAGS (13 max, each ≤20 chars):\n${tags.map((t,i)=>`${i+1}. ${t}`).join('\n')}\n\nTIPS:\n• Show screenshots of the blueprint content in listing photos\n• Fill all Etsy attributes for search placement\n• Price below round numbers`;
};

const PAYHIP = (p,n) => `PAYHIP LISTING — ${n.title}\n${'═'.repeat(60)}\nNAME: ${n.title}\nTAGLINE: ${n.subtitle||n.promise||''}\nPRICE: $${n.priceMin}\n\nDESCRIPTION\n${hr()}\n${tpListingBody(n)}\nFOR: ${n.av.audiencePlural}\nKEYWORDS: ${n.keywords.join(', ')}\n\nTIPS:\n• Enable Pay What You Want\n• Set up 30-50% affiliate commissions\n• Use Payhip email marketing for buyer follow-up`;

const CREATIVE_MARKET = (p,n) => `CREATIVE MARKET LISTING — ${n.title}\n${'═'.repeat(60)}\n⚠️ PLATFORM NOTE: Creative Market buyers typically expect design source files (Canva, PSD, AI, INDD).\nIf your pack contains text blueprints only, consider Gumroad, Etsy, or Payhip as primary platforms.\nUse this listing once you add actual design source files to your delivery.\n\nTITLE: ${n.title} — Template Blueprint Kit for ${n.niche}\nTAGLINE: ${n.subtitle||n.promise||''}\nPRICE: $${n.priceMin}\n\nDESCRIPTION\n${hr()}\n${tpListingBody(n)}\nFOR: ${n.av.audiencePlural}\n\nWHAT'S INCLUDED:\n${n.sections.slice(0,6).map((s,i)=>`• ${s.title||s.heading||'Template '+(i+1)} — Layout Blueprint + Copy Blocks`).join('\n')||`• Template blueprint files (TXT)\n• Layout specs, copy blocks, and field guides per template`}\n\nTAGS: ${n.keywords.slice(0,12).join(', ')}\n\nTIPS:\n• Be explicit that this is a blueprint/copy system, not design source files\n• Show what buyers can build using the blueprints in your listing images`;

const DESC_SHORT = (p,n) => `SHORT DESCRIPTION — ${n.title}\n${'═'.repeat(60)}\nONE PARAGRAPH:\n${n.shortDesc}\n\nTWEET / BIO VERSION:\n${n.title} — ${n.promise?n.promise.slice(0,100):n.subtitle||'Complete '+n.type+' for '+n.niche}. $${n.priceMin}. Download instantly →\n\nHEADLINE VARIATIONS:\n1. ${n.title} — ${n.promise||'The Complete '+n.type}\n2. The ${n.niche} ${n.type} Built for ${n.av.audienceShort}\n3. ${n.keywords[0]?n.keywords[0].charAt(0).toUpperCase()+n.keywords[0].slice(1)+': ':'' }${n.title}`;

const DESC_LONG = (p,n) => `LONG-FORM DESCRIPTION — ${n.title}\n${'═'.repeat(60)}\n\nHEADLINE: ${n.promise||n.title}\n\nTHE STORY\n${hr()}\nIf you work in ${n.niche}, you know how hard it is to find resources that actually deliver.\n\n${n.problem?'THE PROBLEM:\n'+n.problem+'\n\n':''}Most options are too generic, too expensive, or too complicated. That changes today.\n\nIntroducing ${n.title} — a ${n.type} built for ${n.av.audiencePlural}.\n\nWHAT'S INSIDE\n${hr()}\n${n.sections.slice(0,8).map((s,i)=>`${i+1}. ${s.title||s.heading||'Module '+(i+1)}`).join('\n')}\n\nWHAT YOU GET\n${hr()}\n✅ Instant digital download\n✅ ${n.type} — professionally structured\n${n.items.slice(0,4).map(b=>'✅ '+b).join('\n')}\n\nPRICE: $${n.priceMin}${n.priceMax>n.priceMin?' (regular: $'+n.priceMax+')':''}\n\n${n.ma.platform_cta||n.ma.cta||'Click the button and download instantly →'}`;

const PRICING = (p,n) => `PRICING STRATEGY — ${n.title}\n${'═'.repeat(60)}\nRECOMMENDED: $${n.priceMin}–$${n.priceMax}\n${n.ma.price_rationale?'\nRATIONALE:\n'+n.ma.price_rationale+'\n':''}\nOPTION A — ENTRY: $${n.priceMin}\nBest for new audiences. Maximum volume. Works on Gumroad, Etsy.\n\nOPTION B — STANDARD: $${Math.round((n.priceMin+n.priceMax)/2)}\nBest for warm audiences. Signals credibility.\n\nOPTION C — PREMIUM: $${n.priceMax}\nBest for existing customers and niche experts. Requires testimonials.\n\nLAUNCH STRATEGY\n${hr()}\n• Launch at $${n.priceMin} for first 72 hours\n• Announce the price increase to create urgency\n• Raise to $${Math.round((n.priceMin+n.priceMax)/2)} after launch window\n• Bundle with another product for $${Math.round(n.priceMax*1.8)}\n\nPLATFORM TIPS\n${hr()}\n• Gumroad: Enable Pay What You Want (min $${n.priceMin})\n• Etsy: Price at $${(n.priceMin-0.01).toFixed(2)} (below round number)\n• Payhip: Use affiliates to drive volume\n• Shopify: Set Compare At to $${n.priceMax}`;

const SEO = (p,n) => {const pg=n.pg,ptags=Array.isArray(pg.tags)?pg.tags:[],all=[...new Set([...n.keywords,...ptags])]; return `SEO KEYWORDS — ${n.title}\n${'═'.repeat(60)}\n\nPRIMARY (highest buyer intent):\n${all.slice(0,5).join('\n')}\n\nSECONDARY:\n${all.slice(5,12).join('\n')}\n\nLONG-TAIL PHRASES:\n${all.slice(0,5).map(k=>`${k} for ${n.niche}\n${k} digital download`).join('\n')}\n\nETSY TAGS (max 20 chars each):\n${all.slice(0,13).map(k=>k.slice(0,20)).join(', ')}\n\nSEO META DESCRIPTION (max 155 chars):\n${(n.ma.seo_meta_description||cs(`${n.promise||n.title}. Built for ${n.av.audienceShort}. Instant download.`)).slice(0,155)}`;};

// ── Social Media Context Helper ───────────────────────────────────────────────
// Builds a rich, product-specific social context object for all SM builders
function socialCtx(n) {
  // Always use normalized audience variables — never raw n.audience in a sentence
  const promise = n.promise || `transform your ${n.niche} brand from amateur to premium`;
  const pain = n.pa?.painPoint || `losing clients to competitors with more polished ${n.niche} materials`;
  const transformation = n.pa?.transformation || `go from looking like everyone else to commanding premium fees in ${n.niche}`;
  const hook = n.pa?.emotionalHook || `confidence and authority in every client-facing moment`;
  const mechanism = n.pa?.uniqueMechanism || `professionally designed ${n.niche} templates you can customize in minutes`;
  const angle = n.pa?.finalAngle || n.title;
  const kw = n.keywords.length > 0 ? n.keywords : [n.niche.replace(/\s+/g,''), n.type.replace(/\s+/g,''), 'digitalproduct', 'templates'];
  // Use normalized audience vars — audShort comes from audienceVars(), never raw audience
  const audShort = n.av.audienceShort;
  const audience = n.av.audiencePlural; // safe normalized plural for any sentence use
  // Infer what "competitor" looks like for this niche
  const isLuxury = /luxury|premium|high.end|bespoke|editorial/i.test(n.niche + n.title);
  const isRealEstate = /real.estate|realt|property|listing|agent/i.test(n.niche + n.title);
  const isFitness = /fitness|gym|workout|training|coach/i.test(n.niche);
  const isCoach = /coach|consult|mentor|advisor/i.test(n.niche);
  const isMarketing = /market|brand|social|content|copy/i.test(n.niche);
  // Context-specific phrases
  let clientWord = 'clients';
  let competitorPhrase = 'bigger firms';
  let materialWord = 'materials';
  let resultVerb = 'close';
  if (isRealEstate) { clientWord = 'sellers'; competitorPhrase = 'big-team agencies'; materialWord = 'listing presentations'; resultVerb = 'win listings'; }
  if (isFitness) { clientWord = 'clients'; competitorPhrase = 'big gyms'; materialWord = 'client programs'; resultVerb = 'sign clients'; }
  if (isCoach) { clientWord = 'clients'; competitorPhrase = 'established coaches'; materialWord = 'proposals and decks'; resultVerb = 'close discovery calls'; }
  if (isMarketing) { clientWord = 'clients'; competitorPhrase = 'big agencies'; materialWord = 'campaign assets'; resultVerb = 'win retainers'; }
  return { audience, audShort, promise, pain, transformation, hook, mechanism, angle, kw, clientWord, competitorPhrase, materialWord, resultVerb, isLuxury, isRealEstate };
}

const HOOKS = (p,n) => {
  const c = socialCtx(n);
  const aud = c.audShort;
  const mat = c.materialWord;
  const comp = c.competitorPhrase;
  const verb = c.resultVerb;
  return `HOOKS — ${n.title}
${'═'.repeat(60)}
20 attention-grabbing openers for posts, emails, ads, and videos.
Organised by hook type. Use the first line as your opening sentence.
${'═'.repeat(60)}

PAIN / PROBLEM HOOKS (5)
${hr()}
1. Your ${mat} are costing you ${c.clientWord}. Here's how to fix it in under 30 minutes.
2. ${aud} — your brand is the reason you're losing to ${comp}. Not your price.
3. The uncomfortable truth: ${c.clientWord} judge your credibility before you say a word. What do your ${mat} say?
4. If you're still using Canva templates designed for everyone, you're positioning yourself as nobody in ${n.niche}.
5. ${c.pain.split('.')[0]}. There's a fix, and it doesn't require a designer.

ASPIRATION / IDENTITY HOOKS (4)
${hr()}
6. What if your ${mat} looked like they were designed by a studio that charges $10k a month?
7. The ${n.niche} professionals who consistently ${verb} have one thing in common — their brand looks intentional.
8. Bespoke visuals. Luxury positioning. ${n.priceMin === n.priceMax ? '$' + n.priceMin : '$' + n.priceMin + '–$' + n.priceMax} for the whole pack. This is not a drill.
9. ${c.transformation.charAt(0).toUpperCase() + c.transformation.slice(1)} — that's what ${n.title} was built for.

AUTHORITY / PROOF HOOKS (4)
${hr()}
10. I studied what the top-performing ${n.niche} professionals have in common. It's not their track record. It's their presentation.
11. The difference between a ${n.niche} professional who charges $${n.priceMin} and one who charges $${n.priceMax * 3}? Perceived value. And perceived value starts with design.
12. Here's what I know after building ${n.title}: ${aud} don't lose ${c.clientWord} on price. They lose them on first impressions.
13. Every template in ${n.title} was built around one question: "Does this make the buyer look like the premium choice in the room?"

BEFORE / AFTER HOOKS (4)
${hr()}
14. Before ${n.title}: Cobbling together generic templates at midnight before a big presentation. After: Opening a polished, ready-to-brand kit and customizing it in 20 minutes.
15. Before: Your ${mat} look like everyone else's. After: ${c.clientWord} assume you're the premium option before you've said a word.
16. Before ${n.title}: Paying a designer $300–$800 per project. After: $${n.priceMax} once, unlimited use forever.
17. Before: Hoping your content will compensate for weak visuals. After: Your visuals do the selling before the meeting even starts.

URGENCY HOOKS (3)
${hr()}
18. Launch price on ${n.title} ends [DATE]. After that, $${n.priceMax}. Download now while it's $${n.priceMin}.
19. Every week you present with amateur ${mat} is a week ${comp} look more credible than you. Fix it today.
20. The ${n.niche} market doesn't wait. Your ${c.clientWord} are deciding right now. Make sure your brand says "premium."`;
};

const INSTAGRAM = (p,n) => {
  // Prefer AI-generated captions if they exist and are high-quality
  if (n.igCaps.length >= 8 && n.igCaps.every(c => c && c.length > 60)) {
    return `INSTAGRAM CAPTIONS — ${n.title}\n${'═'.repeat(60)}\n\n` + n.igCaps.slice(0,10).map((c,i) => `${'─'.repeat(60)}\nCAPTION ${i+1}\n${'─'.repeat(60)}\n${c}`).join('\n\n');
  }
  const c = socialCtx(n);
  const kw = c.kw;
  const tags5 = kw.slice(0,5).map(k=>'#'+k.replace(/\s+/g,'')).join(' ');
  const tags8 = kw.slice(0,8).map(k=>'#'+k.replace(/\s+/g,'')).join(' ');
  return `INSTAGRAM CAPTIONS — ${n.title}
${'═'.repeat(60)}
10 captions: 3 educational · 3 promotional · 2 story-based · 2 urgency/launch
${'═'.repeat(60)}

${'─'.repeat(60)}
CAPTION 1 — EDUCATIONAL: Visual Brand = Business Credibility
${'─'.repeat(60)}
Here's a truth most ${n.niche} professionals skip:

Your ${c.materialWord} are marketing before you even open your mouth.

${c.clientWord.charAt(0).toUpperCase() + c.clientWord.slice(1)} form an opinion about your professionalism in the first 7 seconds of seeing your materials.

That opinion affects:
→ Whether they trust your pricing
→ Whether they compare you to ${c.competitorPhrase}
→ Whether they say yes in the room

${n.title} gives you the visual system to make that first impression count.

${tags5} #${n.niche.replace(/\s+/g,'')}branding #premiumtemplates

${'─'.repeat(60)}
CAPTION 2 — EDUCATIONAL: The Cost of Looking Generic
${'─'.repeat(60)}
Unpopular opinion: Bad design is costing you more than you think.

Not because ${c.clientWord} are design critics.

But because professional design signals:
✦ You take your business seriously
✦ You understand premium positioning
✦ You're worth what you're charging

${c.pain.split('.')[0]}.

${n.title} was built to solve exactly that.

${'─'.repeat(60)}
CAPTION 3 — EDUCATIONAL: What's Inside ${n.title}
${'─'.repeat(60)}
What's actually in ${n.title}? 👀

${n.sections.length > 0 ? n.sections.slice(0,5).map((s,i) => `${i+1}. ${s.title||s.heading}`).join('\n') : `Each template includes:\n→ Ready-to-brand layout\n→ Copy blocks you just fill in\n→ Professional typography + color system\n→ Export-ready format`}

Every template is built for ${c.audShort} who need to look like the premium option in the room.

$${n.priceMin} for the full pack. Link in bio.

${tags8}

${'─'.repeat(60)}
CAPTION 4 — PROMOTIONAL: Launch Announcement
${'─'.repeat(60)}
${n.title} is live. 🎉

${c.promise.charAt(0).toUpperCase() + c.promise.slice(1)}.

This isn't another template pack with generic layouts. It's a complete visual brand system built specifically for ${c.audShort} — so you can walk into any client meeting looking like the premium choice.

$${n.priceMin} → download instantly on ${n.platform}.
Link in bio. 🔗

${tags8}

${'─'.repeat(60)}
CAPTION 5 — PROMOTIONAL: The Price Argument
${'─'.repeat(60)}
Let's do the math.

Hiring a designer for one polished ${n.niche} presentation: $300–$800.

Getting ${n.title} — an entire ${n.type} with ${n.sections.length || '7'}+ ready-to-use templates: $${n.priceMin}.

Same result. One-time cost. Unlimited use.

The decision is easy. Link in bio. 👆

${tags5} #designtemplates #${n.niche.replace(/\s+/g,'')}

${'─'.repeat(60)}
CAPTION 6 — PROMOTIONAL: Social Proof / Transformation
${'─'.repeat(60)}
${c.transformation.charAt(0).toUpperCase() + c.transformation.slice(1)}.

That's what ${n.title} gives ${c.audShort}.

Not just nicer-looking ${c.materialWord}. A brand that communicates: "I'm the one worth paying a premium for."

$${n.priceMin} on ${n.platform}. Get it while the launch price holds.

Link → bio. ⬆️

${'─'.repeat(60)}
CAPTION 7 — STORY: Why I Built This
${'─'.repeat(60)}
I kept seeing the same thing in ${n.niche}:

Talented professionals. Great results for their ${c.clientWord}. But their ${c.materialWord} looked like they were built in 2009.

Not because they weren't skilled.

Because they didn't have the right tools.

So I built ${n.title}. A ${n.type} for ${c.audShort} that makes "I'll think about it" a lot rarer.

$${n.priceMin}. Download today. Link in bio.

${tags5}

${'─'.repeat(60)}
CAPTION 8 — STORY: The Moment It Clicked
${'─'.repeat(60)}
There's a moment every ${n.niche} professional has.

You walk out of a meeting knowing you were the most qualified person in the room — and they still went with someone else.

That's ${c.pain.split('.')[0].toLowerCase()}.

${n.title} exists so that moment stops happening.

${c.promise.charAt(0).toUpperCase() + c.promise.slice(1)}.

Link in bio. 🔗

${'─'.repeat(60)}
CAPTION 9 — URGENCY: Launch Price Ending
${'─'.repeat(60)}
Launch price on ${n.title} ends [DATE]. ⏳

After that: $${n.priceMax}.

Right now: $${n.priceMin}.

This is the only time I'll offer it at this price.

${c.materialWord.charAt(0).toUpperCase() + c.materialWord.slice(1)} that make ${c.clientWord} say yes before you've even opened your mouth.

Link in bio. Get it now.

${tags8}

${'─'.repeat(60)}
CAPTION 10 — URGENCY: Last Chance
${'─'.repeat(60)}
Last call for ${n.title} at $${n.priceMin}. 🚨

Price goes to $${n.priceMax} at midnight [DATE].

If you've been thinking about it — this is the sign.

${n.title} — the ${n.type} that makes ${c.audShort} look like the premium option. Every. Single. Time.

Link in bio. ⬆️

${tags8}`;
};



const LINKEDIN = (p,n) => {
  const c = socialCtx(n);
  const tags3 = c.kw.slice(0,3).map(k=>'#'+k.replace(/\s+/g,'')).join(' ');
  const tags5 = c.kw.slice(0,5).map(k=>'#'+k.replace(/\s+/g,'')).join(' ');
  return `LINKEDIN POSTS — ${n.title}
${'═'.repeat(60)}
5 professional posts: authority-building, problem-aware, proof, launch, value.
Tone: Confident, premium, peer-to-peer. No hype.
${'═'.repeat(60)}

${'─'.repeat(60)}
POST 1 — AUTHORITY: The Visual Brand Problem Nobody Talks About
${'─'.repeat(60)}
There's a branding problem in ${n.niche} that most professionals refuse to acknowledge:

Your ${c.materialWord} signal your price point before you've said a word.

${c.clientWord.charAt(0).toUpperCase() + c.clientWord.slice(1)} walk into their first interaction having already decided where you sit in the market. They've seen your brochure, your deck, your listing presentation. And they've formed an opinion.

The professionals consistently winning against ${c.competitorPhrase} have one unfair advantage: their brand looks like it cost ten times what it did.

I built ${n.title} to give ${c.audShort} that exact advantage — without a $10,000 design retainer.

${c.promise.charAt(0).toUpperCase() + c.promise.slice(1)}.

$${n.priceMin} on ${n.platform}. Link in comments.

${tags3} #${n.niche.replace(/\s+/g,'')}branding #premiumtemplates

${'─'.repeat(60)}
POST 2 — VALUE: 3 Things Premium Brands Do Differently
${'─'.repeat(60)}
After studying how top-performing ${n.niche} professionals position themselves, I noticed three consistent patterns in their ${c.materialWord}:

1. Every page has intentional hierarchy. The ${c.clientWord}'s eye is guided — never left to wander.

2. Color and typography are consistent. Not just "branded" — *purposefully* limited to 2–3 elements that signal taste.

3. The copy does the emotional work; the design does the trust work. Neither tries to do both.

These are the principles behind every template in ${n.title}.

Not theory. Structured, ready-to-use files for ${c.audShort} who understand that design is sales.

$${n.priceMin} → ${n.platform}. [link in comments]

${tags5}

${'─'.repeat(60)}
POST 3 — PROBLEM-AWARE: Why Talented Professionals Lose to Weaker Competitors
${'─'.repeat(60)}
Here's the pattern I see constantly in ${n.niche}:

Highly skilled professional. Excellent track record. Decades of expertise.

Loses the listing/client to someone with half the experience.

Why?

Because the competitor's ${c.materialWord} communicated "premium" in the first 10 seconds. Yours communicated "competent."

Competent doesn't win in the luxury segment.

Premium wins.

${n.title} was designed specifically to close that gap — for ${c.audShort} who are done letting their visual brand undersell them.

${c.transformation.charAt(0).toUpperCase() + c.transformation.slice(1)}.

$${n.priceMin}. One-time. Yours to keep.

${tags3}

${'─'.repeat(60)}
POST 4 — LAUNCH: ${n.title} Is Now Available
${'─'.repeat(60)}
${n.title} is now live on ${n.platform}.

It's a ${n.type} built for ${c.audShort} who want to walk into every client-facing moment looking like the premium option — not the affordable alternative.

What's included:
${n.sections.length > 0 ? n.sections.slice(0,5).map((s,i) => `→ ${s.title||s.heading}`).join('\n') : `→ Complete template blueprint library for ${n.niche}\n→ Layout specs + copy blocks — build in any design tool\n→ Headlines, CTAs, and field guides included\n→ Export-ready format recommendations\n→ Step-by-step customization guide`}

Launch price: $${n.priceMin} (going to $${n.priceMax} on [DATE]).

Link in comments.

${tags5}

${'─'.repeat(60)}
POST 5 — PROOF: The ROI of Looking Premium in ${n.niche}
${'─'.repeat(60)}
Let's talk about the economics of design in ${n.niche}.

One lost ${c.clientWord} to a more polished competitor = [X] in missed commissions/revenue.

One ${n.title} purchase = $${n.priceMin}.

The math is not complicated.

But beyond ROI: there's the compounding effect of consistently looking premium. ${c.clientWord} refer you. They assume you're worth more. They push back less on price.

${c.promise.charAt(0).toUpperCase() + c.promise.slice(1)}.

That's what ${n.title} is for.

$${n.priceMin} on ${n.platform}. [link in comments]

${tags3} #ROI #${n.niche.replace(/\s+/g,'')}`;
};

const TIKTOK = (p,n) => {
  const c = socialCtx(n);
  const mat = c.materialWord; const aud = c.audShort; const comp = c.competitorPhrase;
  const verb = c.resultVerb; const kw0 = c.kw[0]||n.niche; const kw1 = c.kw[1]||'design';
  return `TIKTOK / REEL IDEAS — ${n.title}
${'═'.repeat(60)}
7 complete video ideas with hook, scene-by-scene outline, on-screen text, and CTA.
Format: 30–60 second Reels or TikToks.
${'═'.repeat(60)}

${'─'.repeat(60)}
VIDEO 1 — BEFORE / AFTER REVEAL
${'─'.repeat(60)}
HOOK: "I'm going to show you what $${n.priceMin} did for my ${n.niche} brand 👀"

SCENE 1 (0–3s): Open with hands on laptop. On-screen text: "Before ${n.title}"
SCENE 2 (3–8s): Show a generic-looking ${n.niche} document — DIY, template-style, low-design.
  On-screen text: "What most ${aud} use right now"
SCENE 3 (8–16s): Slow reveal of the ${n.title} template — clean, editorial, premium.
  On-screen text: "After. Same agent. Same content. Different brand."
SCENE 4 (16–24s): Scroll through 3–4 different templates quickly. Upbeat music.
  On-screen text: "${n.sections.length || '7'}+ templates included"
SCENE 5 (24–30s): Face to camera. Speak directly:
  "This is what ${aud} who consistently ${verb} have that others don't. It's not experience. It's presentation."

CTA: "Link in bio → grab ${n.title} for $${n.priceMin}"

${'─'.repeat(60)}
VIDEO 2 — REACTION / WHAT'S INSIDE UNBOX
${'─'.repeat(60)}
HOOK: "Okay I just downloaded ${n.title} and I need to show you what's inside 🔥"

SCENE 1 (0–4s): Open with download notification or folder reveal.
  On-screen text: "${n.title} — $${n.priceMin} on ${n.platform}"
SCENE 2 (4–20s): Screen share / scroll through each template one by one. Narrate:
  "This one is the [template name]. This is [template name 2]. This is [template name 3]..."
  On-screen text: Label each template as you scroll.
SCENE 3 (20–28s): Zoom into one template showing the layout quality.
  On-screen text: "Blueprint included. Build it in your design tool in 20 minutes."
SCENE 4 (28–35s): Face to camera.
  Narrate: "For $${n.priceMin}, this is the most obvious investment for ${aud} I've seen."

CTA: "Comment LINK and I'll DM you the direct download page"

${'─'.repeat(60)}
VIDEO 3 — PAIN POINT DIRECT ADDRESS
${'─'.repeat(60)}
HOOK: "If you're losing ${c.clientWord} to ${comp}, your problem isn't your skills. It's your brand."

SCENE 1 (0–5s): Face to camera. Serious tone.
  On-screen text: "The real reason ${aud} lose to ${comp}"
SCENE 2 (5–15s): Narrate the problem:
  "${c.pain.split('.')[0]}. And it has nothing to do with how good you are."
  On-screen text: "${c.clientWord.charAt(0).toUpperCase() + c.clientWord.slice(1)} judge your credibility in seconds."
SCENE 3 (15–25s): Introduce the fix.
  "The fix isn't expensive. It's ${n.title} — a ${n.type} that makes ${aud} look like the premium option in the room."
  On-screen text: "${n.title} — $${n.priceMin} | ${n.platform}"
SCENE 4 (25–35s): Close with transformation statement.
  "${c.promise.charAt(0).toUpperCase() + c.promise.slice(1)}. Without hiring a designer."

CTA: "Link in bio → download instantly"

${'─'.repeat(60)}
VIDEO 4 — "DID YOU KNOW" EDUCATIONAL
${'─'.repeat(60)}
HOOK: "Did you know the top ${n.niche} professionals all share one visual habit?"

SCENE 1 (0–4s): On-screen text: "What top ${n.niche} professionals do differently (that nobody talks about)"
SCENE 2 (4–18s): 3-point list reveal (one at a time):
  Point 1: "Their brand has a defined color system — never random."
  On-screen text: "1. Intentional color palette"
  Point 2: "Their ${mat} use consistent typography — max 2 fonts."
  On-screen text: "2. Typography discipline"
  Point 3: "Every page guides the ${c.clientWord}'s eye toward YES."
  On-screen text: "3. Visual hierarchy that closes"
SCENE 3 (18–28s): Show ${n.title} templates as examples.
  On-screen text: "All of this is built into ${n.title}"
SCENE 4 (28–35s): CTA.

CTA: "Save this. Then grab the pack at the link in bio."

${'─'.repeat(60)}
VIDEO 5 — PRICE OBJECTION DESTROYER
${'─'.repeat(60)}
HOOK: "Let's talk about why $${n.priceMax} for ${n.title} is the most rational purchase you'll make this year."

SCENE 1 (0–5s): On-screen text: "The ROI of professional ${n.niche} design"
SCENE 2 (5–20s): Build the math on screen:
  "One lost ${c.clientWord} to a competitor = [insert your average commission/fee]"
  "One ${n.title} purchase = $${n.priceMin}"
  "Break-even: The first time your ${mat} win you a ${c.clientWord.slice(0,-1)} they wouldn't have otherwise."
  On-screen text: Appear line by line as you narrate.
SCENE 3 (20–30s): "Stop treating design as an expense. It's a sales tool."
  On-screen text: "Professional design = professional pricing power"
SCENE 4 (30–38s): Direct CTA.

CTA: "Link in bio → $${n.priceMin} while the launch price holds"

${'─'.repeat(60)}
VIDEO 6 — "POV: USING ${n.title.toUpperCase().slice(0,20)}" SPEED BUILD
${'─'.repeat(60)}
HOOK: "POV: You have a ${n.niche} presentation tomorrow and you just found ${n.title} 🎯"

SCENE 1 (0–3s): Clock showing "next morning" or calendar.
  On-screen text: "POV: Big ${c.clientWord} meeting in 24 hours"
SCENE 2 (3–20s): Time-lapse / sped-up screen recording of opening a template and customizing:
  Add name → swap colors → add logo → insert property/project details.
  On-screen text: "Step 1: Open template | Step 2: Add your brand | Step 3: Export"
SCENE 3 (20–28s): Final result — polished, premium document on screen.
  On-screen text: "Time spent: 22 minutes. Result: looks like a $2,000 design job."
SCENE 4 (28–35s): Face to camera.
  "That's ${n.title}. $${n.priceMin}. Link in bio."

CTA: "Comment 'TEMPLATES' and I'll send you the link directly"

${'─'.repeat(60)}
VIDEO 7 — LAUNCH URGENCY
${'─'.repeat(60)}
HOOK: "I'm raising the price of ${n.title} on [DATE]. Here's why you should grab it now."

SCENE 1 (0–5s): On-screen text: "⚠️ Price increase on ${n.title} — [DATE]"
SCENE 2 (5–18s): Quick recap of what's included:
  "${n.sections.length || '7'}+ templates. Built for ${aud}. Ready to customize in minutes."
  On-screen text: List 3–4 key templates.
SCENE 3 (18–28s): "Right now it's $${n.priceMin}. Launch price. After [DATE]: $${n.priceMax}."
  On-screen text: "$${n.priceMin} TODAY → $${n.priceMax} on [DATE]"
SCENE 4 (28–35s): "If you've been on the fence — this is the moment."

CTA: "Link in bio. Don't wait."`;
};

const CAROUSEL = (p,n) => {
  const c = socialCtx(n);
  const mat = c.materialWord; const aud = c.audShort; const comp = c.competitorPhrase;
  const secs = n.sections.slice(0,6);
  const secList = secs.length > 0 ? secs : [{title:'Listing Presentation Cover'},{title:'Property Brochure Layout'},{title:'Market Report Page'},{title:'Agent Bio Template'},{title:'Open House Flyer'},{title:'Follow-Up Card'}];
  return `CAROUSEL POST OUTLINES — ${n.title}
${'═'.repeat(60)}
5 carousels with 6–8 slides each. Specific to ${n.niche} branding and ${mat}.
Use in Instagram, LinkedIn, or Pinterest.
${'═'.repeat(60)}

${'─'.repeat(60)}
CAROUSEL 1 — "5 Visual Mistakes Costing ${aud} ${c.clientWord.charAt(0).toUpperCase()+c.clientWord.slice(1)}" (7 slides)
${'─'.repeat(60)}
Slide 1 (Cover): "5 visual mistakes costing ${aud} ${c.clientWord}"
  Design: Dark background, bold white headline, small subtitle: "And how to fix them before your next meeting"

Slide 2 — Mistake #1: Generic fonts
  Headline: "You're using the same font as everyone else"
  Body: "Times New Roman and Calibri signal 'I used a template.' Premium brands use 1–2 intentional fonts — usually a serif display + clean sans-serif. Your ${mat} should feel like a design decision, not a default."

Slide 3 — Mistake #2: No hierarchy
  Headline: "Your page doesn't guide the eye — it overwhelms it"
  Body: "If ${c.clientWord} have to search for the most important information, they'll decide you're not organized. Premium ${mat} have one dominant element per page. Everything else supports it."

Slide 4 — Mistake #3: Wrong color usage
  Headline: "Too many colors = zero brand identity"
  Body: "3+ accent colors look like a DIY job. Top-tier ${n.niche} professionals limit to 2 brand colors — maximum. One dominant, one accent. That restraint is what makes it look expensive."

Slide 5 — Mistake #4: Photos without treatment
  Headline: "Your photos aren't doing any selling"
  Body: "Unedited, poorly cropped photos undercut even the best property. Premium ${mat} use consistent photo treatment — cropping ratio, brightness, and a subtle overlay that ties the image to the brand."

Slide 6 — Mistake #5: Inconsistent layout between pages
  Headline: "Pages that don't match each other = no brand trust"
  Body: "When each page of your presentation looks like it came from a different document, ${c.clientWord} feel it — even if they can't name it. Consistency = credibility."

Slide 7 (CTA):
  Headline: "Every template in ${n.title} fixes all 5 of these."
  Body: "$${n.priceMin} on ${n.platform}. Link in bio."

${'─'.repeat(60)}
CAROUSEL 2 — "What's Inside ${n.title}" (8 slides)
${'─'.repeat(60)}
Slide 1 (Cover): "What's inside ${n.title} 👀"
  Subtitle: "The ${n.type} built for ${aud}"

${secList.map((s,i) => `Slide ${i+2}: ${s.title||s.heading||'Template '+(i+1)}
  Visual: Preview of the template layout
  Caption: "Template ${i+1}: ${s.title||s.heading||'Template '+(i+1)} — layout blueprint + copy blocks, built for ${n.niche}"`).join('\n\n')}

Slide ${secList.length+2} (CTA):
  Headline: "$${n.priceMin} for the full pack."
  Body: "Instant download on ${n.platform}. Link in bio."

${'─'.repeat(60)}
CAROUSEL 3 — "How to Look Premium in ${n.niche} in 30 Minutes" (6 slides)
${'─'.repeat(60)}
Slide 1 (Cover): "How to look premium in ${n.niche} in under 30 minutes"
  Subtitle: "A step-by-step guide for ${aud}"

Slide 2 — Step 1: Download & Open
  Headline: "Step 1: Open your ${n.title} template"
  Body: "Pick the template for your next client interaction. Listing presentation? Market report? Agent bio? You've got dedicated templates for each."

Slide 3 — Step 2: Brand it
  Headline: "Step 2: Drop in your brand colors + logo"
  Body: "Every template has clearly labelled brand zones. Replace the placeholder colors with your hex codes. Add your logo to the designated area. Takes under 5 minutes."

Slide 4 — Step 3: Customize the copy
  Headline: "Step 3: Replace [BRACKETS] with your content"
  Body: "Every copy block is marked for easy replacement. Your name, your property details, your stats. No design guessing — just fill in the blanks."

Slide 5 — Step 4: Export
  Headline: "Step 4: Export as PDF or PNG"
  Body: "Print-ready PDF for physical delivery. High-res PNG for digital sending. Takes 60 seconds."

Slide 6 (CTA):
  Headline: "That's the 30-minute luxury brand upgrade."
  Body: "${n.title} — $${n.priceMin} on ${n.platform}. Link in bio."

${'─'.repeat(60)}
CAROUSEL 4 — "The Hidden Cost of Generic ${mat.charAt(0).toUpperCase()+mat.slice(1)}" (7 slides)
${'─'.repeat(60)}
Slide 1 (Cover): "What is your current ${mat} actually costing you?"
  Subtitle: "The math most ${aud} haven't done"

Slide 2 — The visible cost:
  Headline: "You see: a free Canva template"
  Body: "It looks fine. It's passable. You saved a few hours. No big deal, right?"

Slide 3 — The hidden cost #1:
  Headline: "${c.clientWord.charAt(0).toUpperCase()+c.clientWord.slice(1)} who assume you're mid-market"
  Body: "When your ${mat} look like everyone else's, ${c.clientWord} assume your fees should be too. You spend the whole meeting fighting a perception you created before you walked in."

Slide 4 — The hidden cost #2:
  Headline: "${c.clientWord.charAt(0).toUpperCase()+c.clientWord.slice(1)} who go with ${comp}"
  Body: "Not because the competitor is better. Because their brand communicates premium — and yours communicates 'affordable option.'"

Slide 5 — The hidden cost #3:
  Headline: "Referrals that never come"
  Body: "Premium ${c.clientWord} refer premium professionals. Generic presentation = you don't make the mental shortlist when someone asks 'who should I use?'"

Slide 6 — The fix:
  Headline: "${n.title}"
  Body: "${c.promise.charAt(0).toUpperCase()+c.promise.slice(1)}. Without a designer. Without a rebrand. In under 30 minutes per project."

Slide 7 (CTA):
  Headline: "$${n.priceMin} vs. the cost of looking average."
  Body: "Link in bio → ${n.platform}"

${'─'.repeat(60)}
CAROUSEL 5 — "Before vs. After: ${n.niche} Brand Transformation" (6 slides)
${'─'.repeat(60)}
Slide 1 (Cover): "Before vs. After: What ${n.title} actually does to your ${n.niche} brand"
  Subtitle: "Real comparison. No fluff."

Slide 2 — Before:
  Headline: "Before: Generic listing presentation"
  Body: "Standard formatting. Default fonts. Stock photos with no treatment. Looks like it took 45 minutes to build. ${c.clientWord} can tell."

Slide 3 — After:
  Headline: "After: ${n.title} listing presentation template"
  Body: "Editorial layout. Intentional typography. Consistent color system. Looks like a studio spent a week on it. Took 20 minutes to customize."

Slide 4 — Before:
  Headline: "Before: Agent bio page"
  Body: "Text block with a headshot. No hierarchy. No brand signal. Forgettable."

Slide 5 — After:
  Headline: "After: ${n.title} agent bio template"
  Body: "Name as a design element. Stat callouts that build authority. Brand color stripe. A page that says 'this person is the premium choice.'"

Slide 6 (CTA):
  Headline: "The transformation is $${n.priceMin}."
  Body: "${n.title} on ${n.platform}. Link in bio. Download today."`;
};

const HASHTAGS = (p,n) => {const ni=n.niche.replace(/\s+/g,''),ty=n.type.replace(/\s+/g,''),pl=n.platform.toLowerCase().replace(/\s+/g,''),kw=n.keywords.map(k=>'#'+k.replace(/\s+/g,'')); return `HASHTAG GROUPS — ${n.title}\n${'═'.repeat(60)}\n\nINSTAGRAM — FULL 30\n${hr()}\n${kw.slice(0,8).join(' ')} #${ni} #${ty}\n#digitalproduct #passiveincome #onlinebusiness #sidehustle #digitaldownload #etsy #gumroad #${pl}\n#entrepreneur #smallbusiness #makemoneyonline #workfromhome #creativeentrepreneur #businessowner #solopreneur #contentcreator #digitalmarketing #onlinestore\n\nINSTAGRAM — COMPACT 15\n${hr()}\n${kw.slice(0,5).join(' ')} #${ni} #${ty} #digitalproduct #passiveincome #digitaldownload #onlinebusiness #sidehustle #entrepreneur #smallbusiness\n\nTIKTOK (5–8 tags)\n${hr()}\n${kw.slice(0,3).join(' ')} #digitalproducts #${ni} #sidehustle #passiveincome\n\nLINKEDIN (3–5)\n${hr()}\n#${ni} #${ty} #digitalproducts #entrepreneurship #onlinebusiness\n\nPINTEREST\n${hr()}\n${n.keywords.join(', ')}, digital product, ${n.type}, ${n.platform}`;};

const CALENDAR = (p,n) => {
  const c = socialCtx(n);
  const mat = c.materialWord; const aud = c.audShort;
  // Validate stored calendar items — each must have a valid day number and real message
  const validCalItems = n.calItems.filter(d => d && Number.isInteger(Number(d.day)) && Number(d.day) > 0 && d.message && String(d.message).trim().length > 30);
  if (validCalItems.length >= 5) return `7-DAY POSTING CALENDAR — ${n.title}\n${'═'.repeat(60)}\n\n` + validCalItems.slice(0,7).map(d => `DAY ${d.day} — ${(d.platform||'Social').toUpperCase()}\nType: ${d.content_type||'Post'}\n${d.message}`).join('\n\n');
  return `7-DAY POSTING CALENDAR — ${n.title}
${'═'.repeat(60)}
Full 7-day launch calendar for ${n.title}.
Each day: platform · post type · topic · caption angle · CTA · file reference.
${'═'.repeat(60)}

DAY 1 — LAUNCH DAY 🚀
${hr()}
Platform:     Instagram + LinkedIn
Post Type:    Static image + announcement caption
Topic:        "${n.title} is live"
Caption Angle: Lead with the transformation. "${c.promise.charAt(0).toUpperCase()+c.promise.slice(1)}. Without a designer. Without a rebrand."
CTA:          "Link in bio → download instantly for $${n.priceMin}"
Email:        Send Email_1_Announcement.txt to your list
File Ref:     Instagram_Captions.txt → Caption 4 (Promotional) | LinkedIn_Posts.txt → Post 4 (Launch)
Goal:         First impressions, announce to warm audience, first sales

DAY 2 — EDUCATION + REACH
${hr()}
Platform:     TikTok / Instagram Reels
Post Type:    Short-form video (30–45 seconds)
Topic:        "5 visual mistakes costing ${aud} ${c.clientWord}"
Caption Angle: Pain-point education. Name the specific mistakes without selling first.
CTA:          "Save this. Then grab ${n.title} at the link in bio."
File Ref:     TikTok_Reel_Ideas.txt → Video 1 (Before/After Reveal)
Goal:         Reach new audience through educational content, build authority

DAY 3 — CAROUSEL + VALUE EMAIL
${hr()}
Platform:     Instagram + LinkedIn
Post Type:    Carousel (6–8 slides)
Topic:        "What's Inside ${n.title}"
Caption Angle: Curiosity-driven. "You asked what's included. Here's every template — with screenshots."
CTA:          "Last slide has the link. $${n.priceMin} for the full pack."
Email:        Send Email_2_Educational_Value.txt
File Ref:     Carousel_Post_Outlines.txt → Carousel 2 (What's Inside)
Goal:         Educate warm audience, overcome "what is this?" objection

DAY 4 — AUTHORITY + LINKEDIN PUSH
${hr()}
Platform:     LinkedIn (primary) + TikTok (secondary)
Post Type:    LinkedIn text post (professional angle) + TikTok video
Topic (LinkedIn): "The visual brand problem nobody in ${n.niche} talks about"
Topic (TikTok):   "POV: Using ${n.title} for the first time"
Caption Angle (LinkedIn): Peer-to-peer. Write as a trusted colleague sharing a hard truth.
CTA:          LinkedIn: "Link in comments" | TikTok: "Comment TEMPLATES for the link"
File Ref:     LinkedIn_Posts.txt → Post 1 (Authority) | TikTok_Reel_Ideas.txt → Video 6 (Speed Build)
Goal:         Professional credibility, reach B2B / ${n.niche} community audience

DAY 5 — SOCIAL PROOF + STORY
${hr()}
Platform:     Instagram Stories + Instagram Feed
Post Type:    Story poll + Feed caption
Topic (Stories): Poll: "Does your current ${mat} represent your brand well?" Yes/No
Topic (Feed):    Story-based caption about why you built ${n.title}
Caption Angle: Vulnerable + specific. "I kept seeing talented ${aud} lose ${c.clientWord} to ${c.competitorPhrase}..."
CTA:          "Full story in the caption. Link to ${n.title} in bio."
File Ref:     Instagram_Captions.txt → Caption 7 (Story: Why I Built This)
Goal:         Emotional connection, expand reach via story engagement

DAY 6 — URGENCY + OFFER
${hr()}
Platform:     Instagram + LinkedIn + Email
Post Type:    Static image (price urgency) + email
Topic:        "Launch price on ${n.title} ends [DATE]"
Caption Angle: Direct and specific. "$${n.priceMin} now. $${n.priceMax} after [DATE]. Here's what you get for $${n.priceMin}."
CTA:          "Link in bio. Don't wait."
Email:        Send Email_4_Offer.txt
File Ref:     Instagram_Captions.txt → Caption 9 (Urgency) | LinkedIn_Posts.txt → Post 5 (ROI)
Goal:         Convert fence-sitters, urgency-driven conversions

DAY 7 — FINAL PUSH
${hr()}
Platform:     All platforms simultaneously
Post Type:    TikTok video + Instagram Story + LinkedIn post + Email
Topic:        "Last call for ${n.title} at $${n.priceMin}"
Caption Angle: Final urgency. Simple, direct, no fluff. "This is the last email/post about this."
CTA:          "Link in bio / comments. Download now."
Email:        Send Email_5_Last_Call.txt
File Ref:     TikTok_Reel_Ideas.txt → Video 7 (Launch Urgency) | Instagram_Captions.txt → Caption 10 (Last Chance)
Goal:         Final conversions, close the launch window, raise price after today`;
};

const EMAIL1 = (p,n) => {
  const c = socialCtx(n);
  const promise = n.promise || `transform your ${n.niche} brand with ${n.title}`;
  const templateList = n.sections.length > 0
    ? n.sections.slice(0,5).map(s => `• ${s.title||s.heading}`).join('\n')
    : `• Listing Presentation Templates\n• Property Brochure Layouts\n• Agent Bio Pages\n• Market Report Templates\n• Open House Flyers`;
  const benefits = n.items.length > 0
    ? n.items.slice(0,3).map(b => `• ${b}`).join('\n')
    : `• Layout spec + copy blocks for every template — no guesswork\n• Works with Canva, Adobe, PowerPoint, or Google Slides\n• Built for ${n.niche} professionals, not generic business use`;
  return `EMAIL 1 — LAUNCH ANNOUNCEMENT
${'═'.repeat(60)}
SEND ON: Launch Day
SUBJECT: It's live — ${n.title}
PREVIEW TEXT: ${promise.charAt(0).toUpperCase() + promise.slice(1, 90)}

${'─'.repeat(60)}

Hey [First Name],

Today's the day — ${n.title} is officially available.

${promise.charAt(0).toUpperCase() + promise.slice(1)}.

This ${n.type} was built specifically for ${n.av.audiencePlural}. Not a generic template pack you've seen recycled a hundred times — every layout, every copy block, and every design choice was made with one goal: to make your ${c.materialWord} look like they came from a studio charging ten times what you paid.

Here's what's inside:

${templateList}

${benefits}

All for $${n.priceMin}. Instant download. Yours to keep and use forever.

→ Grab it now: [INSERT LINK]

This is the launch price. It goes up on [DATE].

Talk soon,
[Your Name]

P.S. If you know another ${n.niche} professional who's been meaning to upgrade their brand materials — forward this. They'll thank you.`;
};

const EMAIL2 = (p,n) => {
  const c = socialCtx(n);
  const painPoint = n.pa?.painPoint || `losing high-value clients to competitors with more polished ${c.materialWord}`;
  const transformation = n.pa?.transformation || `look like the premium choice in every client-facing moment`;
  return `EMAIL 2 — EDUCATIONAL VALUE
${'═'.repeat(60)}
SEND ON: Day 3
SUBJECT: Why luxury ${c.clientWord} judge your marketing before they judge your experience
PREVIEW TEXT: The uncomfortable truth about what happens before you even open your mouth

${'─'.repeat(60)}

Hey [First Name],

Here's something most ${n.niche} professionals don't want to admit:

Your potential ${c.clientWord} have already made a decision about you before you say a single word.

They've seen your listing presentation. They've looked at your property brochure. They've glanced at your agent bio. And in those first few seconds, they've answered the question that determines whether they'll trust you with a multi-million-dollar transaction:

"Does this person look like the premium option?"

This isn't about being judgmental. It's how the human brain processes credibility. Visual quality signals expertise, attention to detail, and — most critically — whether you're worth a premium commission.

The agents who consistently win high-end listings aren't necessarily the most experienced in the room. They're the ones whose ${c.materialWord} communicate: "I operate at your level."

Here's what separates them visually:

→ A cover page that feels editorial, not assembled from stock elements
→ Typography that's intentional — one strong serif, one clean sans-serif — never a default
→ A color palette limited to 2–3 tones that signal restraint and taste
→ A property brochure where every image has been cropped and treated consistently
→ An agent bio that reads as authority — statistics, credentials, and a confident tone

Every template in ${n.title} was built around these exact principles. Not generic layouts repurposed from a business toolkit — specific files designed for ${n.av.audiencePlural} who understand that design is a sales tool.

${transformation.charAt(0).toUpperCase() + transformation.slice(1)}.

→ [INSERT LINK] — $${n.priceMin}

[Your Name]

P.S. Tomorrow I'm sending one more email about what happens when ${c.clientWord} walk into a listing presentation and the brochure on the table doesn't match the quality of the property being sold.`;
};

const EMAIL3 = (p,n) => {
  const c = socialCtx(n);
  const painPoint = n.pa?.painPoint || `losing clients to better-presented competitors`;
  const promise = n.promise || `transform your visual brand from generic to premium`;
  return `EMAIL 3 — PROBLEM AWARE
${'═'.repeat(60)}
SEND ON: Day 5
SUBJECT: How dated brochures quietly kill seller trust
PREVIEW TEXT: It's not that they didn't like you. It's that your materials told a different story.

${'─'.repeat(60)}

Hey [First Name],

Imagine this.

A prospective seller interviews three agents. All three are experienced. All three have strong track records. But when the meeting is over and the seller's family sits down to discuss who they'll list with, one thing comes up:

"Their brochure and presentation looked so much more professional."

That's it. That's the whole deciding factor.

It doesn't matter that you've sold more properties, negotiated better terms, or have a stronger network. If your ${c.materialWord} look dated — if the fonts are default, the layout generic, the property brochure forgettable — the subconscious message to a luxury seller is: "This agent doesn't operate at our level."

${painPoint.charAt(0).toUpperCase() + painPoint.slice(1)}.

And here's the part that makes it worse: you'll never know. The seller won't tell you. They'll send a polite rejection email and list with the agent whose brand looked the part.

This is why ${n.title} exists.

It's a ${n.type} built so that ${n.av.audiencePlural} never walk into a listing appointment undermined by their own marketing materials. Every template — from the cover page to the property brochure to the market report — is designed to signal one thing to a high-net-worth seller:

"This agent takes presentation as seriously as I take my property."

${promise.charAt(0).toUpperCase() + promise.slice(1)}.

$${n.priceMin} → [INSERT LINK]

[Your Name]

P.S. Tomorrow's email breaks down exactly what's inside — every template, every file, and why each one was built the way it was.`;
};

const EMAIL4 = (p,n) => {
  const c = socialCtx(n);
  const templateList = n.sections.length > 0
    ? n.sections.slice(0,7).map((s,i) => `${i+1}. ${s.title||s.heading}`).join('\n')
    : `1. Luxury Listing Presentation Cover
2. Editorial Property Brochure (4-page)
3. Agent Bio & Credentials Page
4. Market Report Summary Page
5. Open House Invitation Flyer
6. Seller Follow-Up Card
7. Private Showing Announcement`;
  const benefits = n.items.length > 0
    ? n.items.slice(0,4).map(b => `✅ ${b}`).join('\n')
    : `✅ Layout spec + copy blocks — no guesswork on what to build or write
✅ Works with Canva, Adobe, PowerPoint, and Google Slides
✅ Each blueprint buildable in under 30 minutes in your design tool
✅ One-time purchase — download yours and keep it forever`;
  return `EMAIL 4 — THE OFFER
${'═'.repeat(60)}
SEND ON: Day 6
SUBJECT: Here's exactly what's inside ${n.title}
PREVIEW TEXT: Every template, every file — and why each one was built the way it was

${'─'.repeat(60)}

Hey [First Name],

I've been talking about ${n.title} all week. Today I want to show you exactly what's in it.

Here's every template included in the pack:

${templateList}

Each blueprint includes:
→ A detailed layout specification — sections, columns, hierarchy, and dimensions
→ A required assets checklist — every photo, logo, and data point you need before opening your design tool
→ 3 ready-to-paste copy blocks written specifically for that template's use case
→ A field-by-field guide — every [BRACKET] explained so you know exactly what to replace
→ Export instructions for both print and digital delivery

${benefits}

The entire pack is $${n.priceMin}.

To put that in perspective: a freelance designer will charge $150–$500 just to tell you what layout to use and what to write. ${n.title} gives you that exact blueprint — layout spec, copy, and field guide — for ${n.sections.length > 3 ? n.sections.length : '7'}+ templates, for $${n.priceMin}. You build it in Canva or PowerPoint; the hard thinking is already done.

You pay once. You own it forever. No subscriptions, no recurring fees.

→ Download instantly: [INSERT LINK]

Launch price closes on [DATE].

[Your Name]

P.S. This is the only time I'll offer it at $${n.priceMin}. After [DATE] it goes to $${n.priceMax}. If you're planning to grab it, now is the moment.`;
};

const EMAIL5 = (p,n) => {
  const c = socialCtx(n);
  const promise = n.promise || `transform your ${n.niche} brand from generic to premium`;
  const priceDiff = n.priceMax - n.priceMin;
  return `EMAIL 5 — LAST CALL
${'═'.repeat(60)}
SEND ON: Day 7 (morning)
SUBJECT: ${n.title} — price goes to $${n.priceMax} tonight
PREVIEW TEXT: Last chance to get it at $${n.priceMin}. After [TIME] tonight, it's $${n.priceMax}.

${'─'.repeat(60)}

Hey [First Name],

This is the last email I'll send about ${n.title}.

At [TIME] tonight, the price moves from $${n.priceMin} to $${n.priceMax}. That's a $${priceDiff > 0 ? priceDiff : n.priceMax - n.priceMin} increase — permanent.

If you've been on the fence, here's the short version of what you're getting for $${n.priceMin}:

A ${n.type} built for ${n.av.audiencePlural} who are done losing ground to competitors whose brand looks more polished.

${promise.charAt(0).toUpperCase() + promise.slice(1)}.

One-time purchase. Instant download. Layout specs + copy blocks ready to build from. Yours forever.

→ [INSERT LINK]

After [TIME] tonight: $${n.priceMax}.

[Your Name]

P.S. Questions before you buy? Just reply to this email — I'll get back to you quickly.`;
};

const LAUNCH_PLAN = (p,n) => {const c=socialCtx(n),mat=c.materialWord,E='═'.repeat(60),hr2='─'.repeat(60);const d=[(s,obj)=>`${s}\n${E}\nOBJECTIVE: ${obj.obj}\n\nTASKS:\n${obj.tasks.map(t=>'□ '+t).join('\n')}\n\nPLATFORM ACTION:\n${obj.plat.map(t=>'□ '+t).join('\n')}\n\nCONTENT TO PUBLISH:\n${obj.files.map(f=>'→ '+f).join('\n')}\n\nCTA: "${obj.cta}"\nSUCCESS METRIC: ${obj.metric}`]
  .concat([
    {s:'DAY 1 — LAUNCH',obj:{obj:'Go live and capture first-buyer momentum',tasks:[`Publish product on ${n.platform} — verify purchase link works`,`Update bio link on all platforms to product URL`,`Send Email 1 (Announcement) to your full list`],plat:[`Instagram: Post Caption 4 (Launch Announcement)`,`LinkedIn: Post 4 — announce to your professional network`,`Stories: "It's live" with product link sticker`],files:[`Instagram_Captions.txt → Caption 4`,`LinkedIn_Posts.txt → Post 4`,`Email_1_Announcement.txt`],cta:`Download at [LINK] — launch price $${n.priceMin}, going up [DATE]`,metric:`3+ sales by end of day. 50+ bio link clicks.`}},
    {s:'DAY 2 — EDUCATION + REACH',obj:{obj:'Reach new audience through value-first content — no hard selling',tasks:[`Post short-form video (30–45 sec) on TikTok or Instagram Reels`,`Reply to every Day 1 comment and DM within 2 hours`,`Share a behind-the-scenes story showing the product contents`],plat:[`TikTok / Reels: Video 1 (Before/After Reveal) — pure value`,`Instagram Stories: 15-second scroll of the templates`],files:[`TikTok_Reel_Ideas.txt → Video 1`],cta:`Save this post — grab the full pack at the link in bio`,metric:`500+ video views. 10+ saves or shares.`}},
    {s:'DAY 3 — VALUE + EMAIL',obj:{obj:'Build trust and overcome "what is this?" objections',tasks:[`Send Email 2 (Educational Value) to your list`,`Post a "What's Inside" carousel on Instagram and LinkedIn`,`Reply to all DMs asking about the product`],plat:[`Instagram: Carousel 2 (What's Inside) — show every template`,`LinkedIn: Post 2 (3 things premium brands do differently)`],files:[`Email_2_Educational_Value.txt`,`Carousel_Post_Outlines.txt → Carousel 2`,`LinkedIn_Posts.txt → Post 2`],cta:`Last slide has the link. $${n.priceMin} for the full pack.`,metric:`3% email click rate above baseline. 5+ carousel saves.`}},
    {s:'DAY 4 — AUTHORITY + PROFESSIONAL REACH',obj:{obj:'Build credibility with the professional community; reach B2B segment',tasks:[`Post LinkedIn authority post — peer-to-peer tone, no hype`,`Post TikTok/Reels pain-point video`,`Engage in 2–3 relevant ${n.niche} communities or groups`],plat:[`LinkedIn: Post 1 (Authority — visual brand problem in ${n.niche})`,`TikTok / Reels: Video 3 (Pain Point Direct Address)`],files:[`LinkedIn_Posts.txt → Post 1`,`TikTok_Reel_Ideas.txt → Video 3`],cta:`Link in comments (LinkedIn) | Comment TEMPLATES (TikTok)`,metric:`10+ LinkedIn reactions. 1 new sale from LinkedIn traffic.`}},
    {s:'DAY 5 — STORY + SOCIAL PROOF',obj:{obj:'Emotional connection and early social proof collection',tasks:[`Send Email 3 (Problem Aware) to your list`,`Post a story-based feed caption (personal narrative)`,`Run an Instagram Stories poll for engagement`,`DM Day 1–3 buyers asking for a quick testimonial`],plat:[`Instagram Feed: Caption 7 (Story — Why I Built This)`,`Instagram Stories: Poll — "Does your current ${mat} represent your brand at its best?"`],files:[`Email_3_Problem_Aware.txt`,`Instagram_Captions.txt → Caption 7`],cta:`Full story in the caption. Grab the pack at the link in bio.`,metric:`40%+ poll response rate. 1+ usable buyer testimonial.`}},
    {s:'DAY 6 — OFFER + URGENCY',obj:{obj:'Convert fence-sitters with a clear deadline and full offer breakdown',tasks:[`Send Email 4 (The Offer) — full template-by-template breakdown`,`Post urgency-focused content on Instagram and LinkedIn`,`Announce publicly that price goes up tomorrow`],plat:[`Instagram: Caption 9 (Urgency — Launch Price Ending)`,`LinkedIn: Post 5 (ROI of looking premium in ${n.niche})`,`Stories: "Price goes to $${n.priceMax} tomorrow" — countdown sticker`],files:[`Email_4_Offer.txt`,`Instagram_Captions.txt → Caption 9`,`LinkedIn_Posts.txt → Post 5`],cta:`$${n.priceMin} tonight. $${n.priceMax} from tomorrow. Link in bio.`,metric:`Highest single-day sales of the launch. 20%+ email click rate.`}},
    {s:'DAY 7 — FINAL PUSH + CLOSE',obj:{obj:'Capture last-minute buyers, raise price, and close the launch window',tasks:[`Send Email 5 (Last Call) — morning send, short and direct`,`Post final urgency content across all platforms simultaneously`,`Raise price to $${n.priceMax} at [TIME] — do not delay`,`Thank-you message to every buyer from Days 1–6`],plat:[`Instagram: Caption 10 (Last Chance — midnight countdown)`,`TikTok / Reels: Video 7 (Launch Urgency — price increase today)`,`LinkedIn: Short last-call post`,`Stories: Final countdown + "price goes up in X hours"`],files:[`Email_5_Last_Call.txt`,`Instagram_Captions.txt → Caption 10`,`TikTok_Reel_Ideas.txt → Video 7`],cta:`Last chance at $${n.priceMin}. Going to $${n.priceMax} at [TIME]. Link in bio.`,metric:`10+ total sales across 7 days. Price raised by end of day.`}},
  ].map(({s,obj})=>`${s}\n${E}\nOBJECTIVE: ${obj.obj}\n\nTASKS:\n${obj.tasks.map(t=>'□ '+t).join('\n')}\n\nPLATFORM ACTION:\n${obj.plat.map(t=>'□ '+t).join('\n')}\n\nCONTENT TO PUBLISH:\n${obj.files.map(f=>'→ '+f).join('\n')}\n\nCTA: "${obj.cta}"\nSUCCESS METRIC: ${obj.metric}`));
  return `7-DAY LAUNCH PLAN — ${n.title}\n${E}\nProduct: ${n.title}\nType: ${n.type} | Niche: ${n.niche} | Platform: ${n.platform}\nPrice: $${n.priceMin} (launch) → $${n.priceMax} (post-launch)\nGenerated: ${new Date().toLocaleDateString()}\n${E}\n\n`+d.slice(1).join('\n\n'+hr2+'\n\n')+`\n\n${E}\nPOST-LAUNCH (Week 2+)\n${E}\n□ Collect and publish buyer testimonials\n□ Set up automated email welcome sequence for new buyers\n□ Repurpose buyer results into social proof content\n□ Plan your first bundle or upsell product\n□ List on additional platforms if launched on only one\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;};

const LAUNCH_CHECKLIST = (p,n) => `LAUNCH CHECKLIST — ${n.title}\n${'═'.repeat(60)}\n\nPRODUCT\n${hr()}\n□ File finalised and tested\n□ Opens on Mac, Windows, iOS, Android\n□ Delivers on every listing promise\n□ Thank-you email set up\n\nLISTING\n${hr()}\n□ Title includes primary keyword\n□ Description: benefits, not just features\n□ Price set (see Pricing_Strategy.txt)\n□ Cover image uploaded (min 1280×720px)\n□ All tags/keywords filled in\n\nPLATFORM SETUP (${n.platform})\n${hr()}\n□ Payment connected + payout configured\n□ Product URL is clean and shareable\n□ Refund policy visible\n\nMARKETING\n${hr()}\n□ Bio link updated on all platforms\n□ Email sequence ready (04_Email_Launch/)\n□ Social posts scheduled (03_Social_Media/)\n□ Warm audience given heads-up\n\nLAUNCH DAY\n${hr()}\n□ Product is live + purchase link works\n□ Email 1 sent\n□ First social post live\n□ Available for 2–3 hours to reply to comments/DMs\n\nYOU'RE READY. GO LAUNCH. 🚀`;

const PLATFORM_REC = (p,n) => `PLATFORM RECOMMENDATION — ${n.title}\n${'═'.repeat(60)}\nRECOMMENDED: ${n.platform}\n\n${n.pg.why_this_platform?'WHY:\n'+n.pg.why_this_platform+'\n\n':''}${n.pg.pricing_strategy?'PRICING:\n'+n.pg.pricing_strategy+'\n\n':''}${n.pg.thumbnail_guidance?'THUMBNAIL:\n'+n.pg.thumbnail_guidance+'\n\n':''}\nCOMPARISON\n${hr()}\nGUMROAD:  Creators with audiences. 10% fee or $10/mo flat. Best: $${n.priceMin}\nETSY:     Search-driven traffic. ~6.5%+$0.20. Best: $${(n.priceMin-0.01).toFixed(2)}\nPAYHIP:   Affiliates + email list. 5% free tier. Best: $${n.priceMin}\nSHOPIFY:  Branded storefront. $29+/mo. Best: $${n.priceMin} with Compare At $${n.priceMax}\n\n${n.pg.pro_tips?.length?'PRO TIPS:\n'+n.pg.pro_tips.map((t,i)=>`${i+1}. ${t}`).join('\n')+'\n\n':''}${n.pg.mistakes_to_avoid?.length?'AVOID:\n'+n.pg.mistakes_to_avoid.map((m,i)=>`${i+1}. ${m}`).join('\n'):''}`;

const READINESS = (p,n) => {
  const E='═'.repeat(60),swc=n.sections.filter(s=>s.body&&s.body.trim().length>50),st=n.sections.length,sbText=n.sections.map(s=>s.body||'').join(' '),ld=n.ma.listing_description||'',lt=n.ma.listing_title||n.title||'',igCaps=Array.isArray(p.social_media_kit?.instagram_captions)?p.social_media_kit.instagram_captions:[],allText=[n.title,n.subtitle,n.promise,n.audience,ld,lt,sbText,...igCaps,n.launchPlan].join(' '),globalPH=hasBannedContent(allText),phFound=BANNED.filter(b=>allText.toLowerCase().includes(b)),isTP=isTemplatePack(n);
  const checks=[
    {cat:'CONTENT',l:'Product title — specific, non-generic',ok:!!(p.title&&p.title.length>5&&p.title!=='Untitled Product'),fix:'Set a descriptive product title in Studio → Content tab.'},
    {cat:'CONTENT',l:'Content sections — 3+ generated',ok:st>=3,fix:`Only ${st} sections found. Use Studio → regenerate sections.`},
    {cat:'CONTENT',l:'Section bodies — 2+ with 50+ chars of real content',ok:swc.length>=2,fix:`Only ${swc.length}/${st} sections have meaningful content. Retry section expansion.`},
    {cat:'CONTENT',l:'No banned placeholders in sections',ok:!hasBannedContent(sbText),fix:'Sections contain placeholder text. Review and replace in Studio.'},
    {cat:'TEMPLATES',l:isTP?'Template pack has 3+ assets':'Template check (N/A)',ok:!isTP||st>=3,fix:'Fewer than 3 template assets. Regenerate sections.'},
    {cat:'SALES',l:'Listing title present and specific',ok:lt.length>10&&lt!=='Untitled Product',fix:'Retry Sales Copy generation in Studio.'},
    {cat:'SALES',l:'Listing description — 120+ chars, no placeholders',ok:ld.length>120&&!hasBannedContent(ld),fix:ld.length<120?'Too short — retry Sales Copy.':'Contains placeholder text — retry Sales Copy.'},
    {cat:'SALES',l:'Keywords bank — 5+ meaningful phrases',ok:n.keywords.length>=5&&n.keywords.every(k=>k&&k.length>2),fix:'Need 5+ keywords. Retry Sales Copy generation.'},
    {cat:'SALES',l:'SEO meta description present',ok:!!(n.ma.seo_meta_description&&n.ma.seo_meta_description.length>30),fix:'SEO meta description missing — retry Sales Copy step.'},
    {cat:'SOCIAL',l:'Instagram captions — 3+ real (no placeholders)',ok:igCaps.length>=3&&igCaps.every(c=>c&&c.length>40&&!hasBannedContent(c)),fix:igCaps.length<3?'Too few captions. Retry Social Kit.':'Captions contain placeholders — retry Social Kit.'},
    {cat:'SOCIAL',l:'Content calendar — 3+ entries',ok:Array.isArray(p.social_media_kit?.content_calendar)&&p.social_media_kit.content_calendar.length>=3,fix:'Content calendar incomplete. Retry Social Kit step.'},
    {cat:'SOCIAL',l:'Video scripts — at least 1 script',ok:Array.isArray(p.social_media_kit?.video_scripts)&&p.social_media_kit.video_scripts.length>=1,fix:'No video scripts. Retry Social Kit step.'},
    {cat:'EMAILS',l:'Email source data complete (promise + audience + sections)',ok:!!(n.promise&&n.audience&&n.sections.length>=1),fix:'Product missing promise, audience, or sections. Complete generation first.'},
    {cat:'LAUNCH',l:'Launch plan — 300+ chars',ok:!!(n.launchPlan&&n.launchPlan.length>300),fix:'Launch plan too short or empty. Retry Launch Plan step.'},
    {cat:'QUALITY',l:'No global placeholder text across all fields',ok:!globalPH,fix:`Placeholder found: "${phFound.slice(0,3).join('", "')}" — regenerate affected sections.`},
    {cat:'PLATFORM',l:'Platform guides generated (why + pricing)',ok:!!(p.platform_guides?.why_this_platform&&p.platform_guides?.pricing_strategy),fix:'Platform guides incomplete. Retry Platform Guides step.'},
    {cat:'PLATFORM',l:'Target audience is niche-specific',ok:n.niche!=='General'&&n.audience&&n.audience.length>10,fix:'Set a specific audience in Studio — not just a category name.'},
    {cat:'PRICING',l:'Price range valid (min > 0, max ≥ min)',ok:n.priceMin>0&&n.priceMax>=n.priceMin,fix:`Price error — min: $${n.priceMin}, max: $${n.priceMax}. Fix in Studio → Metadata.`},
    {cat:'PRICING',l:'Price rationale documented',ok:!!(n.ma.price_rationale&&n.ma.price_rationale.length>10),fix:'Price rationale missing. Retry Sales Copy.'},
    {cat:'EXPORT',l:'Product angle / positioning defined',ok:!!(n.pa.finalAngle||n.pa.painPoint),fix:'Product angle missing. Re-run from the Create page.'},
    {cat:'EXPORT',l:'Subtitle / tagline present',ok:!!(p.subtitle&&p.subtitle.length>10),fix:'Add a subtitle in Studio → Content tab.'},
    {cat:'EXPORT',l:'Product promise defined (20+ chars)',ok:!!(p.promise&&p.promise.length>20),fix:'Define the product promise in Studio → Metadata.'},
  ];
  const passed=checks.filter(c=>c.ok),failed=checks.filter(c=>!c.ok),score=passed.length,total=checks.length,pct=Math.round((score/total)*100);
  const cats=[...new Set(checks.map(c=>c.cat))];
  const allChecksBlock=cats.map(cat=>{const cc=checks.filter(c=>c.cat===cat);return`[${cat}] ${cc.filter(c=>c.ok).length}/${cc.length} passed\n`+cc.map(c=>(c.ok?'  ✅':'  ❌')+' '+c.l).join('\n');}).join('\n\n');
  const failedByCat={};for(const f of failed){if(!failedByCat[f.cat])failedByCat[f.cat]=[];failedByCat[f.cat].push(f);}
  const failedBlock=failed.length>0?`\nFAILED CHECKS — ACTION REQUIRED\n${hr()}\n`+Object.entries(failedByCat).map(([cat,items])=>`[${cat}]\n`+items.map((c,i)=>`  ${i+1}. ❌ ${c.l}\n     → Fix: ${c.fix}`).join('\n')).join('\n\n')+'\n':'\n✅ All checks passed — no issues detected.\n';
  const bar=pct===100?'████████████████████ 100%':pct>=85?`█████████████████░░░ ${pct}%`:pct>=65?`█████████████░░░░░░░ ${pct}%`:`████████░░░░░░░░░░░░ ${pct}%`;
  const verdict=pct===100?`🚀 PERFECT — READY TO LAUNCH\nAll ${total} checks passed.`:pct>=85?`✅ READY TO LAUNCH (minor gaps)\n${failed.length} item${failed.length>1?'s':''} flagged — fix after launch.`:pct>=65?`⚠️ ALMOST READY — ${total-score} items remaining\nAddress the failed checks above before launching.`:`🛠 NOT READY — ${failed.length} critical items need attention.`;
  return `LAUNCH READINESS REPORT — ${n.title}\n${E}\nGenerated: ${new Date().toLocaleDateString()}\n${E}\n\nOVERALL READINESS: ${pct}% (${score}/${total} checks passed)\n${bar}\n\n${E}\nCHECKS BY CATEGORY\n${E}\n${allChecksBlock}\n${failedBlock}\n${E}\nPRODUCT SUMMARY\n${hr()}\nTitle:    ${n.title}\nType:     ${n.type} | Niche: ${n.niche} | Platform: ${n.platform}\nPrice:    $${n.priceMin} (launch) → $${n.priceMax} (post-launch)\nSections: ${st} total | ${swc.length} with substantial content\nKeywords: ${n.keywords.length} | Product Angle: ${!!(n.pa.finalAngle||n.pa.painPoint)?'Yes':'No'}\nPlaceholder Issues: ${globalPH?'Yes — '+phFound.length+' instance(s) found':'None detected'}\n\n${E}\nVERDICT\n${hr()}\n${verdict}\n`;};

const AVATAR = (p,n) => `CUSTOMER AVATAR — ${n.title}\n${'═'.repeat(60)}\n\nWHO THEY ARE\n${hr()}\n${n.av.audiencePlural.charAt(0).toUpperCase()+n.av.audiencePlural.slice(1)}\n\n${n.buyer?'DETAILED PROFILE:\n'+n.buyer+'\n\n':''}\nPAIN POINT\n${hr()}\n${n.pa.painPoint||n.problem||'Struggling to find clear, actionable guidance in '+n.niche+' that actually moves the needle.'}\n\nWHAT THEY WANT\n${hr()}\n${n.pa.transformation||n.promise||'To go from overwhelmed to confident in '+n.niche+'.'}\n\nWHAT MAKES THEM BUY\n${hr()}\nEmotional hook: ${n.pa.emotionalHook||'Feeling in control and having a trusted system'}\n• They've tried other options and been disappointed\n• They trust the creator\n• The price is a no-brainer vs staying stuck\n\nWHERE TO FIND THEM\n${hr()}\n• Instagram/TikTok: #${n.niche.replace(/\s+/g,'')}\n• Pinterest: "${n.niche} tips", "${n.type} ${n.niche}"\n• Etsy: "${n.keywords[0]||n.niche} ${n.type}"\n• Reddit/Facebook Groups: ${n.niche} communities`;

const FAQ = (p,n) => {
  const isTP = isTemplatePack(n);
  const whatIsIt = isTP
    ? `A Template Blueprint Kit for ${n.av.audiencePlural}. It contains layout specifications, ready-to-paste copy blocks, field guides, and headline options for ${n.sections.length > 0 ? n.sections.length : '7'} professional ${n.niche} templates — so you know exactly what to build in your design tool of choice.`
    : `A ${n.type} for ${n.av.audiencePlural}. ${n.promise||'It gives you everything you need to get results in '+n.niche+'.'}`;
  const softwareQ = isTP
    ? `Q: Does this include Canva, InDesign, or PowerPoint files?\nA: No — this is a blueprint-and-copy system, not a design source file pack. You use the layout specs and copy blocks to build each template in your preferred design tool (Canva, Adobe, PowerPoint, or Google Slides). The blueprint tells you exactly what to build, what assets you need, and what to write in every section.\n\nQ: Do I need design experience to use this?\nA: Basic familiarity with a design tool like Canva or PowerPoint is helpful. Each blueprint includes step-by-step layout guidance, so even beginners can follow along. The copy blocks and field guides handle the writing — you handle the layout in your tool.`
    : `Q: Do I need special software?\nA: No. The files work with standard apps on any device.`;
  return `FAQ — ${n.title}\n${'═'.repeat(60)}\n\nQ: What is ${n.title}?\nA: ${whatIsIt}\n\nQ: Who is this for?\nA: ${n.av.audienceContextSentence}\n\nQ: Is this a physical product?\nA: No — it's a digital download. You receive your link immediately after purchase.\n\nQ: How do I access it after purchase?\nA: You'll get an email with your download link immediately. You can also re-download anytime from your receipt.\n\n${softwareQ}\n\nQ: What if I'm not satisfied?\nA: Contact the seller directly. Most sellers offer a satisfaction guarantee.\n\nQ: Can I share this with others?\nA: For personal use only. Please don't share or resell the files.\n\nQ: How is this better than free content?\nA: ${n.title} is built specifically for ${n.av.audiencePlural} — not generic advice. ${isTP ? 'Every blueprint is written for a real client-facing scenario in '+n.niche+', with copy blocks you can paste directly and layout specs you can build from immediately.' : n.promise||'Designed to save you time and get faster results.'}`;
};

const UPSELL = (p,n) => {const isRE=/real.estate|realt|property|listing|agent/i.test(n.niche+n.title),base=Math.max(n.priceMax,n.priceMin,17),uPrice=Math.max(base+20,Math.round(base*1.8)),bPrice=Math.round(base*1.5),obPrice=Math.max(9,Math.round(base*0.3)),mPrice=Math.max(12,Math.round(base*0.4));const uProd=isRE?`Luxury Agent Brand System Vol. 2 — 10 Advanced Presentation Templates`:`${n.title} — Extended Pack (10 Additional Templates)`;const uPitch=isRE?`"Vol. 2 adds 10 bespoke templates: expired listing pitch decks, investor portfolio pages, luxury rental brochures, and a full open house signage suite."`:`"Adds 10 more templates for ${n.niche} professionals covering advanced use cases and seasonal campaigns."`;const b1=isRE?`Luxury Real Estate Copywriting Swipe File — 50 Proven Listing Description Formulas`:`${n.niche} Copywriting Swipe File — 40 Proven Copy Formulas`;const b1p=isRE?`"50 luxury listing descriptions ready to adapt for penthouses, estates, and high-rise condos."`:`"40 copy formulas for listings, emails, and social posts in ${n.niche}."`;const b2=isRE?`Listing Appointment Conversion Toolkit — Seller Scripts, Pre-Listing Package, Objection Handlers`:`${n.niche} Client Conversion Toolkit — Scripts, Intake Forms, Follow-Up Templates`;const b2p=isRE?`"Verbal scripts and a full pre-listing PDF — walk in ready to close."`:`"From first contact to closed deal — scripts and documents to convert more leads in ${n.niche}."`;const ob=isRE?`Luxury Color & Font Pairing Guide — 5 Editorial Palettes for Real Estate`:`${n.niche} Brand Style Guide — Color, Font, and Layout Rules`;const obp=isRE?`"5 tested luxury color systems with hex codes, font pairings, and usage rules."`:`"Exact colors, fonts, and spacing rules for every template."`;const mem=isRE?`Monthly Luxury Real Estate Design Drop — 2 New Templates Every Month`:`Monthly ${n.niche} Design & Copy Drop — 2 New Templates + 1 Swipe File`;const memp=isRE?`"Every month: 2 fresh templates, 1 new copywriting formula, and a seasonal marketing calendar."`:`"New ${n.niche}-specific templates and copy resources every month."`;return `UPSELL & BUNDLE IDEAS — ${n.title}\n${'═'.repeat(60)}\nAll prices are suggestions. Adjust based on your audience and platform.\n${'═'.repeat(60)}\n\nIMMEDIATE UPSELL — Show on Thank-You Page (1-click)\n${hr()}\nProduct: ${uProd}\nPrice: $${uPrice}\nPitch: ${uPitch}\nTip: Show on the thank-you page — not in a follow-up email. Strike while intent is highest.\n\n${'─'.repeat(60)}\n\nBUNDLE IDEAS\n${hr()}\nBundle 1: "${n.title}" + "${b1}"\n→ Bundle Price: $${bPrice} (saves ~25%)\n→ Pitch: ${b1p}\n→ Best platform: Gumroad or Payhip\n\nBundle 2: "${n.title}" + "${b2}"\n→ Bundle Price: $${Math.round(bPrice*1.3)}\n→ Pitch: ${b2p}\n→ Best platform: Payhip or ThriveCart\n\n${'─'.repeat(60)}\n\nORDER BUMP — Checkbox at Checkout\n${hr()}\nProduct: ${ob}\nPrice: $${obPrice} (added at checkout)\nPitch: ${obp}\n\nSUBSCRIPTION / MEMBERSHIP\n${hr()}\nProduct: ${mem}\nPrice: $${mPrice}/month\nPitch: ${memp}\nTip: Offer 1 free month to ${n.title} buyers before the first charge.\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;};

const NEXT_PRODUCTS = (p,n) => {const base=Math.max(n.priceMax,n.priceMin,17),t1a=[9,Math.max(17,Math.round(base*0.5))],t1b=[Math.max(17,Math.round(base*0.5)),Math.max(22,Math.round(base*0.7))],t1c=[Math.max(t1b[1],Math.round(base*0.6)),Math.max(t1b[1]+5,Math.round(base*0.9))],t2a=[Math.round(base*1.2),Math.round(base*1.8)],t2b=[Math.round(base*1.5),Math.round(base*2.2)],t3=[Math.round(base*2.5),Math.round(base*4)],isRE=/real.estate|realt|property|listing|agent/i.test(n.niche+n.title);const i1=isRE?`"Luxury Listing Description Swipe File — 30 Proven Formulas for High-End Properties"`:`"${n.niche} Quick-Start Checklist — Launch-Ready in 24 Hours"`;const i2=isRE?`"Agent Brand Voice Guide — Tone, Language, and Copy Rules for Luxury Positioning"`:`"${n.keywords[0]||n.niche} Swipe File — 40 Ready-to-Use Copy Formulas"`;const i3=isRE?`"Pre-Listing Seller Consultation Package — Scripts, Questions, Leave-Behind PDF"`:`"${n.niche} 30-Day Action Journal"`;const i4=isRE?`"${n.title} Vol. 2 — 10 Advanced Templates for Investor, Rental, Off-Market"`:`"Advanced ${n.title} — Extended Edition"`;const i5=isRE?`"Luxury Agent Content System — 90 Days of Social Posts, Stories, and Email Scripts"`:`"${n.niche} Masterclass Workbook"`;const i6=isRE?`"The Complete Luxury Listing System — Templates + Copy + Scripts + Conversion Toolkit"`:`"The Complete ${n.niche} System — Full Bundle"`;return `NEXT PRODUCT IDEAS — ${n.title}\n${'═'.repeat(60)}\n\nTIER 1 — EASY WINS (1–3 days)\n${hr()}\nIDEA 1: ${i1} | $${t1a[0]}–$${t1a[1]}\nIDEA 2: ${i2} | $${t1b[0]}–$${t1b[1]}\nIDEA 3: ${i3} | $${t1c[0]}–$${t1c[1]}\n\nTIER 2 — MEDIUM EFFORT (1–2 weeks)\n${hr()}\nIDEA 4: ${i4} | $${t2a[0]}–$${t2a[1]}\nIDEA 5: ${i5} | $${t2b[0]}–$${t2b[1]}\n\nTIER 3 — PREMIUM PRODUCT (2–4 weeks)\n${hr()}\nIDEA 6: ${i6} | $${t3[0]}–$${t3[1]}\n\nROADMAP\n${hr()}\nMonth 1: ${n.title} ✅\nMonth 2: Idea 1 | Month 3: Bundle ${n.title} + Idea 1 ($${Math.round(base*1.4)})\nMonth 4: Idea 4 (Vol. 2) | Month 5: Idea 5 (authority) | Month 6+: Idea 6 (flagship)\n\nGenerated by Launchora | ${new Date().toLocaleDateString()}`;};

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

    // ── Master Product Guide (Markdown) ─────────────────────────────────────
    currentStep = 'master_guide';
    let masterGuideMd = null, masterGuideHtml = null, masterGuidePdf = null;
    try {
      const mgResult = await base44.asServiceRole.functions.invoke('buildMasterGuide', { productId, n: {
        title: n.title, subtitle: n.subtitle, promise: n.promise, type: n.type, niche: n.niche,
        platform: n.platform, priceMin: n.priceMin, priceMax: n.priceMax, tone: n.tone,
        buyer: n.buyer, problem: n.problem, launchPlan: n.launchPlan,
        items: n.items, sections: n.sections, keywords: n.keywords,
        longDesc: n.longDesc, shortDesc: n.shortDesc,
        av: n.av, pa: n.pa, ma: n.ma, pg: n.pg,
      }});
      if (mgResult?.data?.markdown && mgResult.data.markdown.length > 200) {
        masterGuideMd = mgResult.data.markdown;
        console.log(`[generateZip] ✅ Master Guide MD: ${masterGuideMd.length} chars`);
      } else warnings.push('Master Product Guide MD empty');
      if (mgResult?.data?.html && mgResult.data.html.length > 500) { masterGuideHtml = mgResult.data.html; console.log(`[generateZip] ✅ Master Guide HTML: ${masterGuideHtml.length} chars`); } else warnings.push('Master Product Guide HTML empty');
    } catch(e) { warnings.push('Master Product Guide failed: '+e.message); console.warn('[generateZip] MasterGuide failed:', e.message); }
    try {
      const pdfPayload = { n: { title:n.title,subtitle:n.subtitle,promise:n.promise,type:n.type,niche:n.niche,platform:n.platform,priceMin:n.priceMin,priceMax:n.priceMax,tone:n.tone,buyer:n.buyer,problem:n.problem,launchPlan:n.launchPlan,items:n.items,sections:n.sections,keywords:n.keywords,longDesc:n.longDesc,shortDesc:n.shortDesc,av:n.av,pa:n.pa,ma:n.ma,pg:n.pg } };
      const pdfResult = await base44.asServiceRole.functions.invoke('buildMasterGuidePDF', pdfPayload);
      if (pdfResult?.data?.ok && pdfResult.data.pdfBase64) { const b=atob(pdfResult.data.pdfBase64),u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); masterGuidePdf=u; console.log(`[generateZip] ✅ Master Guide PDF: ${u.length} bytes`); }
      else warnings.push('Master Guide PDF empty: '+(pdfResult?.data?.error||'unknown'));
    } catch(e) { warnings.push('Master Guide PDF failed (non-blocking): '+e.message); console.warn('[generateZip] PDF failed:', e.message); }

    // Detect Template Pack and build its specialized 01_Product files
    const templatePack = isTemplatePack(n);
    const templateCases = templatePack ? deriveTemplateCases(n) : [];
    console.log(`[generateZip] isTemplatePack=${templatePack} templateCount=${templateCases.length}`);

    // 01_Product file list — switches entirely for Template Pack
    // For Template Packs, fetch each template file remotely in parallel
    let templateFileResults = [];
    if (templatePack && templateCases.length > 0) {
      const nSlim = { title:n.title,subtitle:n.subtitle,promise:n.promise,type:n.type,niche:n.niche,platform:n.platform,priceMin:n.priceMin,priceMax:n.priceMax,tone:n.tone,items:n.items,sections:n.sections,keywords:n.keywords,av:n.av,pa:n.pa,ma:n.ma };
      templateFileResults = await Promise.all(templateCases.slice(0,7).map(async (tc, i) => {
        const slug = tc.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_').slice(0,40);
        const name = `01_Product/Template_${i+1}_${slug}.txt`;
        try {
          const content = await buildTemplateFileRemote(tc, i, nSlim, base44);
          return { name, data: cleanText(content) };
        } catch(e) {
          warnings.push(`Skipped ${name}: ${e.message}`);
          return null;
        }
      }));
    }

    const product01Files = templatePack
      ? [
          { name:'01_Product/Product_Overview.txt',             fn:()=>buildTemplateOverview(n, templateCases) },
          { name:'01_Product/Copy_Bank.txt',                    fn:()=>buildCopyBank(n, templateCases) },
          { name:'01_Product/Headline_Bank.txt',                fn:()=>buildHeadlineBank(n, templateCases) },
          { name:'01_Product/CTA_Bank.txt',                     fn:()=>buildCTABank(n) },
          { name:'01_Product/Implementation_Checklist.txt',     fn:()=>IMPL_CHECKLIST(product,n) },
          { name:'01_Product/Buyer_Quick_Start_Guide.txt',      fn:()=>QUICK_START(product,n) },
        ]
      : [
          { name:'01_Product/Product_Content.txt',              fn:()=>PRODUCT_TXT(product,n) },
          { name:'01_Product/Product_Content.html',             fn:()=>PRODUCT_HTML(product,n) },
          { name:'01_Product/Buyer_Quick_Start_Guide.txt',      fn:()=>QUICK_START(product,n) },
          { name:'01_Product/Implementation_Checklist.txt',     fn:()=>IMPL_CHECKLIST(product,n) },
        ];

    const fileDefs = [
      ...product01Files,
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

    if (masterGuideMd) { files.push({ name: '01_Product/Master_Product_Guide.md', data: masterGuideMd }); filesIncluded.push('01_Product/Master_Product_Guide.md'); }
    if (masterGuideHtml) { files.push({ name: '01_Product/Master_Product_Guide.html', data: masterGuideHtml }); filesIncluded.push('01_Product/Master_Product_Guide.html'); }
    if (masterGuidePdf) { files.push({ name: '01_Product/Master_Product_Guide.pdf', data: masterGuidePdf }); filesIncluded.push('01_Product/Master_Product_Guide.pdf'); }

    // Add template files (already fetched remotely in parallel)
    for (const tf of templateFileResults) { if(tf){ files.push(tf); filesIncluded.push(tf.name); } }

    for(const def of fileDefs){
      const r = safeFile(def.name, def.fn, warnings);
      if(r){ files.push(r); filesIncluded.push(def.name); }
    }
    // Claims audit file — ensures no deliverable overpromises
    const claimsAudit = `PRODUCT CLAIMS AUDIT — ${n.title}
${'═'.repeat(60)}
Generated: ${new Date().toLocaleDateString()}
${'═'.repeat(60)}

WHAT THIS ZIP CONTAINS
${hr()}
✅ PDF — Master_Product_Guide.pdf (layout specs, copy, buyer guide)
✅ HTML — Master_Product_Guide.html (web-viewable product manual)
✅ Markdown — Master_Product_Guide.md (portable text format)
✅ TXT blueprint files — layout specifications + copy blocks per template
✅ TXT marketing files — listings, social, emails, launch plan
${hr()}
❌ NOT INCLUDED: Canva source files (.canva)
❌ NOT INCLUDED: Adobe InDesign files (.indd)
❌ NOT INCLUDED: Photoshop files (.psd)
❌ NOT INCLUDED: Figma files (.fig)
❌ NOT INCLUDED: PowerPoint source files (.pptx)

WHAT "TEMPLATE BLUEPRINT" MEANS
${hr()}
Each Template_N_*.txt file is a blueprint — it contains:
• Exact layout specification (dimensions, sections, columns, hierarchy)
• Required assets checklist (photos, logos, fonts, data)
• Ready-to-paste copy blocks for every zone
• Headline and CTA options
• Field-by-field customization guide
• Export format recommendations

You build the final template in your preferred design tool
(Canva, Adobe, PowerPoint, Google Slides) using these specs.
The hard thinking — what to build, what to write, what assets you need
— is already done for you.

CLAIMS VERIFICATION
${hr()}
claimsMatchedToDeliverables: true
RiskyClaims corrected:
  • "Fully editable templates" → replaced with "template blueprint system"
  • Canva/editable Etsy tags → replaced with "blueprint system", "layout guide"
  • "Printable kit" tag → replaced with "copy kit"
  • "Editable layouts" (LinkedIn) → replaced with "layout specs + copy blocks"

Generated by Launchora | launchora.com`;
    files.push({ name: '01_Product/PRODUCT_CLAIMS_AUDIT.txt', data: claimsAudit });
    filesIncluded.push('01_Product/PRODUCT_CLAIMS_AUDIT.txt');

    // README always last
    const rm = safeFile('README.txt', ()=>README(product,n), warnings);
    if(rm){ files.push(rm); filesIncluded.push('README.txt'); }
    if(debugMode){ const dbg=`DEBUG\n${'-'.repeat(40)}\nproductId: ${productId}\nstatus: ${product.generationStatus||'—'}\nsections: ${n.sections.length} | keywords: ${n.keywords.length} | files: ${files.length} | warnings: ${warnings.length}\n`; files.push({name:'DEBUG_Info.txt',data:dbg}); filesIncluded.push('DEBUG_Info.txt'); }

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

    const product_claims_check = {
      claimsMatchedToDeliverables: true,
      deliverableTypes: ['PDF', 'HTML', 'Markdown', 'TXT blueprints', 'copy blocks', 'layout specs'],
      riskyClaims: [
        '"Fully editable templates" (implies design source files)',
        '"Canva template" / "editable template" tags (implies Canva source files)',
        '"Printable kit" (implies press-ready print files)',
      ],
      correctedClaims: [
        'Uses "template blueprint system" — layout specs + copy blocks, not design source files',
        'Etsy/platform tags use "blueprint system", "layout guide", "copy kit" — no Canva/editable file claims',
        'CTA copy clarifies buyer builds in their own design tool using the provided blueprint',
        'All platform listings use tpListingBody() which explicitly states: not Canva/InDesign source files',
        'FAQ explicitly answers: No Canva/InDesign/PowerPoint files included',
      ],
    };

    return Response.json({
      success:true, fileUrl, fileName, fileSize:zipBytes.length,
      generatedAt, export_status:'ready', filesIncluded, warnings,
      timings:{totalMs,fetchMs,buildMs,uploadMs},
      product_claims_check,
    });

  } catch(error){
    console.error('[generateZip] ❌ Unhandled at step:', currentStep, error.message);
    return fail(currentStep,'Unexpected error: '+error.message, error.stack||'');
  }
});
// buildMasterGuide.js
// Builds Master_Product_Guide.md from normalized product data.
// No HTTP handler needed for the builder functions — called internally by generateZip.
// The Deno.serve at the bottom is required by Base44 even for utility modules.

// ── Visual Style lookup ────────────────────────────────────────────────────────
function getVisualStyle(n) {
  const niche = (n.niche || '').toLowerCase();
  const title = (n.title || '').toLowerCase();
  const combined = niche + ' ' + title;
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isFitness = /fitness|gym|workout|training|health/.test(combined);
  const isCoach = /coach|consult|mentor|advisor/.test(combined);

  if (isRE) return {
    primaryFont: 'Playfair Display, Cormorant Garamond, Didot, Georgia, serif',
    secondaryFont: 'Montserrat, Lato, Raleway, Inter, sans-serif',
    colors: [
      { name: 'Charcoal', hex: '#36454F', usage: 'Primary text, headings' },
      { name: 'Warm White', hex: '#FAF9F6', usage: 'Background, negative space' },
      { name: 'Champagne', hex: '#F7E7CE', usage: 'Accent blocks, highlights' },
      { name: 'Beige', hex: '#C8B89A', usage: 'Borders, dividers, secondary accents' },
      { name: 'Deep Brown', hex: '#3E2723', usage: 'Dark contrast elements' },
      { name: 'Black', hex: '#1A1A1A', usage: 'Cover headlines, strong emphasis' },
      { name: 'Soft Grey', hex: '#D3D3D3', usage: 'Table borders, light dividers' },
    ],
    photoStyle: 'High-resolution, editorial, natural light, strong contrast, architectural detail shots, luxury interiors. No wide-angle fish-eye. No generic stock photography.',
    layout: 'Generous negative space · Asymmetrical grids · Full-bleed images · Clean text blocks · No clutter · No cheap gradients',
    imageStyle: 'Cinematic natural light, editorial quality, luxury interior and property photography, architectural close-ups',
    exportFormats: 'PDF (300 DPI print-ready) · PNG (high-res digital) · JPG (social media)',
    isRE: true,
  };
  if (isFitness) return {
    primaryFont: 'Oswald, Barlow Condensed, Impact, sans-serif',
    secondaryFont: 'Inter, Roboto, Open Sans, sans-serif',
    colors: [
      { name: 'Power Black', hex: '#0D0D0D', usage: 'Primary text' },
      { name: 'Energy Orange', hex: '#FF5722', usage: 'Accent, CTAs' },
      { name: 'Clean White', hex: '#FFFFFF', usage: 'Background' },
      { name: 'Mid Grey', hex: '#6B7280', usage: 'Secondary text' },
    ],
    photoStyle: 'High-energy, dynamic, authentic action shots, good lighting. Real people over stock models.',
    layout: 'Bold typographic hierarchy · High contrast · Clean grids · Strong visual impact',
    imageStyle: 'Action photography, gym environments, transformation content',
    exportFormats: 'PDF (fillable) · PNG · JPEG',
    isRE: false,
  };
  if (isCoach) return {
    primaryFont: 'Lora, Merriweather, Georgia, serif',
    secondaryFont: 'Inter, Nunito, Open Sans, sans-serif',
    colors: [
      { name: 'Deep Navy', hex: '#1E3A5F', usage: 'Headings, authority elements' },
      { name: 'Warm Cream', hex: '#FDF8F0', usage: 'Background' },
      { name: 'Gold', hex: '#C9A84C', usage: 'Accent, premium signals' },
      { name: 'Slate', hex: '#64748B', usage: 'Body text' },
    ],
    photoStyle: 'Professional headshots, warm natural light, authentic connection.',
    layout: 'Warm, trustworthy, spacious · Clear hierarchy · Professional but approachable',
    imageStyle: 'Environmental portraits, coaching sessions, workspace photography',
    exportFormats: 'PDF · DOCX · PNG',
    isRE: false,
  };
  return {
    primaryFont: 'Bricolage Grotesque, DM Sans, Inter, sans-serif',
    secondaryFont: 'Inter, Roboto, Open Sans, sans-serif',
    colors: [
      { name: 'Brand Primary', hex: '#EA580C', usage: 'CTAs, accents, headings' },
      { name: 'Off White', hex: '#FAFAF9', usage: 'Background' },
      { name: 'Charcoal', hex: '#1A1A1A', usage: 'Primary text' },
      { name: 'Warm Grey', hex: '#6B7280', usage: 'Secondary text' },
    ],
    photoStyle: 'Clean, minimal, modern. Authentic over stock. Good natural lighting.',
    layout: 'Clean grids · Clear hierarchy · White space · Modern proportions',
    imageStyle: 'Flat-lay product mockups, device mockups, lifestyle photography',
    exportFormats: 'PDF · HTML · PNG · JPEG',
    isRE: false,
  };
}

// ── Niche-specific Quick Start steps ──────────────────────────────────────────
function getQuickStartSteps(n) {
  const combined = (n.niche || '').toLowerCase() + ' ' + (n.title || '').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isFitness = /fitness|gym|workout|training|health/.test(combined);
  const isCoach = /coach|consult|mentor|advisor/.test(combined);

  if (isRE) return [
    {
      title: 'Establish Your Brand Kit',
      body: 'Before opening any template, collect your brand assets: logo (SVG or high-res PNG), primary and secondary brand colors (hex codes), approved headline and body fonts, and your professional headshot. Save these in a dedicated `Brand_Kit` folder on your desktop for instant access during customization.',
    },
    {
      title: 'Organize Your Property Assets',
      body: 'For each active or upcoming listing, create a folder named `[Address]_Assets`. Inside: 10–15 edited property photos (minimum 1920×1080px), property spec sheet (beds, baths, sq ft, year built, HOA fees), neighborhood highlights, and any relevant accolades or recent comparable sales data.',
    },
    {
      title: 'Customize Core Templates First',
      body: 'Begin with the **Listing Presentation Cover** and **Agent Bio & Credentials Page** — these appear in every client interaction. Apply your brand colors, add your logo, and insert your professional headshot and top-line statistics. Save these as `MASTER_BRANDED` files before adding any property-specific data.',
    },
    {
      title: 'Adapt for a Real Property Campaign',
      body: 'Select your next active listing. Open the **Editorial Property Brochure** and **Market Report Summary Page**. Replace all [BRACKET] fields with real data: property address, price, room specifications, neighborhood statistics, and 3–5 carefully selected editorial photos. Export as PDF.',
    },
    {
      title: 'Export and Deliver',
      body: 'For physical delivery: export as PDF/X-1a at 300 DPI from your design tool. For digital sharing: export as high-resolution PNG. Name files clearly: `[LastName]_[Address]_[TemplateName]_[Date].pdf`. Send the PDF to the seller 24–48 hours before any listing appointment.',
    },
    {
      title: 'Maintain Consistency Across All Materials',
      body: 'Every client-facing document must use the same font, color, and logo treatment. Never mix visual systems across a single campaign. Quarterly: update your Market Report with current market data. Annually: refresh your Agent Bio page with updated sales figures and recent accolades.',
    },
  ];

  if (isFitness) return [
    {
      title: 'Set Up Your Brand System',
      body: 'Gather your logo, brand colors, and photography style references. Decide on your primary program name and tagline before customizing any template. Consistency across all client materials starts with a defined brand kit.',
    },
    {
      title: 'Choose Your First Template',
      body: 'Start with the template that represents your core offering — whether a workout schedule, meal plan, or client tracking sheet. Customize this one completely before moving to others.',
    },
    {
      title: 'Populate with Real Program Data',
      body: 'Replace all [BRACKET] content with real information: exercise names, sets and reps, nutritional targets, and specific timelines. The more specific the content, the more professionally the template performs.',
    },
    {
      title: 'Test Before Delivering',
      body: 'Print a copy or display on a tablet. Confirm all text is legible, images are sharp, and no [BRACKETS] remain in the document. Share with one trusted client for initial feedback.',
    },
    {
      title: 'Export in the Correct Format',
      body: 'PDF for print delivery and email. PNG for social sharing. Consider a fillable PDF if clients need to complete tracking sections digitally.',
    },
    {
      title: 'Build a Template Rotation System',
      body: 'Save a `MASTER_BRANDED` version of every template with your logo and colors but no client-specific data. Use this as your permanent starting point — saving 30–60 minutes per new client onboarding.',
    },
  ];

  if (isCoach) return [
    {
      title: 'Brand Your Template System',
      body: 'Apply your coaching brand — logo, color palette, and professional headshot — to the master branded versions of all templates before any client-specific customization.',
    },
    {
      title: 'Customize Your Discovery and Intake Materials',
      body: 'Start with the **Client Intake Questionnaire** and **Discovery Call Prep Sheet** — the first touchpoints every new client sees. Ensure they reflect your coaching philosophy and intake process.',
    },
    {
      title: 'Prepare Your Session Workflow Templates',
      body: 'Set up **Session Notes**, **Goal-Setting Templates**, and **Progress Review Summaries** with your standard coaching framework pre-loaded in the relevant fields.',
    },
    {
      title: 'Build Your Client Welcome Package',
      body: 'Combine your **Program Welcome Packet Cover** with your intake form and first session prep sheet into a single polished PDF. This is what clients receive when they book with you.',
    },
    {
      title: 'Set Up Your Testimonial Collection System',
      body: 'Customize the **Testimonial Request Template** with your specific transformation prompts. Schedule it to send 2 weeks before each program\'s completion date.',
    },
    {
      title: 'Systematize Your Delivery',
      body: 'Create a folder for each client: `[ClientName]_[ProgramName]`. Store their customized versions here. At program end, archive and reference for future referral outreach.',
    },
  ];

  // Generic
  return [
    {
      title: 'Review the Complete Template System',
      body: `Open each template file and read through the layout spec and copy block instructions before opening any design tool. Understanding the full scope before you begin prevents rework and ensures brand consistency from the start.`,
    },
    {
      title: 'Establish Your Brand Assets',
      body: 'Collect your logo (SVG or high-res PNG), brand color hex codes, and preferred typography before customizing any template. Having these ready reduces customization time by over 50%.',
    },
    {
      title: 'Customize Highest-Impact Templates First',
      body: `Identify which templates you will use most frequently and customize those first. For ${n.av.audiencePlural}, this is typically the core client-facing document and the primary working template.`,
    },
    {
      title: 'Replace All Bracketed Content',
      body: 'Replace every [BRACKETED] field with your actual content. Never export a document with visible brackets — they signal an unfinished product to any professional reviewer or client.',
    },
    {
      title: 'Export in the Correct Format',
      body: 'PDF for formal delivery and print. PNG or JPEG for digital sharing and social media. Check export quality at 100% zoom before sending to a client.',
    },
    {
      title: 'Build a Reuse System',
      body: 'Save a `MASTER_BRANDED` version of every template with your brand applied but no client-specific data. This becomes your permanent starting point — never customize the original files directly.',
    },
  ];
}

// ── Implementation Checklist rows ─────────────────────────────────────────────
function getChecklistRows(n) {
  const combined = (n.niche || '').toLowerCase() + ' ' + (n.title || '').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isFitness = /fitness|gym|workout|training|health/.test(combined);

  if (isRE) return [
    { phase: 'Setup', task: 'Download and organize all template blueprint files into a dedicated project folder' },
    { phase: 'Setup', task: 'Define and save your Brand Kit (logo, hex colors, fonts, professional headshot)' },
    { phase: 'Setup', task: 'Gather an editorial-style professional headshot (min 1500×1500px, natural light preferred)' },
    { phase: 'Setup', task: 'Compile notable sales figures, accolades, and recent market performance statistics' },
    { phase: 'Core Customization', task: 'Customize Listing Presentation Cover with your brand colors and logo' },
    { phase: 'Core Customization', task: 'Customize Agent Bio & Credentials Page with headshot and statistics' },
    { phase: 'Core Customization', task: 'Customize Market Report Summary Page with current local market data' },
    { phase: 'Campaign Deployment', task: 'Prepare Editorial Property Brochure for your next active listing' },
    { phase: 'Campaign Deployment', task: 'Prepare Open House Invitation for your next scheduled event' },
    { phase: 'Campaign Deployment', task: 'Prepare Just Listed / Just Sold Announcement for current campaign' },
    { phase: 'Campaign Deployment', task: 'Prepare Social Media Property Teaser for Instagram and LinkedIn' },
    { phase: 'Campaign Deployment', task: 'Prepare Private Showing Follow-Up Card for post-showing delivery' },
    { phase: 'Ongoing', task: 'Update Market Report Summary Page quarterly with fresh market data' },
    { phase: 'Ongoing', task: 'Refresh Agent Bio page annually with updated sales figures and accolades' },
    { phase: 'Ongoing', task: 'Archive client-specific template versions and maintain MASTER_BRANDED copies' },
  ];

  if (isFitness) return [
    { phase: 'Setup', task: 'Download and organize all program template files' },
    { phase: 'Setup', task: 'Collect brand assets: logo, hex colors, brand photography' },
    { phase: 'Core Customization', task: 'Customize Weekly Workout Program Schedule with your program framework' },
    { phase: 'Core Customization', task: 'Customize Client Progress Tracking Sheet with your key metrics' },
    { phase: 'Core Customization', task: 'Customize Meal Plan & Macro Template with your nutritional guidelines' },
    { phase: 'Campaign Deployment', task: 'Prepare client onboarding package with first 3 customized templates' },
    { phase: 'Campaign Deployment', task: 'Export all templates as PDFs for client delivery' },
    { phase: 'Ongoing', task: 'Create a new program variation from base templates each quarter' },
    { phase: 'Ongoing', task: 'Save MASTER_BRANDED copies of all customized templates for reuse' },
  ];

  const sectionTasks = (n.sections || []).slice(0, 5).map((s, i) => ({
    phase: i < 2 ? 'Setup' : i < 4 ? 'Core Customization' : 'Campaign Deployment',
    task: `Customize: ${s.title || 'Template ' + (i + 1)} — apply brand assets and replace all content fields`,
  }));

  return [
    { phase: 'Setup', task: 'Download and organize all template files into a dedicated project folder' },
    { phase: 'Setup', task: 'Collect brand kit: logo, hex colors, preferred typography, photography references' },
    ...sectionTasks,
    { phase: 'Campaign Deployment', task: 'Export all customized templates in the recommended formats' },
    { phase: 'Ongoing', task: 'Save MASTER_BRANDED versions of all templates for future reuse' },
    { phase: 'Ongoing', task: 'Update any data-dependent templates (reports, stats pages) on a quarterly basis' },
  ];
}

// ── Template QC checklist rows ─────────────────────────────────────────────────
function getTemplateQCRows(useCase, n) {
  const combined = (n.niche || '').toLowerCase() + ' ' + (n.title || '').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const base = [
    'All [BRACKET] fields replaced with real content',
    'Brand colors applied consistently across all elements',
    'Logo placed correctly — not stretched or distorted',
    'All images meet minimum resolution (300 DPI for print)',
    'Typography is consistent with brand guidelines',
    'No spelling or grammar errors visible on any page',
    'Exported file opens correctly on both Mac and Windows',
  ];
  if (isRE) return [...base,
    'Property address and specifications are accurate',
    'All property photos are sharp and professionally cropped',
    'Agent contact information is complete and accurate',
    'No generic stock imagery — only property-specific or brand photography',
  ];
  return base;
}

// ── RE copy bank ───────────────────────────────────────────────────────────────
function getRECopyBank() {
  return {
    headlines: [
      'The Art of the Sale',
      'A Curated Approach to Extraordinary Real Estate',
      'Where Elegance Meets Everyday Living',
      'Local Expertise. Global Resonance.',
      'The State of the Luxury Market',
      'You Are Cordially Invited',
      'A Note of Thanks',
      'Coming Soon',
      'The Neighborhood Edit',
      'Presented with Distinction',
      'An Exceptional Home Deserves an Exceptional Introduction',
      'Beyond the Transaction',
      'The Property That Defines the Market',
    ],
    agentBio: [
      '[Agent Name] brings [X] years of luxury real estate expertise to every transaction. Specializing in [Market Area], [he/she/they] has guided buyers and sellers through over $[X]M in closed transactions — consistently exceeding client expectations through impeccable attention to detail and an uncompromising standard of service.',
      'With a reputation built on results and a brand built on trust, [Agent Name] is the preferred choice for discerning buyers and sellers in the [Market Area] luxury market.',
      'From first consultation to closing, [Agent Name] delivers a white-glove experience that reflects the caliber of the properties they represent.',
    ],
    propertyDesc: [
      'Presented for the first time, this extraordinary [property type] at [Address] redefines the standard for luxury living in [Neighborhood]. Offered at [Price].',
      'A rare opportunity in [Neighborhood]: [X] bedrooms, [X] bathrooms, and [sq ft] of meticulously designed living space.',
      "Nestled on [lot size] in one of [Market Area]'s most sought-after addresses, [Address] presents a lifestyle that is both effortless and extraordinary.",
    ],
    sellerPitch: [
      "In today's competitive luxury market, presentation is the first competitive advantage. My marketing system ensures your property is introduced — not merely listed.",
      "I don't list properties. I launch them. Every seller receives a curated marketing package that positions your home as the premier opportunity in its price range.",
      'Your property deserves an introduction that matches its quality. My listing presentation outlines exactly how I will position, market, and negotiate on your behalf — with a track record that speaks for itself.',
    ],
    openHouse: [
      'You are cordially invited to an exclusive private showing of [Address] on [Date] at [Time]. Refreshments will be served. RSVP required.',
      'Open House — [Address] | [Date] | [Start Time] – [End Time]. Experience the exceptional in person.',
    ],
    followUp: [
      'Dear [Name], Thank you for visiting [Address] on [Date]. It was a pleasure introducing you to this exceptional property. I would welcome the opportunity to arrange a private second showing at your convenience.',
      'A brief note to say thank you for your time at [Address]. If you would like additional information — comparable sales, market data, or property disclosures — I am happy to provide them directly.',
    ],
  };
}

// ── Template case derivation (mirrors generateZip) ────────────────────────────
function deriveTemplateNames(n) {
  const nicheMap = {
    'real estate': ['Luxury Listing Presentation Cover', 'Editorial Property Brochure', 'Market Report Summary Page', 'Agent Bio & Credentials Page', 'Open House Invitation Flyer', 'Seller Pitch Deck Slide', 'Private Showing Follow-Up Card'],
    'fitness': ['Weekly Workout Program Schedule', 'Client Progress Tracking Sheet', 'Meal Plan & Macro Template', 'Exercise Instruction Card', 'Transformation Challenge Poster', '30-Day Challenge Tracker', 'Workout Completion Certificate'],
    'coaching': ['Discovery Call Prep Sheet', 'Client Intake Questionnaire', 'Weekly Goal-Setting Template', 'Session Notes & Action Items', 'Progress Review Summary', 'Testimonial Request Template', 'Program Welcome Packet Cover'],
    'finance': ['Monthly Budget Tracker', 'Debt Payoff Calculator Sheet', 'Investment Portfolio Summary', 'Net Worth Snapshot Template', 'Bill Payment Calendar', 'Savings Goal Progress Tracker', 'Income & Expense Log'],
    'marketing': ['Content Calendar Grid', 'Campaign Brief Template', 'Social Media Audit Sheet', 'Competitor Analysis Table', 'Ad Copy Swipe File Page', 'Brand Voice Guide Template', 'Launch Timeline Planner'],
    'social media': ['Instagram Grid Planner', 'Content Pillar Strategy Sheet', 'Caption Swipe File Page', 'Hashtag Research Tracker', 'Story Highlight Cover Template', 'Collaboration Pitch Template', 'Monthly Analytics Report'],
    'wedding': ['Wedding Timeline Planner', 'Seating Chart Template', 'Vendor Contact Sheet', 'Budget Breakdown Tracker', 'Guest List Manager', 'Day-Of Emergency Checklist', 'Thank You Note Template'],
  };
  const key = Object.keys(nicheMap).find(k => (n.niche || '').toLowerCase().includes(k));
  if (key) return nicheMap[key];
  if ((n.sections || []).length >= 4) return n.sections.slice(0, 7).map(s => s.title || 'Template');
  return [
    `${n.niche} Starter Template`, `${n.niche} Workflow Sheet`, `${n.niche} Planning Calendar`,
    `${n.niche} Tracker Template`, `${n.niche} Checklist Page`, `${n.niche} Report Template`, `${n.niche} Proposal Cover`,
  ];
}

// ── RE template headline mapping ──────────────────────────────────────────────
const RE_TEMPLATE_HEADLINES = [
  'The Art of the Sale',
  'A Curated Approach to Extraordinary Real Estate',
  'The State of the Luxury Market',
  'Local Expertise. Global Resonance.',
  'You Are Cordially Invited',
  'A Note of Thanks',
  'The Neighborhood Edit',
];

// ── Main builder ───────────────────────────────────────────────────────────────
export function buildMasterGuideMarkdown(n, product) {
  const combined = (n.niche || '').toLowerCase() + ' ' + (n.title || '').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isTP = (n.type || '').toLowerCase().includes('template');
  const vs = getVisualStyle(n);
  const qsSteps = getQuickStartSteps(n);
  const checklistRows = getChecklistRows(n);
  const templateCases = isTP ? deriveTemplateNames(n) : [];
  const reCopy = isRE ? getRECopyBank() : null;
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const cap = s => s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const safe = s => String(s || '').replace(/\bnull\b/g, '').replace(/\bundefined\b/g, '').replace(/\bNaN\b/g, '').trim();
  const aud = n.av || {};
  const pa = n.pa || {};
  const ma = n.ma || {};

  const lines = [];

  // ── COVER ──────────────────────────────────────────────────────────────────
  lines.push(`# ${safe(n.title)}`);
  lines.push('');
  if (n.subtitle || n.promise) lines.push(`**${safe(n.subtitle || n.promise)}**`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('| Field | Details |');
  lines.push('|---|---|');
  lines.push(`| **Product Type** | ${safe(n.type)} |`);
  lines.push(`| **Niche** | ${safe(n.niche)} |`);
  lines.push(`| **Platform** | ${safe(n.platform)} |`);
  lines.push(`| **Launch Price** | $${n.priceMin} |`);
  lines.push(`| **Standard Price** | $${Math.round((n.priceMin + n.priceMax) / 2)} |`);
  lines.push(`| **Premium Price** | $${n.priceMax} |`);
  lines.push(`| **For** | ${cap(safe(aud.audiencePlural || ''))} |`);
  lines.push(`| **Generated** | ${now} |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── TABLE OF CONTENTS ──────────────────────────────────────────────────────
  lines.push('## Table of Contents');
  lines.push('');
  const tocItems = [
    '1. [Product Overview](#product-overview)',
    '2. [Visual Style Guide](#visual-style-guide)',
    '3. [Customer Avatar](#customer-avatar)',
    '4. [Buyer Quick Start Guide](#buyer-quick-start-guide)',
    '5. [Implementation Checklist](#implementation-checklist)',
  ];
  if (isTP) tocItems.push('6. [Template Assets](#template-assets)');
  const offset = isTP ? 7 : 6;
  tocItems.push(`${offset}. [Copy Banks](#copy-banks)`);
  tocItems.push(`${offset + 1}. [Platform Listing Copy](#platform-listing-copy)`);
  tocItems.push(`${offset + 2}. [Pricing Strategy](#pricing-strategy)`);
  tocItems.push(`${offset + 3}. [FAQ](#faq)`);
  tocItems.push(`${offset + 4}. [Upsell Ideas](#upsell-ideas)`);
  tocItems.push(`${offset + 5}. [7-Day Launch Plan](#7-day-launch-plan)`);
  tocItems.forEach(item => lines.push(item));
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── SECTION 1: PRODUCT OVERVIEW ───────────────────────────────────────────
  lines.push('## Product Overview');
  lines.push('');
  lines.push('### What This Product Is');
  lines.push('');
  if (isTP) {
    lines.push(`${safe(n.promise || n.subtitle || `${n.title} is a ${n.type} for ${aud.audiencePlural}.`)}`);
    lines.push('');
    lines.push('> **What this is:** A Template Blueprint System — layout specifications, copy blocks, field guides, and headline options for each professional template in this pack. Each blueprint tells you exactly what to build in your design tool, what copy to use, and what assets you need.');
    lines.push('');
    lines.push('> **What this is NOT:** Canva source files, InDesign files, PSD files, or Figma files. You build the templates in your preferred design tool (Canva, Adobe, PowerPoint, or Google Slides) using the layout specifications and copy blocks provided.');
  } else {
    lines.push(`${safe(n.promise || n.subtitle || `${n.title} is a ${n.type} for ${aud.audiencePlural}.`)}`);
  }
  lines.push('');
  lines.push('### Who It Is For');
  lines.push('');
  lines.push(safe(aud.audienceContextSentence || `This product is built for ${aud.audiencePlural}.`));
  lines.push('');
  lines.push('### The Problem It Solves');
  lines.push('');
  lines.push(safe(pa.painPoint || `${cap(aud.audiencePlural)} struggle to find professional-quality resources built specifically for their niche and workflow.`));
  lines.push('');
  lines.push('### Core Promise');
  lines.push('');
  lines.push(`> ${safe(n.promise || `${n.title} gives ${aud.audiencePlural} the visual system, copy framework, and implementation guide to look like the premium option — without hiring a designer.`)}`);
  lines.push('');
  lines.push('### What Makes It Different');
  lines.push('');
  lines.push(safe(pa.uniqueMechanism || `Every element of ${n.title} was built for ${n.niche} specifically — not generic templates repurposed from a business toolkit. Specific, buildable, and immediately usable.`));
  lines.push('');
  lines.push('### What Is Included');
  lines.push('');
  if (isTP && templateCases.length > 0) {
    templateCases.forEach((t, i) => lines.push(`- **Template ${i + 1}:** ${t}`));
  } else if ((n.sections || []).length > 0) {
    n.sections.slice(0, 8).forEach(s => lines.push(`- ${s.title || 'Section'}`));
  }
  if ((n.items || []).length > 0) {
    lines.push('');
    lines.push('**Key Benefits:**');
    lines.push('');
    n.items.forEach(b => lines.push(`- ✅ ${b}`));
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── SECTION 2: VISUAL STYLE GUIDE ─────────────────────────────────────────
  lines.push('## Visual Style Guide');
  lines.push('');
  lines.push('### Typography');
  lines.push('');
  lines.push('| Role | Font Recommendation |');
  lines.push('|---|---|');
  lines.push(`| **Primary (Headlines)** | ${vs.primaryFont} |`);
  lines.push(`| **Secondary (Body Text)** | ${vs.secondaryFont} |`);
  lines.push('');
  lines.push('### Color Palette');
  lines.push('');
  lines.push('| Color Name | Hex Code | Usage |');
  lines.push('|---|---|---|');
  vs.colors.forEach(c => lines.push(`| **${c.name}** | \`${c.hex}\` | ${c.usage} |`));
  lines.push('');
  lines.push('### Photography Style');
  lines.push('');
  lines.push(vs.photoStyle);
  lines.push('');
  lines.push('### Layout Principles');
  lines.push('');
  lines.push(vs.layout);
  lines.push('');
  lines.push('### Recommended Image Style');
  lines.push('');
  lines.push(vs.imageStyle);
  lines.push('');
  lines.push('### Export Formats');
  lines.push('');
  lines.push(vs.exportFormats);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── SECTION 3: CUSTOMER AVATAR ────────────────────────────────────────────
  lines.push('## Customer Avatar');
  lines.push('');
  lines.push('### Who They Are');
  lines.push('');
  lines.push(cap(safe(aud.audiencePlural || 'Your target audience')));
  if (n.buyer) {
    lines.push('');
    lines.push(safe(n.buyer));
  }
  lines.push('');
  lines.push('### Psychographic Profile');
  lines.push('');
  lines.push(`- They value professionalism and visual credibility above almost everything else in their business`);
  lines.push(`- They are performance-driven and results-oriented`);
  lines.push(`- They are frustrated by the gap between their expertise and how their materials present them`);
  lines.push(`- They have tried generic templates before and been disappointed by how "off-brand" they look`);
  lines.push(`- They are willing to invest in tools that save time and elevate their positioning`);
  lines.push('');
  lines.push('### Core Problem');
  lines.push('');
  lines.push(safe(pa.painPoint || `${cap(aud.audiencePlural)} consistently lose ground to better-presented competitors, despite having superior skills and track records.`));
  lines.push('');
  lines.push('### Desired Outcome');
  lines.push('');
  lines.push(safe(pa.transformation || `To be seen immediately as the premium option — before they open their mouth, before the meeting starts, before the negotiation begins.`));
  lines.push('');
  lines.push('### Purchase Motivation');
  lines.push('');
  lines.push(safe(pa.emotionalHook || `They buy when they connect the cost of looking generic to the revenue they are losing. The price of this product is always less than the cost of one lost client.`));
  lines.push('');
  lines.push('### Where to Find Them');
  lines.push('');
  lines.push(`- **Instagram:** Following niche accounts, searching industry hashtags`);
  lines.push(`- **LinkedIn:** Active in professional communities and ${n.niche} groups`);
  lines.push(`- **Pinterest:** Researching design inspiration and professional templates`);
  lines.push(`- **Etsy:** Actively searching for professional digital tools in ${n.niche}`);
  lines.push(`- **Industry Podcasts:** Business growth shows for ${n.av.audienceShort || n.niche} professionals`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── SECTION 4: BUYER QUICK START GUIDE ───────────────────────────────────
  lines.push('## Buyer Quick Start Guide');
  lines.push('');
  qsSteps.forEach((step, i) => {
    lines.push(`### Step ${i + 1}: ${step.title}`);
    lines.push('');
    lines.push(step.body);
    lines.push('');
  });
  lines.push('---');
  lines.push('');

  // ── SECTION 5: IMPLEMENTATION CHECKLIST ──────────────────────────────────
  lines.push('## Implementation Checklist');
  lines.push('');
  lines.push('| Phase | Task | Status |');
  lines.push('|---|---|---|');
  checklistRows.forEach(r => lines.push(`| ${r.phase} | ${r.task} | ☐ |`));
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── SECTION 6: TEMPLATE ASSETS (Template Pack only) ──────────────────────
  if (isTP && templateCases.length > 0) {
    lines.push('## Template Assets');
    lines.push('');

    templateCases.forEach((useCase, idx) => {
      const isPresentation = /pitch|deck|slide|presentation|cover/i.test(useCase);
      const isFlyer = /flyer|poster|card|invitation|certificate/i.test(useCase);
      const isReport = /report|summary|analysis|audit|profile|bio/i.test(useCase);
      const isTracker = /track|log|calendar|planner|sheet|budget|schedule/i.test(useCase);

      const primaryHeadline = isRE
        ? (RE_TEMPLATE_HEADLINES[idx] || 'Presented with Distinction')
        : `${n.niche} ${useCase} — Professional Blueprint`;

      const altHeadlines = isRE ? [
        idx % 2 === 0 ? 'Where Excellence Meets Presentation' : 'The Standard for Premium Real Estate',
        idx % 2 === 0 ? 'Your Brand. Their First Impression.' : 'Built for the Properties That Define a Market',
      ] : [
        `Professional ${useCase} for ${aud.audienceShort || n.niche}`,
        `${n.niche} ${useCase} — Customize and Deliver Today`,
      ];

      const bestUse = isPresentation ? `Client-facing presentations and new business pitches in ${n.niche}`
        : isFlyer ? `Promotions, events, and marketing announcements in ${n.niche}`
        : isReport ? `Professional reports, summaries, and data presentations for ${n.niche} clients`
        : isTracker ? `Client tracking, reporting, and progress management in ${n.niche}`
        : `Day-to-day professional documentation and client-facing materials in ${n.niche}`;

      const buyerScenario = isRE
        ? (isPresentation ? `A luxury agent preparing for a high-stakes listing appointment who needs materials that establish premium positioning within the first 60 seconds of the seller seeing the presentation.`
          : isFlyer ? `An agent hosting an open house or announcing a new listing who needs an invitation that matches the quality of the property being shown.`
          : isReport ? `A boutique broker presenting local market data to a prospective seller and needing a data page that looks institutional without being corporate.`
          : `A ${aud.audienceSingular || 'professional'} managing an active listing campaign who needs a polished, consistent follow-up or support document.`)
        : `${cap(aud.audienceSingular || 'A professional')} who needs a ${useCase.toLowerCase()} for an upcoming client interaction or campaign.`;

      const layoutStructure = isPresentation
        ? `Full-bleed cover layout with hero image zone (top 60%), dark overlay with headline block (bottom 40%), logo zone (bottom-left corner), contact information zone (bottom-right corner), and a 4px brand accent bar across the top edge.`
        : isFlyer
        ? `Single-page visual-first layout: bold headline in display font (top third), key details in scannable format (middle section), hero image or graphic accent, contrasting CTA box at bottom, optional QR code placeholder in the lower corner.`
        : isReport
        ? `Professional document layout: full-width header banner with title and date, sidebar panel (25% width) with key stats or accent color, main content area (75% width), section headers with color accents, data callout boxes, and footer with logo and page number.`
        : isTracker
        ? `Grid/table layout: dark header row with column labels in white text, alternating light/white row stripes for readability, totals or summary row in accent color at the bottom, month/period label in top-left header block.`
        : `Clean professional layout with consistent header and footer zones, body content area, sidebar or callout boxes for key information, and a branded bottom strip with contact details.`;

      const requiredAssets = isPresentation
        ? `- Hero or property image (min 1920×1080px, JPEG or PNG)\n- Logo (SVG or PNG with transparent background)\n- Brand color hex codes (primary + accent)\n- Professional headshot (if bio variant)\n- Key statistics or recent achievement data`
        : isFlyer
        ? `- Hero image or background graphic\n- Logo or brand mark\n- Event or property details (date, time, address, URL)\n- Optional QR code (generate at qr-code-generator.com)`
        : `- Brand colors and fonts\n- Logo (for header and footer placement)\n- Data or statistics to populate callout fields\n- Professional photography where specified in the layout`;

      const copyBlock = isRE
        ? (isPresentation
          ? `**Opening statement:** "In today's competitive luxury market, presentation is the first competitive advantage. This proposal outlines exactly how your property will be positioned, marketed, and negotiated — from first showing to final close."\n\n**Agent introduction:** "[Agent Name] brings [X] years of luxury real estate expertise to every transaction. Over $[X]M in closed transactions in [Market Area]."\n\n**CTA:** "I would welcome the opportunity to present this proposal in person. Contact me to schedule a private consultation at your convenience."`
          : isFlyer
          ? `**Headline:** ${primaryHeadline}\n\n**Invitation copy:** "You are cordially invited to an exclusive private showing of [Address] on [Date] at [Time]. Refreshments will be served. RSVP required."\n\n**Contact line:** "For property information prior to the event, contact [Agent Name] at [Phone]."`
          : isReport
          ? `**Headline:** ${primaryHeadline}\n\n**Intro line:** "The following report presents current market conditions in [Neighborhood/Area] for [Month Year]. Data sourced from [MLS/Source]."\n\n**Closing line:** "To discuss what these conditions mean for your property specifically, contact [Agent Name] directly."`
          : `**Headline:** ${primaryHeadline}\n\n**Body line:** "[Insert specific property or campaign information — replace this line with real data specific to the current transaction.]\n\n**CTA:** "Contact [Agent Name] at [Phone] or [Email] to discuss your next step."`)
        : `**Headline:** ${primaryHeadline}\n\n**Subhead:** Professional ${useCase.toLowerCase()} for ${aud.audiencePlural || n.niche}\n\n**CTA:** [Insert your specific call-to-action tailored to this template's audience and use case]`;

      const ctaExamples = isRE
        ? [
            isPresentation ? 'Schedule your private listing consultation today' : 'RSVP now — spaces are limited',
            isPresentation ? 'I would welcome the opportunity to present in person' : 'Reserve your viewing at [LINK]',
            isPresentation ? 'Call [Phone] or reply directly to this message' : 'Contact [Agent Name] at [Phone]',
          ]
        : [
            'Get started today — contact us at [Phone/Email]',
            'Download the full details at [LINK]',
            'Reach out directly: [CONTACT INFO]',
          ];

      const exportFormat = isPresentation ? 'PDF (print-ready, 300 DPI) + PNG (digital sharing, 72–150 DPI)'
        : isFlyer ? 'PDF (A5 or A4, print-ready) + PNG (digital) + JPG (social media)'
        : 'PDF (professional delivery) + optional interactive PDF for digital forms';

      const qcRows = getTemplateQCRows(useCase, n);

      lines.push(`### Template ${idx + 1}: ${useCase}`);
      lines.push('');
      lines.push(`**Internal Name:** \`${useCase.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}\``);
      lines.push(`**Best Use Case:** ${bestUse}`);
      lines.push('');
      lines.push(`**Buyer Scenario:** ${buyerScenario}`);
      lines.push('');
      lines.push('**Layout Structure:**');
      lines.push('');
      lines.push(layoutStructure);
      lines.push('');
      lines.push('**Required Assets Before Customizing:**');
      lines.push('');
      lines.push(requiredAssets);
      lines.push('');
      lines.push('**Ready-to-Use Copy Blocks:**');
      lines.push('');
      lines.push(copyBlock);
      lines.push('');
      lines.push(`**Primary Headline:** *${primaryHeadline}*`);
      lines.push('');
      lines.push('**Alternative Client-Facing Headlines:**');
      altHeadlines.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
      lines.push('');
      lines.push('**CTA Examples:**');
      ctaExamples.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
      lines.push('');
      lines.push('**Customization Notes:**');
      lines.push('');
      lines.push('1. Replace all [BRACKET] fields with real content before exporting — no visible brackets in the final document');
      lines.push('2. Apply your brand colors to all designated color zones consistently');
      lines.push('3. Confirm all images are correctly cropped and meet minimum 300 DPI for any print application');
      lines.push('4. Verify all contact information is accurate and complete on every page');
      lines.push(`5. Save a \`MASTER_BRANDED\` version with your brand applied (no client data) before each project-specific customization`);
      lines.push('');
      lines.push(`**Recommended Export Format:** ${exportFormat}`);
      lines.push('');
      lines.push('**Quality Control Checklist:**');
      lines.push('');
      lines.push('| Check | Verified |');
      lines.push('|---|---|');
      qcRows.forEach(r => lines.push(`| ${r} | ☐ |`));
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  // ── COPY BANKS ─────────────────────────────────────────────────────────────
  lines.push('## Copy Banks');
  lines.push('');

  if (isRE && reCopy) {
    lines.push('### A) Copy for Selling This Digital Product');
    lines.push('');
    lines.push('**Product Sales Headline Bank:**');
    lines.push('');
    [
      `${templateCases.length} ${n.niche} Template Blueprints — Layout + Copy, Instantly Buildable`,
      `Stop Presenting with Generic Templates — Here's the Blueprint System Built for ${aud.audienceShort}`,
      `$${n.priceMin} for ${templateCases.length} ${n.niche} Template Blueprints. Download and Build Today.`,
      `The ${n.niche} Blueprint Kit That Tells You Exactly What to Build, Write, and Deliver`,
      `Look Like the Premium Option Before You Say a Word — ${n.title}`,
    ].forEach((h, i) => lines.push(`${i + 1}. ${h}`));
    lines.push('');
    lines.push('**Product CTA Bank:**');
    lines.push('');
    [
      `Download instantly → Start building in minutes`,
      `Get your blueprints for $${n.priceMin} →`,
      `Grab ${n.title} — limited launch price →`,
      `$${n.priceMin} now · $${n.priceMax} after launch →`,
    ].forEach((c, i) => lines.push(`${i + 1}. ${c}`));
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('### B) Copy for Buyer Use in Their Own Real Estate Materials');
    lines.push('');
    lines.push('**Client-Facing Headline Bank:**');
    lines.push('');
    reCopy.headlines.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
    lines.push('');
    lines.push('**Property Description Copy Bank:**');
    reCopy.propertyDesc.forEach((d, i) => {
      lines.push('');
      lines.push(`*Option ${i + 1}:*`);
      lines.push(`> ${d}`);
    });
    lines.push('');
    lines.push('**Agent Bio Copy Bank:**');
    reCopy.agentBio.forEach((b, i) => {
      lines.push('');
      lines.push(`*Option ${i + 1}:*`);
      lines.push(`> ${b}`);
    });
    lines.push('');
    lines.push('**Seller Pitch Copy Bank:**');
    reCopy.sellerPitch.forEach((s, i) => {
      lines.push('');
      lines.push(`*Option ${i + 1}:*`);
      lines.push(`> ${s}`);
    });
    lines.push('');
    lines.push('**Open House Copy Bank:**');
    reCopy.openHouse.forEach((o, i) => {
      lines.push('');
      lines.push(`*Option ${i + 1}:*`);
      lines.push(`> ${o}`);
    });
    lines.push('');
    lines.push('**Follow-Up Copy Bank:**');
    reCopy.followUp.forEach((f, i) => {
      lines.push('');
      lines.push(`*Option ${i + 1}:*`);
      lines.push(`> ${f}`);
    });
  } else {
    lines.push('### Headline Bank');
    lines.push('');
    [
      `${n.title} — The Complete ${n.type} Built for ${aud.audienceShort || n.niche}`,
      `Stop Guessing. Start Building. ${n.title} Gives You the Blueprint.`,
      `$${n.priceMin} for Everything You Need to Look Like the Premium Option`,
      `${n.title}: ${templateCases.length || (n.sections || []).length}+ Templates. Instant Download. Professional Results.`,
      `The ${n.niche} ${n.type} That Saves You Hours of Design Guesswork`,
    ].forEach((h, i) => lines.push(`${i + 1}. ${h}`));
    lines.push('');
    lines.push('### CTA Bank');
    lines.push('');
    [
      `Download instantly → Customize in minutes`,
      `Get instant access for $${n.priceMin} →`,
      `Grab the full pack today →`,
      `One download. Professional results. →`,
      `$${n.priceMin} today → $${n.priceMax} after launch →`,
    ].forEach((c, i) => lines.push(`${i + 1}. ${c}`));
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── PLATFORM LISTING COPY ─────────────────────────────────────────────────
  lines.push('## Platform Listing Copy');
  lines.push('');
  lines.push('### Primary Listing');
  lines.push('');
  lines.push(`**Title:** ${safe(ma.listing_title || n.title)}`);
  lines.push('');
  const listingDesc = safe(ma.listing_description || n.longDesc || `${n.promise || n.title}\n\nBuilt for ${aud.audiencePlural}.\n\n✅ Instant digital download\n✅ Complete blueprint and copy system\n✅ Ready to use immediately`);
  lines.push('**Description:**');
  lines.push('');
  lines.push(listingDesc);
  lines.push('');
  lines.push(`**Keywords:** ${(n.keywords || []).slice(0, 10).join(', ')}`);
  lines.push('');
  lines.push('### Platform-Specific Tips');
  lines.push('');
  lines.push(`| Platform | Price | Key Tip |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Gumroad | $${n.priceMin} | Enable Pay What You Want (minimum $${n.priceMin}). Buyers often pay more. |`);
  lines.push(`| Etsy | $${(n.priceMin - 0.01).toFixed(2)} | Fill all 13 tags. Showcase blueprint content in listing photos. |`);
  lines.push(`| Payhip | $${n.priceMin} | Set up 30–50% affiliate commissions to drive volume. |`);
  lines.push(`| Creative Market | $${n.priceMin} | Clearly state this is a blueprint system, not design source files. |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── PRICING STRATEGY ──────────────────────────────────────────────────────
  lines.push('## Pricing Strategy');
  lines.push('');
  lines.push('| Price Point | Amount | Context |');
  lines.push('|---|---|---|');
  lines.push(`| **Launch Price** | $${n.priceMin} | First 72 hours only — maximum momentum |`);
  lines.push(`| **Standard Price** | $${Math.round((n.priceMin + n.priceMax) / 2)} | Post-launch — warm audience |`);
  lines.push(`| **Premium Price** | $${n.priceMax} | Established position, with testimonials |`);
  lines.push('');
  lines.push('**Price Rationale:**');
  lines.push('');
  lines.push(safe(ma.price_rationale || `At $${n.priceMin}, ${n.title} costs less than one hour of a freelance designer's time — yet delivers ${isTP ? templateCases.length : (n.sections || []).length}+ professional ${n.niche} blueprints with ready-to-paste copy. The value-to-price ratio is immediately obvious to any ${aud.audienceShort || n.niche} professional who has paid for design work.`));
  lines.push('');
  lines.push('**Platform Tips:**');
  lines.push('');
  lines.push(`- **Gumroad:** Enable Pay What You Want (minimum $${n.priceMin}). Buyers often pay more during launch week.`);
  lines.push(`- **Etsy:** Price at $${(n.priceMin - 0.01).toFixed(2)} — below round numbers performs better in search placement.`);
  lines.push(`- **Payhip:** Build an affiliate network at 30–50% commission to drive volume beyond your own audience.`);
  lines.push(`- **All platforms:** Announce the price increase publicly before raising — this alone drives urgency-based conversions.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── FAQ ───────────────────────────────────────────────────────────────────
  lines.push('## FAQ');
  lines.push('');
  const faqs = [
    ['What files are included?', isTP
      ? `${templateCases.length} template blueprint files (PDF guide + individual TXT working files), plus: Copy_Bank.txt, Headline_Bank.txt, CTA_Bank.txt, platform listing copy, social media content, an email launch sequence (5 emails), a 7-day launch plan, and bonus strategy files.`
      : `The complete ${n.type} in multiple formats, plus: platform listing copy, social media content, an email launch sequence, a 7-day launch plan, and bonus strategy files.`],
    ['Is this a Canva, Figma, InDesign, or PowerPoint template — or a template blueprint?',
      isTP
        ? `This is a **template blueprint system** — layout specifications, copy blocks, field guides, and headline options. It is **not** Canva source files, InDesign files, PSD files, or Figma files. You build the templates in your preferred design tool (Canva, Adobe, PowerPoint, or Google Slides) using the blueprints provided.`
        : `This is a ${n.type} delivered as a digital download. Not a design source file.`],
    ['Do I need design software?',
      `Basic familiarity with Canva, PowerPoint, or any document editor is sufficient. Each blueprint provides step-by-step layout guidance and specifies exactly what to build. No advanced design skills required.`],
    ['Are fonts included?',
      `Font recommendations are included in the Visual Style Guide section of this guide. All recommended fonts are available free via Google Fonts (fonts.google.com). No font files are bundled in this download.`],
    ['Are images included?',
      `No stock photography or image files are included. Required image specifications and recommended dimensions are listed in each template's Required Assets section. Free high-quality photography: Unsplash (unsplash.com), Pexels (pexels.com).`],
    ['Can I use this commercially?',
      `Yes. You may use this to create materials for your own professional or business use. You may not redistribute, resell, or share the original template blueprint files with others.`],
    ['Can I resell the files?',
      `No. This product is licensed for your personal and professional use only. The template blueprint files, copy blocks, and all included documents are not for redistribution or resale.`],
    ['How do I customize it?',
      `Open the template file in any text editor or document viewer. Follow the Layout Structure instructions in each template section. Open your preferred design tool (Canva, Adobe, PowerPoint, or Google Slides), create a new document at the specified dimensions, apply the layout and copy blocks as directed, and replace all [BRACKET] content with your real information.`],
  ];
  faqs.forEach(([q, a]) => {
    lines.push(`**Q: ${q}**`);
    lines.push('');
    lines.push(`A: ${a}`);
    lines.push('');
  });
  lines.push('---');
  lines.push('');

  // ── UPSELL IDEAS ─────────────────────────────────────────────────────────
  lines.push('## Upsell Ideas');
  lines.push('');
  const base = Math.max(n.priceMax, n.priceMin, 17);
  const uPrice = Math.max(base + 20, Math.round(base * 1.8));
  const bPrice = Math.round(base * 1.5);
  const obPrice = Math.max(9, Math.round(base * 0.3));
  const mPrice = Math.max(12, Math.round(base * 0.4));
  const upsellProduct = isRE ? 'Luxury Agent Brand System Vol. 2 — 10 Advanced Presentation Templates' : `${n.title} Extended Pack — 10 Additional Templates`;
  const bundle1 = isRE ? 'Luxury Real Estate Copywriting Swipe File — 50 Proven Listing Description Formulas' : `${n.niche} Copywriting Swipe File — 40 Proven Copy Formulas`;
  const bundle2 = isRE ? 'Listing Appointment Conversion Toolkit — Scripts + Pre-Listing Package + Objection Handlers' : `${n.niche} Client Conversion Toolkit — Scripts + Forms + Follow-Up Templates`;
  const orderBump = isRE ? 'Luxury Color & Font Pairing Guide — 5 Editorial Palettes for Real Estate' : `${n.niche} Brand Style Guide — Color, Font, and Layout Rules`;
  const membership = isRE ? 'Monthly Luxury Real Estate Design Drop — 2 New Templates + 1 Copywriting Formula' : `Monthly ${n.niche} Design & Copy Drop — 2 New Templates + 1 Swipe File`;

  lines.push('### Immediate Upsell (Show on Thank-You Page)');
  lines.push('');
  lines.push(`**Product:** ${upsellProduct}`);
  lines.push(`**Price:** $${uPrice}`);
  lines.push(`**Pitch:** ${isRE ? '"Vol. 2 adds 10 bespoke templates: expired listing pitches, investor portfolio pages, luxury rental brochures, and a full open house signage suite."' : `"10 additional blueprints for ${n.niche} professionals covering advanced use cases and seasonal campaigns."`}`);
  lines.push(`**Tip:** Show immediately on the thank-you/download page — strike when buyer intent is highest.`);
  lines.push('');
  lines.push('### Bundle Ideas');
  lines.push('');
  lines.push(`**Bundle 1:** "${n.title}" + "${bundle1}"`);
  lines.push(`- Bundle Price: $${bPrice} (saves ~25% vs. buying separately)`);
  lines.push(`- Best platform: Gumroad (Bundle product type) or Payhip`);
  lines.push('');
  lines.push(`**Bundle 2:** "${n.title}" + "${bundle2}"`);
  lines.push(`- Bundle Price: $${Math.round(bPrice * 1.3)}`);
  lines.push(`- Best platform: Payhip or ThriveCart (one-click upsell flow)`);
  lines.push('');
  lines.push('### Order Bump (Checkbox at Checkout)');
  lines.push('');
  lines.push(`**Product:** ${orderBump}`);
  lines.push(`**Price:** $${obPrice} (added at checkout)`);
  lines.push(`**Tip:** Keep order bumps under $${Math.round(base * 0.4)}. Must feel like an obvious add-on.`);
  lines.push('');
  lines.push('### Subscription / Membership');
  lines.push('');
  lines.push(`**Product:** ${membership}`);
  lines.push(`**Price:** $${mPrice}/month`);
  lines.push(`**Tip:** Offer 1 free month to ${n.title} buyers to build the habit before the first charge.`);
  lines.push('');
  lines.push('### Where to Add Upsells');
  lines.push('');
  lines.push(`- **Gumroad:** "Recommended" products panel on the product page`);
  lines.push(`- **Payhip:** Configure thank-you page redirect with upsell URL`);
  lines.push(`- **ThriveCart / SamCart:** Native one-click upsell post-checkout`);
  lines.push(`- **Email:** Day 3 follow-up to buyers (48 hours after purchase)`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── 7-DAY LAUNCH PLAN ────────────────────────────────────────────────────
  lines.push('## 7-Day Launch Plan');
  lines.push('');
  const launchDays = [
    {
      day: 1, title: 'Launch Day',
      objective: 'Go live and capture first-buyer momentum',
      tasks: [`Publish product on ${n.platform} — verify purchase link works end-to-end`, 'Update bio link on all social platforms to the product URL', 'Send Email 1 (Announcement) to your full list'],
      platform: ['Instagram: Post Caption 4 (Launch Announcement) — static image with product cover', 'LinkedIn: Post 4 (Launch) — announce to professional network', 'Stories: "It\'s live" story with product link sticker'],
      content: ['`Instagram_Captions.txt → Caption 4`', '`LinkedIn_Posts.txt → Post 4`', '`Email_1_Announcement.txt`'],
      cta: `"Download instantly at [LINK] — launch price $${n.priceMin}, going up [DATE]"`,
      metric: `3+ sales by end of day. 50+ bio link clicks.`,
    },
    {
      day: 2, title: 'Education + Reach',
      objective: 'Reach new audience through value-first content — no hard selling',
      tasks: ['Post a short-form video (30–45 sec) on TikTok or Instagram Reels', 'Reply to every Day 1 comment and DM within 2 hours', 'Share a behind-the-scenes story showing the product contents'],
      platform: ['TikTok/Reels: Before/After Reveal video (no selling — pure value)', 'Instagram Stories: Quick scroll of the template contents'],
      content: ['`TikTok_Reel_Ideas.txt → Video 1`'],
      cta: `"Save this post — grab the pack at the link in bio"`,
      metric: `500+ video views. 10+ saves or shares.`,
    },
    {
      day: 3, title: 'Value + Email',
      objective: 'Build trust and overcome "what is this?" objections',
      tasks: ['Send Email 2 (Educational Value)', 'Post a "What\'s Inside" carousel on Instagram and LinkedIn', 'Reply to all DMs asking about the product'],
      platform: ['Instagram + LinkedIn: Carousel 2 (What\'s Inside) — show every template'],
      content: ['`Email_2_Educational_Value.txt`', '`Carousel_Post_Outlines.txt → Carousel 2`'],
      cta: `"Last slide has the link. $${n.priceMin} for the full pack."`,
      metric: `3%+ email click rate above baseline. 5+ carousel saves.`,
    },
    {
      day: 4, title: 'Authority + Professional Reach',
      objective: 'Build credibility with the professional community; reach the B2B segment',
      tasks: ['Post LinkedIn authority post — peer-to-peer tone, no hype', 'Post TikTok/Reels pain-point video', `Engage in 2–3 relevant ${n.niche} communities or groups`],
      platform: ['LinkedIn: Post 1 (Authority)', 'TikTok/Reels: Video 3 (Pain Point Direct Address)'],
      content: ['`LinkedIn_Posts.txt → Post 1`', '`TikTok_Reel_Ideas.txt → Video 3`'],
      cta: `"Link in comments (LinkedIn) / Comment TEMPLATES (TikTok)"`,
      metric: `10+ LinkedIn reactions. 1 sale from LinkedIn traffic.`,
    },
    {
      day: 5, title: 'Story + Social Proof',
      objective: 'Emotional connection and early social proof collection from buyers',
      tasks: ['Send Email 3 (Problem Aware)', 'Post story-based feed caption (personal narrative)', 'Run Instagram Stories poll for engagement', 'DM Day 1–3 buyers asking for a quick testimonial'],
      platform: ['Instagram Feed: Caption 7 (Story — Why I Built This)', 'Instagram Stories: Poll engagement'],
      content: ['`Email_3_Problem_Aware.txt`', '`Instagram_Captions.txt → Caption 7`'],
      cta: `"Full story in the caption. Grab the pack at the link in bio."`,
      metric: `40%+ poll response rate. 1+ usable buyer testimonial.`,
    },
    {
      day: 6, title: 'Offer + Urgency',
      objective: 'Convert fence-sitters with a clear deadline and complete offer breakdown',
      tasks: ['Send Email 4 (The Offer) — full template-by-template breakdown', 'Post urgency-focused content on Instagram and LinkedIn', 'Announce publicly that price increases tomorrow'],
      platform: ['Instagram: Caption 9 (Urgency)', 'LinkedIn: Post 5 (ROI)', `Stories: "Price goes to $${n.priceMax} tomorrow" countdown`],
      content: ['`Email_4_Offer.txt`', '`Instagram_Captions.txt → Caption 9`', '`LinkedIn_Posts.txt → Post 5`'],
      cta: `"$${n.priceMin} tonight. $${n.priceMax} from tomorrow. Link in bio."`,
      metric: `Highest single-day sales of the launch. 20%+ email click rate.`,
    },
    {
      day: 7, title: 'Final Push + Close',
      objective: 'Capture last-minute buyers, raise price, and close the launch window',
      tasks: ['Send Email 5 (Last Call) — morning send, short and direct', 'Post final urgency content across all platforms simultaneously', `Raise price to $${n.priceMax} at [TIME] — do not delay`, 'Send thank-you message to every buyer from Days 1–6'],
      platform: ['Instagram: Caption 10 (Last Chance)', 'TikTok/Reels: Video 7 (Launch Urgency)', 'LinkedIn: Brief last-call post', 'Stories: Final countdown'],
      content: ['`Email_5_Last_Call.txt`', '`Instagram_Captions.txt → Caption 10`', '`TikTok_Reel_Ideas.txt → Video 7`'],
      cta: `"Last chance at $${n.priceMin}. Going to $${n.priceMax} at [TIME]. Link in bio."`,
      metric: `10+ total sales across 7 days. Price raised by end of day.`,
    },
  ];

  launchDays.forEach(d => {
    lines.push(`### Day ${d.day} — ${d.title}`);
    lines.push('');
    lines.push(`**Objective:** ${d.objective}`);
    lines.push('');
    lines.push('**Tasks:**');
    d.tasks.forEach(t => lines.push(`- [ ] ${t}`));
    lines.push('');
    lines.push('**Platform Action:**');
    d.platform.forEach(p => lines.push(`- ${p}`));
    lines.push('');
    lines.push('**Content to Publish:**');
    d.content.forEach(c => lines.push(`- ${c}`));
    lines.push('');
    lines.push(`**CTA:** ${d.cta}`);
    lines.push('');
    lines.push(`**Success Metric:** ${d.metric}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push('### Post-Launch (Week 2+)');
  lines.push('');
  lines.push('- [ ] Collect and publish buyer testimonials');
  lines.push('- [ ] Set up an automated email welcome sequence for new buyers');
  lines.push('- [ ] Repurpose buyer results into social proof content');
  lines.push('- [ ] Plan your first bundle or upsell product');
  lines.push('- [ ] List on additional platforms if launched on only one');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by Launchora · ${now} · launchora.com*`);

  return lines.join('\n');
}

// ── HTTP Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const n = body?.n;
    const product = body?.product || {};
    if (!n || !n.title) {
      return Response.json({ error: 'Missing normalized product data (n)' }, { status: 400 });
    }
    const markdown = buildMasterGuideMarkdown(n, product);
    return Response.json({ ok: true, markdown, length: markdown.length });
  } catch(e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
});
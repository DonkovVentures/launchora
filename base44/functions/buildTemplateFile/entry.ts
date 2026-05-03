// buildTemplateFile.js
// Builds a single rich, use-case-specific template blueprint file.
// Called inline from generateZip — exported as a pure function via HTTP for testing.
// Returns the full text content of the template file.

const hr = (c = '─', n = 60) => c.repeat(n);
const E60 = '═'.repeat(60);

// ── Real estate specific template definitions ─────────────────────────────────
const RE_TEMPLATES = {
  'Luxury Listing Presentation Cover': {
    internalName: 'listing-cover',
    bestUseCase: 'The first page a seller sees when you walk into a listing appointment. Sets the tone for the entire presentation.',
    buyerScenario: 'You have a listing appointment tomorrow with a high-net-worth seller evaluating three agents. This cover page signals editorial credibility before you say a word.',
    layout: `Full-bleed single-page cover layout (A4 / US Letter portrait)
• Top 65%: High-resolution property hero image or brand graphic — full bleed, no borders
• Bottom 35%: Deep charcoal panel (#1A1A1A or brand dark)
• Main headline: Display serif font, 36–48pt, white, left-aligned with 40px left margin
• Subheadline: 14pt sans-serif, 40% white opacity, immediately below headline
• Agent name + brokerage: Bottom-left corner, 10pt, white
• Logo: Bottom-right corner, max 120px wide, white version
• Thin accent rule: 2px brand color line separating image from dark panel
• Page size: A4 (210×297mm) or US Letter (8.5×11in)`,
    assets: `• Property hero image — minimum 2400×1600px, sharp, natural or golden-hour light
• Agent headshot (optional variant) — min 800×800px, neutral background
• Brokerage logo — SVG or PNG, white/light version for dark backgrounds
• Brand hex color codes — primary + accent
• Agent name exactly as it should appear in print
• Brokerage name and license number (if required by your state/country)`,
    copyBlocks: [
      {
        label: 'Editorial Headline (use on cover)',
        copy: `The Art of the Sale`
      },
      {
        label: 'Alternative Cover Headline',
        copy: `A Curated Approach to Extraordinary Real Estate`
      },
      {
        label: 'Agent Introduction Line (below headline)',
        copy: `Presented by [Agent Name] · [Brokerage Name] · [License #]`
      },
      {
        label: 'Property Tagline (optional, italic)',
        copy: `Where Elegance Meets Everyday Living`
      },
      {
        label: 'Prepared-for Line',
        copy: `Exclusively Prepared for [Seller First Name] & [Seller Last Name] · [Date]`
      }
    ],
    primaryHeadline: 'The Art of the Sale',
    altHeadlines: [
      'A Curated Approach to Extraordinary Real Estate',
      'Where Elegance Meets Everyday Living',
      'Local Expertise. Global Resonance.',
      'The Standard for Luxury Representation',
      'Presented with Distinction'
    ],
    ctaExamples: [
      'Walk in with this cover and let the presentation speak before you do.',
      'Send this as a PDF 24 hours before the appointment — sellers share it with their families.',
      'Print at 300 DPI on 100gsm silk stock for in-person listing appointments.',
      'Use as the opening slide in a Keynote or PowerPoint version of your pitch.',
      'Pair with the Editorial Property Brochure for a complete listing appointment package.'
    ],
    customizationNotes: [
      'Replace the hero image with a high-quality exterior shot of the specific property — never use stock photos for individual listings.',
      'Apply your brokerage brand colors to the accent rule and any color elements. Limit to 2 colors maximum.',
      'Use a premium serif for the headline (Playfair Display, Cormorant Garamond, or similar). Avoid sans-serif for this element.',
      'Keep the dark panel dark — resist the urge to lighten it. Contrast is what makes this cover command attention.',
      'The "Prepared for" line is optional but powerful — sellers keep personalized presentations.',
      'If your brokerage has strict logo placement rules, follow them. The logo position here is a guide, not a requirement.'
    ],
    exportFormat: `PDF/X-1a at 300 DPI for print delivery (hand it to the seller at the appointment)
PNG at 150 DPI for digital sharing via email
JPEG at 72 DPI compressed for email thumbnail or social preview`,
    qcChecklist: [
      ['Hero image is property-specific — not stock photography', '☐'],
      ['No [BRACKET] fields remain in the final export', '☐'],
      ['Agent name and license number are accurate', '☐'],
      ['Logo is the correct version (light/white for dark background)', '☐'],
      ['Headline is in display serif font at minimum 36pt', '☐'],
      ['Dark panel provides sufficient contrast — text is clearly legible', '☐'],
      ['PDF exports at 300 DPI without visible compression artifacts', '☐'],
      ['File named correctly: [AgentLastName]_ListingCover_[PropertyAddress]_[Date]', '☐'],
    ]
  },

  'Editorial Property Brochure': {
    internalName: 'property-brochure',
    bestUseCase: 'A 4-page editorial property brochure delivered to the seller before the listing appointment, left at open houses, and sent to buyer leads.',
    buyerScenario: 'You have an active listing at a price point where buyers expect premium marketing. This brochure sits on the kitchen counter at the open house and gets photographed and shared.',
    layout: `4-page editorial layout (A4 portrait or US Letter)
Page 1 — Cover: Full-bleed hero image + property address + headline
Page 2 — Property Details: Left column (2/3 width) body copy + specs table | Right column (1/3) secondary image stack
Page 3 — Lifestyle + Location: Full-width lifestyle image top half | Two-column text below (neighborhood + lifestyle copy)
Page 4 — Agent + Contact: Agent bio block (left) | Brokerage info + QR code (right) | Full-width footer strip

Typography: Display serif headline (48pt cover, 24pt interior) + clean sans-serif body (10pt, 1.6 line height)
Color: White background, dark charcoal text, single brand accent color for rules and callouts`,
    assets: `• 6–10 professional property photographs (min 2400×1600px each)
• Property address and full legal description
• Bedroom / bathroom / parking / land size specifications
• Price (if publicly marketed) or "Offers invited" language
• Neighborhood description (50–80 words)
• Lifestyle description (30–50 words describing who this home suits)
• Agent headshot (min 600×600px, clean background)
• Agent bio (100–150 words)
• Brokerage logo (color and white versions)
• Agent contact: phone, email, website
• QR code linking to the listing page (generate at qr-code-generator.com)`,
    copyBlocks: [
      {
        label: 'Cover Headline',
        copy: `Where Elegance Meets Everyday Living`
      },
      {
        label: 'Property Introduction (Page 2 opening paragraph)',
        copy: `Presented for the first time, [Property Name or Address] redefines the standard for [neighborhood] living. Set on [lot size], this exceptional [property type] offers [X] bedrooms, [X] bathrooms, and [sq ft] of meticulously designed space — where architectural precision and refined comfort exist in perfect balance.`
      },
      {
        label: 'Property Features List Label',
        copy: `Property Specifications`
      },
      {
        label: 'Lifestyle Copy (Page 3)',
        copy: `Positioned moments from [local landmark or amenity], [Property Address] places the finest of [neighborhood name] at your doorstep. Whether [morning ritual, e.g. "morning coffee on the terrace"] or [evening activity, e.g. "entertaining on the rooftop"], every detail of this home has been considered for the way you actually live.`
      },
      {
        label: 'Agent Bio Opening',
        copy: `[Agent Name] is a trusted advisor to buyers and sellers in [market area], known for combining market intelligence with a measured, client-first approach. With [X] years of experience and [sales volume / notable transaction], [he/she/they] brings unmatched expertise to every listing.`
      }
    ],
    primaryHeadline: 'Where Elegance Meets Everyday Living',
    altHeadlines: [
      'A Rare Offering in [Neighborhood Name]',
      'The Neighborhood Edit: [Address]',
      'Architectural Precision Meets Refined Comfort',
      'An Exceptional Home Deserves an Exceptional Introduction',
      'Presented with Distinction'
    ],
    ctaExamples: [
      'Leave a printed copy on the kitchen counter at every open house — buyers take them.',
      'Email the PDF to registered buyer leads 48 hours before the open house.',
      'Post page 1 as an Instagram carousel cover image for your listing launch post.',
      'Send as a PDF attachment in your listing email to the seller for approval before publishing.',
      'Use the QR code on page 4 to link directly to the online listing or booking page.'
    ],
    customizationNotes: [
      'All 6–10 photos must be edited consistently — same brightness, contrast, and cropping ratio across the set.',
      'Never use more than 2 font families. Display serif for headlines, clean sans-serif for body text.',
      'The specs table (bedrooms, bathrooms, area, etc.) should be in a clean grid — never a bulleted list.',
      'The lifestyle copy on page 3 should describe the buyer, not the property. "For those who appreciate..." rather than "The property features..."',
      'Page 4 agent bio must include a credibility signal — years of experience, transaction volume, or a notable market achievement.',
      'Print on 130gsm silk or gloss coated stock for maximum perceived value. Standard office paper undermines the design.'
    ],
    exportFormat: `PDF/X-1a at 300 DPI for professional print (minimum 130gsm coated stock)
PDF at 150 DPI for email delivery to buyers and sellers
PNG page 1 at 72 DPI for social media (Instagram carousel cover)`,
    qcChecklist: [
      ['All 6+ property photographs are professionally edited and consistently treated', '☐'],
      ['Property specifications table is accurate and complete', '☐'],
      ['All [BRACKET] placeholder fields have been replaced with real content', '☐'],
      ['Agent bio includes a specific credibility signal (experience, volume, achievement)', '☐'],
      ['QR code has been tested — links to the correct URL', '☐'],
      ['Typography: display serif for headlines, sans-serif for body — no mixing beyond 2 families', '☐'],
      ['Color palette limited to 2–3 tones — white, dark charcoal, and 1 brand accent', '☐'],
      ['PDF exports at 300 DPI with no visible JPEG compression on photographs', '☐'],
    ]
  },

  'Seller Pitch Deck Slide': {
    internalName: 'seller-pitch-deck-slide',
    bestUseCase: 'A single-slide template used inside a full listing presentation deck — for key stats, pricing strategy, marketing plan, or proof of performance.',
    buyerScenario: 'You are presenting slide 7 of your listing pitch — the "Why My Marketing Is Different" slide. The seller has seen generic Canva decks before. This one needs to look like it was made by a studio.',
    layout: `Single slide layout (16:9 widescreen — 1920×1080px recommended)
• Left panel (40% width): Brand-colored solid background panel
  - Stat or key number: 72–96pt display font, white
  - Stat label: 14pt sans-serif, white, 60% opacity
  - Secondary stat (optional): 36pt, white
• Right panel (60% width): White or off-white background
  - Slide headline: 28–32pt serif, dark charcoal
  - Body copy: 12pt sans-serif, charcoal, max 3 bullet points or 4 lines of prose
  - Supporting data or source note: 9pt, muted grey
• Bottom strip: Full-width 4px brand accent color rule
• Logo: Bottom-right corner, 60px wide
• Slide number: Bottom-right, 9pt muted grey`,
    assets: `• The specific statistic or key number for the left panel (e.g. "98.7% List-to-Sale Ratio" or "47 Days Average on Market")
• Headline for this slide (what argument this slide makes)
• Up to 3 bullet points or a short paragraph of supporting copy
• Data source or date range for any statistics used
• Brokerage logo (color version for light backgrounds)
• Brand accent hex color`,
    copyBlocks: [
      {
        label: 'Marketing Advantage Headline',
        copy: `Local Expertise. Global Resonance.`
      },
      {
        label: 'Proof Slide Headline',
        copy: `The Numbers Behind the Name`
      },
      {
        label: 'Pricing Strategy Slide Headline',
        copy: `The Strategy That Maximises Your Sale Price`
      },
      {
        label: 'Key Stat Supporting Body Copy',
        copy: `In [Market Area], the difference between the right price and the wrong price is measured in weeks — and thousands of dollars. Our pricing methodology draws on [X] months of real-time market data, [X] comparable sales, and [X] years of pricing experience in this exact neighbourhood.`
      },
      {
        label: 'Marketing Plan Supporting Body Copy',
        copy: `Every property deserves a marketing plan built for its specific buyer. Our approach combines professional photography, editorial print materials, targeted digital distribution, and a network of [X]+ pre-qualified buyer contacts.`
      }
    ],
    primaryHeadline: 'Local Expertise. Global Resonance.',
    altHeadlines: [
      'The Numbers Behind the Name',
      'The Strategy That Maximises Your Sale Price',
      'Why Every Detail of Your Marketing Matters',
      'A Curated Approach to Extraordinary Real Estate',
      'The Standard for Luxury Representation'
    ],
    ctaExamples: [
      'Duplicate this slide for each key argument in your pitch — pricing, marketing, track record, and network.',
      'Animate the left-panel stat to count up from zero in Keynote or PowerPoint for a memorable reveal.',
      'Export as PNG and use as individual Instagram carousel slides for your marketing content.',
      'Print as a single-page insert (A4 landscape) to hand to sellers who want a leave-behind.',
      'Use the "48 Hours" variant to show your pre-listing marketing timeline.'
    ],
    customizationNotes: [
      'The left-panel number must be a real statistic — never fabricated. Sellers remember and fact-check claims made in listing presentations.',
      'Limit body copy on the right panel to 50–70 words maximum. This is a presentation slide, not a document.',
      'Each slide in your deck should make exactly one argument. If you need to say three things, use three slides.',
      'The brand color panel (left side) creates visual consistency across the entire deck. Use the same hex code on every slide.',
      'Avoid clip art, stock illustrations, and decorative borders. Clean, data-forward design builds more credibility than decoration.',
      'If presenting on-screen, export as PDF to avoid font substitution issues on client computers.'
    ],
    exportFormat: `PDF for on-screen presentation (export entire deck as single PDF)
PNG at 1920×1080px per slide for social media use
PPTX or KEY source file preserved for future editing`,
    qcChecklist: [
      ['Left-panel statistic is accurate and can be verified if challenged by a seller', '☐'],
      ['Slide makes exactly one argument — not a summary of everything you do', '☐'],
      ['Body copy is under 70 words on the right panel', '☐'],
      ['Brand accent color hex code matches other slides in the deck', '☐'],
      ['Logo is correctly sized and positioned with adequate padding', '☐'],
      ['No decorative elements that are not functional (clip art, gradient fills, drop shadows)', '☐'],
      ['PDF export tested on a different device — fonts render correctly', '☐'],
      ['Slide number is present and correct if used in a multi-slide presentation', '☐'],
    ]
  },

  'Market Report Summary Page': {
    internalName: 'market-report-summary',
    bestUseCase: 'A one-page market snapshot delivered to seller clients monthly, used as a listing appointment leave-behind, and shared as a social media authority piece.',
    buyerScenario: 'You want to stay front-of-mind with past clients and potential sellers. A branded monthly market report positions you as the local expert — not just an agent with a license.',
    layout: `Single A4 / US Letter portrait page
• Top header strip (full width, dark): Report title + month/year + agent branding
• Left column (60%): Main data section
  - "The State of the Market" headline (24pt serif)
  - 3–4 key market statistics in large-number callout boxes (stat + label)
  - 80–120 word market commentary paragraph
• Right column (40%): Supporting data
  - Mini table: "Key Metrics at a Glance" (median price, days on market, list-to-sale ratio, active inventory)
  - Compact agent bio + headshot (bottom of right column)
• Bottom footer: Agent contact details + disclaimer + brokerage logo
• Accent elements: Brand color rule under header, thin rules between sections`,
    assets: `• Current month market data (median price, days on market, list-to-sale ratio, active listings, sold volume)
• Prior month or year-ago comparison data for context
• Market area name (suburb, city, or defined farm area)
• 80–120 word market commentary (written in your own voice — buyers/sellers read for perspective, not data alone)
• Agent headshot (min 400×400px, clean background)
• Agent name, phone, email, website
• Brokerage logo + optional disclaimer text`,
    copyBlocks: [
      {
        label: 'Report Title / Header',
        copy: `The State of the [Market Area] Market · [Month Year]`
      },
      {
        label: 'Market Commentary (replace figures in brackets)',
        copy: `[Month] saw [X] properties transact across [Market Area], with a median sale price of $[X] — representing a [X]% [increase/decrease] from the same period last year. Days on market [shortened/extended] to an average of [X] days, reflecting a market that continues to favour [buyers/sellers]. For homeowners considering a sale in the next [90/180] days, the current environment presents [a meaningful opportunity / a period of considered strategy].`
      },
      {
        label: '"Key Metrics" Table Labels',
        copy: `Median Sale Price | Days on Market | List-to-Sale Ratio | Active Listings`
      },
      {
        label: 'Report Footer Disclaimer',
        copy: `Data sourced from [MLS/Source Name] for [Market Area] for the period [Date Range]. Information is deemed reliable but not guaranteed. For a personalised market appraisal, contact [Agent Name] directly.`
      },
      {
        label: 'Social Media Caption (share the report page)',
        copy: `The [Month] [Market Area] Market Report is here. [X] sales. Median price: $[X]. What it means if you are thinking of selling: [one-sentence insight]. Full report in your inbox — or DM me to get on the list.`
      }
    ],
    primaryHeadline: 'The State of the Luxury Market',
    altHeadlines: [
      'The Neighborhood Edit: [Market Area] — [Month Year]',
      'Market Intelligence for [Market Area] Homeowners',
      'What the Market Is Telling Us This Month',
      'Your Monthly Window into [Market Area] Real Estate',
      'Informed Decisions Begin with Informed Agents'
    ],
    ctaExamples: [
      'Email to your database on the first Tuesday of every month — consistent cadence builds authority.',
      'Post page 1 as a LinkedIn document (upload as PDF) for professional reach.',
      'Send as a printed insert to your geographic farm area (500–1000 homes) once per quarter.',
      'Share a cropped version of the key stats callout box as an Instagram story.',
      'Offer a "get the monthly report" email opt-in on your website — use this as the lead magnet.'
    ],
    customizationNotes: [
      'Update all market data figures every month before distribution. A report with outdated data destroys credibility faster than not sending one at all.',
      'The commentary paragraph is the most important differentiator — write it in your voice, not as a data dump. Sellers want interpretation, not just numbers.',
      'Keep the design locked after your first branded version. Consistency month-over-month reinforces brand recognition.',
      'The "Key Metrics" table should have no more than 4–5 rows. More data = less readability.',
      'Print version: 100gsm silk. Digital version: compress to under 2MB for email deliverability.',
      'Include your phone number in at least 2 places — sellers who are ready to move act quickly.'
    ],
    exportFormat: `PDF at 150 DPI for email distribution (target under 2MB file size)
PDF/X-1a at 300 DPI for print distribution to your farm area
PNG at 1080×1350px (cropped to key stats section) for Instagram feed post`,
    qcChecklist: [
      ['All market data figures are current for the correct reporting month', '☐'],
      ['Commentary paragraph is written in first person, specific to this market area', '☐'],
      ['Month and year are updated in the header and all date references', '☐'],
      ['Agent contact details (phone, email, website) are accurate and clickable in PDF version', '☐'],
      ['Disclaimer text is present in the footer', '☐'],
      ['Key Metrics table has no more than 5 rows', '☐'],
      ['PDF file size is under 2MB for email distribution', '☐'],
      ['Brokerage logo is the correct, current version', '☐'],
    ]
  },

  'Agent Bio & Credentials Page': {
    internalName: 'agent-bio-credentials',
    bestUseCase: 'A standalone agent biography and credentials page included in listing presentations, buyer packages, and sent as a pre-appointment introduction.',
    buyerScenario: 'A seller is evaluating you against two other agents. They have your bio page in front of them before the meeting. This page must signal authority, trust, and relevance to their specific situation — without sounding like a resume.',
    layout: `Single A4 / US Letter portrait page
• Left column (35%): Professional headshot — top-third, full column width, slight overlap with white area
  - Below headshot: Name (24pt display serif) + title (12pt sans-serif) + brokerage
  - Below title: 3 credential badges in a row (award icons, certifications, or designations)
  - Contact block: phone, email, website
• Right column (65%): White background, generous left padding
  - Section header: "A Note on Representation" or custom heading (18pt serif)
  - Bio paragraph: 120–160 words
  - "Career Highlights" section: 4–5 bullet statistics
  - Client testimonial pull quote (italics, accent color rule on left side)
• Footer: Brokerage logo + tagline + optional regulatory text`,
    assets: `• Professional headshot (min 1200×1600px portrait, clean or editorial background)
• Agent full name and title exactly as it should appear
• Brokerage name and logo
• Bio paragraph (120–160 words, written in third person)
• 4–5 specific career statistics (e.g. "98.4% average list-to-sale ratio over 5 years", "$[X]M in closed volume in [year]", "[X] transactions completed")
• Designations and certifications (ABR, CRS, SRES, etc.)
• 1 strong client testimonial (40–60 words, attributed with first name and property type)
• Agent contact: direct phone, email, website`,
    copyBlocks: [
      {
        label: 'Bio Opening Line (replace italicised prompts)',
        copy: `[Agent Name] is a [market area] real estate specialist with [X] years of experience representing buyers and sellers across [suburb/area list]. Known for [distinctive quality, e.g. "a measured, research-driven approach to pricing"] and [second quality, e.g. "an uncompromising commitment to client outcomes"], [he/she/they] has built a practice grounded in long-term relationships and consistent results.`
      },
      {
        label: 'Career Highlights Label',
        copy: `A Record That Speaks`
      },
      {
        label: 'Career Statistics (example format)',
        copy: `• $[X]M in residential sales volume in [Year]
• [X]% average list-to-sale ratio — market average: [X]%
• [X] transactions completed across [area] since [Year]
• Recognised by [Award Name] — [Year]
• [Designation/Certification] · [Designation/Certification]`
      },
      {
        label: 'Testimonial Pull Quote',
        copy: `"[Agent Name] handled every detail of our sale with a level of professionalism we have never experienced with a real estate agent. We achieved [outcome, e.g. 'a sale price 12% above our reserve'] and felt genuinely supported throughout." — [First Name], [Property Type, e.g. "Vendor, Double Bay"]`
      },
      {
        label: 'Page Section Header',
        copy: `A Note on Representation`
      }
    ],
    primaryHeadline: 'A Note on Representation',
    altHeadlines: [
      'Trusted. Measured. Proven.',
      'Experience You Can Verify',
      'What You Should Know Before You Choose Your Agent',
      'The Professional Standard in [Market Area]',
      'A Record That Speaks'
    ],
    ctaExamples: [
      'Include in every listing presentation as page 2 — after the cover, before the marketing plan.',
      'Email as a standalone PDF to a new seller lead 24 hours after your first conversation.',
      'Include in your buyer welcome package alongside the buyer questionnaire.',
      'Post to LinkedIn as a pinned document — professional network visibility.',
      'Laminate and include in a physical "premium agent kit" left with sellers after appointments.'
    ],
    customizationNotes: [
      'The headshot is the single most important element of this page. A low-quality headshot negates everything else. If yours is more than 2 years old, get a new one.',
      'Bio should be 120–160 words maximum. Sellers do not read long bios. Every word must earn its place.',
      'All statistics in "Career Highlights" must be real and defensible. Do not inflate numbers.',
      'The testimonial pull quote should be about an outcome — not "great to work with." Sellers want proof of results.',
      'Credentials and designations: list only those directly relevant to residential real estate. A crowded badge section looks unpolished.',
      'Third-person bio reads more authoritatively than first person on a credentials page. "Jane Smith is a..." vs "I am a..."'
    ],
    exportFormat: `PDF at 150 DPI for email distribution and digital presentation
PDF/X-1a at 300 DPI for professional print (included in printed listing kit)
PNG at 1080×1350px for LinkedIn document post`,
    qcChecklist: [
      ['Headshot is current (within 2 years) and professionally photographed', '☐'],
      ['Bio is 120–160 words — not longer', '☐'],
      ['All career statistics are accurate and verifiable', '☐'],
      ['Testimonial includes a specific outcome, not just a sentiment', '☐'],
      ['Agent contact details are current and correct', '☐'],
      ['Third-person voice used consistently throughout bio', '☐'],
      ['Brokerage logo is the correct current version', '☐'],
      ['No [BRACKET] placeholder fields remain in the final file', '☐'],
    ]
  },

  'Open House Invitation Flyer': {
    internalName: 'open-house-invitation',
    bestUseCase: 'A print-ready and digital open house announcement distributed to the neighborhood, sent to your buyer database, and posted across social media 5–7 days before the event.',
    buyerScenario: 'You have an open house this weekend and want it to feel like an invitation to an event — not a standard real estate flyer. High-net-worth buyers notice the difference.',
    layout: `Single A5 (148×210mm) or A4 portrait flyer
• Top third: "You Are Cordially Invited" in display serif (36pt), centered
• Beneath: Property address in clean sans-serif (16pt, dark)
• Middle section: Feature property photograph — full width, 200px height
• Event details block (centered, generous whitespace):
  - Open: [Day, Date] | [Time Range]
  - Address: [Full street address]
  - Agent: [Agent Name] · [Phone]
• Thin accent rule above and below event details block
• Bottom: Brokerage logo (centered) + agent website
• QR code: Bottom-right corner, links to online listing
• Paper stock note: Print on 170gsm gloss for letterbox distribution`,
    assets: `• Property exterior photograph (min 1920×1080px, exterior in good light)
• Open house date (Day, Month Date — e.g. Saturday, 14 June)
• Open house time range (e.g. 10:00am – 11:30am)
• Full street address of the property
• Agent name and direct phone number
• Brokerage logo
• QR code linking to the online listing or agent website
• Optional: Brief property teaser (1 sentence, max 20 words)`,
    copyBlocks: [
      {
        label: 'Primary Invitation Headline',
        copy: `You Are Cordially Invited`
      },
      {
        label: 'Teaser Line (beneath headline, before property image)',
        copy: `An exceptional [property type] in [suburb name], presented for your consideration.`
      },
      {
        label: 'Event Details Block',
        copy: `Open for Inspection
[Day], [Date] · [Start Time] – [End Time]
[Full Property Address]
[Agent Name] · [Direct Phone]`
      },
      {
        label: 'Email Subject Line (for email distribution)',
        copy: `You're invited — Open Inspection: [Property Address], [Day] [Date]`
      },
      {
        label: 'Social Media Caption (Instagram/Facebook)',
        copy: `You are cordially invited to inspect [Property Address] this [Day].
[Day], [Date] · [Time]
An exceptional [property type] in [suburb]. [One-sentence lifestyle descriptor].
[Agent Name] · [Brokerage] · [Phone]
[Link in bio] or DM to register your interest.`
      }
    ],
    primaryHeadline: 'You Are Cordially Invited',
    altHeadlines: [
      'Coming Soon — Open for Inspection',
      'A Private Showing Awaits',
      'An Exceptional Home. An Open Door.',
      'The Neighborhood Edit: Open This Weekend',
      'Presented for Your Consideration'
    ],
    ctaExamples: [
      'Letterbox drop to 200 homes within 500m of the property 5 days before the open house.',
      'Email to your buyer database with "You are cordially invited" as the subject line.',
      'Post to Instagram 3 days before the open — pin to your story highlights.',
      'Print A5 size on 170gsm gloss for physical distribution.',
      'Text or WhatsApp the digital version (PNG) to registered buyers on your database.'
    ],
    customizationNotes: [
      '"You Are Cordially Invited" is the headline — do not change it to "OPEN HOME" or any generic equivalent. The tone is intentional.',
      'The property photograph must be exterior and taken in good light. An interior shot on a flyer confuses recipients who cannot identify the address from the street.',
      'Time format should match your local convention (e.g. 10:00am vs 10:00 AM). Be consistent throughout.',
      'The QR code must be tested on multiple devices before printing. A non-functional QR code on a printed flyer is a missed opportunity.',
      'Keep the design uncluttered — this is an invitation, not a brochure. Details go in the brochure. The flyer gets attention and drives attendance.',
      'For letterbox drops, laminate or use a 170gsm+ stock to ensure the flyer survives weather and handling.'
    ],
    exportFormat: `PDF/X-1a at 300 DPI with 3mm bleed for professional print (letterbox distribution)
PDF at 150 DPI for digital email distribution
PNG at 1080×1350px (portrait crop) for Instagram feed
PNG at 1080×1080px (square crop) for Facebook event cover`,
    qcChecklist: [
      ['Open house date and time are accurate and verified with the seller', '☐'],
      ['Full street address is correct — including suburb/city and postcode', '☐'],
      ['Agent phone number is the direct mobile — not a general office line', '☐'],
      ['QR code tested and links to the correct listing URL', '☐'],
      ['Property photograph is exterior, taken in good light, no visible date stamp', '☐'],
      ['Print version has 3mm bleed on all sides', '☐'],
      ['No [BRACKET] fields remain in the final export', '☐'],
      ['File named: [AgentLastName]_OpenHouse_[PropertyAddress]_[Date]', '☐'],
    ]
  },

  'Private Showing Follow-Up Card': {
    internalName: 'private-showing-follow-up',
    bestUseCase: 'A personalised follow-up sent to buyers within 4 hours of a private showing — thanking them for their time, restating the key selling points, and inviting next steps.',
    buyerScenario: 'You showed a $2M property to a qualified buyer couple this morning. They are also inspecting two competitor properties this week. A follow-up card that arrives in their inbox within 4 hours keeps your listing top-of-mind and demonstrates the kind of service they can expect if they buy through you.',
    layout: `Single-page landscape card layout (A5 landscape or 148×105mm)
• Left panel (40%): Brand-colored background
  - "A Note of Thanks" in 24pt display serif, white, centered
  - Thin white rule below
  - Property address in 11pt sans-serif, white, 70% opacity
• Right panel (60%): White background
  - Salutation: "Dear [First Name]," — 11pt serif
  - Body paragraph: 60–80 words
  - 3 property highlight bullet points (specific, not generic)
  - Next-step CTA sentence
  - Agent signature block: Name, title, phone, email
  - Brokerage logo (bottom-right, 60px)`,
    assets: `• Buyer first name(s) exactly as they introduced themselves
• Property address being followed up on
• 3 specific property highlights from the showing (features the buyers commented on positively)
• Date and time of the showing
• Agent name, title, direct phone, and email
• Brokerage logo`,
    copyBlocks: [
      {
        label: 'Card Headline (Left Panel)',
        copy: `A Note of Thanks`
      },
      {
        label: 'Body Paragraph (customise the bracketed elements)',
        copy: `Dear [First Name],

Thank you for taking the time to inspect [Property Address] today. It was a genuine pleasure to show you through the property, and I hope it gave you a clear sense of the lifestyle it offers.

As you consider your options, I wanted to highlight three elements that distinguish this particular home: [highlight 1], [highlight 2], and [highlight 3]. These are rarely found together at this price point in [suburb name].

I am happy to arrange a second showing, provide further documentation, or answer any questions — at any time that suits you.`
      },
      {
        label: 'Next Step CTA Line',
        copy: `I look forward to hearing your thoughts. Please do not hesitate to call me directly on [phone number].`
      },
      {
        label: 'Signature Block',
        copy: `With regards,
[Agent Name]
[Title] · [Brokerage Name]
[Direct Phone] · [Email Address]`
      },
      {
        label: 'Property Highlight Bullets (example format)',
        copy: `• Northerly aspect flooding the living areas with natural light throughout the day
• Rare double lock-up garage in a suburb where off-street parking is increasingly scarce
• Recent kitchen renovation with [brand] appliances — nothing to spend before moving in`
      }
    ],
    primaryHeadline: 'A Note of Thanks',
    altHeadlines: [
      'It Was a Pleasure to Show You Through',
      'Following Up on [Property Address]',
      'A Few Things Worth Remembering About [Address]',
      'After Your Inspection This Morning',
      'For Your Consideration'
    ],
    ctaExamples: [
      'Send as a PDF attachment via email within 4 hours of the showing — every hour of delay reduces impact.',
      'Print and post (physical mail) to buyers who prefer traditional correspondence — this is unexpected and memorable.',
      'Use as a template for every single showing — consistency builds a reputation for exceptional service.',
      'Personalise the 3 property highlights based on what the buyer actually commented on during the showing.',
      'Include a one-page property fact sheet as a second attachment for buyers who want specifications.'
    ],
    customizationNotes: [
      'The 3 property highlights must be specific to what the buyers said during the showing — not generic features from the listing. Listen during the showing and note what they respond to.',
      '"A Note of Thanks" is the intended headline. It positions you as considerate and measured — qualities that build trust with high-net-worth buyers.',
      'Body copy should be 60–80 words maximum. Buyers who just saw the property do not want to re-read the listing. This is a relationship touch, not a sales pitch.',
      'Send within 4 hours of the showing. The same evening is acceptable. The next morning is too late.',
      'If the buyers have a buyer\'s agent, send a separate copy directly to the agent as a professional courtesy.',
      'Physical mailed version (postcard format): print on 350gsm for a premium physical feel.'
    ],
    exportFormat: `PDF at 150 DPI for email delivery (attach to follow-up email)
PDF/X-1a at 300 DPI for professional print (A5 landscape, 350gsm card stock)
PNG at 1200×850px for digital sharing via messaging apps`,
    qcChecklist: [
      ['Buyer first name(s) are spelled correctly and match how they introduced themselves', '☐'],
      ['Property address is correct', '☐'],
      ['3 property highlights are specific to this property — not generic listing copy', '☐'],
      ['Agent direct phone number is the mobile number buyers can actually call', '☐'],
      ['Sent within 4 hours of the showing — not the following day', '☐'],
      ['Body copy is under 80 words', '☐'],
      ['No [BRACKET] placeholder fields remain in the final version', '☐'],
      ['Brokerage logo is current and correctly positioned', '☐'],
    ]
  },

  'Just Listed / Just Sold Announcement': {
    internalName: 'just-listed-just-sold',
    bestUseCase: 'A neighborhood announcement flyer and social media asset distributed when a property goes live or sells — used to generate new listing leads from nearby homeowners.',
    buyerScenario: 'You just listed or sold a property. Every homeowner within 1km is now wondering what their own home is worth. This announcement is your proof of activity and your invitation for them to call.',
    layout: `Single A5 or A4 portrait flyer
• Top strip: "JUST LISTED" or "JUST SOLD" badge in brand accent color (white text, full-width)
• Center: Property photograph — full width, 250px height
• Key details block (centered):
  - Price (if sold) or "Enquire for Price" / guide range (if listed)
  - Bedrooms · Bathrooms · Parking (icon + number format)
  - Property address in 14pt sans-serif
• Agent block (bottom third):
  - Headline: "Thinking of selling in [suburb]? Let's talk."
  - Agent name, photo, direct phone
  - Brokerage logo
• QR code: links to agent website or dedicated landing page`,
    assets: `• "Just Listed" or "Just Sold" designation
• Property exterior photograph (min 1920×1080px)
• Sale price or listing price (if publicly marketed)
• Bedroom, bathroom, and parking count
• Full property address
• Agent headshot (min 400×400px)
• Agent direct phone and website
• QR code`,
    copyBlocks: [
      {
        label: 'Just Listed Announcement Copy',
        copy: `JUST LISTED
[Property Address]
[Bedrooms] bed · [Bathrooms] bath · [Parking] parking
Guide: $[Price range]
Open: [Day], [Date] · [Time]
[Agent Name] · [Direct Phone]
[Brokerage Name]`
      },
      {
        label: 'Just Sold Announcement Copy',
        copy: `JUST SOLD
[Property Address] has found its new owner.
Sold for $[Price] — [X]% above the guide.
If you are considering a sale in [suburb], now is an excellent time to understand what your property is worth.
[Agent Name] · [Direct Phone]
[Brokerage Name]`
      },
      {
        label: 'Lead Generation Headline',
        copy: `Thinking of selling in [Suburb Name]? Let's talk.`
      },
      {
        label: 'Social Media Caption (Just Sold)',
        copy: `JUST SOLD: [Property Address].
$[Sale Price] · [X]% above the asking guide.
In a market where every decision matters, results like this don't happen by chance.
Thinking of selling in [suburb]? Let's have a conversation.
[Agent Name] · [Phone] · [Brokerage]`
      },
      {
        label: 'Letterbox Drop Cover Note (handwritten-style font)',
        copy: `Dear Neighbour,
I am delighted to share that [Address] has recently [listed / sold]. If you have ever been curious about the value of your own home, I would be happy to provide a confidential, no-obligation appraisal at a time that suits you.
[Agent Name] · [Direct Phone]`
      }
    ],
    primaryHeadline: 'Just Sold. What Does This Mean for Your Home?',
    altHeadlines: [
      'The Neighborhood Edit: A New Chapter for [Address]',
      'Coming Soon to [Suburb Name]',
      'Another Successful Sale in [Suburb Name]',
      'Proof of Performance in [Suburb Name]',
      'Your Neighbour Just Made a Smart Decision'
    ],
    ctaExamples: [
      'Letterbox drop to 300 homes within 500m of the sold/listed property the same day as announcement.',
      'Post on Instagram with "JUST SOLD" overlay on the property photograph.',
      'Email to your geographic farm area database — subject line: "Another [suburb] result from [Agent Name]."',
      'Post on LinkedIn with a brief commentary on what the sale means for the local market.',
      'Leave printed copies at the local café, real estate window, or community board.'
    ],
    customizationNotes: [
      'For Just Sold: always include the sale price if it is publicly recordable. Transparency builds credibility with other potential sellers.',
      'For Just Listed: include the open house time if there is one — the flyer drives attendance.',
      '"Thinking of selling in [suburb]? Let\'s talk." is the most important line on the page. Make it prominent.',
      'The agent headshot builds familiarity in the neighborhood — use the same photo across all neighborhood distribution materials.',
      'Include a QR code linking to a free appraisal request page for the highest conversion rate from print distribution.',
      'Delivered on the same day as the listing or settlement achieves the strongest impact — do not delay.'
    ],
    exportFormat: `PDF/X-1a at 300 DPI with 3mm bleed for letterbox print distribution
PNG at 1080×1350px for Instagram feed
PNG at 1080×1080px for Facebook and LinkedIn
PDF at 150 DPI for email distribution to your database`,
    qcChecklist: [
      ['"Just Listed" or "Just Sold" designation is correct — not both on the same flyer', '☐'],
      ['Property address is accurate including suburb and postcode', '☐'],
      ['Sale price (if sold) or price guide (if listed) is correct and approved for publication', '☐'],
      ['Bedroom / bathroom / parking counts are correct', '☐'],
      ['Agent phone number is the direct mobile', '☐'],
      ['QR code tested on multiple devices before printing', '☐'],
      ['Print version has 3mm bleed on all sides', '☐'],
      ['Distributed within 24 hours of listing launch or settlement', '☐'],
    ]
  },

  'Social Media Property Teaser': {
    internalName: 'social-media-property-teaser',
    bestUseCase: 'A branded social media graphic published 48–72 hours before a listing goes live — building anticipation and generating enquiries before the public campaign begins.',
    buyerScenario: 'You are launching a premium listing on Friday. You want to generate pre-launch buyer enquiries and make the seller feel like a VIP with a pre-marketing campaign.',
    layout: `Square format (1080×1080px) — optimised for Instagram feed and Stories
• Background: Property exterior photograph or interior hero shot, with a 40% dark overlay
• Center text block:
  - "Coming Soon" in 48pt display serif, white, centered
  - Property suburb (or address if seller approves) in 14pt sans-serif, white
  - "Register your interest" CTA line in 11pt, light
• Bottom left: Agent name + brokerage logo (small, non-intrusive)
• Bottom right: Swipe-up arrow or "DM to enquire" in 10pt
• Optional: Thin accent color rule at top and bottom edges`,
    assets: `• 1 hero property photograph — exterior preferred for teaser (min 1080×1080px square crop available)
• Property suburb (full address only if seller approves pre-launch)
• Headline text (e.g. "Coming Soon" — confirmed with seller)
• Agent name and brokerage
• Contact method for enquiries (DM, phone, or email)`,
    copyBlocks: [
      {
        label: 'Teaser Headline Options',
        copy: `Coming Soon
The Neighborhood Edit: [Suburb Name]
Something Exceptional Is Coming to [Suburb Name]
A Rare Offering`
      },
      {
        label: 'Caption Copy (Instagram / Facebook)',
        copy: `Coming soon to [suburb name].

Before this one hits the market, I want to give my network first access.

[Brief one-sentence property tease — e.g. "A north-facing [property type] with [key feature], positioned in one of [suburb]'s most sought-after streets."]

Register your interest below or DM me directly.
[Agent Name] · [Direct Phone] · [Brokerage]`
      },
      {
        label: 'Stories Text Overlay',
        copy: `COMING SOON 👀
[Suburb Name]
Swipe up to register your interest`
      },
      {
        label: 'Email to Buyer Database',
        copy: `Subject: Coming Soon — [Suburb Name] | Pre-Market Access

Dear [First Name],

Before this property reaches the open market, I wanted to give you first consideration.

[One-sentence property description without the full address if not approved for pre-release.]

If this sounds like it could be the right fit, I would be delighted to arrange a private preview before the public campaign begins.

[Agent Name] · [Direct Phone]`
      },
      {
        label: 'LinkedIn Caption',
        copy: `Coming soon: a property in [suburb] that I believe will attract significant buyer interest.

Before the public campaign opens, I am offering private previews to qualified buyers.

If you or someone you know is actively looking in [suburb], I would welcome a conversation.

[Agent Name] · [Brokerage] · [Phone]`
      }
    ],
    primaryHeadline: 'Coming Soon',
    altHeadlines: [
      'The Neighborhood Edit: Coming to [Suburb Name]',
      'Something Exceptional Arrives in [Suburb Name]',
      'Pre-Market: First Access for Qualified Buyers',
      'A Rare Offering — Available Before the Market Knows',
      'Register Your Interest Before This Lists Publicly'
    ],
    ctaExamples: [
      'Post the square graphic to your Instagram feed 72 hours before the official listing launch.',
      'Add to your Instagram Stories with a link sticker to a registration landing page.',
      'Email to your buyer database segmented by suburb interest or price range.',
      'Post to Facebook with the caption — boost to a 5km radius audience for $15–30.',
      'Message directly to 10–15 qualified buyers in your database who match the property profile.'
    ],
    customizationNotes: [
      'Always confirm with the seller that they approve pre-marketing before publishing. Some sellers prefer a simultaneous launch.',
      '"Coming Soon" is the strongest teaser headline — keep it simple. Overexplaining reduces intrigue.',
      'The photograph must be high quality. A poor photo on a teaser post communicates low quality before buyers even see the listing.',
      'Do not include the full property address on pre-launch social posts unless the seller explicitly approves it.',
      'The caption should be brief — one sentence about the property, one sentence about what to do next. No more.',
      'Monitor DMs and comments closely within 24 hours of posting — buyer interest at the teaser stage is high intent.'
    ],
    exportFormat: `PNG at 1080×1080px for Instagram feed and Facebook
PNG at 1080×1920px (Stories format) for Instagram/Facebook Stories
PNG at 1200×628px for LinkedIn and email header image`,
    qcChecklist: [
      ['Seller has approved the pre-marketing campaign and the content of this post', '☐'],
      ['Property address omitted or approved for inclusion — confirmed with seller', '☐'],
      ['Hero photograph is high-resolution and represents the property positively', '☐'],
      ['Dark overlay provides sufficient contrast for white text legibility', '☐'],
      ['Agent contact method (DM / phone) is clearly stated', '☐'],
      ['Caption is brief — one property sentence + one CTA sentence', '☐'],
      ['Instagram Stories version has a link sticker or swipe-up CTA set up', '☐'],
      ['Post scheduled to publish 48–72 hours before official listing launch', '☐'],
    ]
  },

  'Buyer Lifestyle Guide Page': {
    internalName: 'buyer-lifestyle-guide',
    bestUseCase: 'A single page included in a buyer welcome package or listing brochure that describes the lifestyle associated with owning this specific property — written for the emotional buyer, not the analytical one.',
    buyerScenario: 'A buyer is comparing two properties at a similar price point. The difference is not the property — it is the story you tell about what life looks like here. This page makes your listing feel like a home, not an asset.',
    layout: `Single A4 portrait page
• Top third: Lifestyle hero photograph — full bleed (an aspirational interior or lifestyle scene from or near the property)
• Center content block (on white):
  - Section header: "The Life This Home Makes Possible" (20pt display serif)
  - Lifestyle narrative: 120–180 words in 3 short paragraphs
  - 3 lifestyle vignettes (one-line descriptors below a subtle horizontal rule)
• Bottom third: Supporting lifestyle image (smaller, right-aligned, oval or rounded crop)
  + Neighborhood at-a-glance: 5 nearby amenities with distances
• Footer: Property address + agent name + brokerage logo`,
    assets: `• 2 lifestyle photographs (hero image + supporting image — interior scenes, nearby café, park, or coastal walk)
• Lifestyle narrative written for the specific property and neighborhood (120–180 words)
• 3 lifestyle vignettes (one sentence each, e.g. "Morning coffee on the terrace while the city wakes.")
• 5 nearby amenities with walking or driving distances (e.g. "Centennial Park — 8 min walk")
• Property address
• Agent name and brokerage`,
    copyBlocks: [
      {
        label: 'Section Header',
        copy: `The Life This Home Makes Possible`
      },
      {
        label: 'Lifestyle Narrative Opening (customise suburb and property details)',
        copy: `There are homes that you buy, and then there are homes that change the texture of your days. [Property Address] belongs to the second category.

Set in the heart of [suburb name], this is a life defined by [lifestyle quality 1 — e.g. "effortless access to the city's finest dining and retail"] and [lifestyle quality 2 — e.g. "the kind of quiet that only comes with a north-facing aspect and mature garden privacy"].

For those who have spent years looking for a home that genuinely supports the way they want to live, this is a rare arrival.`
      },
      {
        label: '3 Lifestyle Vignettes (one per line)',
        copy: `Morning coffee on the terrace while the garden comes to life.
An evening walk to [local café/restaurant] — three minutes from the front door.
Weekend mornings at [local market or park] — [X] minutes on foot.`
      },
      {
        label: 'Neighborhood At-a-Glance Labels',
        copy: `[Café/Restaurant Name] — [X] min walk
[Park/Reserve Name] — [X] min walk
[Train Station / Bus Stop] — [X] min walk
[Supermarket/Grocer] — [X] min drive
[School Name] — [X] min drive`
      },
      {
        label: 'Closing Line',
        copy: `This is not just a property. It is a life you have been building toward.`
      }
    ],
    primaryHeadline: 'The Life This Home Makes Possible',
    altHeadlines: [
      'Where Every Detail Was Considered for How You Actually Live',
      'A Life Curated — [Suburb Name]',
      'The Neighborhood Edit: Life at [Property Address]',
      'For Those Who Live Deliberately',
      'A Home That Grows With You'
    ],
    ctaExamples: [
      'Include as the final page of your 4-page property brochure — it\'s the emotional close after the specifications.',
      'Send as a standalone PDF to buyers who inspected but have not yet made an offer — it keeps them emotionally connected.',
      'Post the lifestyle narrative as a LinkedIn article for authority content, referencing the suburb without naming the address.',
      'Read the lifestyle narrative aloud during private showings — it reframes how buyers experience the space.',
      'Use as the basis for an Instagram caption series: 1 vignette per post in the 3 days before the auction.'
    ],
    customizationNotes: [
      'The lifestyle narrative must be specific to this property and neighborhood — not a reused template from a previous listing. Buyers notice.',
      'Lifestyle vignettes work best when they are sensory — morning light, the sound of the garden, the smell of the café down the road.',
      'Nearby amenity distances must be accurate. Use Google Maps walking distance. Inaccurate distances are an immediate trust killer.',
      'The hero photograph should not be a standard real estate shot. An aspirational interior scene — a beautifully set breakfast table, morning light through sheers — works better here.',
      'Do not mention price, bedrooms, or specifications on this page. This is an emotional page. The specifications live in the brochure.',
      'Write in the second person if possible ("your morning", "your terrace") to create ownership psychology before the sale.'
    ],
    exportFormat: `PDF at 150 DPI for email and digital delivery
PDF/X-1a at 300 DPI for print inclusion in physical property brochure
PNG at 1080×1350px for Instagram feed (lifestyle content series)`,
    qcChecklist: [
      ['Lifestyle narrative is specific to this property and suburb — not recycled from a previous listing', '☐'],
      ['All nearby amenity distances verified via Google Maps walking distance', '☐'],
      ['Lifestyle photographs are aspirational, high-resolution, and relevant to the property', '☐'],
      ['No specifications (bedrooms, bathrooms, price) appear on this page', '☐'],
      ['Lifestyle vignettes are sensory and specific — not generic descriptions', '☐'],
      ['Property address in footer is correct', '☐'],
      ['No [BRACKET] placeholder fields remain in the final version', '☐'],
      ['Page reads as a story, not a sales document — test by reading aloud', '☐'],
    ]
  },
};

// ── Generic template definitions for non-RE niches ────────────────────────────
// RULE 2: Each template at each index position must have a UNIQUE layout, purpose, and copy.
// RULE 4: Copy must be niche-specific — never generic business filler.
// RULE 6: Every visual product must specify exact visual assets and mockup requirements.
const GENERIC_LAYOUT_VARIANTS = [
  // Index 0 — Cover / Hero presentation
  {
    layoutType: 'cover',
    layout: (useCase, niche) => `Full-bleed cover layout (A4 portrait / US Letter — 210×297mm)
• Top 65%: Hero image zone — full bleed, no border, minimum 2400×1600px
• Bottom 35%: Deep brand-color panel (#1A1A1A or your darkest brand tone)
• Main headline: Display serif font (Lora, Playfair Display, or Merriweather), 38–48pt, white, left-aligned, 40px left margin
• Subheadline: 14pt sans-serif, white at 65% opacity, immediately below headline
• Logo: Bottom-right corner, white version, max 110px wide
• Accent rule: 2px brand primary color separating image from dark panel
• Client/project name (optional): Bottom-left, 10pt sans-serif, white at 80% opacity`,
    assets: (useCase, niche) => `• Hero image — minimum 2400×1600px, professionally shot, high contrast
• Your logo — SVG or PNG with transparent background, white/light version for dark backgrounds
• Brand primary hex code + accent hex code
• Headline text (use the copy blocks below — do not use placeholder text)
• Client or project name (if applicable)
• Your name/business name for the bottom attribution line`,
    exportFormat: `PDF/X-1a at 300 DPI — for print delivery and client-facing presentations
PNG at 150 DPI — for digital sharing via email or messaging
JPEG at 1920×1200px — for social media preview`,
  },
  // Index 1 — Two-column document / report
  {
    layoutType: 'report',
    layout: (useCase, niche) => `Two-column report layout (A4 portrait)
• Full-width header band (40px height): Brand primary color, white text — title + date + brand name
• Left column (62% width): Primary content zone
  - Section headers: 16pt serif, brand accent color underline rule (1px)
  - Body text: 10pt sans-serif, 1.6 line height, dark charcoal (#2C2C2C)
  - Data callout boxes: Accent-color background, stat number (28pt bold) + label (9pt)
• Right column (38% width): Light grey background (#F5F4F2)
  - Key stats at a glance: 4–5 metrics in clean list format
  - Visual accent: thin vertical brand-color rule on the right column's left edge
• Footer: Full-width, light border top — Logo (left) + page number (center) + contact (right)`,
    assets: (useCase, niche) => `• Data or statistics to populate the left-column callout boxes (specific numbers, not placeholders)
• 4–5 key metrics for the right-column summary (must be real figures relevant to ${niche})
• Brand primary color hex + secondary/accent color hex
• Logo (color version for light backgrounds)
• Your contact details: phone, email, website`,
    exportFormat: `PDF at 150 DPI — email distribution (keep under 2MB)
PDF/X-1a at 300 DPI — professional print on 100gsm silk
PNG at 1080×1350px — social media (crop to header + stats section)`,
  },
  // Index 2 — Single-page tracker / planner
  {
    layoutType: 'tracker',
    layout: (useCase, niche) => `Grid/tracker layout (A4 portrait or landscape depending on column count)
• Header block (full width, 50px): Brand color background, white title (18pt bold), date range
• Column headers row: Dark charcoal background (#1A1A1A), white text (9pt, uppercase, 0.5 tracking)
• Data rows: Alternating white and off-white (#FAFAF9), 32px row height
• Totals / summary row at bottom: Brand accent-color background, bold text
• Left-side row labels: 10pt semi-bold, dark charcoal
• Footer: Thin brand-accent top rule + brand name/logo (right-aligned)
• Notes section: 3 ruled lines at page bottom with "Notes:" label in brand color`,
    assets: (useCase, niche) => `• Column header labels for your specific ${niche} use case (do not leave generic)
• Row categories/labels specific to what you are tracking in ${niche}
• Brand colors: 2 maximum for clean readability
• Logo for footer (small, 60px max)
• Timeframe or date range to populate the header`,
    exportFormat: `PDF (with interactive fillable fields if using Adobe Acrobat) — for digital completion
PDF at 300 DPI — for print on 80gsm standard paper or 100gsm for premium feel
PNG at 1080×1350px — for showing the template on social media`,
  },
  // Index 3 — Visual flyer / announcement
  {
    layoutType: 'flyer',
    layout: (useCase, niche) => `Visual-first single-page flyer (A5 portrait — 148×210mm — or square 1080×1080px)
• Top third: Bold announcement headline — 48pt+ display font, centered, brand primary color
• Middle: Hero image or graphic — full-width, 200px height, with subtle brand-color overlay
• Event/offer details block (centered, 24px top/bottom padding):
  - Primary detail line: 16pt bold, dark charcoal
  - Secondary detail lines: 11pt sans-serif, muted grey, generous line spacing
  - Thin accent rule above and below this block
• CTA block at bottom: Brand-color background strip, white text (12pt bold), centered
• QR code: Bottom-right corner, 70×70px, white background, links to your landing page
• Footer text: Business name + website in 9pt, centered, muted`,
    assets: (useCase, niche) => `• Hero image — minimum 1920×1080px, relevant to the specific announcement or offer
• Headline text (use the completed copy block below — no placeholder headlines)
• Key details: date, time, location, price point, or offer specifics (all must be real)
• CTA text (e.g. "Book your spot →" or "Download now →")
• QR code — generate at qr.io or qr-code-generator.com, test on 3 devices before printing
• Logo for footer`,
    exportFormat: `PDF/X-1a at 300 DPI with 3mm bleed — professional print distribution
PNG at 1080×1350px — Instagram feed (portrait)
PNG at 1080×1080px — Instagram / Facebook / LinkedIn (square)
PDF at 150 DPI — email attachment`,
  },
  // Index 4 — Form / intake / questionnaire
  {
    layoutType: 'form',
    layout: (useCase, niche) => `Single-column form layout (A4 portrait)
• Header: Full-width brand-color bar (40px) with white title + logo top-right (80×40px)
• Intro paragraph zone: 40px top margin, 11pt body text, left-aligned, max 3 sentences
• Section dividers: Thin brand-accent rule + section label (8pt, uppercase, bold, 0.8 tracking)
• Short-answer fields: Underline input style (0.5pt rule), 24px height, label in 9pt above
• Multi-line fields: Bordered rectangle, 3–5 lines, rounded corners 4px
• Checkbox questions: 16×16px square check boxes, left-aligned, 11pt label text
• Signature block: Underline rule + "Signature" label (9pt) + "Date" field (right-aligned)
• Footer: Contact details centered, 8pt, brand logo bottom-right`,
    assets: (useCase, niche) => `• Form title specific to your ${niche} use case (not "Form 1" — give it a real name)
• Section labels: the actual categories of information you are collecting from ${niche} clients
• Intro paragraph text (use the copy block below — explains the purpose and what to expect)
• Your business name, phone, email, website for the footer
• Logo (color version for header, can be monochrome for footer)
• Any required legal disclaimer or confidentiality notice for your jurisdiction`,
    exportFormat: `PDF with interactive form fields (Adobe Acrobat Pro) — for digital completion and return
PDF at 300 DPI (flat) — for printing and handwritten completion
Google Form equivalent: use the field labels from this blueprint to build the digital version`,
  },
  // Index 5 — Social media content kit
  {
    layoutType: 'social',
    layout: (useCase, niche) => `Social media content template set — 3 format variants
FORMAT A: Square post (1080×1080px)
• Background: Brand primary color or high-quality lifestyle photograph with 35% dark overlay
• Center text zone: Headline (24pt bold, white) + subtext (14pt, white at 80%) centered with generous padding
• Bottom strip: 60px white strip — logo (left, 40px) + handle/website (center, 10pt) + CTA icon (right)

FORMAT B: Story/Reel cover (1080×1920px)
• Full-bleed background image or gradient
• Safe zone text (center 70% of height): Headline (36pt, white) + 2-line description + CTA button
• Top 15%: Brand logo (centered, 60px, white)
• Bottom 15%: Account handle + swipe/tap CTA text

FORMAT C: LinkedIn banner (1200×628px)
• Left 55%: Brand color panel — headline (28pt) + 2-line description + small logo
• Right 45%: High-quality image or branded graphic`,
    assets: (useCase, niche) => `• 1 high-quality lifestyle or product photograph per format (minimum 1080×1080px for square, 1080×1920px for Stories)
• Headline text — use the completed copy blocks below, do not leave generic
• Brand primary hex + secondary hex
• Logo (white version for dark backgrounds, color version for light)
• Social media handle or website URL
• CTA text specific to what you want the audience to do`,
    exportFormat: `PNG at 1080×1080px — Instagram/Facebook/LinkedIn square post
PNG at 1080×1920px — Instagram/Facebook Stories and Reels cover
PNG at 1200×628px — LinkedIn post image
PNG at 1080×1350px — Instagram portrait post (optimal reach format)`,
  },
];

function buildGenericTemplate(useCase, index, n) {
  const aud = (n.av && n.av.audiencePlural) ? n.av.audiencePlural : `${n.niche} professionals`;
  const audShort = (n.av && n.av.audienceShort) ? n.av.audienceShort : n.niche;
  const sectionBody = n.sections && n.sections[index] ? (n.sections[index].body || '') : '';
  const niche = n.niche || 'professional services';

  // RULE 2: Use index-specific layout to ensure every template is visually distinct
  const variantIndex = index % GENERIC_LAYOUT_VARIANTS.length;
  const variant = GENERIC_LAYOUT_VARIANTS[variantIndex];

  const layout = variant.layout(useCase, niche);
  const assets = variant.assets(useCase, niche);
  const exportFormat = variant.exportFormat;

  // RULE 4: Niche-specific copy — use sectionBody if available, otherwise build from niche context
  const hasSectionContent = sectionBody && sectionBody.trim().length > 80;
  const primaryCopyBlock = hasSectionContent
    ? sectionBody.trim()
    : buildNicheSpecificCopy(useCase, niche, aud, n);

  // RULE 3: All copy blocks must have zero generic placeholders in the primary content
  const ctaMap = {
    'tracker': `Open your design tool, set the column headers to match your ${niche} workflow, apply your brand colors, and save as a fillable PDF. Your clients can complete it digitally or print and return it.`,
    'form': `Share the form link with your ${niche} clients before their first session or consultation. A completed form lets you prepare properly — and signals professionalism from the first interaction.`,
    'flyer': `Export as PNG at 1080×1350px for Instagram, then export at 1080×1080px for Facebook. Post 48 hours before your event or offer closes for maximum attention.`,
    'cover': `Export as a high-resolution PDF and open the first slide in front of your ${niche} client. This cover signals the quality of everything that follows.`,
    'report': `Email to your ${niche} clients or prospects on a consistent schedule — monthly or quarterly. A branded report positions you as the authority in ${niche}.`,
    'social': `Post the square format on Instagram, the Story format 24 hours before a launch or event, and the LinkedIn banner when you publish a professional update.`,
  };
  const specificCTA = ctaMap[variant.layoutType] || `Customize in your design tool, replace all [BRACKET] fields with your real information, and export in the format matching your delivery method.`;

  return {
    internalName: useCase.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    bestUseCase: buildBestUseCase(useCase, niche, aud, variant.layoutType),
    buyerScenario: buildBuyerScenario(useCase, niche, aud, audShort, variant.layoutType, index),
    layout,
    assets,
    copyBlocks: [
      {
        label: `${useCase} — Primary Headline`,
        copy: buildNicheHeadline(useCase, niche, audShort, 0),
      },
      {
        label: `${useCase} — Main Content Block`,
        copy: primaryCopyBlock,
      },
      {
        label: `${useCase} — Secondary Headline (alternate)`,
        copy: buildNicheHeadline(useCase, niche, audShort, 1),
      },
      {
        label: `Call-to-Action`,
        copy: specificCTA,
      },
      {
        label: `Social Media Caption`,
        copy: buildSocialCaption(useCase, niche, audShort, n),
      }
    ],
    primaryHeadline: buildNicheHeadline(useCase, niche, audShort, 0),
    altHeadlines: [
      buildNicheHeadline(useCase, niche, audShort, 1),
      buildNicheHeadline(useCase, niche, audShort, 2),
      `The ${niche} ${useCase} Built for ${audShort} Who Want Results`,
      `Professional ${useCase} — Built for Real ${niche} Work`,
      `${useCase}: Designed for How ${audShort} Actually Operate`,
    ],
    ctaExamples: [
      specificCTA,
      `Build this in Canva (use the layout spec above), PowerPoint, or Adobe. The blueprint tells you exactly what to put where — your design tool is just the execution layer.`,
      `Every time you need a ${useCase.toLowerCase()}, open this blueprint first. It halves your setup time and eliminates design guesswork.`,
      `Share the exported PDF directly with your ${niche} client. A polished ${useCase.toLowerCase()} delivered within 24 hours of a meeting sets you apart from every competitor.`,
      `Once you have built the branded master version, duplicate it per client — never start from scratch again.`,
    ],
    customizationNotes: [
      `Apply your brand colors to the designated zones listed in the Layout Structure — 2 colors maximum for a professional result. More than 3 colors signals DIY.`,
      `Replace every [BRACKET] field with your real information before delivering to any client. A document with visible [BRACKETS] signals an unfinished product.`,
      `Typography: your brand headline font for all H1/H2 elements, and a clean complementary sans-serif for body text. Two font families maximum. Mixing more than two creates visual noise.`,
      `Images: every image zone must be filled with a specific, high-quality photograph at the resolution specified in the Required Assets section. 1920×1080px minimum for full-bleed zones.`,
      `Build a MASTER_BRANDED version first — with your brand applied but no client-specific data. Duplicate it per project. Never modify the original master.`,
      `Quality check at 100% zoom before exporting. Errors visible at full size are invisible at 50% zoom. Check every text field, every image crop, every color zone.`,
    ],
    exportFormat,
    qcChecklist: [
      ['Brand colors applied consistently to all designated zones — 2 colors maximum', '☐'],
      ['Zero [BRACKET] placeholder fields remain in the final export', '☐'],
      ['All images are high-resolution and specific to this use case — no generic stock', '☐'],
      ['Headline and body copy are specific to your niche, client, or campaign — not generic', '☐'],
      ['Typography: maximum 2 font families — headline font + body font only', '☐'],
      ['MASTER_BRANDED file saved separately before client-specific customization', '☐'],
      ['Exported in the correct format for the delivery method (see Export Format above)', '☐'],
      ['Reviewed at 100% zoom — all text, crops, and spacing verified before export', '☐'],
    ]
  };
}

// ── Niche-specific copy helpers (RULE 4) ──────────────────────────────────────
function buildBestUseCase(useCase, niche, aud, layoutType) {
  const useCaseLower = useCase.toLowerCase();
  if (layoutType === 'cover') return `The first visual a ${niche} client sees when you open your presentation or deliver your proposal. Sets the tone for the entire engagement.`;
  if (layoutType === 'report') return `A data-backed document delivered to ${aud} regularly — monthly or after key milestones. Positions you as the informed authority in ${niche}.`;
  if (layoutType === 'tracker') return `A working document used by ${aud} to monitor progress, capture data, or manage ongoing activity in their ${niche} workflow.`;
  if (layoutType === 'form') return `The intake or qualification document you send to ${aud} before a first session, consultation, or project kickoff in ${niche}.`;
  if (layoutType === 'flyer') return `A visual announcement for ${aud} — used to promote an event, offer, program, or launch specific to the ${niche} market.`;
  if (layoutType === 'social') return `Branded social content that ${aud} post to establish authority, announce offers, or drive enquiries in the ${niche} space.`;
  return `A professional ${useCaseLower} used by ${aud} in their day-to-day ${niche} practice.`;
}

function buildBuyerScenario(useCase, niche, aud, audShort, layoutType, index) {
  const scenarios = {
    'cover': `You have a new ${niche} client meeting in 48 hours. You want to walk in with a presentation that immediately signals premium positioning. This cover page does that before you speak a word.`,
    'report': `You want to stay front-of-mind with past ${niche} clients and convert warm leads into active engagements. A branded monthly report positions you as the expert they call first.`,
    'tracker': `You are onboarding a new ${niche} client and need a professional tracking document that reflects your standard of work. A polished tracker communicates that you run a systematic, results-focused practice.`,
    'form': `A prospective ${niche} client has inquired about working with you. Sending a professional intake form before the first call demonstrates that your process is structured, thorough, and worth the investment.`,
    'flyer': `You are launching a new ${niche} offer, program, or event and need a visual that commands attention in a crowded feed or inbox — without looking like every other ${niche} flyer.`,
    'social': `You want to consistently show up as the authority in ${niche} without spending hours designing content from scratch. This template system makes every post look intentional and brand-consistent.`,
  };
  return scenarios[layoutType] || `You need a professional ${useCase.toLowerCase()} for your ${niche} practice. This blueprint gives you exactly what to build, what to write, and how to deliver it to ${audShort}.`;
}

function buildNicheHeadline(useCase, niche, audShort, variant) {
  const useCaseLower = useCase.toLowerCase();
  const headlines = [
    `The ${niche} ${useCase} Built for ${audShort} Who Work at a Premium Level`,
    `Professional ${useCase} for ${audShort} — Built for Your Real Workflow`,
    `${useCase}: The ${niche} Standard for Client-Facing Materials`,
    `How Serious ${audShort} Present ${useCaseLower} to Clients`,
    `Your ${niche} Practice Deserves a ${useCase} That Looks Like It`,
  ];
  return headlines[variant % headlines.length];
}

function buildNicheSpecificCopy(useCase, niche, aud, n) {
  const useCaseLower = useCase.toLowerCase();
  const promise = n.promise || `help ${aud} work more effectively`;
  const pa = n.pa || {};
  return `${useCase} for ${niche} Professionals

Purpose: This ${useCaseLower} is designed specifically for ${aud} who need a professional-grade deliverable they can use with clients immediately.

${pa.painPoint ? `The problem this solves: ${pa.painPoint}` : `Most ${niche} professionals either spend hours building ${useCaseLower}s from scratch or use generic templates that undermine their positioning. Neither is acceptable at a premium price point.`}

What this ${useCaseLower} delivers:
• A visually consistent, brand-compliant document that clients perceive as professional from the first glance
• Clear structure that guides the reader through the information in the right order for the right outcome
• Copy blocks you can use as-is or adapt — so you spend time on your craft, not on writing headings

How to use it:
1. Open your design tool (Canva, Adobe, PowerPoint, or Google Slides)
2. Apply the layout structure described in this blueprint exactly
3. Insert your brand colors, logo, and typography as specified
4. Replace all [BUYER_INFO] fields with your real client and business details
5. Export in the recommended format before delivery

${pa.transformation ? `The outcome: ${pa.transformation}` : `When your ${niche} client opens this document, they should feel they made the right decision in choosing you.`}`;
}

function buildSocialCaption(useCase, niche, audShort, n) {
  const priceMin = n.priceMin || 17;
  const title = n.title || `${niche} Template Pack`;
  return `Here is the ${useCase.toLowerCase()} I use in my ${niche} practice.

Every ${audShort} I know has spent time building these from scratch — time that should go to clients, not to formatting.

This pack includes the exact layout, copy, and export specs I use. $${priceMin}. Download instantly.

[Link in bio] or comment "TEMPLATE" and I will send it directly.`;
}

// ── Main builder ──────────────────────────────────────────────────────────────
function buildTemplateFileContent(useCase, index, n) {
  const isRE = /real.estate|realt|property|listing|agent|luxury/i.test(n.niche + n.title);

  // Find RE template definition or fall back to generic
  let def = null;
  if (isRE) {
    // Match by exact name or closest match
    const exactMatch = RE_TEMPLATES[useCase];
    if (exactMatch) {
      def = exactMatch;
    } else {
      // Try partial match
      const matchKey = Object.keys(RE_TEMPLATES).find(k =>
        k.toLowerCase().includes(useCase.toLowerCase().split(' ')[0]) ||
        useCase.toLowerCase().includes(k.toLowerCase().split(' ')[0])
      );
      if (matchKey) def = RE_TEMPLATES[matchKey];
    }
  }

  if (!def) {
    const generic = buildGenericTemplate(useCase, index, n);
    def = generic;
  }

  // Build the QC checklist table
  const qcRows = def.qcChecklist.map(([check, status]) =>
    `│ ${check.padEnd(58)} │ ${status.padEnd(10)} │`
  ).join('\n');
  const qcHeader = `┌${'─'.repeat(60)}┬${'─'.repeat(12)}┐\n│ ${'CHECK'.padEnd(58)} │ ${'VERIFIED'.padEnd(10)} │\n├${'─'.repeat(60)}┼${'─'.repeat(12)}┤`;
  const qcFooter = `└${'─'.repeat(60)}┴${'─'.repeat(12)}┘`;

  // Build copy blocks section
  const copyBlocksText = def.copyBlocks.map((b, i) =>
    `COPY BLOCK ${i + 1}: ${b.label.toUpperCase()}\n${hr()}\n${b.copy}`
  ).join('\n\n');

  // Build customization notes as numbered list
  const customNotes = def.customizationNotes.map((note, i) =>
    `${i + 1}. ${note}`
  ).join('\n');

  return `TEMPLATE ${index + 1}: ${useCase.toUpperCase()}
${E60}
Part of: ${n.title}
Niche: ${n.niche} | Type: Template Blueprint | Format: Layout Spec + Copy Blocks
${E60}

IMPORTANT — WHAT THIS FILE IS AND HOW TO USE IT
${hr()}
This is a TEMPLATE BLUEPRINT. It contains:
  ✓ Exact layout specification (dimensions, zones, hierarchy, typography)
  ✓ Required assets checklist (photos, logos, data, fonts)
  ✓ Ready-to-use copy blocks with completed text
  ✓ Step-by-step customization guide
  ✓ Export format recommendations
  ✓ Quality control checklist

This is NOT a Canva file, InDesign file, Figma file, or PowerPoint file.
NEXT STEP: Open Canva (canva.com), Adobe, PowerPoint, or Google Slides.
Create a new document at the dimensions specified in LAYOUT STRUCTURE below.
Follow the layout spec to build the template. The hard work — what to build,
what to write, and how to structure it — is already done for you in this file.

REQUIRED VISUAL ASSETS (RULE 6 — Visual Products)
${hr()}
This template requires the following visual deliverables before it can be used:
  1. MOCKUP IMAGE — Build the template in your design tool, export as PNG, create
     a device or print mockup using smartmockups.com or Anthony Boyd Graphics.
     Minimum 1 mockup per template. Ideal: show it in context (laptop, print, phone).
  2. FILLED EXAMPLE — Complete one version of this template with realistic, fictional
     content (not your real client data). This is your product preview for marketplace listings.
  3. COLOR PALETTE — Use exactly the hex codes listed in the Visual Style Guide section
     of your Master_Product_Guide.pdf. Apply consistently to this template.
  4. TYPOGRAPHY — Apply the font pairing from your Visual Style Guide. Do not substitute.
  5. PREVIEW PDF — Once all templates are built, assemble a single visual_preview.pdf
     showing every template at full size. This is your primary marketplace thumbnail content.

INTERNAL NAME
${hr()}
${def.internalName}

BEST USE CASE
${hr()}
${def.bestUseCase}

BUYER SCENARIO
${hr()}
${def.buyerScenario}

LAYOUT STRUCTURE
${hr()}
${def.layout}

REQUIRED ASSETS
${hr()}
${def.assets}

READY-TO-USE COPY BLOCKS
${E60}
${copyBlocksText}

PRIMARY HEADLINE
${hr()}
${def.primaryHeadline}

ALTERNATIVE CLIENT-FACING HEADLINES
${hr()}
${def.altHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

CTA EXAMPLES
${hr()}
${def.ctaExamples.map((c, i) => `${i + 1}. ${c}`).join('\n')}

CUSTOMIZATION NOTES
${hr()}
${customNotes}

RECOMMENDED EXPORT FORMAT
${hr()}
${def.exportFormat}

QUALITY CONTROL CHECKLIST
${hr()}
${qcHeader}
${qcRows}
${qcFooter}

Generated by Launchora for ${n.title} | ${new Date().toLocaleDateString()}`;
}

// ── HTTP handler (for direct testing) ────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { useCase, index, n } = body;
    if (!useCase || !n) return Response.json({ ok: false, error: 'Missing useCase or n' }, { status: 400 });
    const content = buildTemplateFileContent(useCase, index || 0, n);
    return Response.json({ ok: true, content });
  } catch(e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
});
// buildMasterGuidePDF.js
// Generates Master_Product_Guide.pdf using PDFKit (npm:pdfkit).
// Called by generateZip via base44.functions.invoke('buildMasterGuidePDF', { n, product }).
// Returns { ok: true, pdfBase64: "..." } or { ok: false, error: "..." }

import PDFDocument from 'npm:pdfkit@0.15.0';

// ── Colour & typography constants ─────────────────────────────────────────────
const C = {
  charcoal:   '#2C2C2C',
  darkChar:   '#1A1A1A',
  muted:      '#6B6B6B',
  border:     '#E0DDD8',
  accent:     '#C8B89A',
  accentDark: '#8C6D4F',
  accentBg:   '#F7E7CE',
  white:      '#FFFFFF',
  rowAlt:     '#F7F5F2',
};

// Page geometry
const PAGE_W = 595.28;  // A4 pt
const PAGE_H = 841.89;
const ML = 56, MR = 56, MT = 56, MB = 56;
const CONTENT_W = PAGE_W - ML - MR;

// ── Helper: collect PDFKit output into a Uint8Array ───────────────────────────
function docToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      let total = 0;
      for (const c of chunks) total += c.length;
      const result = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) { result.set(c, offset); offset += c.length; }
      resolve(result);
    });
    doc.on('error', reject);
  });
}

// ── Text helpers ──────────────────────────────────────────────────────────────
const safe = s => String(s || '').replace(/\bnull\b/g,'').replace(/\bundefined\b/g,'').replace(/\bNaN\b/g,'').trim();
const cap  = s => s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const trunc = (s, n) => { const t = safe(s); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// ── Layout helpers ────────────────────────────────────────────────────────────
function needsPage(doc, requiredPts = 60) {
  if (doc.y > PAGE_H - MB - requiredPts) doc.addPage();
}

function sectionDivider(doc) {
  doc.addPage();
}

function drawHRule(doc, y, color = C.border) {
  doc.save().strokeColor(color).lineWidth(0.5).moveTo(ML, y).lineTo(PAGE_W - MR, y).stroke().restore();
}

function sectionLabel(doc, text) {
  doc.fontSize(7).fillColor(C.accentDark)
     .text(text.toUpperCase(), ML, doc.y, { characterSpacing: 1.5, width: CONTENT_W });
  doc.moveDown(0.3);
}

function h2(doc, text) {
  needsPage(doc, 80);
  doc.fontSize(20).fillColor(C.darkChar).font('Times-Bold')
     .text(safe(text), ML, doc.y, { width: CONTENT_W });
  doc.moveDown(0.25);
  // accent underline
  const lineY = doc.y;
  doc.save().strokeColor(C.accent).lineWidth(2).moveTo(ML, lineY).lineTo(ML + CONTENT_W * 0.35, lineY).stroke().restore();
  doc.moveDown(0.9);
}

function h3(doc, text) {
  needsPage(doc, 50);
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(C.darkChar).font('Times-BoldItalic')
     .text(safe(text), ML, doc.y, { width: CONTENT_W });
  doc.moveDown(0.4);
}

function h4(doc, text) {
  needsPage(doc, 40);
  doc.moveDown(0.4);
  doc.fontSize(8).fillColor(C.muted).font('Helvetica-Bold')
     .text(safe(text).toUpperCase(), ML, doc.y, { characterSpacing: 0.8, width: CONTENT_W });
  doc.moveDown(0.3);
}

function body(doc, text, opts = {}) {
  if (!text || !safe(text)) return;
  needsPage(doc, 30);
  doc.fontSize(10).fillColor(C.charcoal).font('Helvetica')
     .text(safe(text), ML, doc.y, { width: CONTENT_W, lineGap: 3, ...opts });
  doc.moveDown(0.5);
}

function callout(doc, text, bgColor = C.accentBg, borderColor = C.accentDark) {
  if (!text || !safe(text)) return;
  needsPage(doc, 60);
  const textContent = safe(text);
  // Measure text height
  const textH = doc.heightOfString(textContent, { width: CONTENT_W - 32, lineGap: 3 });
  const boxH = textH + 20;
  const boxY = doc.y;
  // Draw box
  doc.save()
     .rect(ML, boxY, CONTENT_W, boxH).fillColor(bgColor).fill()
     .rect(ML, boxY, 3, boxH).fillColor(borderColor).fill()
     .restore();
  doc.fontSize(10).fillColor('#3A2A1A').font('Helvetica-Oblique')
     .text(textContent, ML + 16, boxY + 10, { width: CONTENT_W - 32, lineGap: 3 });
  doc.y = boxY + boxH + 8;
  doc.moveDown(0.3);
}

function bulletList(doc, items, indent = 0) {
  if (!items || items.length === 0) return;
  for (const item of items) {
    needsPage(doc, 20);
    const txt = safe(item);
    if (!txt) continue;
    doc.fontSize(10).fillColor(C.charcoal).font('Helvetica')
       .text('•  ' + txt, ML + indent, doc.y, { width: CONTENT_W - indent, lineGap: 2 });
    doc.moveDown(0.3);
  }
  doc.moveDown(0.2);
}

function numberedList(doc, items) {
  if (!items || items.length === 0) return;
  items.forEach((item, i) => {
    needsPage(doc, 20);
    const txt = safe(item);
    if (!txt) return;
    doc.fontSize(10).fillColor(C.charcoal).font('Helvetica')
       .text(`${i + 1}.  ${txt}`, ML, doc.y, { width: CONTENT_W, lineGap: 2 });
    doc.moveDown(0.3);
  });
  doc.moveDown(0.2);
}

// ── Table renderer ────────────────────────────────────────────────────────────
function drawTable(doc, headers, rows, colWidths) {
  needsPage(doc, 60);
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const rowH = 22;
  let tableY = doc.y;

  // Header row
  let x = ML;
  const headerH = 24;
  doc.save().rect(ML, tableY, totalW, headerH).fillColor(C.darkChar).fill().restore();
  x = ML;
  headers.forEach((h, i) => {
    doc.fontSize(7.5).fillColor(C.white).font('Helvetica-Bold')
       .text(safe(h).toUpperCase(), x + 6, tableY + 8, { width: colWidths[i] - 10, lineBreak: false, characterSpacing: 0.5 });
    x += colWidths[i];
  });
  tableY += headerH;

  // Data rows
  rows.forEach((row, rIdx) => {
    const rowTexts = row.map((cell, ci) => safe(String(cell || '')));
    // Measure tallest cell
    const maxH = Math.max(rowH, ...rowTexts.map((t, ci) =>
      doc.heightOfString(t, { width: colWidths[ci] - 12, lineGap: 2 }) + 12
    ));
    needsPage(doc, maxH + 4);
    tableY = doc.y;

    // Row bg
    doc.save().rect(ML, tableY, totalW, maxH)
       .fillColor(rIdx % 2 === 0 ? C.white : C.rowAlt).fill().restore();

    x = ML;
    rowTexts.forEach((t, ci) => {
      doc.fontSize(9).fillColor(C.charcoal).font(ci === 0 ? 'Helvetica-Bold' : 'Helvetica')
         .text(t, x + 6, tableY + 6, { width: colWidths[ci] - 12, lineGap: 2 });
      x += colWidths[ci];
    });
    // Bottom border
    doc.save().strokeColor(C.border).lineWidth(0.4)
       .moveTo(ML, tableY + maxH).lineTo(ML + totalW, tableY + maxH).stroke().restore();

    doc.y = tableY + maxH;
  });

  // Outer border
  const tableEndY = doc.y;
  doc.save().rect(ML, doc.y - (tableEndY - tableY), totalW, tableEndY - tableY)
     .strokeColor(C.border).lineWidth(0.6).stroke().restore();

  doc.moveDown(0.8);
}

// ── Checklist table ───────────────────────────────────────────────────────────
function checklistTable(doc, items) {
  if (!items || items.length === 0) return;
  const phaseW = 110, checkW = 30, taskW = CONTENT_W - phaseW - checkW;
  drawTable(doc, ['Phase', 'Task', 'Done'], items.map(r => [r.phase, r.task, '☐']), [phaseW, taskW, checkW]);
}

// ── Step cards ────────────────────────────────────────────────────────────────
function stepCards(doc, steps) {
  steps.forEach((step, i) => {
    needsPage(doc, 70);
    const title = safe(step.title);
    const bodyTxt = safe(step.body);
    const textH = doc.heightOfString(bodyTxt, { width: CONTENT_W - 52, lineGap: 3 });
    const cardH = Math.max(50, textH + 32);
    const cardY = doc.y;

    // Card background
    doc.save().rect(ML, cardY, CONTENT_W, cardH).fillColor('#F9F8F6').fill()
       .rect(ML, cardY, CONTENT_W, cardH).strokeColor(C.border).lineWidth(0.5).stroke().restore();

    // Step number circle
    doc.save().circle(ML + 20, cardY + 20, 12).fillColor(C.darkChar).fill().restore();
    doc.fontSize(8).fillColor(C.white).font('Helvetica-Bold')
       .text(String(i + 1), ML + 14, cardY + 15, { width: 12, align: 'center' });

    // Title
    doc.fontSize(10.5).fillColor(C.darkChar).font('Helvetica-Bold')
       .text(title, ML + 40, cardY + 10, { width: CONTENT_W - 52 });

    // Body
    doc.fontSize(9.5).fillColor(C.muted).font('Helvetica')
       .text(bodyTxt, ML + 40, cardY + 26, { width: CONTENT_W - 52, lineGap: 3 });

    doc.y = cardY + cardH + 6;
  });
  doc.moveDown(0.4);
}

// ── Day card ──────────────────────────────────────────────────────────────────
function dayCard(doc, d) {
  needsPage(doc, 120);
  const cardY = doc.y;

  // Header strip
  const headerH = 26;
  doc.save().rect(ML, cardY, CONTENT_W, headerH).fillColor(C.darkChar).fill().restore();
  doc.fontSize(8).fillColor(C.white).font('Helvetica-Bold')
     .text(`DAY ${d.day}  —  ${safe(d.title).toUpperCase()}`, ML + 10, cardY + 9, { width: CONTENT_W - 20, characterSpacing: 0.5 });

  let cy = cardY + headerH + 8;

  // Objective banner
  const objH = doc.heightOfString(safe(d.objective), { width: CONTENT_W - 20, lineGap: 2 }) + 12;
  doc.save().rect(ML, cy, CONTENT_W, objH).fillColor(C.accentBg).fill().restore();
  doc.fontSize(9).fillColor(C.accentDark).font('Helvetica-Oblique')
     .text(safe(d.objective), ML + 10, cy + 6, { width: CONTENT_W - 20, lineGap: 2 });
  cy += objH + 8;

  // Two-column: Tasks | Platform
  const colW = (CONTENT_W - 8) / 2;
  const leftX = ML, rightX = ML + colW + 8;

  doc.fontSize(7.5).fillColor(C.muted).font('Helvetica-Bold').text('TASKS', leftX, cy, { characterSpacing: 0.6 });
  doc.fontSize(7.5).fillColor(C.muted).font('Helvetica-Bold').text('PLATFORM', rightX, cy, { characterSpacing: 0.6 });
  cy += 14;

  const maxItems = Math.max(d.tasks.length, d.platform.length);
  for (let i = 0; i < maxItems; i++) {
    const taskTxt = d.tasks[i] ? '• ' + safe(d.tasks[i]) : '';
    const platTxt = d.platform[i] ? '• ' + safe(d.platform[i]) : '';
    const lh = Math.max(
      taskTxt ? doc.heightOfString(taskTxt, { width: colW - 4, lineGap: 2 }) : 0,
      platTxt ? doc.heightOfString(platTxt, { width: colW - 4, lineGap: 2 }) : 0,
      14
    );
    needsPage(doc, lh + 4);
    if (doc.y !== cy) cy = doc.y;
    if (taskTxt) doc.fontSize(9).fillColor(C.charcoal).font('Helvetica').text(taskTxt, leftX, cy, { width: colW - 4, lineGap: 2 });
    if (platTxt) doc.fontSize(9).fillColor(C.charcoal).font('Helvetica').text(platTxt, rightX, cy, { width: colW - 4, lineGap: 2 });
    cy += lh + 3;
    doc.y = cy;
  }

  cy += 6;
  // CTA strip
  const ctaTxt = 'CTA: ' + safe(d.cta);
  const ctaH = doc.heightOfString(ctaTxt, { width: CONTENT_W - 20, lineGap: 2 }) + 10;
  doc.save().rect(ML, cy, CONTENT_W, ctaH).fillColor('#1A1A1A').fill().restore();
  doc.fontSize(9).fillColor(C.white).font('Helvetica-Oblique')
     .text(ctaTxt, ML + 10, cy + 5, { width: CONTENT_W - 20, lineGap: 2 });
  cy += ctaH + 4;

  // Metric
  doc.fontSize(8).fillColor(C.muted).font('Helvetica')
     .text('✓  ' + safe(d.metric), ML + 4, cy, { width: CONTENT_W - 8 });
  cy += 18;

  // Border around whole card
  const cardH = cy - cardY;
  doc.save().rect(ML, cardY, CONTENT_W, cardH).strokeColor(C.border).lineWidth(0.5).stroke().restore();

  doc.y = cy + 10;
}

// ── Visual style lookup (mirrors buildMasterGuide) ────────────────────────────
function getVisualStyle(n) {
  const combined = (n.niche||'').toLowerCase() + ' ' + (n.title||'').toLowerCase();
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
    photoStyle: 'High-resolution, editorial, natural light, strong contrast, architectural detail shots, luxury interiors.',
    layout: 'Generous negative space · Asymmetrical grids · Full-bleed images · Clean text blocks',
    exportFormats: 'PDF (300 DPI print-ready) · PNG (high-res digital) · JPG (social media)',
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
    photoStyle: 'High-energy, dynamic, authentic action shots.',
    layout: 'Bold typographic hierarchy · High contrast · Clean grids',
    exportFormats: 'PDF (fillable) · PNG · JPEG',
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
    photoStyle: 'Professional headshots, warm natural light.',
    layout: 'Warm, trustworthy, spacious · Clear hierarchy',
    exportFormats: 'PDF · DOCX · PNG',
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
    photoStyle: 'Clean, minimal, modern. Authentic over stock.',
    layout: 'Clean grids · Clear hierarchy · White space',
    exportFormats: 'PDF · HTML · PNG · JPEG',
  };
}

function getQuickStartSteps(n) {
  const combined = (n.niche||'').toLowerCase() + ' ' + (n.title||'').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isFitness = /fitness|gym|workout|training|health/.test(combined);
  const isCoach = /coach|consult|mentor|advisor/.test(combined);
  if (isRE) return [
    { title: 'Establish Your Brand Kit', body: 'Collect your logo (SVG or high-res PNG), primary and secondary brand colors (hex codes), approved headline and body fonts, and your professional headshot. Save these in a dedicated Brand_Kit folder for instant access during customization.' },
    { title: 'Organize Your Property Assets', body: 'For each active or upcoming listing, create a folder named [Address]_Assets. Inside: 10–15 edited property photos (minimum 1920×1080px), property spec sheet, neighborhood highlights, and recent comparable sales data.' },
    { title: 'Customize Core Templates First', body: 'Begin with the Listing Presentation Cover and Agent Bio & Credentials Page. Apply your brand colors, add your logo, and insert your professional headshot and top-line statistics. Save these as MASTER_BRANDED files first.' },
    { title: 'Adapt for a Real Property Campaign', body: 'Open the Editorial Property Brochure and Market Report Summary Page. Replace all [BRACKET] fields with real data: property address, price, room specifications, neighborhood statistics, and 3–5 editorial photos. Export as PDF.' },
    { title: 'Export and Deliver', body: 'For physical delivery: export as PDF/X-1a at 300 DPI. For digital sharing: export as high-resolution PNG. Name files clearly: [LastName]_[Address]_[TemplateName]_[Date].pdf. Send 24–48 hours before any listing appointment.' },
    { title: 'Maintain Consistency', body: 'Every client-facing document must use the same font, color, and logo treatment. Quarterly: update your Market Report with current data. Annually: refresh your Agent Bio with updated sales figures.' },
  ];
  if (isFitness) return [
    { title: 'Set Up Your Brand System', body: 'Gather your logo, brand colors, and photography style references. Decide on your primary program name and tagline before customizing any template.' },
    { title: 'Choose Your First Template', body: 'Start with the template that represents your core offering — whether a workout schedule, meal plan, or client tracking sheet. Customize this one completely before moving to others.' },
    { title: 'Populate with Real Program Data', body: 'Replace all [BRACKET] content with real information: exercise names, sets and reps, nutritional targets, and specific timelines. The more specific the content, the more professionally the template performs.' },
    { title: 'Test Before Delivering', body: 'Print a copy or display on a tablet. Confirm all text is legible, images are sharp, and no [BRACKETS] remain. Share with one trusted client for initial feedback.' },
    { title: 'Export in the Correct Format', body: 'PDF for print delivery and email. PNG for social sharing. Consider a fillable PDF if clients need to complete tracking sections digitally.' },
    { title: 'Build a Template Rotation System', body: 'Save a MASTER_BRANDED version of every template with your logo and colors but no client-specific data. Use this as your permanent starting point.' },
  ];
  if (isCoach) return [
    { title: 'Brand Your Template System', body: 'Apply your coaching brand — logo, color palette, and professional headshot — to the master branded versions of all templates before any client-specific customization.' },
    { title: 'Customize Discovery and Intake Materials', body: 'Start with the Client Intake Questionnaire and Discovery Call Prep Sheet — the first touchpoints every new client sees. Ensure they reflect your coaching philosophy.' },
    { title: 'Prepare Session Workflow Templates', body: 'Set up Session Notes, Goal-Setting Templates, and Progress Review Summaries with your standard coaching framework pre-loaded in the relevant fields.' },
    { title: 'Build Your Client Welcome Package', body: 'Combine your Program Welcome Packet Cover with your intake form and first session prep sheet into a single polished PDF. This is what clients receive when they book with you.' },
    { title: 'Set Up Testimonial Collection', body: 'Customize the Testimonial Request Template with your specific transformation prompts. Schedule it to send 2 weeks before each program\'s completion date.' },
    { title: 'Systematize Your Delivery', body: 'Create a folder for each client: [ClientName]_[ProgramName]. Store their customized versions here. At program end, archive and reference for future referral outreach.' },
  ];
  return [
    { title: 'Review the Complete Template System', body: 'Open each template file and read through the layout spec and copy block instructions before opening any design tool. Understanding the full scope prevents rework.' },
    { title: 'Establish Your Brand Assets', body: 'Collect your logo (SVG or high-res PNG), brand color hex codes, and preferred typography before customizing any template. Having these ready reduces customization time by over 50%.' },
    { title: 'Customize Highest-Impact Templates First', body: `Identify which templates you will use most frequently and customize those first. For ${(n.av||{}).audiencePlural||'your audience'}, this is typically the core client-facing document.` },
    { title: 'Replace All Bracketed Content', body: 'Replace every [BRACKETED] field with your actual content. Never export a document with visible brackets — they signal an unfinished product to any professional reviewer.' },
    { title: 'Export in the Correct Format', body: 'PDF for formal delivery and print. PNG or JPEG for digital sharing and social media. Check export quality at 100% zoom before sending to a client.' },
    { title: 'Build a Reuse System', body: 'Save a MASTER_BRANDED version of every template with your brand applied but no client-specific data. This becomes your permanent starting point.' },
  ];
}

function getChecklistRows(n) {
  const combined = (n.niche||'').toLowerCase() + ' ' + (n.title||'').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isFitness = /fitness|gym|workout|training|health/.test(combined);
  if (isRE) return [
    { phase: 'Setup', task: 'Download and organize all template blueprint files into a dedicated project folder' },
    { phase: 'Setup', task: 'Define and save your Brand Kit (logo, hex colors, fonts, professional headshot)' },
    { phase: 'Setup', task: 'Gather an editorial-style professional headshot (min 1500×1500px, natural light preferred)' },
    { phase: 'Setup', task: 'Compile notable sales figures, accolades, and recent market performance statistics' },
    { phase: 'Core', task: 'Customize Listing Presentation Cover with your brand colors and logo' },
    { phase: 'Core', task: 'Customize Agent Bio & Credentials Page with headshot and statistics' },
    { phase: 'Core', task: 'Customize Market Report Summary Page with current local market data' },
    { phase: 'Deploy', task: 'Prepare Editorial Property Brochure for your next active listing' },
    { phase: 'Deploy', task: 'Prepare Open House Invitation for your next scheduled event' },
    { phase: 'Deploy', task: 'Prepare Just Listed / Just Sold Announcement for current campaign' },
    { phase: 'Ongoing', task: 'Update Market Report Summary Page quarterly with fresh market data' },
    { phase: 'Ongoing', task: 'Archive client-specific versions and maintain MASTER_BRANDED copies' },
  ];
  if (isFitness) return [
    { phase: 'Setup', task: 'Download and organize all program template files' },
    { phase: 'Setup', task: 'Collect brand assets: logo, hex colors, brand photography' },
    { phase: 'Core', task: 'Customize Weekly Workout Program Schedule with your program framework' },
    { phase: 'Core', task: 'Customize Client Progress Tracking Sheet with your key metrics' },
    { phase: 'Core', task: 'Customize Meal Plan & Macro Template with your nutritional guidelines' },
    { phase: 'Deploy', task: 'Prepare client onboarding package with first 3 customized templates' },
    { phase: 'Ongoing', task: 'Create a new program variation from base templates each quarter' },
    { phase: 'Ongoing', task: 'Save MASTER_BRANDED copies of all customized templates for reuse' },
  ];
  const sectionTasks = (n.sections||[]).slice(0,5).map((s,i) => ({
    phase: i < 2 ? 'Setup' : i < 4 ? 'Core' : 'Deploy',
    task: `Customize: ${s.title||'Template '+(i+1)} — apply brand assets and replace all content fields`,
  }));
  return [
    { phase: 'Setup', task: 'Download and organize all template files into a dedicated project folder' },
    { phase: 'Setup', task: 'Collect brand kit: logo, hex colors, preferred typography, photography references' },
    ...sectionTasks,
    { phase: 'Deploy', task: 'Export all customized templates in the recommended formats' },
    { phase: 'Ongoing', task: 'Save MASTER_BRANDED versions of all templates for future reuse' },
  ];
}

function deriveTemplateNames(n) {
  const nicheMap = {
    'real estate': ['Luxury Listing Presentation Cover','Editorial Property Brochure','Market Report Summary Page','Agent Bio & Credentials Page','Open House Invitation Flyer','Seller Pitch Deck Slide','Private Showing Follow-Up Card'],
    'fitness': ['Weekly Workout Program Schedule','Client Progress Tracking Sheet','Meal Plan & Macro Template','Exercise Instruction Card','Transformation Challenge Poster','30-Day Challenge Tracker','Workout Completion Certificate'],
    'coaching': ['Discovery Call Prep Sheet','Client Intake Questionnaire','Weekly Goal-Setting Template','Session Notes & Action Items','Progress Review Summary','Testimonial Request Template','Program Welcome Packet Cover'],
    'finance': ['Monthly Budget Tracker','Debt Payoff Calculator Sheet','Investment Portfolio Summary','Net Worth Snapshot Template','Bill Payment Calendar','Savings Goal Progress Tracker','Income & Expense Log'],
    'marketing': ['Content Calendar Grid','Campaign Brief Template','Social Media Audit Sheet','Competitor Analysis Table','Ad Copy Swipe File Page','Brand Voice Guide Template','Launch Timeline Planner'],
    'social media': ['Instagram Grid Planner','Content Pillar Strategy Sheet','Caption Swipe File Page','Hashtag Research Tracker','Story Highlight Cover Template','Collaboration Pitch Template','Monthly Analytics Report'],
    'wedding': ['Wedding Timeline Planner','Seating Chart Template','Vendor Contact Sheet','Budget Breakdown Tracker','Guest List Manager','Day-Of Emergency Checklist','Thank You Note Template'],
  };
  const key = Object.keys(nicheMap).find(k => (n.niche||'').toLowerCase().includes(k));
  if (key) return nicheMap[key];
  if ((n.sections||[]).length >= 4) return n.sections.slice(0,7).map(s => s.title||'Template');
  return [`${n.niche} Starter Template`,`${n.niche} Workflow Sheet`,`${n.niche} Planning Calendar`,`${n.niche} Tracker Template`,`${n.niche} Checklist Page`,`${n.niche} Report Template`,`${n.niche} Proposal Cover`];
}

// ── Main PDF builder ──────────────────────────────────────────────────────────
async function buildPDF(n) {
  const combined = (n.niche||'').toLowerCase() + ' ' + (n.title||'').toLowerCase();
  const isRE = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  const isTP = (n.type||'').toLowerCase().includes('template');
  const vs = getVisualStyle(n);
  const qsSteps = getQuickStartSteps(n);
  const checklistRows = getChecklistRows(n);
  const templateCases = isTP ? deriveTemplateNames(n) : [];
  const now = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const aud = n.av || {};
  const pa  = n.pa || {};
  const ma  = n.ma || {};

  const doc = new PDFDocument({ size: 'A4', margins: { top: MT, bottom: MB, left: ML, right: MR }, autoFirstPage: false, bufferPages: true });
  const bufferPromise = docToBuffer(doc);

  // ══════════════════════════════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════════════════════════════
  doc.addPage();

  // Top accent bar
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();

  // Eyebrow
  doc.y = 80;
  doc.fontSize(7.5).fillColor(C.accentDark).font('Helvetica-Bold')
     .text('LAUNCHORA  ·  MASTER PRODUCT GUIDE', ML, doc.y, { align: 'center', width: CONTENT_W, characterSpacing: 2 });
  doc.moveDown(1.5);

  // Title
  doc.fontSize(32).fillColor(C.darkChar).font('Times-Bold')
     .text(safe(n.title), ML, doc.y, { align: 'center', width: CONTENT_W, lineGap: 6 });
  doc.moveDown(0.6);

  if (n.subtitle || n.promise) {
    doc.fontSize(13).fillColor(C.muted).font('Times-Italic')
       .text(safe(n.subtitle || n.promise), ML, doc.y, { align: 'center', width: CONTENT_W, lineGap: 4 });
  }
  doc.moveDown(2);

  // Divider ornament
  doc.fontSize(14).fillColor(C.accent).text('— ✦ —', ML, doc.y, { align: 'center', width: CONTENT_W });
  doc.moveDown(2);

  // Meta table (2-col)
  const metaItems = [
    ['Product Type', safe(n.type)],
    ['Niche', safe(n.niche)],
    ['Platform', safe(n.platform)],
    ['Launch Price', `$${n.priceMin}`],
    ['Standard Price', `$${Math.round((n.priceMin + n.priceMax) / 2)}`],
    ['Premium Price', `$${n.priceMax}`],
    ['For', cap(safe(aud.audiencePlural || ''))],
    ['Generated', now],
  ];
  const metaX = ML + 60;
  const metaW = CONTENT_W - 120;
  const metaColW = metaW / 2;
  let metaY = doc.y;
  doc.save().rect(metaX, metaY, metaW, metaItems.length * 22 + 10).fillColor(C.accentBg).fill().restore();
  metaItems.forEach(([k, v], i) => {
    const row = Math.floor(i / 2), col = i % 2;
    const rx = metaX + col * metaColW + 10;
    const ry = metaY + row * 22 + 8;
    doc.fontSize(7).fillColor(C.accentDark).font('Helvetica-Bold').text(k.toUpperCase() + ':', rx, ry, { width: metaColW * 0.38, characterSpacing: 0.4 });
    doc.fontSize(8.5).fillColor(C.charcoal).font('Helvetica').text(safe(v), rx + metaColW * 0.38, ry, { width: metaColW * 0.6, lineBreak: false });
  });
  doc.y = metaY + Math.ceil(metaItems.length / 2) * 22 + 16;

  // Bottom footer on cover
  doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
     .text('Confidential · For buyer use only · Not for redistribution', ML, PAGE_H - MB - 20, { align: 'center', width: CONTENT_W });

  // Bottom accent bar
  doc.save().rect(0, PAGE_H - 5, PAGE_W, 5).fillColor(C.accent).fill().restore();

  // ══════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Navigation');
  h2(doc, 'Table of Contents');

  const tocSections = [
    ['01', 'Product Overview'],
    ['02', 'Visual Style Guide'],
    ['03', 'Customer Avatar'],
    ['04', 'Buyer Quick Start Guide'],
    ['05', 'Implementation Checklist'],
    ...(isTP ? [['06', 'Template Assets']] : []),
    [isTP ? '07' : '06', 'Copy Banks'],
    [isTP ? '08' : '07', 'Platform Listing Copy'],
    [isTP ? '09' : '08', 'Pricing Strategy'],
    [isTP ? '10' : '09', 'FAQ'],
    [isTP ? '11' : '10', 'Upsell Ideas'],
    [isTP ? '12' : '11', '7-Day Launch Plan'],
  ];

  tocSections.forEach(([num, title]) => {
    needsPage(doc, 20);
    const tocY = doc.y;
    doc.fontSize(9.5).fillColor(C.accentDark).font('Helvetica-Bold').text(num, ML, tocY, { width: 24 });
    doc.fontSize(9.5).fillColor(C.charcoal).font('Helvetica').text(title, ML + 28, tocY, { width: CONTENT_W - 28 });
    doc.moveDown(0.1);
    drawHRule(doc, doc.y, C.border);
    doc.moveDown(0.35);
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 01 — PRODUCT OVERVIEW
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Section 01');
  h2(doc, 'Product Overview');

  h3(doc, 'What This Product Is');
  if (isTP) {
    callout(doc, 'WHAT THIS IS: A Template Blueprint System — layout specifications, copy blocks, field guides, and headline options for each professional template in this pack. Each blueprint tells you exactly what to build in your design tool, what copy to use, and what assets you need.');
    callout(doc, 'WHAT THIS IS NOT: Canva source files, InDesign files, PSD files, or Figma files. You build the templates in your preferred design tool using the layout specifications and copy blocks provided.', '#F0F4FF', '#6B7FD7');
  } else {
    body(doc, safe(n.promise || n.subtitle || ''));
  }

  h3(doc, 'Who It Is For');
  body(doc, safe(aud.audienceContextSentence || `This product is built for ${aud.audiencePlural}.`));

  h3(doc, 'The Problem It Solves');
  body(doc, safe(pa.painPoint || ''));

  h3(doc, 'Core Promise');
  callout(doc, safe(n.promise || `${n.title} gives ${aud.audiencePlural} the visual system, copy framework, and implementation guide to look like the premium option — without hiring a designer.`));

  h3(doc, 'What Makes It Different');
  body(doc, safe(pa.uniqueMechanism || `Every element of ${n.title} was built for ${n.niche} specifically — not generic templates repurposed from a business toolkit.`));

  h3(doc, 'What Is Included');
  if (isTP && templateCases.length > 0) {
    bulletList(doc, templateCases.map((t, i) => `Template ${i + 1}: ${t}`));
  } else if ((n.sections||[]).length > 0) {
    bulletList(doc, n.sections.slice(0,8).map(s => s.title || 'Section'));
  }
  if ((n.items||[]).length > 0) {
    h4(doc, 'Key Benefits');
    bulletList(doc, n.items.map(b => '✅  ' + safe(b)));
  }

  // ══════════════════════════════════════════════════════════════
  // SECTION 02 — VISUAL STYLE GUIDE
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Section 02');
  h2(doc, 'Visual Style Guide');

  h3(doc, 'Typography');
  drawTable(doc, ['Role', 'Font Recommendation'], [
    ['Primary (Headlines)', vs.primaryFont],
    ['Secondary (Body Text)', vs.secondaryFont],
  ], [140, CONTENT_W - 140]);

  h3(doc, 'Color Palette');
  drawTable(doc, ['Color Name', 'Hex Code', 'Usage'], vs.colors.map(c => [c.name, c.hex, c.usage]), [120, 80, CONTENT_W - 200]);

  h3(doc, 'Photography Style');
  body(doc, vs.photoStyle);

  h3(doc, 'Layout Principles');
  body(doc, vs.layout);

  h3(doc, 'Export Formats');
  body(doc, vs.exportFormats);

  // ══════════════════════════════════════════════════════════════
  // SECTION 03 — CUSTOMER AVATAR
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Section 03');
  h2(doc, 'Customer Avatar');

  h3(doc, 'Who They Are');
  body(doc, cap(safe(aud.audiencePlural || 'Your target audience')));
  if (n.buyer) body(doc, safe(n.buyer));

  h3(doc, 'Psychographic Profile');
  bulletList(doc, [
    'They value professionalism and visual credibility above almost everything else in their business',
    'They are performance-driven and results-oriented',
    'They are frustrated by the gap between their expertise and how their materials present them',
    'They have tried generic templates before and been disappointed by how off-brand they look',
    'They are willing to invest in tools that save time and elevate their positioning',
  ]);

  h3(doc, 'Core Problem');
  body(doc, safe(pa.painPoint || ''));

  h3(doc, 'Desired Outcome');
  body(doc, safe(pa.transformation || 'To be seen immediately as the premium option — before they open their mouth, before the meeting starts, before the negotiation begins.'));

  h3(doc, 'Purchase Motivation');
  callout(doc, safe(pa.emotionalHook || 'They buy when they connect the cost of looking generic to the revenue they are losing. The price of this product is always less than the cost of one lost client.'));

  h3(doc, 'Where to Find Them');
  bulletList(doc, [
    'Instagram: Following niche accounts, searching industry hashtags',
    `LinkedIn: Active in professional communities and ${n.niche} groups`,
    'Pinterest: Researching design inspiration and professional templates',
    `Etsy: Actively searching for professional digital tools in ${n.niche}`,
    `Industry Podcasts: Business growth shows for ${aud.audienceShort||n.niche} professionals`,
  ]);

  // ══════════════════════════════════════════════════════════════
  // SECTION 04 — BUYER QUICK START GUIDE
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Section 04');
  h2(doc, 'Buyer Quick Start Guide');
  stepCards(doc, qsSteps);

  // ══════════════════════════════════════════════════════════════
  // SECTION 05 — IMPLEMENTATION CHECKLIST
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, 'Section 05');
  h2(doc, 'Implementation Checklist');
  checklistTable(doc, checklistRows);

  // ══════════════════════════════════════════════════════════════
  // SECTION 06 — TEMPLATE ASSETS (Template Pack only)
  // ══════════════════════════════════════════════════════════════
  if (isTP && templateCases.length > 0) {
    sectionDivider(doc);
    doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
    doc.y = MT + 10;
    sectionLabel(doc, 'Section 06');
    h2(doc, 'Template Assets');

    templateCases.forEach((useCase, idx) => {
      needsPage(doc, 120);
      // Card header
      const cardY = doc.y;
      doc.save().rect(ML, cardY, CONTENT_W, 26).fillColor(C.darkChar).fill().restore();
      doc.fontSize(8).fillColor(C.white).font('Helvetica-Bold')
         .text(`TEMPLATE ${idx + 1}  —  ${safe(useCase).toUpperCase()}`, ML + 10, cardY + 9, { width: CONTENT_W - 20, characterSpacing: 0.5 });
      doc.y = cardY + 30;

      const isPresentation = /pitch|deck|slide|presentation|cover/i.test(useCase);
      const isFlyer = /flyer|poster|card|invitation|certificate/i.test(useCase);
      const isReport = /report|summary|analysis|audit|profile|bio/i.test(useCase);
      const bestUse = isPresentation ? `Client-facing presentations and new business pitches in ${n.niche}` : isFlyer ? `Promotions, events, and marketing announcements in ${n.niche}` : isReport ? `Professional reports and data presentations for ${n.niche} clients` : `Day-to-day professional documentation and client-facing materials in ${n.niche}`;
      const exportFmt = isPresentation ? 'PDF (print-ready, 300 DPI) + PNG (digital sharing)' : isFlyer ? 'PDF (A5 or A4, print-ready) + PNG + JPG' : 'PDF (professional delivery)';

      body(doc, `Best use: ${bestUse}`);
      h4(doc, 'Export Format');
      body(doc, exportFmt);
      drawHRule(doc, doc.y, C.border);
      doc.moveDown(0.8);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // COPY BANKS
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 07' : 'Section 06');
  h2(doc, 'Copy Banks');

  const isRE2 = /real.estate|realt|property|listing|agent|luxury/.test(combined);
  if (isRE2) {
    h3(doc, 'A) Headlines for Selling This Product');
    numberedList(doc, [
      `${templateCases.length} ${n.niche} Template Blueprints — Layout + Copy, Instantly Buildable`,
      `Stop Presenting with Generic Templates — Here's the Blueprint System Built for ${aud.audienceShort}`,
      `$${n.priceMin} for ${templateCases.length} ${n.niche} Template Blueprints. Download and Build Today.`,
      `The ${n.niche} Blueprint Kit That Tells You Exactly What to Build, Write, and Deliver`,
      `Look Like the Premium Option Before You Say a Word — ${n.title}`,
    ]);
    h3(doc, 'B) Client-Facing Headline Bank');
    numberedList(doc, ['The Art of the Sale','A Curated Approach to Extraordinary Real Estate','Where Elegance Meets Everyday Living','Local Expertise. Global Resonance.','The State of the Luxury Market','You Are Cordially Invited','A Note of Thanks','Coming Soon','The Neighborhood Edit','Presented with Distinction','An Exceptional Home Deserves an Exceptional Introduction','Beyond the Transaction','The Property That Defines the Market']);
    h3(doc, 'Property Description Copy');
    [
      'Presented for the first time, this extraordinary [property type] at [Address] redefines the standard for luxury living in [Neighborhood]. Offered at [Price].',
      'A rare opportunity in [Neighborhood]: [X] bedrooms, [X] bathrooms, and [sq ft] of meticulously designed living space.',
      "Nestled on [lot size] in one of [Market Area]'s most sought-after addresses, [Address] presents a lifestyle that is both effortless and extraordinary.",
    ].forEach((d, i) => callout(doc, `Option ${i+1}: ${d}`));
  } else {
    h3(doc, 'Headline Bank');
    numberedList(doc, [
      `${n.title} — The Complete ${n.type} Built for ${aud.audienceShort||n.niche}`,
      `Stop Guessing. Start Building. ${n.title} Gives You the Blueprint.`,
      `$${n.priceMin} for Everything You Need to Look Like the Premium Option`,
      `${n.title}: ${templateCases.length||(n.sections||[]).length}+ Templates. Instant Download. Professional Results.`,
      `The ${n.niche} ${n.type} That Saves You Hours of Design Guesswork`,
    ]);
    h3(doc, 'CTA Bank');
    numberedList(doc, [
      `Download instantly → Customize in minutes`,
      `Get instant access for $${n.priceMin} →`,
      `Grab the full pack today →`,
      `One download. Professional results. →`,
      `$${n.priceMin} today → $${n.priceMax} after launch →`,
    ]);
  }

  // ══════════════════════════════════════════════════════════════
  // PLATFORM LISTING COPY
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 08' : 'Section 07');
  h2(doc, 'Platform Listing Copy');

  h3(doc, 'Primary Listing Title');
  callout(doc, safe(ma.listing_title || n.title));

  h3(doc, 'Listing Description');
  body(doc, safe(ma.listing_description || n.longDesc || ''));

  h3(doc, 'Keywords');
  bulletList(doc, (n.keywords||[]).slice(0,10));

  h3(doc, 'Platform-Specific Tips');
  drawTable(doc, ['Platform', 'Price', 'Key Tip'], [
    ['Gumroad', `$${n.priceMin}`, `Enable Pay What You Want (minimum $${n.priceMin}). Buyers often pay more.`],
    ['Etsy', `$${(n.priceMin-0.01).toFixed(2)}`, `Fill all 13 tags. Showcase blueprint content in listing photos.`],
    ['Payhip', `$${n.priceMin}`, `Set up 30–50% affiliate commissions to drive volume.`],
    ['Creative Market', `$${n.priceMin}`, `Clearly state this is a blueprint system, not design source files.`],
  ], [90, 60, CONTENT_W - 150]);

  // ══════════════════════════════════════════════════════════════
  // PRICING STRATEGY
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 09' : 'Section 08');
  h2(doc, 'Pricing Strategy');

  drawTable(doc, ['Price Point', 'Amount', 'Context'], [
    ['Launch Price', `$${n.priceMin}`, 'First 72 hours only — maximum momentum'],
    ['Standard Price', `$${Math.round((n.priceMin+n.priceMax)/2)}`, 'Post-launch — warm audience'],
    ['Premium Price', `$${n.priceMax}`, 'Established position, with testimonials'],
  ], [130, 80, CONTENT_W - 210]);

  h3(doc, 'Price Rationale');
  callout(doc, safe(ma.price_rationale || `At $${n.priceMin}, ${n.title} costs less than one hour of a freelance designer's time — yet delivers ${isTP ? templateCases.length : (n.sections||[]).length}+ professional ${n.niche} blueprints with ready-to-paste copy. The value-to-price ratio is immediately obvious to any ${aud.audienceShort||n.niche} professional who has paid for design work.`));

  h3(doc, 'Platform Tips');
  bulletList(doc, [
    `Gumroad: Enable Pay What You Want (minimum $${n.priceMin}). Buyers often pay more during launch week.`,
    `Etsy: Price at $${(n.priceMin-0.01).toFixed(2)} — below round numbers performs better in search placement.`,
    'Payhip: Build an affiliate network at 30–50% commission to drive volume beyond your own audience.',
    'All platforms: Announce the price increase publicly before raising — this alone drives urgency-based conversions.',
  ]);

  // ══════════════════════════════════════════════════════════════
  // FAQ
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 10' : 'Section 09');
  h2(doc, 'FAQ');

  const faqs = [
    ['What files are included?', isTP ? `${templateCases.length} template blueprint files plus Copy_Bank, Headline_Bank, CTA_Bank, platform listing copy, social media content, 5-email launch sequence, 7-day launch plan, and bonus strategy files.` : `The complete ${n.type} in multiple formats, plus platform listing copy, social media content, email launch sequence, 7-day launch plan, and bonus files.`],
    ['Is this a Canva / InDesign / Figma file?', isTP ? 'No. This is a template blueprint system — layout specs, copy blocks, field guides. Not Canva source files. You build the templates in your preferred design tool using the blueprints.' : `This is a ${n.type} delivered as a digital download. Not a design source file.`],
    ['Do I need design software?', 'Basic familiarity with Canva, PowerPoint, or any document editor is sufficient. Each blueprint provides step-by-step layout guidance.'],
    ['Are fonts included?', 'Font recommendations are in the Visual Style Guide. All recommended fonts are available free via Google Fonts (fonts.google.com).'],
    ['Are images included?', 'No stock photography is included. Required image specs are listed in each template\'s Required Assets section. Free photography: Unsplash, Pexels.'],
    ['Can I use this commercially?', 'Yes — for your own professional use. You may not redistribute or resell the original files.'],
    ['Can I resell the files?', 'No. This product is for personal and professional use only.'],
    ['How do I customize it?', 'Open the template file in any text editor or document viewer. Follow the Layout Structure instructions in each template section. Replace all [BRACKET] content with your real information.'],
  ];
  faqs.forEach(([q, a]) => {
    needsPage(doc, 50);
    doc.fontSize(10).fillColor(C.darkChar).font('Helvetica-Bold').text('Q: ' + safe(q), ML, doc.y, { width: CONTENT_W });
    doc.moveDown(0.25);
    doc.fontSize(9.5).fillColor(C.muted).font('Helvetica').text('A: ' + safe(a), ML + 12, doc.y, { width: CONTENT_W - 12, lineGap: 2 });
    doc.moveDown(0.6);
    drawHRule(doc, doc.y, C.border);
    doc.moveDown(0.4);
  });

  // ══════════════════════════════════════════════════════════════
  // UPSELL IDEAS
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 11' : 'Section 10');
  h2(doc, 'Upsell Ideas');

  const base2 = Math.max(n.priceMax, n.priceMin, 17);
  const uPrice = Math.max(base2 + 20, Math.round(base2 * 1.8));
  const bPrice = Math.round(base2 * 1.5);
  const obPrice = Math.max(9, Math.round(base2 * 0.3));
  const mPrice = Math.max(12, Math.round(base2 * 0.4));
  const upsellProd = isRE2 ? 'Luxury Agent Brand System Vol. 2 — 10 Advanced Presentation Templates' : `${n.title} Extended Pack — 10 Additional Templates`;
  const b1 = isRE2 ? 'Luxury Real Estate Copywriting Swipe File' : `${n.niche} Copywriting Swipe File`;
  const b2t = isRE2 ? 'Listing Appointment Conversion Toolkit' : `${n.niche} Client Conversion Toolkit`;
  const ob = isRE2 ? 'Luxury Color & Font Pairing Guide' : `${n.niche} Brand Style Guide`;
  const mem = isRE2 ? 'Monthly Luxury Real Estate Design Drop' : `Monthly ${n.niche} Design & Copy Drop`;

  h3(doc, 'Immediate Upsell — Show on Thank-You Page');
  body(doc, `Product: ${upsellProd}`);
  body(doc, `Price: $${uPrice}`);
  body(doc, 'Tip: Show immediately on the thank-you/download page — strike when buyer intent is highest.');

  h3(doc, 'Bundle Ideas');
  drawTable(doc, ['Bundle', 'Price', 'Best Platform'], [
    [`"${trunc(n.title,30)}" + "${b1}"`, `$${bPrice}`, 'Gumroad or Payhip'],
    [`"${trunc(n.title,30)}" + "${b2t}"`, `$${Math.round(bPrice*1.3)}`, 'Payhip or ThriveCart'],
  ], [220, 60, CONTENT_W - 280]);

  h3(doc, 'Order Bump');
  body(doc, `${ob} — $${obPrice} added at checkout. Keep order bumps under $${Math.round(base2*0.4)}. Must feel like an obvious add-on.`);

  h3(doc, 'Subscription / Membership');
  body(doc, `${mem} — $${mPrice}/month. Offer 1 free month to ${n.title} buyers to build the habit before the first charge.`);

  // ══════════════════════════════════════════════════════════════
  // 7-DAY LAUNCH PLAN
  // ══════════════════════════════════════════════════════════════
  sectionDivider(doc);
  doc.save().rect(0, 0, PAGE_W, 6).fillColor(C.accent).fill().restore();
  doc.y = MT + 10;
  sectionLabel(doc, isTP ? 'Section 12' : 'Section 11');
  h2(doc, '7-Day Launch Plan');

  const launchDays = [
    { day:1, title:'Launch Day', objective:'Go live and capture first-buyer momentum', tasks:[`Publish product on ${n.platform}`,`Update bio link on all social platforms`,`Send Email 1 (Announcement)`], platform:['Instagram: Launch Announcement post','LinkedIn: Announce to professional network','Stories: Product link sticker'], cta:`"Download at [LINK] — launch price $${n.priceMin}, going up [DATE]"`, metric:`3+ sales. 50+ bio link clicks.` },
    { day:2, title:'Education + Reach', objective:'Reach new audience through value-first content — no hard selling', tasks:['Post short-form video (30–45 sec) on TikTok or Reels','Reply to Day 1 comments and DMs','Share behind-the-scenes story'], platform:['TikTok/Reels: Before/After Reveal — pure value','Stories: Quick scroll of templates'], cta:`"Save this post — grab the pack at the link in bio"`, metric:`500+ video views. 10+ saves.` },
    { day:3, title:'Value + Email', objective:'Build trust and overcome objections', tasks:['Send Email 2 (Educational Value)','Post What\'s Inside carousel','Reply to product DMs'], platform:['Instagram + LinkedIn: Carousel — show every template'], cta:`"Last slide has the link. $${n.priceMin} for the full pack."`, metric:`3%+ email click rate. 5+ saves.` },
    { day:4, title:'Authority + Professional Reach', objective:'Build credibility; reach B2B segment', tasks:['Post LinkedIn authority piece','Post TikTok pain-point video',`Engage in 2–3 ${n.niche} communities`], platform:['LinkedIn: Authority post','TikTok: Pain Point Direct Address'], cta:`"Link in comments (LinkedIn) · Comment TEMPLATES (TikTok)"`, metric:`10+ LinkedIn reactions. 1 sale from LinkedIn.` },
    { day:5, title:'Story + Social Proof', objective:'Emotional connection and early testimonials', tasks:['Send Email 3 (Problem Aware)','Post story-based caption','Run Instagram Stories poll','DM early buyers for testimonials'], platform:['Instagram Feed: Story caption','Stories: Engagement poll'], cta:`"Full story in the caption. Link in bio."`, metric:`40%+ poll response. 1+ testimonial.` },
    { day:6, title:'Offer + Urgency', objective:'Convert fence-sitters with a clear deadline', tasks:['Send Email 4 (The Offer)','Post urgency content on all platforms','Announce price increase tomorrow'], platform:[`Instagram + LinkedIn: Urgency post`,`Stories: Price goes to $${n.priceMax} tomorrow — countdown`], cta:`"$${n.priceMin} tonight. $${n.priceMax} from tomorrow."`, metric:`Highest single-day sales. 20%+ email click rate.` },
    { day:7, title:'Final Push + Close', objective:'Capture last-minute buyers, raise price', tasks:['Send Email 5 (Last Call)','Post final urgency on all platforms',`Raise price to $${n.priceMax} at [TIME]`,'Thank every buyer from Days 1–6'], platform:['Instagram: Last Chance post','TikTok: Launch Urgency video','LinkedIn: Last-call note'], cta:`"Last chance at $${n.priceMin}. Going to $${n.priceMax} at [TIME]."`, metric:`10+ total sales. Price raised by end of day.` },
  ];

  launchDays.forEach(d => dayCard(doc, d));

  h3(doc, 'Post-Launch — Week 2+');
  bulletList(doc, [
    'Collect and publish buyer testimonials',
    'Set up an automated email welcome sequence for new buyers',
    'Repurpose buyer results into social proof content',
    'Plan your first bundle or upsell product',
    'List on additional platforms if launched on only one',
  ]);

  // ══════════════════════════════════════════════════════════════
  // PAGE NUMBERS
  // ══════════════════════════════════════════════════════════════
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    // Footer rule
    doc.save().strokeColor(C.border).lineWidth(0.5)
       .moveTo(ML, PAGE_H - MB + 2).lineTo(PAGE_W - MR, PAGE_H - MB + 2).stroke().restore();
    doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
       .text(`${safe(n.title)}  ·  Master Product Guide`, ML, PAGE_H - MB + 6, { width: CONTENT_W * 0.65, align: 'left' });
    doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
       .text(`${i + 1}`, ML + CONTENT_W * 0.65, PAGE_H - MB + 6, { width: CONTENT_W * 0.35, align: 'right' });
    // Bottom accent bar on every page
    doc.save().rect(0, PAGE_H - 4, PAGE_W, 4).fillColor(C.accent).fill().restore();
  }

  doc.end();
  return bufferPromise;
}

// ── HTTP Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const n = body?.n;
    if (!n || !n.title) return Response.json({ ok: false, error: 'Missing normalized product data (n)' }, { status: 400 });

    const pdfBytes = await buildPDF(n);
    // Return as base64 so it can be decoded in generateZip
    const base64 = btoa(String.fromCharCode(...pdfBytes));
    return Response.json({ ok: true, pdfBase64: base64, size: pdfBytes.length });
  } catch(e) {
    console.error('[buildMasterGuidePDF] Error:', e.message, e.stack);
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
});
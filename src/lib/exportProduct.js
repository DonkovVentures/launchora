import { jsPDF } from 'jspdf';

const BRAND_ORANGE = [234, 88, 12];
const DARK = [30, 20, 10];
const MUTED = [120, 100, 80];
const LIGHT_BG = [253, 249, 244];
const WHITE = [255, 255, 255];
const ACCENT_LIGHT = [253, 237, 220];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function addHeader(doc, title, pageNum) {
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, 210, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(title.toUpperCase(), 14, 8);
  doc.text(`${pageNum}`, 196, 8, { align: 'right' });
}

function addSection(doc, title, content, y, pageNum, totalTitle) {
  const margin = 14;
  const maxWidth = 182;

  if (y > 260) {
    doc.addPage();
    pageNum++;
    addHeader(doc, totalTitle, pageNum);
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, 12, 210, 285, 'F');
    y = 24;
  }

  // Section pill
  doc.setFillColor(...ACCENT_LIGHT);
  doc.roundedRect(margin, y, maxWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text(title.toUpperCase(), margin + 4, y + 4.8);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);

  const items = Array.isArray(content) ? content : content ? [String(content)] : [];
  items.forEach((item, i) => {
    const prefix = Array.isArray(content) ? `${i + 1}. ` : '';
    const lines = doc.splitTextToSize(`${prefix}${item}`, maxWidth - 4);
    lines.forEach(line => {
      if (y > 270) {
        doc.addPage();
        pageNum++;
        addHeader(doc, totalTitle, pageNum);
        doc.setFillColor(...LIGHT_BG);
        doc.rect(0, 12, 210, 285, 'F');
        y = 24;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...DARK);
      }
      doc.text(line, margin + 4, y);
      y += 5.8;
    });
    if (Array.isArray(content)) y += 1.5;
  });

  y += 6;
  return { y, pageNum };
}

// ─── MAIN: Export the actual PRODUCT (not a report) ─────────────────────────

export function exportProductAsPDF(product) {
  const d = product.generated_data || {};
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const docTitle = d.title || product.title || 'Product';
  let pageNum = 1;

  // ── COVER PAGE ──────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, 0, 210, 297, 'F');

  // Top orange bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, 210, 70, 'F');

  // Product type
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 200, 150);
  doc.text(`${product.product_type}  ·  ${product.niche || ''}`, 14, 20);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(docTitle, 180);
  doc.text(titleLines, 14, 35);

  // Subtitle
  const subtY = 45 + titleLines.length * 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(255, 220, 180);
  const subLines = doc.splitTextToSize(d.subtitle || '', 180);
  doc.text(subLines, 14, subtY);

  // Divider
  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(14, 80, 196, 80);

  // Promise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('WHAT YOU WILL ACHIEVE', 14, 92);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  const promLines = doc.splitTextToSize(d.promise || '', 182);
  doc.text(promLines, 14, 100);

  // Format info
  let fy = 100 + promLines.length * 7 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('FORMAT', 14, fy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(d.format || '', 14, fy + 7);

  // Audience
  fy += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRAND_ORANGE);
  doc.text('WHO THIS IS FOR', 14, fy);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const audLines = doc.splitTextToSize(d.audience || '', 182);
  doc.text(audLines, 14, fy + 7);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Created with Launchora · ${new Date().toLocaleDateString()}`, 14, 290);

  // ── PAGE 2: CONTENT ─────────────────────────────────────────────────────
  doc.addPage();
  pageNum = 2;
  addHeader(doc, docTitle, pageNum);
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, 12, 210, 285, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text('Contents', 14, 26);
  let state = { y: 34, pageNum };

  // Structure / Table of contents
  if (d.structure && d.structure.length) {
    state = addSection(doc, 'Table of Contents', d.structure, state.y, state.pageNum, docTitle);
  }

  // ── PAGE 3: MAIN CONTENT ────────────────────────────────────────────────
  doc.addPage();
  pageNum = state.pageNum + 1;
  addHeader(doc, docTitle, pageNum);
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, 12, 210, 285, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text('Content', 14, 26);
  state = { y: 34, pageNum };

  state = addSection(doc, 'Full Content', d.content_draft, state.y, state.pageNum, docTitle);

  // ── BENEFITS + SELLING ANGLE ────────────────────────────────────────────
  if (d.benefits && d.benefits.length) {
    state = addSection(doc, 'Key Benefits', d.benefits, state.y, state.pageNum, docTitle);
  }

  // ── PAGE: VISUAL DIRECTION ──────────────────────────────────────────────
  if (d.visual_direction || d.cover_concept) {
    doc.addPage();
    pageNum = state.pageNum + 1;
    addHeader(doc, docTitle, pageNum);
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, 12, 210, 285, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DARK);
    doc.text('Design & Visual Direction', 14, 26);
    state = { y: 34, pageNum };

    if (d.visual_direction) {
      state = addSection(doc, 'Visual Style Guide', d.visual_direction, state.y, state.pageNum, docTitle);
    }
    if (d.cover_concept) {
      state = addSection(doc, 'Cover Concept', d.cover_concept, state.y, state.pageNum, docTitle);
    }
  }

  // ── LAST PAGE: LISTING COPY (ready to paste into platform) ─────────────
  doc.addPage();
  pageNum = state.pageNum + 1;
  addHeader(doc, docTitle, pageNum);
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, 12, 210, 285, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(`${product.platform} Listing Copy`, 14, 26);

  // Platform note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Copy and paste the sections below directly into your product listing.', 14, 33);
  state = { y: 40, pageNum };

  state = addSection(doc, 'Listing Title', d.listing_title, state.y, state.pageNum, docTitle);
  state = addSection(doc, 'Listing Description', d.listing_description, state.y, state.pageNum, docTitle);
  state = addSection(doc, 'Keywords / Tags', d.keywords, state.y, state.pageNum, docTitle);
  state = addSection(doc, 'Suggested Price', [`$${d.price_min}–$${d.price_max} · ${d.price_rationale}`], state.y, state.pageNum, docTitle);
  state = addSection(doc, 'Call to Action', d.cta, state.y, state.pageNum, docTitle);

  const filename = `${(docTitle).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

// ─── COPY LISTING to clipboard ─────────────────────────────────────────────

export function copyListingToClipboard(product) {
  const d = product.generated_data || {};
  const platform = product.platform || '';

  const text = [
    `LISTING TITLE (${platform}):`,
    d.listing_title || '',
    '',
    'DESCRIPTION:',
    d.listing_description || '',
    '',
    `KEYWORDS / TAGS (${platform}):`,
    (d.keywords || []).join(', '),
    '',
    'SUGGESTED PRICE:',
    `$${d.price_min}–$${d.price_max}`,
    d.price_rationale ? `(${d.price_rationale})` : '',
    '',
    'CALL TO ACTION:',
    d.cta || '',
  ].join('\n');

  return navigator.clipboard.writeText(text);
}

// ─── EXPORT TXT: Full product content as plain text ─────────────────────────

export function exportProductAsTXT(product) {
  const d = product.generated_data || {};
  const title = d.title || product.title || 'Product';

  const lines = [
    '='.repeat(60),
    title.toUpperCase(),
    d.subtitle || '',
    '='.repeat(60),
    '',
    'WHAT YOU WILL ACHIEVE',
    '-'.repeat(40),
    d.promise || '',
    '',
    'FORMAT',
    '-'.repeat(40),
    d.format || '',
    '',
    'WHO THIS IS FOR',
    '-'.repeat(40),
    d.audience || '',
    '',
    'TABLE OF CONTENTS',
    '-'.repeat(40),
    ...(d.structure || []).map((s, i) => `${i + 1}. ${s}`),
    '',
    'FULL CONTENT',
    '-'.repeat(40),
    d.content_draft || '',
    '',
    'KEY BENEFITS',
    '-'.repeat(40),
    ...(d.benefits || []).map((b, i) => `${i + 1}. ${b}`),
    '',
    '='.repeat(60),
    `${(product.platform || '').toUpperCase()} LISTING COPY`,
    '='.repeat(60),
    '',
    'LISTING TITLE:',
    d.listing_title || '',
    '',
    'DESCRIPTION:',
    d.listing_description || '',
    '',
    'KEYWORDS / TAGS:',
    (d.keywords || []).join(', '),
    '',
    'PRICE:',
    `$${d.price_min}–$${d.price_max}`,
    d.price_rationale || '',
    '',
    'CALL TO ACTION:',
    d.cta || '',
    '',
    '='.repeat(60),
    'VISUAL & DESIGN',
    '='.repeat(60),
    '',
    'Visual Direction:',
    d.visual_direction || '',
    '',
    'Cover Concept:',
    d.cover_concept || '',
    '',
    `Generated with Launchora · ${new Date().toLocaleDateString()}`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
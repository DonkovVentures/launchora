import { jsPDF } from 'jspdf';
import { normalizeProduct } from '@/lib/normalizeProduct';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const PALETTE = {
  minimal:  { accent: [234, 88, 12],   bg: [253, 249, 244], dark: [26, 20, 10],   muted: [120, 100, 80],  light: [255, 241, 228] },
  premium:  { accent: [201, 169, 110],  bg: [15, 15, 15],   dark: [232, 224, 212], muted: [150, 140, 120], light: [40, 36, 28] },
  feminine: { accent: [212, 98, 138],   bg: [255, 245, 247], dark: [74, 48, 64],   muted: [160, 120, 140], light: [255, 225, 235] },
  business: { accent: [37, 99, 235],    bg: [248, 250, 252], dark: [30, 41, 59],   muted: [100, 116, 139], light: [219, 234, 254] },
  elegant:  { accent: [139, 105, 20],   bg: [250, 248, 245], dark: [44, 36, 23],   muted: [130, 110, 70],  light: [240, 230, 200] },
  modern:   { accent: [22, 163, 74],    bg: [240, 253, 244], dark: [20, 83, 45],   muted: [74, 130, 100],  light: [187, 247, 208] },
  pastel:   { accent: [251, 146, 60],   bg: [254, 249, 240], dark: [120, 113, 108], muted: [168, 162, 158], light: [255, 228, 196] },
  bold:     { accent: [245, 158, 11],   bg: [24, 24, 27],   dark: [212, 212, 216], muted: [113, 113, 122], light: [63, 63, 70] },
};
const WHITE = [255, 255, 255];
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 12;
const CONTENT_TOP = 22;
const CONTENT_BOTTOM = PAGE_H - FOOTER_H - 6;

// ── Page Manager ──────────────────────────────────────────────────────────────
class PageManager {
  constructor(doc, palette, productTitle) {
    this.doc = doc;
    this.palette = palette;
    this.title = productTitle;
    this.pageNum = 0;
    this.y = CONTENT_TOP;
  }

  newPage() {
    if (this.pageNum > 0) this.doc.addPage();
    this.pageNum++;
    this._drawPageBackground();
    this._drawHeader();
    this._drawFooter();
    this.y = CONTENT_TOP;
  }

  ensureSpace(needed = 20) {
    if (this.y + needed > CONTENT_BOTTOM) {
      this.newPage();
    }
  }

  _drawPageBackground() {
    const { bg } = this.palette;
    this.doc.setFillColor(...bg);
    this.doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  }

  _drawHeader() {
    const { accent } = this.palette;
    this.doc.setFillColor(...accent);
    this.doc.rect(0, 0, PAGE_W, 14, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(...WHITE);
    this.doc.text('LAUNCHORA', MARGIN, 9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.title.toUpperCase().slice(0, 50), PAGE_W / 2, 9, { align: 'center' });
  }

  _drawFooter() {
    const { muted, accent } = this.palette;
    const footerY = PAGE_H - FOOTER_H + 4;
    // thin divider line
    this.doc.setDrawColor(...accent);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(...muted);
    this.doc.text(this.title, MARGIN, footerY);
    this.doc.text(`${this.pageNum}`, PAGE_W - MARGIN, footerY, { align: 'right' });
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────

  heading1(text) {
    this.ensureSpace(20);
    const { dark, accent } = this.palette;
    // accent left bar
    this.doc.setFillColor(...accent);
    this.doc.rect(MARGIN, this.y - 1, 3, 10, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(...dark);
    this.doc.text(text, MARGIN + 6, this.y + 7);
    this.y += 16;
    this._divider();
  }

  heading2(text) {
    this.ensureSpace(16);
    const { dark } = this.palette;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...dark);
    this.doc.text(text, MARGIN, this.y + 8);
    this.y += 13;
  }

  label(text) {
    this.ensureSpace(10);
    const { accent, light } = this.palette;
    this.doc.setFillColor(...light);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, 7, 1, 1, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(...accent);
    this.doc.text(text.toUpperCase(), MARGIN + 4, this.y + 5);
    this.y += 10;
  }

  body(text, indent = 0) {
    if (!text?.trim()) return;
    const { dark } = this.palette;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...dark);
    const lines = this.doc.splitTextToSize(String(text).trim(), CONTENT_W - indent - 4);
    for (const line of lines) {
      this.ensureSpace(6);
      this.doc.text(line, MARGIN + indent, this.y);
      this.y += 5.5;
    }
    this.y += 3;
  }

  bulletList(items, opts = {}) {
    if (!items?.length) return;
    const { dark } = this.palette;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...dark);
    for (const item of items) {
      const text = typeof item === 'string' ? item : (item.title || item.heading || String(item));
      const lines = this.doc.splitTextToSize(text, CONTENT_W - 12);
      this.ensureSpace(6);
      this.doc.text(opts.numbered ? '' : '•', MARGIN + 4, this.y);
      this.doc.text(lines[0], MARGIN + 9, this.y);
      this.y += 5.5;
      for (let i = 1; i < lines.length; i++) {
        this.ensureSpace(6);
        this.doc.text(lines[i], MARGIN + 9, this.y);
        this.y += 5.5;
      }
      this.y += 1;
    }
    this.y += 3;
  }

  checkboxList(items) {
    if (!items?.length) return;
    const { dark, accent } = this.palette;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    for (const item of items) {
      this.ensureSpace(8);
      // draw checkbox square
      this.doc.setDrawColor(...accent);
      this.doc.setLineWidth(0.5);
      this.doc.rect(MARGIN + 4, this.y - 4, 4, 4);
      this.doc.setTextColor(...dark);
      const lines = this.doc.splitTextToSize(String(item), CONTENT_W - 14);
      this.doc.text(lines[0], MARGIN + 10, this.y);
      this.y += 5.5;
      for (let i = 1; i < lines.length; i++) {
        this.ensureSpace(6);
        this.doc.text(lines[i], MARGIN + 10, this.y);
        this.y += 5.5;
      }
      this.y += 1;
    }
    this.y += 3;
  }

  answerLines(count = 3, label = '') {
    if (label) {
      this.ensureSpace(8);
      const { muted } = this.palette;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...muted);
      this.doc.text(label, MARGIN + 4, this.y);
      this.y += 6;
    }
    const { muted } = this.palette;
    this.doc.setDrawColor(...muted);
    this.doc.setLineWidth(0.3);
    for (let i = 0; i < count; i++) {
      this.ensureSpace(8);
      this.doc.line(MARGIN + 4, this.y, MARGIN + CONTENT_W - 4, this.y);
      this.y += 7;
    }
    this.y += 4;
  }

  spacer(h = 6) { this.y += h; }

  _divider() {
    const { accent } = this.palette;
    this.doc.setDrawColor(...accent);
    this.doc.setLineWidth(0.4);
    this.doc.line(MARGIN, this.y - 2, MARGIN + CONTENT_W, this.y - 2);
    this.y += 4;
  }

  infoBox(lines, opts = {}) {
    if (!lines?.length) return;
    const { light, dark, accent } = this.palette;
    const lineH = 5.5;
    const padding = 5;
    const totalH = lines.length * lineH + padding * 2;
    this.ensureSpace(totalH + 4);
    const boxY = this.y;
    this.doc.setFillColor(...(opts.bg || light));
    this.doc.roundedRect(MARGIN, boxY, CONTENT_W, totalH, 2, 2, 'F');
    if (opts.border) {
      this.doc.setDrawColor(...accent);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(MARGIN, boxY, CONTENT_W, totalH, 2, 2, 'S');
    }
    this.doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...dark);
    let ly = boxY + padding + 4;
    for (const line of lines) {
      this.doc.text(String(line), MARGIN + padding, ly);
      ly += lineH;
    }
    this.y = boxY + totalH + 6;
  }
}

// ── Page Builders ─────────────────────────────────────────────────────────────

function buildCoverPage(doc, norm, product, palette) {
  const { accent, bg, dark, muted, light } = palette;

  // Full background
  doc.setFillColor(...bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Top hero block
  doc.setFillColor(...accent);
  doc.rect(0, 0, PAGE_W, 80, 'F');

  // Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('LAUNCHORA', MARGIN, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 220, 180);
  doc.text('DONKOV VENTURES', MARGIN, 20);

  // Type + Platform badge line
  const badgeText = [norm.product_type, product.platform, product.niche].filter(Boolean).join('  ·  ');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 220, 180);
  doc.text(badgeText.toUpperCase(), MARGIN, 32);

  // Product Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(norm.title || 'Untitled Product', CONTENT_W);
  doc.text(titleLines, MARGIN, 46);

  // Subtitle card
  const cardY = 88;
  doc.setFillColor(...WHITE);
  doc.roundedRect(MARGIN, cardY, CONTENT_W, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(...dark);
  const subLines = doc.splitTextToSize(norm.subtitle || norm.promise || '', CONTENT_W - 12);
  doc.text(subLines.slice(0, 2), MARGIN + 6, cardY + 10);

  // PROMISE
  let infoY = cardY + 30;
  if (norm.promise) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text('THE PROMISE', MARGIN, infoY);
    infoY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    const promLines = doc.splitTextToSize(norm.promise, CONTENT_W);
    doc.text(promLines.slice(0, 3), MARGIN, infoY);
    infoY += promLines.slice(0, 3).length * 5.5 + 8;
  }

  // FOR WHO
  if (norm.targetAudience) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text('FOR', MARGIN, infoY);
    infoY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    const audLines = doc.splitTextToSize(norm.targetAudience, CONTENT_W);
    doc.text(audLines.slice(0, 2), MARGIN, infoY);
    infoY += audLines.slice(0, 2).length * 5.5 + 10;
  }

  // Price + CTA boxes at bottom
  const boxY = 240;
  const ma = norm.marketingAssets || {};
  if (ma.price_min) {
    doc.setFillColor(...accent);
    doc.roundedRect(MARGIN, boxY, 85, 30, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('SUGGESTED PRICE', MARGIN + 5, boxY + 10);
    doc.setFontSize(20);
    doc.text(`$${ma.price_min}–$${ma.price_max}`, MARGIN + 5, boxY + 23);
  }

  if (ma.cta) {
    doc.setFillColor(...light);
    doc.roundedRect(PAGE_W - MARGIN - 97, boxY, 97, 30, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text('CALL TO ACTION', PAGE_W - MARGIN - 92, boxY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...dark);
    const ctaLines = doc.splitTextToSize(ma.cta, 84);
    doc.text(ctaLines.slice(0, 2), PAGE_W - MARGIN - 92, boxY + 19);
  }

  // Footer line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`Generated by Launchora · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, PAGE_H - 8);
}

function buildIntroPage(pm, norm) {
  pm.newPage();
  pm.heading1('Welcome');

  pm.body(`This is your complete digital product, created and structured to help you deliver real results to your customers.`);
  pm.spacer(4);

  if (norm.targetAudience) {
    pm.label('Who This Is For');
    pm.body(norm.targetAudience);
  }

  if (norm.promise) {
    pm.label('What You Can Expect');
    pm.body(norm.promise);
  }

  if (norm.problemSolved) {
    pm.label('The Problem We Solve');
    pm.body(norm.problemSolved);
  }

  if (norm.buyerProfile) {
    pm.label('Your Buyer Profile');
    pm.body(norm.buyerProfile);
  }

  // Table of Contents
  pm.spacer(6);
  pm.heading2('Contents at a Glance');

  const tocItems = norm.pages
    .filter(b => b.type !== 'listing')
    .map(b => b.heading || b.content?.title || b.type)
    .filter(Boolean);

  if (tocItems.length > 0) {
    pm.bulletList(tocItems);
  } else if (norm.sections.length > 0) {
    pm.bulletList(norm.sections.map(s => s.title || s.heading || ''));
  }
}

function buildContentPages(pm, norm) {
  const blocks = norm.pages.length > 0 ? norm.pages : null;
  const sections = norm.sections.length > 0 ? norm.sections : null;

  if (blocks) {
    for (const block of blocks) {
      const type = block.type;
      const content = block.content || {};

      // Skip listing blocks — those go in marketing, not product PDF
      if (type === 'listing') continue;

      pm.newPage();

      if (type === 'cover') {
        pm.heading1(content.title || norm.title);
        if (content.subtitle) pm.body(content.subtitle);
        if (content.promise) { pm.label('Promise'); pm.body(content.promise); }
        if (content.audience) { pm.label('For'); pm.body(content.audience); }

      } else if (type === 'toc') {
        pm.heading1(block.heading || 'Table of Contents');
        const items = content.items || [];
        pm.bulletList(items);

      } else if (type === 'section') {
        const title = block.heading || content.heading || 'Section';
        pm.heading1(title);
        pm.body(content.body || block.body || '');

      } else if (type === 'checklist') {
        pm.heading1(block.heading || content.title || 'Checklist');
        const items = content.items || [];
        pm.checkboxList(items);

      } else if (type === 'worksheet') {
        pm.heading1(block.heading || content.title || 'Worksheet');
        if (content.instructions) pm.body(content.instructions);
        pm.spacer(4);
        const questions = content.questions || [];
        for (const q of questions) {
          pm.label(q);
          pm.answerLines(3);
        }

      } else if (type === 'prompt') {
        pm.heading1(block.heading || content.title || 'Prompts');
        if (content.intro) pm.body(content.intro);
        pm.spacer(4);
        const prompts = content.prompts || [];
        for (const p of prompts) {
          pm.label(p);
          pm.answerLines(2);
        }

      } else if (type === 'notes') {
        pm.heading1(block.heading || content.title || 'Notes');
        pm.body('Use this space to capture your thoughts, ideas, and reflections.');
        pm.spacer(6);
        const lineCount = content.lines || 12;
        pm.answerLines(lineCount);

      } else {
        // Generic fallback
        const heading = block.heading || block.type || 'Section';
        pm.heading1(heading);
        if (content.body) pm.body(content.body);
        else if (typeof block.body === 'string') pm.body(block.body);
      }
    }
  } else if (sections) {
    // Render plain sections
    for (const section of sections) {
      pm.newPage();
      pm.heading1(section.title || section.heading || 'Section');
      pm.body(section.body || '');
    }
  }

  // Standalone checklist_items if no checklist block found
  const hasChecklistBlock = blocks?.some(b => b.type === 'checklist');
  if (!hasChecklistBlock && norm.checklistItems?.length > 0) {
    pm.newPage();
    pm.heading1('Key Takeaways');
    pm.checkboxList(norm.checklistItems);
  }
}

function buildFinalPage(pm, norm) {
  pm.newPage();
  pm.heading1('You\'re Ready to Go');

  pm.body(`Congratulations on completing ${norm.title}. You now have everything you need to take the next step.`);
  pm.spacer(6);

  pm.label('Summary');
  pm.body(norm.promise || norm.subtitle || `${norm.title} is your complete guide to achieving your goals.`);
  pm.spacer(4);

  pm.label('Next Steps');
  const nextSteps = [
    'Review everything you\'ve worked through in this product.',
    'Identify the one action you can take in the next 24 hours.',
    'Apply consistently — small steps create big results.',
    'Reach out if you have questions or want support.',
  ];
  pm.bulletList(nextSteps);
  pm.spacer(8);

  // Closing quote box
  const closing = norm.promise
    ? `"${norm.promise}"`
    : `"The best time to start was yesterday. The second best time is right now."`;

  pm.infoBox(
    pm.doc.splitTextToSize(closing, CONTENT_W - 12),
    { border: true }
  );

  pm.spacer(6);
  pm.body(`Thank you for choosing ${norm.title}. We wish you every success.`);

  // Branding sign-off
  pm.spacer(10);
  pm.doc.setFont('helvetica', 'bold');
  pm.doc.setFontSize(8);
  pm.doc.setTextColor(...pm.palette.accent);
  pm.doc.text('POWERED BY LAUNCHORA', MARGIN, pm.y);
  pm.doc.setFont('helvetica', 'normal');
  pm.doc.setFontSize(7.5);
  pm.doc.setTextColor(...pm.palette.muted);
  pm.doc.text('launchora.com', MARGIN, pm.y + 6);
}

// ── Main Export Function ──────────────────────────────────────────────────────

export function exportProductPDF(product) {
  const norm = normalizeProduct(product);
  const styleKey = norm.visualStyle?.preset || product.visual_style?.preset || 'minimal';
  const palette = PALETTE[styleKey] || PALETTE.minimal;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Cover Page (no page manager — fully custom layout) ──────────────────
  buildCoverPage(doc, norm, product, palette);

  // ── Remaining pages via PageManager ────────────────────────────────────
  const pm = new PageManager(doc, palette, norm.title);
  pm.doc = doc; // attach doc reference to pm

  buildIntroPage(pm, norm);
  buildContentPages(pm, norm);
  buildFinalPage(pm, norm);

  // ── Save ────────────────────────────────────────────────────────────────
  const filename = `${(norm.title || 'product').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-launchora.pdf`;
  doc.save(filename);
}
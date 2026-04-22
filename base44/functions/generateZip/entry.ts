import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ── PDF GENERATION ─────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

const STYLE_PRESETS = {
  minimal:  { bg: '#ffffff', text: '#1a1a1a', accent: '#ea580c', heading: '#111111' },
  premium:  { bg: '#0f0f0f', text: '#e8e0d4', accent: '#c9a96e', heading: '#f5efe8' },
  feminine: { bg: '#fff5f7', text: '#4a3040', accent: '#d4628a', heading: '#2d1a28' },
  business: { bg: '#f8fafc', text: '#1e293b', accent: '#2563eb', heading: '#0f172a' },
  elegant:  { bg: '#faf8f5', text: '#2c2417', accent: '#8b6914', heading: '#1a1208' },
  modern:   { bg: '#f0fdf4', text: '#14532d', accent: '#16a34a', heading: '#052e16' },
  pastel:   { bg: '#fef9f0', text: '#78716c', accent: '#fb923c', heading: '#44403c' },
  bold:     { bg: '#18181b', text: '#d4d4d8', accent: '#f59e0b', heading: '#fafafa' },
};

async function generateProductPDF(product, blocks, preset) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const d = product.generated_data || {};
  const W = 210, MARGIN = 18, TW = W - MARGIN * 2;
  const c = {
    bg: hexToRgb(preset?.bg || '#ffffff'),
    text: hexToRgb(preset?.text || '#1a1a1a'),
    accent: hexToRgb(preset?.accent || '#ea580c'),
    heading: hexToRgb(preset?.heading || '#111111'),
  };

  let pageNum = 0;
  const newPage = () => {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    doc.setFillColor(...c.bg);
    doc.rect(0, 0, 210, 297, 'F');
    // Footer
    doc.setFillColor(...c.accent);
    doc.rect(0, 292, 210, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const productName = (d.title || product.title || '').substring(0, 50);
    doc.text(`${productName}`, MARGIN, 295.5);
    doc.text(`Page ${pageNum}`, W - MARGIN, 295.5, { align: 'right' });
    return MARGIN;
  };

  const ensureSpace = (y, needed) => {
    if (y + needed > 285) {
      return newPage();
    }
    return y;
  };

  const writeLine = (doc, text, x, y, maxW, fontSize, font = 'normal', color = c.text) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', font);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), maxW);
    lines.forEach(line => {
      doc.text(line, x, y);
      y += fontSize * 0.45;
    });
    return y;
  };

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    let y = newPage();

    // ── COVER ──
    if (block.type === 'cover') {
      // Top accent bar
      doc.setFillColor(...c.accent);
      doc.rect(0, 0, 210, 10, 'F');
      // Product type badge
      doc.setFillColor(...c.accent);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text((product.product_type || '').toUpperCase(), MARGIN, 26);
      // Title
      y = 40;
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.heading);
      const titleLines = doc.splitTextToSize(block.content?.title || d.title || product.title || '', TW);
      titleLines.forEach(line => { doc.text(line, MARGIN, y); y += 12; });
      // Subtitle
      if (block.content?.subtitle) {
        y += 4;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...c.text);
        const subLines = doc.splitTextToSize(block.content.subtitle, TW);
        subLines.forEach(line => { doc.text(line, MARGIN, y); y += 7; });
      }
      // Divider
      y += 10;
      doc.setFillColor(...c.accent);
      doc.rect(MARGIN, y, TW, 1, 'F');
      y += 8;
      // Promise box
      if (block.content?.promise) {
        doc.setFillColor(...hexToRgb('#f5f5f5'));
        doc.roundedRect(MARGIN, y, TW, 28, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.accent);
        doc.text('THE PROMISE', MARGIN + 6, y + 7);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...c.text);
        const pLines = doc.splitTextToSize(block.content.promise, TW - 12);
        pLines.slice(0, 3).forEach((line, li) => doc.text(line, MARGIN + 6, y + 14 + li * 5.5));
        y += 36;
      }
      // Audience
      if (block.content?.audience) {
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.accent);
        doc.text('FOR:', MARGIN, y); y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...c.text);
        const audLines = doc.splitTextToSize(block.content.audience, TW);
        audLines.slice(0, 2).forEach(line => { doc.text(line, MARGIN, y); y += 6; });
      }

    // ── TABLE OF CONTENTS ──
    } else if (block.type === 'toc') {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.heading);
      doc.text('TABLE OF CONTENTS', MARGIN, y); y += 6;
      doc.setFillColor(...c.accent);
      doc.rect(MARGIN, y, TW, 1.5, 'F'); y += 10;
      const items = block.content?.items || [];
      items.forEach((item, i) => {
        y = ensureSpace(y, 10);
        // Alternating row bg
        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(MARGIN, y - 5, TW, 8, 'F');
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
        doc.setTextColor(...c.text);
        doc.text(`${String(i + 1).padStart(2, '0')}`, MARGIN + 3, y);
        doc.text(String(item), MARGIN + 14, y);
        doc.setTextColor(...c.accent);
        doc.text('·', W - MARGIN - 20, y);
        y += 9;
      });

    // ── SECTION / WORKSHEET / PROMPT ──
    } else if (['section', 'worksheet', 'prompt'].includes(block.type)) {
      // Header bar
      doc.setFillColor(...c.accent);
      doc.rect(0, 0, 6, 297, 'F');
      // Title
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.heading);
      const hLines = doc.splitTextToSize(block.content?.title || block.heading || '', TW - 4);
      hLines.forEach(l => { doc.text(l, MARGIN + 4, y); y += 8; });
      doc.setFillColor(...c.accent);
      doc.rect(MARGIN + 4, y, TW - 4, 0.8, 'F'); y += 7;
      // Body text — parse markdown lightly
      const rawBody = block.content?.body || '';
      const lines = rawBody.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { y += 3; continue; }
        y = ensureSpace(y, 8);
        // H2 / H3
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headText = trimmed.replace(/^#{2,3}\s+/, '');
          y += 3;
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...c.accent);
          const hh = doc.splitTextToSize(headText, TW - 8);
          hh.forEach(hl => { y = ensureSpace(y, 7); doc.text(hl, MARGIN + 4, y); y += 6.5; });
          y += 1;
        // Bold line (starts/ends with **)
        } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          const boldText = trimmed.replace(/\*\*/g, '');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...c.text);
          const bl = doc.splitTextToSize(boldText, TW - 8);
          bl.forEach(bline => { y = ensureSpace(y, 6); doc.text(bline, MARGIN + 4, y); y += 5.5; });
        // Bullet / list item
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('✓ ') || trimmed.startsWith('☐ ') || /^\d+\.\s/.test(trimmed)) {
          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');
          const isCheck = trimmed.startsWith('✓ ') || trimmed.startsWith('☐ ');
          const isNum = /^\d+\.\s/.test(trimmed);
          const itemText = trimmed.replace(/^[-•✓☐]\s+/, '').replace(/^\d+\.\s+/, '');
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...c.text);
          const il = doc.splitTextToSize(itemText, TW - 16);
          y = ensureSpace(y, 6);
          if (isBullet) {
            doc.setFillColor(...c.accent);
            doc.circle(MARGIN + 8, y - 1.5, 1, 'F');
          } else if (isCheck) {
            doc.setDrawColor(...c.accent);
            doc.rect(MARGIN + 6, y - 4, 4, 4);
          } else if (isNum) {
            doc.setTextColor(...c.accent);
            doc.setFont('helvetica', 'bold');
            doc.text(trimmed.match(/^\d+/)[0] + '.', MARGIN + 5, y);
            doc.setTextColor(...c.text);
            doc.setFont('helvetica', 'normal');
          }
          il.forEach((il_line, ili) => {
            y = ensureSpace(y, 6);
            doc.text(il_line, MARGIN + (isNum ? 14 : 13), y);
            y += 5.5;
          });
        // Normal text
        } else {
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...c.text);
          const tl = doc.splitTextToSize(trimmed, TW - 4);
          tl.forEach(tline => { y = ensureSpace(y, 6); doc.text(tline, MARGIN + 4, y); y += 5.5; });
        }
      }

    // ── CHECKLIST ──
    } else if (block.type === 'checklist') {
      doc.setFillColor(...c.accent);
      doc.rect(0, 0, 6, 297, 'F');
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.heading);
      doc.text(block.content?.title || block.heading || 'Checklist', MARGIN + 4, y); y += 8;
      doc.setFillColor(...c.accent);
      doc.rect(MARGIN + 4, y, TW - 4, 0.8, 'F'); y += 8;
      const items = block.content?.items || [];
      items.forEach((item, i) => {
        y = ensureSpace(y, 8);
        // Checkbox
        doc.setDrawColor(...c.accent);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN + 4, y - 4.5, 5, 5, 1, 1);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...c.text);
        const il = doc.splitTextToSize(String(item), TW - 16);
        il.forEach((iline, ili) => { doc.text(iline, MARGIN + 13, y + ili * 5.5); });
        y += il.length * 5.5 + 3;
      });

    // ── NOTES ──
    } else if (block.type === 'notes') {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...c.heading);
      doc.text('Notes', MARGIN, y); y += 6;
      doc.setFillColor(...c.accent);
      doc.rect(MARGIN, y, TW, 1, 'F'); y += 10;
      const lineCount = block.content?.lines || 14;
      for (let i = 0; i < lineCount; i++) {
        y = ensureSpace(y, 10);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y, W - MARGIN, y);
        y += 11;
      }

    // ── LISTING ──
    } else if (block.type === 'listing') {
      doc.setFillColor(...c.accent);
      doc.rect(0, 0, 210, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('PLATFORM LISTING COPY', MARGIN, 8);
      y = 20;
      const fields = [
        { label: 'LISTING TITLE', val: block.content?.listing_title },
        { label: 'DESCRIPTION', val: block.content?.listing_description },
        { label: 'SEO KEYWORDS', val: (block.content?.keywords || []).join(', ') },
        { label: 'META DESCRIPTION', val: block.content?.seo_meta_description },
        { label: 'PLATFORM CTA', val: block.content?.platform_cta || block.content?.cta },
        { label: 'PRICE RANGE', val: `$${block.content?.price_min || 17}–$${block.content?.price_max || 37}` },
      ];
      fields.forEach(f => {
        if (!f.val) return;
        y = ensureSpace(y, 14);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.accent);
        doc.text(f.label, MARGIN, y); y += 5;
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...c.text);
        const lines = doc.splitTextToSize(String(f.val), TW);
        lines.forEach(l => { y = ensureSpace(y, 6); doc.text(l, MARGIN, y); y += 5; });
        y += 5;
      });
    }
  }

  return doc.output('arraybuffer');
}

// ── TEXT EXPORTS ───────────────────────────────────────────────────────────

function generateListingTXT(d, product) {
  const safeStr = (v) => (v && v !== 'undefined' && v !== 'null') ? String(v) : '(not generated)';
  const priceMin = Number(d.price_min) || Number(d.generated_data?.price_min) || '';
  const priceMax = Number(d.price_max) || Number(d.generated_data?.price_max) || '';
  const priceStr = priceMin && priceMax ? `$${priceMin}–$${priceMax}` : 'See listing';

  return [
    `╔══════════════════════════════════════════════════════════╗`,
    `  LAUNCHORA — COMPLETE SALES PACKAGE`,
    `  ${safeStr(d.title || product.title)}`,
    `╚══════════════════════════════════════════════════════════╝`,
    `  Type: ${product.product_type} | Platform: ${product.platform}`,
    '',
    '━━━ LISTING TITLE ━━━',
    safeStr(d.listing_title),
    '',
    '━━━ LISTING DESCRIPTION ━━━',
    safeStr(d.listing_description),
    '',
    '━━━ SEO KEYWORDS ━━━',
    Array.isArray(d.keywords) && d.keywords.length ? d.keywords.join(', ') : '(not generated)',
    '',
    '━━━ SEO META DESCRIPTION ━━━',
    safeStr(d.seo_meta_description),
    '',
    '━━━ PLATFORM CTA ━━━',
    safeStr(d.platform_cta || d.cta),
    '',
    '━━━ PRICE ━━━',
    priceStr,
    '',
    '━━━ PRODUCT PROMISE ━━━',
    safeStr(d.promise),
    '',
    '━━━ TARGET AUDIENCE ━━━',
    safeStr(d.audience),
    '',
    '━━━ BUYER PROFILE ━━━',
    safeStr(d.buyer_profile),
    '',
    '━━━ SELLING ANGLE ━━━',
    safeStr(d.selling_angle),
    '',
    '━━━ KEY BENEFITS ━━━',
    Array.isArray(d.benefits) && d.benefits.length
      ? d.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')
      : safeStr(null),
    '',
    '━━━ PRODUCT STRUCTURE ━━━',
    Array.isArray(d.structure) && d.structure.length
      ? d.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : safeStr(null),
    '',
    '━━━ VISUAL DIRECTION ━━━',
    safeStr(d.visual_direction),
    '',
    '━━━ COVER CONCEPT ━━━',
    safeStr(d.cover_concept),
    '',
    '━━━ PRICE RATIONALE ━━━',
    safeStr(d.price_rationale),
    '',
    `Generated by Launchora`,
  ].join('\n');
}

function generateContentTXT(d, product) {
  const title = d.title || product.title || 'Product';
  const lines = ['='.repeat(60), title, '='.repeat(60), ''];
  if (d.promise) lines.push(`PROMISE: ${d.promise}`, '');
  if (d.audience) lines.push(`FOR: ${d.audience}`, '');
  lines.push('─'.repeat(60), 'FULL PRODUCT CONTENT', '─'.repeat(60), '');
  lines.push(d.content_draft || '(Content not yet generated)');
  return lines.join('\n');
}

function generatePlatformGuideTXT(d, product) {
  const pg = d.platform_guidance || {};
  const safeStr = (v) => (v && String(v).trim()) ? String(v) : '(not generated)';
  return [
    `╔══════════════════════════════════════════════════════════╗`,
    `  LAUNCHORA — PLATFORM LAUNCH GUIDE`,
    `  ${d.title || product.title}`,
    `  Platform: ${product.platform}`,
    `╚══════════════════════════════════════════════════════════╝`,
    '',
    '━━━ WHY THIS PLATFORM ━━━',
    safeStr(pg.why_this_platform),
    '',
    '━━━ PLATFORM AUDIENCE ━━━',
    safeStr(pg.platform_audience),
    '',
    '━━━ PRICING STRATEGY ━━━',
    safeStr(pg.pricing_strategy),
    '',
    '━━━ THUMBNAIL GUIDANCE ━━━',
    safeStr(pg.thumbnail_guidance),
    '',
    '━━━ LAUNCH PLAN ━━━',
    safeStr(pg.launch_plan),
    '',
    '━━━ PRO TIPS ━━━',
    Array.isArray(pg.pro_tips) && pg.pro_tips.length
      ? pg.pro_tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')
      : safeStr(null),
    '',
    '━━━ MISTAKES TO AVOID ━━━',
    Array.isArray(pg.mistakes_to_avoid) && pg.mistakes_to_avoid.length
      ? pg.mistakes_to_avoid.map((m, i) => `${i + 1}. ${m}`).join('\n')
      : safeStr(null),
    '',
    `Generated by Launchora`,
  ].join('\n');
}

// ── ZIP BUILDER ────────────────────────────────────────────────────────────

async function buildZip(files) {
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
      new Uint8Array([0x50,0x4B,0x03,0x04]),
      u16(20), u16(0), u16(0),
      u16(dosTime), u16(dosDate),
      u32(crc), u32(fileData.length), u32(fileData.length),
      u16(nameBytes.length), u16(0), nameBytes,
    );
    entries.push({ name, nameBytes, crc, size: fileData.length, offset, dosTime, dosDate, localHeader, fileData });
    offset += localHeader.length + fileData.length;
  }

  const cdParts = entries.map(e => concat(
    new Uint8Array([0x50,0x4B,0x01,0x02]),
    u16(20), u16(20), u16(0), u16(0),
    u16(e.dosTime), u16(e.dosDate),
    u32(e.crc), u32(e.size), u32(e.size),
    u16(e.nameBytes.length), u16(0), u16(0), u16(0), u16(0),
    u32(0), u32(e.offset), e.nameBytes,
  ));

  const centralDir = concat(...cdParts);
  const eocd = concat(
    new Uint8Array([0x50,0x4B,0x05,0x06]),
    u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(centralDir.length), u32(offset), u16(0),
  );

  return concat(...entries.flatMap(e => [e.localHeader, e.fileData]), centralDir, eocd);
}

function uint8ToBase64(bytes) {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ── HANDLER ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { productId, stylePreset } = await req.json();

    if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });

    const products = await base44.asServiceRole.entities.Product.list();
    const product = (products || []).find(p => p.id === productId);
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    const d = product.generated_data || {};
    const blocks = d.product_blocks || [];
    const preset = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.minimal;

    console.log(`[generateZip] Generating for product: ${d.title || product.title}`);
    console.log(`[generateZip] Blocks: ${blocks.length}, has listing: ${blocks.some(b => b.type === 'listing')}`);
    console.log(`[generateZip] price_min: ${d.price_min}, listing_title: ${d.listing_title ? 'ok' : 'missing'}`);

    const pdfBytes = await generateProductPDF(product, blocks, preset);
    const listingTxt = generateListingTXT(d, product);
    const contentTxt = generateContentTXT(d, product);
    const platformTxt = generatePlatformGuideTXT(d, product);

    const safeName = (d.title || product.title || 'product')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);

    const readmeTxt = [
      'LAUNCHORA — PRODUCT PACKAGE',
      '============================',
      '',
      `Product: ${d.title || product.title}`,
      `Type: ${product.product_type} | Platform: ${product.platform}`,
      '',
      'INCLUDED FILES:',
      `  📄 ${safeName}_product.pdf         → Full formatted product (print-ready PDF)`,
      `  📋 ${safeName}_listing.txt         → Complete platform listing (paste-ready)`,
      `  📝 ${safeName}_content.txt         → Full product content draft`,
      `  🚀 ${safeName}_platform_guide.txt  → Platform-specific launch strategy`,
      '',
      'HOW TO USE THIS PACKAGE:',
      '  1. Open _product.pdf to review your complete formatted product',
      '  2. Open _listing.txt to copy your listing title, description, and keywords',
      '  3. Follow _platform_guide.txt for your launch strategy',
      '  4. Use _content.txt if you want to edit or repurpose the raw content',
      '',
      'Generated by Launchora · launchora.com',
    ].join('\n');

    const zipData = await buildZip([
      { name: `${safeName}_product.pdf`, data: pdfBytes },
      { name: `${safeName}_listing.txt`, data: listingTxt },
      { name: `${safeName}_content.txt`, data: contentTxt },
      { name: `${safeName}_platform_guide.txt`, data: platformTxt },
      { name: 'README.txt', data: readmeTxt },
    ]);

    const zip_base64 = uint8ToBase64(zipData);
    return Response.json({ zip_base64, filename: `${safeName}_launchora.zip` });

  } catch (error) {
    console.error('[generateZip] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
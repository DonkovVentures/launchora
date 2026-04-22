import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Helper: generate rich PDF from product blocks
async function generateProductPDF(product, blocks, preset) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const d = product.generated_data || {};
  const W = 210, MARGIN = 20, TW = W - MARGIN * 2;

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  };

  const colors = {
    bg: hexToRgb(preset?.bg || '#ffffff'),
    text: hexToRgb(preset?.text || '#1a1a1a'),
    accent: hexToRgb(preset?.accent || '#ea580c'),
    heading: hexToRgb(preset?.heading || '#111111'),
  };

  let pageNum = 1;
  const addPage = () => { doc.addPage(); pageNum++; };

  const setColor = (rgb) => doc.setTextColor(...rgb);
  const setFill = (rgb) => doc.setFillColor(...rgb);

  const wrapText = (text, maxWidth, fontSize) => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(String(text || ''), maxWidth);
  };

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (bi > 0) { addPage(); }

    // Background
    setFill(colors.bg);
    doc.rect(0, 0, 210, 297, 'F');

    let y = MARGIN;

    if (block.type === 'cover') {
      // Accent bar top
      doc.setFillColor(...colors.accent);
      doc.rect(0, 0, 210, 8, 'F');
      y = 40;

      setColor(colors.accent);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text((product.product_type || '').toUpperCase(), MARGIN, y);
      y += 12;

      setColor(colors.heading);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      const titleLines = wrapText(block.content?.title || d.title || product.title, TW, 26);
      titleLines.forEach(line => { doc.text(line, MARGIN, y); y += 10; });
      y += 6;

      if (block.content?.subtitle) {
        setColor(colors.text);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'normal');
        const subLines = wrapText(block.content.subtitle, TW, 13);
        subLines.forEach(line => { doc.text(line, MARGIN, y); y += 7; });
        y += 8;
      }

      if (block.content?.promise) {
        doc.setFillColor(...colors.accent);
        doc.rect(MARGIN, y, TW, 0.5, 'F');
        y += 8;
        setColor(colors.accent);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('THE PROMISE', MARGIN, y); y += 7;
        setColor(colors.text);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const pLines = wrapText(block.content.promise, TW, 10);
        pLines.forEach(line => { doc.text(line, MARGIN, y); y += 6; });
      }

      // Bottom accent bar
      doc.setFillColor(...colors.accent);
      doc.rect(0, 289, 210, 8, 'F');

    } else if (block.type === 'toc') {
      setColor(colors.accent);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLE OF CONTENTS', MARGIN, y); y += 12;

      doc.setFillColor(...colors.accent);
      doc.rect(MARGIN, y, TW, 0.5, 'F'); y += 8;

      const items = block.content?.items || [];
      items.forEach((item, i) => {
        setColor(colors.text);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${i + 1}.  ${item}`, MARGIN + 4, y);
        y += 9;
        if (y > 270) { addPage(); setFill(colors.bg); doc.rect(0,0,210,297,'F'); y = MARGIN; }
      });

    } else if (block.type === 'section') {
      setColor(colors.accent);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const hLines = wrapText(block.content?.title || block.heading, TW, 14);
      hLines.forEach(l => { doc.text(l, MARGIN, y); y += 8; });
      doc.setFillColor(...colors.accent);
      doc.rect(MARGIN, y, TW, 0.5, 'F'); y += 8;

      setColor(colors.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const bodyLines = wrapText(block.content?.body || '', TW, 10);
      bodyLines.forEach(line => {
        if (y > 275) { addPage(); setFill(colors.bg); doc.rect(0,0,210,297,'F'); y = MARGIN; }
        doc.text(line, MARGIN, y); y += 5.5;
      });

    } else if (block.type === 'checklist') {
      setColor(colors.accent);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(block.content?.title || block.heading, MARGIN, y); y += 12;

      const items = block.content?.items || [];
      items.forEach(item => {
        if (y > 275) { addPage(); setFill(colors.bg); doc.rect(0,0,210,297,'F'); y = MARGIN; }
        doc.setFillColor(...colors.accent);
        doc.rect(MARGIN, y - 3.5, 4, 4, 'F');
        setColor(colors.text);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const iLines = wrapText(item, TW - 8, 10);
        iLines.forEach((l, li) => { doc.text(l, MARGIN + 7, y + (li * 5.5)); });
        y += iLines.length * 5.5 + 3;
      });

    } else if (block.type === 'listing') {
      setColor(colors.accent);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLATFORM LISTING', MARGIN, y); y += 12;

      const fields = [
        { label: 'LISTING TITLE', val: block.content?.listing_title },
        { label: 'DESCRIPTION', val: block.content?.listing_description },
        { label: 'KEYWORDS', val: (block.content?.keywords || []).join(', ') },
        { label: 'PRICE', val: `$${block.content?.price_min}–$${block.content?.price_max}` },
        { label: 'CTA', val: block.content?.platform_cta || block.content?.cta },
      ];
      fields.forEach(f => {
        if (!f.val) return;
        if (y > 255) { addPage(); setFill(colors.bg); doc.rect(0,0,210,297,'F'); y = MARGIN; }
        setColor(colors.accent);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(f.label, MARGIN, y); y += 5;
        setColor(colors.text);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        const lines = wrapText(f.val, TW, 9.5);
        lines.forEach(l => { doc.text(l, MARGIN, y); y += 5; });
        y += 5;
      });

    } else {
      // Generic block
      setColor(colors.heading);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(block.heading || block.type, MARGIN, y); y += 10;
      const bodyText = block.content?.body || block.content?.text || JSON.stringify(block.content || '');
      setColor(colors.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const bLines = wrapText(bodyText, TW, 10);
      bLines.forEach(line => {
        if (y > 275) { addPage(); setFill(colors.bg); doc.rect(0,0,210,297,'F'); y = MARGIN; }
        doc.text(line, MARGIN, y); y += 5.5;
      });
    }

    // Page footer
    setColor([180,180,180]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${d.title || product.title}  ·  Page ${pageNum}`, MARGIN, 290);
  }

  return doc.output('arraybuffer');
}

// Helper: generate plain text listing file
function generateListingTXT(product) {
  const d = product.generated_data || {};
  return [
    `PRODUCT: ${d.title || product.title}`,
    `Type: ${product.product_type} | Platform: ${product.platform}`,
    '',
    '━━━ LISTING TITLE ━━━',
    d.listing_title || '',
    '',
    '━━━ DESCRIPTION ━━━',
    d.listing_description || '',
    '',
    '━━━ SEO KEYWORDS ━━━',
    (d.keywords || []).join(', '),
    '',
    '━━━ SEO META DESCRIPTION ━━━',
    d.seo_meta_description || '',
    '',
    '━━━ PLATFORM CTA ━━━',
    d.platform_cta || d.cta || '',
    '',
    '━━━ PRICE ━━━',
    `$${d.price_min}–$${d.price_max}`,
    '',
    '━━━ PROMISE ━━━',
    d.promise || '',
    '',
    '━━━ TARGET AUDIENCE ━━━',
    d.audience || '',
    '',
    '━━━ BUYER PROFILE ━━━',
    d.buyer_profile || '',
    '',
    '━━━ SELLING ANGLE ━━━',
    d.selling_angle || '',
    '',
    '━━━ BENEFITS ━━━',
    (d.benefits || []).map((b, i) => `${i + 1}. ${b}`).join('\n'),
    '',
    '━━━ PRODUCT STRUCTURE ━━━',
    (d.structure || []).map((s, i) => `${i + 1}. ${s}`).join('\n'),
    '',
    '━━━ VISUAL DIRECTION ━━━',
    d.visual_direction || '',
    '',
    '━━━ COVER CONCEPT ━━━',
    d.cover_concept || '',
  ].join('\n');
}

// Helper: generate content draft TXT
function generateContentTXT(product) {
  const d = product.generated_data || {};
  return `${d.title || product.title}\n${'='.repeat(60)}\n\n${d.content_draft || 'No content draft available.'}`;
}

// Helper: generate platform guide TXT
function generatePlatformGuideTXT(product) {
  const d = product.generated_data || {};
  const pg = d.platform_guidance || {};
  return [
    `PLATFORM GUIDE: ${product.platform}`,
    '='.repeat(60),
    '',
    'WHY THIS PLATFORM',
    pg.why_this_platform || '',
    '',
    'PLATFORM AUDIENCE',
    pg.platform_audience || '',
    '',
    'PRICING STRATEGY',
    pg.pricing_strategy || '',
    '',
    'THUMBNAIL GUIDANCE',
    pg.thumbnail_guidance || '',
    '',
    'LAUNCH PLAN',
    pg.launch_plan || '',
    '',
    'PRO TIPS',
    (pg.pro_tips || []).map((t, i) => `${i + 1}. ${t}`).join('\n'),
    '',
    'MISTAKES TO AVOID',
    (pg.mistakes_to_avoid || []).map((m, i) => `${i + 1}. ${m}`).join('\n'),
  ].join('\n');
}

// Simple ZIP builder (using stored file approach)
async function buildZip(files) {
  // We'll encode files as a simple ZIP using pure JS
  // Using a minimal ZIP implementation
  const encoder = new TextEncoder();

  const toBytes = (str) => typeof str === 'string' ? encoder.encode(str) : new Uint8Array(str);

  // CRC32 table
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

  for (const { name, data } of files) {
    const nameBytes = encoder.encode(name);
    const fileData = toBytes(data);
    const crc = crc32(fileData);
    const now = new Date();
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);

    const localHeader = concat(
      new Uint8Array([0x50,0x4B,0x03,0x04]), // signature
      u16(20), // version needed
      u16(0),  // flags
      u16(0),  // compression (stored)
      u16(dosTime), u16(dosDate),
      u32(crc),
      u32(fileData.length), // compressed size
      u32(fileData.length), // uncompressed size
      u16(nameBytes.length),
      u16(0), // extra length
      nameBytes,
    );

    entries.push({ name, nameBytes, crc, size: fileData.length, offset, dosTime, dosDate, localHeader, fileData });
    offset += localHeader.length + fileData.length;
  }

  // Central directory
  const cdParts = [];
  for (const e of entries) {
    const cd = concat(
      new Uint8Array([0x50,0x4B,0x01,0x02]),
      u16(20), u16(20), u16(0), u16(0),
      u16(e.dosTime), u16(e.dosDate),
      u32(e.crc),
      u32(e.size), u32(e.size),
      u16(e.nameBytes.length),
      u16(0), u16(0), u16(0), u16(0),
      u32(0),
      u32(e.offset),
      e.nameBytes,
    );
    cdParts.push(cd);
  }

  const centralDir = concat(...cdParts);
  const cdSize = centralDir.length;
  const cdOffset = offset;

  const eocd = concat(
    new Uint8Array([0x50,0x4B,0x05,0x06]),
    u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(cdSize), u32(cdOffset),
    u16(0),
  );

  const allParts = [
    ...entries.flatMap(e => [e.localHeader, e.fileData]),
    centralDir,
    eocd,
  ];
  return concat(...allParts);
}

const STYLE_PRESETS = {
  minimal: { bg: '#ffffff', text: '#1a1a1a', accent: '#ea580c', font: 'sans', heading: '#111111' },
  premium: { bg: '#0f0f0f', text: '#e8e0d4', accent: '#c9a96e', font: 'serif', heading: '#f5efe8' },
  feminine: { bg: '#fff5f7', text: '#4a3040', accent: '#d4628a', font: 'sans', heading: '#2d1a28' },
  business: { bg: '#f8fafc', text: '#1e293b', accent: '#2563eb', font: 'sans', heading: '#0f172a' },
  elegant: { bg: '#faf8f5', text: '#2c2417', accent: '#8b6914', font: 'serif', heading: '#1a1208' },
  modern: { bg: '#f0fdf4', text: '#14532d', accent: '#16a34a', font: 'sans', heading: '#052e16' },
  pastel: { bg: '#fef9f0', text: '#78716c', accent: '#fb923c', font: 'sans', heading: '#44403c' },
  bold: { bg: '#18181b', text: '#d4d4d8', accent: '#f59e0b', font: 'sans', heading: '#fafafa' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { productId, stylePreset } = await req.json();

    if (!productId) {
      return Response.json({ error: 'productId required' }, { status: 400 });
    }

    const products = await base44.asServiceRole.entities.Product.list();
    const product = (products || []).find(p => p.id === productId);

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const blocks = product.generated_data?.product_blocks || [];
    const preset = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.minimal;

    // Generate files
    const pdfBytes = await generateProductPDF(product, blocks, preset);
    const listingTxt = generateListingTXT(product);
    const contentTxt = generateContentTXT(product);
    const platformTxt = generatePlatformGuideTXT(product);

    const safeName = (product.generated_data?.title || product.title || 'product')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);

    const zipData = await buildZip([
      { name: `${safeName}_product.pdf`, data: pdfBytes },
      { name: `${safeName}_listing.txt`, data: listingTxt },
      { name: `${safeName}_content.txt`, data: contentTxt },
      { name: `${safeName}_platform_guide.txt`, data: platformTxt },
      { name: 'README.txt', data: `Launchora Product Package\n========================\n\nFiles included:\n- ${safeName}_product.pdf   → Full formatted product (print-ready)\n- ${safeName}_listing.txt  → Ready-to-paste platform listing\n- ${safeName}_content.txt  → Full product content draft\n- ${safeName}_platform_guide.txt → Platform-specific launch strategy\n\nGenerated by Launchora · launchora.com\n` },
    ]);

    return new Response(zipData, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}_launchora.zip"`,
      },
    });
  } catch (error) {
    console.error('ZIP generation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
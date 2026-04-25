import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let body = {};

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    body = await req.json();
    const { productId } = body;
    console.log('[generateZip] productId:', productId);

    if (!productId) {
      return Response.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    // Mark export as in-progress
    await base44.asServiceRole.entities.Product.update(productId, {
      export_status: 'generating',
      export_error: null,
    });

    // Fetch the product record
    const product = await base44.asServiceRole.entities.Product.get(productId);
    if (!product) {
      return Response.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Normalize: prefer structured fields, fall back to generated_data
    const d = product.generated_data || {};
    const title = product.title || d.title || 'Untitled Product';
    const subtitle = product.subtitle || d.subtitle || '';
    const promise = product.promise || d.promise || '';

    // Sections: prefer structured product.sections, fall back to generated_data.sections
    const sections = (product.sections && product.sections.length > 0)
      ? product.sections
      : (d.sections && d.sections.length > 0)
        ? d.sections
        : [];

    // Marketing assets
    const ma = product.marketing_assets || {};
    const listingTitle = ma.listing_title || d.listing_title || title;
    const listingDescription = ma.listing_description || d.listing_description || '';
    const keywords = ma.keywords || d.keywords || [];
    const priceMin = ma.price_min ?? d.price_min ?? '';
    const priceMax = ma.price_max ?? d.price_max ?? '';
    const cta = ma.cta || d.cta || '';

    // Platform guides
    const pg = product.platform_guides || d.platform_guidance || {};
    const launchPlan = pg.launch_plan || product.launch_plan || '';

    // Content draft
    const contentDraft = d.content_draft || sections.map(s => `## ${s.title}\n\n${s.body}`).join('\n\n');

    // Build README
    const readmeContent = [
      `LAUNCHORA — ${title}`,
      `${'─'.repeat(60)}`,
      `Subtitle: ${subtitle}`,
      `Promise: ${promise}`,
      `Platform: ${product.platform || ''}`,
      `Type: ${product.product_type || ''}`,
      `Niche: ${product.niche || ''}`,
      `Price: $${priceMin}–$${priceMax}`,
      '',
      `CTA: ${cta}`,
      '',
      `Generated by Launchora`,
    ].join('\n');

    // Build PRODUCT CONTENT file
    const productContent = contentDraft || `# ${title}\n\n${subtitle}`;

    // Build LISTING file
    const listingContent = [
      `LISTING TITLE:\n${listingTitle}`,
      `\nDESCRIPTION:\n${listingDescription}`,
      `\nKEYWORDS:\n${keywords.join(', ')}`,
      `\nPRICE: $${priceMin}–$${priceMax}`,
      `\nCTA: ${cta}`,
    ].join('\n');

    // Build LAUNCH PLAN file
    const launchContent = launchPlan
      ? `LAUNCH PLAN — ${title}\n${'─'.repeat(60)}\n\n${launchPlan}`
      : `LAUNCH PLAN — ${title}\n\nSee your product dashboard for the full launch guide.`;

    const zipBytes = buildZip([
      { name: 'README.txt', data: readmeContent },
      { name: 'Product_Content.txt', data: productContent },
      { name: 'Listing.txt', data: listingContent },
      { name: 'Launch_Plan.txt', data: launchContent },
    ]);
    console.log('[generateZip] ZIP built, size:', zipBytes.length, '— sections:', sections.length);

    // Upload to Base44 storage
    const zipFile = new File([zipBytes], 'launchora-test-export.zip', { type: 'application/zip' });
    const uploadResult = await base44.integrations.Core.UploadFile({ file: zipFile });
    console.log('[generateZip] upload result:', JSON.stringify(uploadResult));

    if (!uploadResult?.file_url) {
      return Response.json({
        success: false,
        error: 'Upload returned no file_url',
        details: JSON.stringify(uploadResult),
      }, { status: 500 });
    }

    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}_export.zip`;

    // Persist export metadata back to structured fields
    await base44.asServiceRole.entities.Product.update(productId, {
      export_status: 'ready',
      last_exported_at: new Date().toISOString(),
      export_error: null,
      export_files: [{ name: fileName, url: uploadResult.file_url, type: 'zip', generated_at: new Date().toISOString(), size: zipBytes.length }],
    });

    return Response.json({
      success: true,
      fileUrl: uploadResult.file_url,
      fileName,
    });

  } catch (error) {
    console.error('[generateZip] error:', error.message);
    // Mark export as failed with a readable message
    try {
      await base44.asServiceRole.entities.Product.update(body?.productId, {
        export_status: 'failed',
        export_error: error.message || 'Unknown error during ZIP generation',
      });
    } catch (_) { /* best-effort */ }
    return Response.json({ success: false, error: error.message, details: error.stack || '' }, { status: 500 });
  }
});
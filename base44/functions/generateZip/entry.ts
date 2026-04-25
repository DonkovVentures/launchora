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

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;
    console.log('[generateZip] productId:', productId);

    if (!productId) {
      return Response.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    // Build minimal ZIP with one file
    const zipBytes = buildZip([
      { name: 'README.txt', data: 'Launchora ZIP export test successful.' },
    ]);
    console.log('[generateZip] ZIP built, size:', zipBytes.length);

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

    return Response.json({
      success: true,
      fileUrl: uploadResult.file_url,
      fileName: 'launchora-test-export.zip',
    });

  } catch (error) {
    console.error('[generateZip] error:', error.message);
    return Response.json({ success: false, error: error.message, details: error.stack || '' }, { status: 500 });
  }
});
import { jsPDF } from 'jspdf';

export function exportBlocksPDF(blocks, product, preset) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 16;
  const contentW = W - margin * 2;
  let pageNum = 1;

  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const bgRgb = hex2rgb(preset.bg || '#ffffff');
  const accentRgb = hex2rgb(preset.accent || '#ea580c');
  const textRgb = hex2rgb(preset.text || '#1a1a1a');
  const headingRgb = hex2rgb(preset.heading || '#111111');

  const fontName = preset.font === 'serif' ? 'times' : 'helvetica';

  const newPage = () => {
    doc.addPage();
    pageNum++;
    doc.setFillColor(...bgRgb);
    doc.rect(0, 0, W, H, 'F');
    // footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${product?.generated_data?.title || product?.title || 'Product'} · Page ${pageNum}`, W / 2, H - 6, { align: 'center' });
    return margin + 6;
  };

  const ensureSpace = (y, needed) => {
    if (y + needed > H - 14) return newPage();
    return y;
  };

  const writeText = (text, x, y, opts = {}) => {
    const { maxWidth = contentW, fontSize = 10, color = textRgb, bold = false } = opts;
    doc.setFont(fontName, bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach(line => {
      doc.text(line, x, y);
      y += fontSize * 0.45;
    });
    return y + 2;
  };

  // Render each block
  blocks.forEach((block, blockIdx) => {
    const c = block.content || {};
    let y;

    if (blockIdx === 0 && block.type === 'cover') {
      // Cover page — full colored background
      doc.setFillColor(...accentRgb);
      doc.rect(0, 0, W, H, 'F');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...bgRgb);
      doc.text(`${product?.product_type || 'Digital Product'}`.toUpperCase(), margin, 24);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(28);
      const titleLines = doc.splitTextToSize(c.title || 'Product', contentW);
      let ty = 40;
      titleLines.forEach(line => {
        doc.text(line, margin, ty);
        ty += 13;
      });

      if (c.subtitle) {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(13);
        doc.setTextColor(...bgRgb);
        doc.globalAlpha = 0.8;
        const subLines = doc.splitTextToSize(c.subtitle, contentW);
        subLines.forEach(line => { doc.text(line, margin, ty); ty += 7; });
        doc.globalAlpha = 1;
      }

      if (c.promise) {
        doc.setFillColor(...bgRgb);
        doc.roundedRect(margin, ty + 8, contentW, 18, 3, 3, 'F');
        doc.setFont(fontName, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...accentRgb);
        const promLines = doc.splitTextToSize(c.promise, contentW - 8);
        doc.text(promLines, margin + 4, ty + 17);
        ty += 28;
      }

      if (c.audience) {
        doc.setFont(fontName, 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...bgRgb);
        doc.text(`For: ${c.audience}`, margin, H - 18);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...bgRgb);
      doc.text(`Created with Launchora · ${new Date().toLocaleDateString()}`, margin, H - 10);
      return; // no more rendering for cover
    }

    // All other blocks — each on a new page
    doc.addPage();
    pageNum++;
    doc.setFillColor(...bgRgb);
    doc.rect(0, 0, W, H, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${product?.generated_data?.title || 'Product'} · Page ${pageNum}`, W / 2, H - 6, { align: 'center' });
    y = margin + 6;

    // Accent top rule
    doc.setFillColor(...accentRgb);
    doc.rect(margin, y, contentW, 1.5, 'F');
    y += 6;

    if (block.type === 'toc') {
      y = writeText('Table of Contents', margin, y, { fontSize: 18, color: headingRgb, bold: true });
      y += 4;
      (c.items || []).forEach((item, i) => {
        y = ensureSpace(y, 10);
        doc.setFillColor(...accentRgb);
        doc.circle(margin + 3, y - 2.5, 3, 'F');
        doc.setFont(fontName, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textRgb);
        doc.text(`${i + 1}. ${item}`, margin + 9, y);
        y += 7;
      });

    } else if (block.type === 'section') {
      if (c.heading) {
        y = writeText(c.heading, margin, y, { fontSize: 16, color: headingRgb, bold: true });
        y += 3;
      }
      if (c.body) {
        const bodyLines = doc.splitTextToSize(c.body, contentW);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textRgb);
        bodyLines.forEach(line => {
          y = ensureSpace(y, 7);
          doc.text(line, margin, y);
          y += 5.5;
        });
      }

    } else if (block.type === 'checklist') {
      if (c.title) {
        y = writeText(c.title, margin, y, { fontSize: 16, color: headingRgb, bold: true });
        y += 3;
      }
      (c.items || []).forEach(item => {
        y = ensureSpace(y, 10);
        doc.setDrawColor(...accentRgb);
        doc.setLineWidth(0.6);
        doc.roundedRect(margin, y - 4, 5, 5, 0.8, 0.8, 'S');
        doc.setFont(fontName, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...textRgb);
        const lines = doc.splitTextToSize(item, contentW - 10);
        lines.forEach((line, li) => {
          doc.text(line, margin + 9, y + li * 5.5);
        });
        y += lines.length * 5.5 + 3;
      });

    } else if (block.type === 'worksheet') {
      if (c.title) {
        y = writeText(c.title, margin, y, { fontSize: 16, color: headingRgb, bold: true });
        y += 3;
      }
      if (c.instructions) {
        doc.setFont(fontName, 'italic');
        doc.setFontSize(9);
        doc.setTextColor(150, 130, 110);
        const iLines = doc.splitTextToSize(c.instructions, contentW);
        iLines.forEach(l => { doc.text(l, margin, y); y += 5; });
        y += 4;
      }
      (c.questions || []).forEach((q, qi) => {
        y = ensureSpace(y, 30);
        y = writeText(`${qi + 1}. ${q}`, margin, y, { fontSize: 10, color: textRgb, bold: true });
        y += 2;
        for (let li = 0; li < 4; li++) {
          doc.setDrawColor(...accentRgb);
          doc.setLineWidth(0.3);
          doc.line(margin, y, margin + contentW, y);
          y += 7;
        }
        y += 4;
      });

    } else if (block.type === 'prompt') {
      if (c.title) {
        y = writeText(c.title, margin, y, { fontSize: 16, color: headingRgb, bold: true });
        y += 3;
      }
      if (c.intro) {
        doc.setFont(fontName, 'italic');
        doc.setFontSize(9);
        doc.setTextColor(150, 130, 110);
        doc.text(c.intro, margin, y);
        y += 8;
      }
      (c.prompts || []).forEach((p, i) => {
        y = ensureSpace(y, 20);
        doc.setFillColor(...accentRgb);
        doc.roundedRect(margin, y - 4, contentW, 14, 2, 2, 'F');
        doc.setFont(fontName, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`→ ${p}`, margin + 4, y + 3);
        y += 18;
      });

    } else if (block.type === 'notes') {
      if (c.title) {
        y = writeText(c.title, margin, y, { fontSize: 16, color: headingRgb, bold: true });
        y += 6;
      }
      const lineCount = c.lines || 12;
      for (let li = 0; li < lineCount; li++) {
        y = ensureSpace(y, 10);
        doc.setDrawColor(...accentRgb);
        doc.setLineWidth(0.25);
        doc.line(margin, y, margin + contentW, y);
        y += 10;
      }

    } else if (block.type === 'listing') {
      // Accent header
      doc.setFillColor(...accentRgb);
      doc.roundedRect(margin, y - 4, contentW, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('MARKETPLACE LISTING COPY — READY TO PASTE', margin + 4, y + 2.5);
      y += 14;

      if (c.listing_title) {
        y = writeText('Listing Title:', margin, y, { fontSize: 8, color: accentRgb, bold: true });
        y = writeText(c.listing_title, margin, y, { fontSize: 11, color: headingRgb, bold: true });
        y += 4;
      }
      if (c.listing_description) {
        y = writeText('Description:', margin, y, { fontSize: 8, color: accentRgb, bold: true });
        const descLines = doc.splitTextToSize(c.listing_description, contentW);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...textRgb);
        descLines.forEach(l => { y = ensureSpace(y, 6); doc.text(l, margin, y); y += 5.5; });
        y += 4;
      }
      if (c.keywords?.length) {
        y = writeText('Keywords / Tags:', margin, y, { fontSize: 8, color: accentRgb, bold: true });
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...textRgb);
        doc.text(c.keywords.join(', '), margin, y, { maxWidth: contentW });
        y += 8;
      }
      if (c.price_min || c.price_max) {
        y = writeText(`Suggested Price: $${c.price_min}–$${c.price_max}`, margin, y, { fontSize: 12, color: accentRgb, bold: true });
      }
    }
  });

  const filename = `${(product?.generated_data?.title || product?.title || 'product').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}
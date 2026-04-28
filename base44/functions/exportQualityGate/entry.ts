import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Export Quality Gate — standalone backend function.
 * Called by generateZip after all files are built, before the ZIP is assembled.
 * Returns { qualityScore, readinessVerdict, passedChecks, failedQualityChecks, criticalMismatch, criticalIssues }
 */

const EXTENDED_BANNED = [
  'content pending', 'todo', 'undefined', 'nan', 'placeholder-only section',
  '[bonus feature]', '[companion template pack]', 'day ?', 'empty hook:',
  'insert your specific content here',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { files = [], filesIncluded = [], masterGuideMd, masterGuideHtml, masterGuidePdfSize, n = {} } = body;

    // Build a string-only file map for content checks
    const fileMap = {};
    for (const f of files) {
      if (f && f.name && typeof f.data === 'string') fileMap[f.name] = f.data;
    }
    const getFile = name => fileMap[name] || null;

    const passed = [], failed = [], criticalIssues = [];

    const check = (label, ok, file, reason, fix, isCritical = false) => {
      if (ok) {
        passed.push({ label, file: file || '—' });
      } else {
        const entry = { label, file: file || '—', reason, fix };
        failed.push(entry);
        if (isCritical) criticalIssues.push(entry);
      }
    };

    // ── 1. Master guide exists ────────────────────────────────────────────────
    check('Master guide (Markdown) exists and is substantial',
      !!masterGuideMd && masterGuideMd.length > 200,
      '01_Product/Master_Product_Guide.md',
      'Master guide Markdown missing or too short (<200 chars)',
      'Re-run export — buildMasterGuide failed or returned empty content', true);

    check('Master guide (HTML) exists and is substantial',
      !!masterGuideHtml && masterGuideHtml.length > 500,
      '01_Product/Master_Product_Guide.html',
      'Master guide HTML missing or too short (<500 chars)',
      'Re-run export — buildMasterGuide HTML output is empty');

    // ── 2. PDF not empty ──────────────────────────────────────────────────────
    const pdfSize = Number(masterGuidePdfSize) || 0;
    // Only fail if PDF was attempted (size provided) and is suspiciously small
    if (pdfSize > 0) {
      check('Master guide PDF is not empty (>2KB)',
        pdfSize > 2000,
        '01_Product/Master_Product_Guide.pdf',
        `Master guide PDF is only ${pdfSize} bytes — appears empty or corrupt`,
        'Re-run export — buildMasterGuidePDF returned near-empty output', true);
    } else {
      passed.push({ label: 'Master guide PDF check skipped (not generated)', file: '—' });
    }

    // ── 3. HTML not empty ─────────────────────────────────────────────────────
    const htmlContent = getFile('01_Product/Master_Product_Guide.html') || getFile('01_Product/Product_Content.html') || masterGuideHtml || '';
    check('HTML guide is non-empty (>300 chars)',
      htmlContent.length > 300,
      '01_Product/Master_Product_Guide.html',
      'HTML guide is empty or too short',
      'Re-run export');

    // ── 4. Markdown not empty ─────────────────────────────────────────────────
    const mdWords = (masterGuideMd || '').split(/\s+/).filter(Boolean).length;
    check('Markdown guide has substantial content (100+ words)',
      mdWords >= 100,
      '01_Product/Master_Product_Guide.md',
      `Markdown has only ${mdWords} words`,
      'Check buildMasterGuide function output — content generation may have failed');

    // ── 5. Table of contents exists ───────────────────────────────────────────
    const mdLower = (masterGuideMd || '').toLowerCase();
    const hasTOC = mdLower.includes('## ') || mdLower.includes('table of contents') || mdLower.includes('contents');
    check('Table of contents or section headers present in Master Guide',
      hasTOC,
      '01_Product/Master_Product_Guide.md',
      'No ## section headers or "Table of Contents" found in Master Guide',
      'Ensure buildMasterGuide generates structured section headers using ## markdown');

    // ── 6. Visual style guide ─────────────────────────────────────────────────
    const hasStyleGuide = mdLower.includes('color') && mdLower.includes('font');
    check('Visual style guidance present in Master Guide (colors + fonts)',
      hasStyleGuide,
      '01_Product/Master_Product_Guide.md',
      'Master Guide does not mention colors or fonts — no visual style guidance',
      'Ensure buildMasterGuide includes a Visual Style or Brand Guidelines section');

    // ── 7 + 8 + 9. Template files ─────────────────────────────────────────────
    const templateFiles = filesIncluded.filter(f => f.startsWith('01_Product/Template_'));
    if (templateFiles.length > 0) {
      const REQUIRED_SECTIONS = ['layout', 'copy', 'assets', 'export'];
      for (const tf of templateFiles.slice(0, 4)) {
        const content = (fileMap[tf] || '').toLowerCase();
        const missing = REQUIRED_SECTIONS.filter(s => !content.includes(s));
        check(`Template required sections present: ${tf.split('/').pop()}`,
          missing.length === 0, tf,
          `Missing sections: ${missing.join(', ')}`,
          'buildTemplateFile must include Layout, Copy, Assets, and Export sections');

        // QC checklist
        const hasQC = content.includes('quality control') || content.includes('qc') || content.includes('checklist') || content.includes('□');
        check(`Template QC checklist present: ${tf.split('/').pop()}`,
          hasQC, tf,
          'No quality control checklist (□ items) found in template file',
          'buildTemplateFile should end with a QC Checklist section');

        // Content-to-filename mapping
        const slug = tf.replace('01_Product/Template_', '').replace('.txt', '')
          .replace(/_/g, ' ').replace(/^\d+\s*/, '').toLowerCase().slice(0, 25);
        const keyWords = slug.split(' ').filter(w => w.length > 3);
        const titleInContent = keyWords.length === 0 || keyWords.some(w => content.includes(w));
        check(`Template content matches filename: ${tf.split('/').pop()}`,
          titleInContent, tf,
          `Template content does not appear to reference its slug keywords ("${slug}")`,
          'Verify buildTemplateFile uses the correct useCase name in the content body');
      }
    } else {
      passed.push({ label: 'Template file checks skipped (no template files in this product type)', file: '—' });
    }

    // ── 10. No banned text in any file ────────────────────────────────────────
    let bannedIssueCount = 0;
    for (const f of files) {
      if (!f || typeof f.data !== 'string' || f.data.length === 0) continue;
      const lower = f.data.toLowerCase();
      const found = EXTENDED_BANNED.filter(b => lower.includes(b.toLowerCase()));
      if (found.length > 0) {
        bannedIssueCount++;
        const isCrit = found.some(b => ['content pending', 'insert your specific content here'].includes(b.toLowerCase()));
        check(`No banned content: ${f.name.split('/').pop()}`,
          false, f.name,
          `Contains banned phrases: ${found.slice(0, 3).join(', ')}`,
          'cleanText() or the content builder left placeholder text — re-run generation', isCrit);
      }
    }
    if (bannedIssueCount === 0) {
      passed.push({ label: 'No banned placeholder content found in any file', file: '(all files)' });
    }

    // ── 11. Audience grammar ──────────────────────────────────────────────────
    const grammarTestText = [
      getFile('03_Social_Media/Instagram_Captions.txt'),
      getFile('02_Sales_Page/Platform_Listing_Primary.txt'),
      getFile('02_Sales_Page/Gumroad_Listing.txt'),
    ].filter(Boolean).join(' ');
    // Detect raw audience injection patterns: "If you're Independent..." or "for Independent luxury..."
    const badGrammarPattern = /\bIf you're (Independent|The |A |An )/i.test(grammarTestText) ||
      /built for (Independent |The |A |An )[a-z]+ (and |or )?[a-z]+ (and |or )?[a-z]+ (and |or )?[a-z]+ (who are|who|that) tired/i.test(grammarTestText);
    check('Audience grammar is clean — no raw injection into sentences',
      !badGrammarPattern,
      '03_Social_Media/Instagram + 02_Sales_Page/Listing',
      'Raw target_audience string was injected directly into a sentence, causing broken grammar',
      'Use audienceVars() normalized variables (audiencePlural, audienceShort) — never n.audience raw');

    // ── 12. Etsy tags natural, not truncated ──────────────────────────────────
    const etsyContent = getFile('02_Sales_Page/Etsy_Listing.txt') || '';
    const etsyTagsBlock = etsyContent.match(/TAGS[\s\S]*?(?=\n\nTIPS|$)/i)?.[0] || '';
    const etsyTagLines = etsyTagsBlock.split('\n').filter(l => /^\d+\.\s/.test(l.trim()));
    const badTags = etsyTagLines.filter(l => {
      const tag = l.replace(/^\d+\.\s*/, '').trim();
      return tag.length > 20 || /[bcdfghjklmnpqrstvwxyz]{5,}$/.test(tag); // long or ends on consonant cluster
    });
    check('Etsy tags are natural phrases (13 tags, each ≤20 chars)',
      etsyTagLines.length >= 10 && badTags.length === 0,
      '02_Sales_Page/Etsy_Listing.txt',
      `${etsyTagLines.length < 10 ? `Only ${etsyTagLines.length} Etsy tags found (need 13). ` : ''}${badTags.length > 0 ? `Suspicious tags: ${badTags.slice(0, 2).map(t => t.trim()).join(', ')}` : ''}`.trim() || 'Tag validation failed',
      'buildEtsyTags must use pre-validated curated lists — never .slice(0,20) on dynamic strings');

    // ── 13. Product claims match deliverables ─────────────────────────────────
    const claimsText = [
      getFile('02_Sales_Page/Etsy_Listing.txt'),
      getFile('02_Sales_Page/Gumroad_Listing.txt'),
      getFile('02_Sales_Page/Platform_Listing_Primary.txt'),
    ].filter(Boolean).join(' ').toLowerCase();
    const falseSourceFileClaim = /\b(canva template(?!s blueprint)|editable canva|figma file|indesign file|psd file|fully editable template|editable template pack)\b/.test(claimsText);
    const hasActualSourceFiles = filesIncluded.some(f => /\.(canva|fig|psd|ai|indd|sketch)$/.test(f));
    check('Product claims match deliverables — no false source file promises',
      !falseSourceFileClaim || hasActualSourceFiles,
      '02_Sales_Page/ (listings)',
      'Listings claim editable source files (Canva/Figma/PSD/InDesign) but no such files are in the ZIP',
      'Remove all "editable Canva/Figma/PSD" language; replace with "template blueprint system"', true);

    // ── New semantic quality checks (Issue 9) ────────────────────────────────

    // 14. Canonical template list consistency — old template names must not appear in sales listings
    const OLD_TEMPLATE_NAMES = ['cover & welcome', "what's included blueprint", 'how to use these templates blueprint', "the 'curator'", "the 'architectural'", "the 'boutique'"];
    const salesListingsText = [
      getFile('02_Sales_Page/Platform_Listing_Primary.txt'),
      getFile('02_Sales_Page/Gumroad_Listing.txt'),
      getFile('02_Sales_Page/Etsy_Listing.txt'),
    ].filter(Boolean).join(' ').toLowerCase();
    const oldNameFound = OLD_TEMPLATE_NAMES.find(name => salesListingsText.includes(name.toLowerCase()));
    check('Sales listings use current canonical template names (no old placeholders)',
      !oldNameFound,
      '02_Sales_Page/ (listings)',
      `Old template name found in sales listing: "${oldNameFound}"`,
      'Sales listings must use the canonical 10-template list — re-export to regenerate', true);

    // 15. Unsupported numeric performance claims removed
    const allFilesText = Object.values(fileMap).join(' ');
    const hasQuantifiedClaim = /win \d+%[^.]*listings?|achieve \d+% (more|higher)|(\d{2,}% (win|success|close|listing))/i.test(allFilesText);
    check('No unsupported quantified performance claims (e.g. "win 80% more listings")',
      !hasQuantifiedClaim,
      '(all files)',
      'File contains unsupported quantified claim (e.g. "win 80% more listings") — replace with safe premium positioning',
      'Replace with: "increase your chances of winning premium listing presentations" or similar');

    // 16. No double periods or "sellers\'s" grammar issues
    const grammarIssues = [
      { pat: /sellers's/gi, label: '"sellers\'s" (wrong possessive)' },
      { pat: /\b\w+s's\b/g, label: 'double possessive -s\'s pattern' },
      { pat: /\.\s*\./g, label: 'double period (..)' },
    ];
    const socialEmailText = [
      getFile('03_Social_Media/Instagram_Captions.txt'),
      getFile('03_Social_Media/LinkedIn_Posts.txt'),
      getFile('04_Email_Launch/Email_1_Announcement.txt'),
      getFile('04_Email_Launch/Email_3_Problem_Aware.txt'),
    ].filter(Boolean).join(' ');
    const foundGrammar = grammarIssues.find(g => g.pat.test(socialEmailText));
    check('No grammar issues in social/email copy (double periods, broken possessives)',
      !foundGrammar,
      '03_Social_Media/ + 04_Email_Launch/',
      `Grammar issue found: ${foundGrammar?.label || 'unknown'}`,
      'Check social and email files for double periods and broken possessives like "sellers\'s"');

    // 17. Master Guide contains full template sections (not just a summary)
    const mdTemplateDepth = masterGuideMd ? (masterGuideMd.match(/### Template \d+:/gi) || []).length : 0;
    const isTPProduct = (n.type || '').toLowerCase().includes('template');
    if (isTPProduct) {
      check('Master Guide contains full template sections (not just a list)',
        mdTemplateDepth >= 3,
        '01_Product/Master_Product_Guide.md',
        `Master Guide has only ${mdTemplateDepth} "### Template N:" entries — expected 3+ for full template documentation`,
        'buildMasterGuide must generate a full "## Template Assets" section with ### subheadings per template');
    } else {
      passed.push({ label: 'Master Guide template depth check skipped (not a template pack)', file: '—' });
    }

    // 18. PDF safe characters — detect common broken unicode in PDF text (heuristic via markdown)
    const pdfBrokenChars = masterGuideMd ? /[\u2018\u2019\u201C\u201D\u2013\u2014\u2026\u2605\u2714\u2718\u26A0\uFFFD]/.test(masterGuideMd) : false;
    // Only flag if the markdown itself has curly quotes/em-dashes that won't survive PDF encoding
    check('Master Guide markdown uses PDF-safe characters (no curly quotes or em-dashes in critical fields)',
      !pdfBrokenChars,
      '01_Product/Master_Product_Guide.md',
      'Master Guide markdown contains curly quotes or Unicode dashes that may render as broken characters in PDF',
      'Use straight quotes and hyphens in buildMasterGuide — PDF renderer requires ASCII-safe characters');

    // ── Score + verdict ───────────────────────────────────────────────────────
    const total = passed.length + failed.length;
    let score = total > 0 ? Math.round((passed.length / total) * 100) : 100;

    // Cap score based on severity of issues (Issue 9)
    const hasTemplateMismatch = criticalIssues.some(c => c.label.includes('canonical template') || c.label.includes('old placeholder'));
    const hasWrongDeliverables = criticalIssues.some(c => c.label.includes('deliverables') || c.label.includes('source file'));
    const hasUnsupportedClaims = failed.some(c => c.label.includes('quantified performance'));
    const hasBrokenPDF = failed.some(c => c.label.includes('PDF-safe'));

    if ((hasTemplateMismatch || hasWrongDeliverables) && score > 79) score = 79;
    if ((hasUnsupportedClaims || hasBrokenPDF) && score > 84) score = 84;
    if (criticalIssues.length > 0 && score > 79) score = 79;

    let readinessVerdict;
    if (criticalIssues.length > 0) {
      readinessVerdict = 'NOT LAUNCHABLE — critical issues must be resolved first';
    } else if (score >= 95) {
      readinessVerdict = 'READY TO LAUNCH';
    } else if (score >= 85) {
      readinessVerdict = 'BETA READY — needs polish before paid launch';
    } else if (score >= 70) {
      readinessVerdict = 'INTERNAL REVIEW ONLY — not ready for paid customers';
    } else {
      readinessVerdict = 'NOT LAUNCHABLE — resolve failed checks before publishing';
    }

    console.log(`[exportQualityGate] score=${score}% passed=${passed.length} failed=${failed.length} critical=${criticalIssues.length} verdict="${readinessVerdict}"`);

    return Response.json({
      ok: true,
      qualityScore: score,
      readinessVerdict,
      passedChecks: passed,
      failedQualityChecks: failed,
      criticalMismatch: criticalIssues.length > 0,
      criticalIssues,
      totalChecks: total,
    });

  } catch (error) {
    console.error('[exportQualityGate] Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
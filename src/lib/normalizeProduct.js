/**
 * normalizeProduct.js
 * Central helper that normalizes any Product record (old flat generated_data
 * or new structured fields) into a single, consistent shape.
 *
 * Rules:
 * - New structured fields always win over generated_data equivalents.
 * - Falls back to generated_data values when structured fields are absent.
 * - Never crashes on missing/null data.
 * - If pages/blocks are missing, synthesises them from sections.
 * - If sections are missing, synthesises from content_draft or basic info.
 * - productAngle falls back to a generated phrase from title+niche+audience.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
const arr = (v) => (Array.isArray(v) && v.length > 0 ? v : null);
const str = (...candidates) => candidates.find(v => typeof v === 'string' && v.trim().length > 0) || '';
const num = (...candidates) => candidates.find(v => typeof v === 'number' && !isNaN(v)) ?? null;

/** Convert structured sections → studio blocks */
function sectionsToBlocks(sections, product) {
  const d = product.generated_data || {};
  const title = str(product.title, d.title, 'Untitled');
  let blockId = 1;
  const mk = (type, content, heading) => ({ id: String(blockId++), type, content, heading });
  const blocks = [];

  blocks.push(mk('cover', {
    title,
    subtitle: str(product.subtitle, d.subtitle),
    promise: str(product.promise, d.promise),
    audience: str(product.target_audience, product.buyer_profile, d.audience),
  }, 'Cover'));

  const structure = d.structure;
  if (arr(structure)) blocks.push(mk('toc', { items: structure }, 'Table of Contents'));

  sections.forEach((s) => {
    const heading = str(s.title, `Section ${blockId}`);
    const body = str(s.body, '');
    blocks.push(mk('section', { heading, body }, heading));
  });

  const benefits = arr(product.checklist_items) || arr(d.benefits);
  if (benefits) blocks.push(mk('checklist', { title: 'Key Benefits', items: benefits }, 'Key Benefits'));

  const ma = product.marketing_assets || {};
  const keywords = arr(ma.keywords) || arr(d.keywords);
  if (keywords) {
    blocks.push(mk('listing', {
      listing_title: str(ma.listing_title, d.listing_title, title),
      listing_description: str(ma.listing_description, d.listing_description),
      keywords,
      price_min: num(ma.price_min, d.price_min),
      price_max: num(ma.price_max, d.price_max),
      cta: str(ma.cta, d.cta),
    }, `${product.platform || 'Platform'} Listing`));
  }

  return blocks;
}

/** Convert content_draft text → sections array */
function contentDraftToSections(contentDraft) {
  return contentDraft
    .split(/\n\n+/)
    .filter(s => s.trim().length > 30)
    .map((chunk, i) => {
      const lines = chunk.trim().split('\n');
      const title = lines[0].replace(/^#+\s*/, '').substring(0, 80) || `Section ${i + 1}`;
      const body = lines.slice(1).join('\n').trim() || chunk;
      return { title, body };
    });
}

/** Generate a fallback product angle from available metadata */
function derivedAngle(title, niche, audience, productType) {
  if (!title && !niche && !audience) return '';
  const forWhom = audience ? `for ${audience}` : niche ? `in the ${niche} space` : '';
  const what = title || productType || 'this product';
  return `${what} — the go-to solution ${forWhom}`.trim();
}

// ── Main export ───────────────────────────────────────────────────────────────
export function normalizeProduct(product) {
  if (!product) return null;

  const d = product.generated_data || {};
  const pg = d.platform_guidance || {};

  // ── Core identity ─────────────────────────────────────────────────────────
  const title = str(product.title, d.title);
  const subtitle = str(product.subtitle, d.subtitle);
  const promise = str(product.promise, d.promise);
  const buyerProfile = str(product.buyer_profile, d.buyer_profile, d.audience);
  const targetAudience = str(product.target_audience, d.audience, buyerProfile);
  const problemSolved = str(product.problem_solved, d.problem_solved);
  const rawAngle = str(product.product_angle, d.selling_angle);
  const productAngle = rawAngle || derivedAngle(title, product.niche, targetAudience, product.product_type);

  // ── Sections ──────────────────────────────────────────────────────────────
  // Priority: product.sections → d.sections → content_draft → basic stub
  let sections = arr(product.sections) || arr(d.sections);
  if (!sections) {
    if (d.content_draft) {
      sections = contentDraftToSections(d.content_draft);
    } else {
      // Absolute fallback: at least a cover section
      sections = title ? [{ title, body: str(subtitle, promise) }] : [];
    }
  }

  // ── Pages / blocks ────────────────────────────────────────────────────────
  // Priority: product.pages → d.product_blocks → synthesise from sections
  const pages = arr(product.pages)
    || arr(d.product_blocks)
    || (sections.length > 0 ? sectionsToBlocks(sections, product) : []);

  // ── Checklist ─────────────────────────────────────────────────────────────
  const checklistItems = arr(product.checklist_items) || arr(d.benefits) || [];

  // ── Marketing assets ──────────────────────────────────────────────────────
  const ma = product.marketing_assets || {};
  const marketingAssets = {
    listing_title: str(ma.listing_title, d.listing_title, title),
    listing_description: str(ma.listing_description, d.listing_description),
    keywords: arr(ma.keywords) || arr(d.keywords) || [],
    platform_cta: str(ma.platform_cta, d.platform_cta, d.cta),
    seo_meta_description: str(ma.seo_meta_description, d.seo_meta_description),
    price_min: num(ma.price_min, d.price_min) ?? 17,
    price_max: num(ma.price_max, d.price_max) ?? 37,
    price_rationale: str(ma.price_rationale, d.price_rationale),
    cta: str(ma.cta, d.cta),
  };

  // ── Platform guides ───────────────────────────────────────────────────────
  const pgStruct = product.platform_guides || {};
  const platformGuides = {
    why_this_platform: str(pgStruct.why_this_platform, pg.why_this_platform),
    platform_audience: str(pgStruct.platform_audience, pg.platform_audience),
    pricing_strategy: str(pgStruct.pricing_strategy, pg.pricing_strategy, marketingAssets.price_rationale),
    thumbnail_guidance: str(pgStruct.thumbnail_guidance, pg.thumbnail_guidance, d.cover_concept),
    launch_plan: str(pgStruct.launch_plan, pg.launch_plan, product.launch_plan),
    pro_tips: arr(pgStruct.pro_tips) || arr(pg.pro_tips) || [],
    mistakes_to_avoid: arr(pgStruct.mistakes_to_avoid) || arr(pg.mistakes_to_avoid) || [],
    best_title: str(pgStruct.best_title, pg.best_title, marketingAssets.listing_title),
    best_description: str(pgStruct.best_description, pg.best_description, marketingAssets.listing_description),
    tags: arr(pgStruct.tags) || arr(pg.tags) || arr(d.keywords) || [],
  };

  // ── Visual style ──────────────────────────────────────────────────────────
  const vs = product.visual_style || {};
  const visualStyle = {
    preset: str(vs.preset, d.style_preset, 'minimal'),
    cover_concept: str(vs.cover_concept, d.cover_concept),
    visual_direction: str(vs.visual_direction, d.visual_direction),
    cover_image_url: str(vs.cover_image_url, d.cover_image_url),
  };

  // ── Export & generation state ─────────────────────────────────────────────
  const exportFiles = product.export_files || [];
  const exportStatus = str(product.export_status) || 'idle';
  const exportError = product.export_error || null;
  const lastExportedAt = product.last_exported_at || null;
  const generationStatus = str(product.generation_status) || (product.status === 'ready' ? 'done' : 'idle');
  const generationProgress = str(product.generation_progress, d._progress);
  const qualityScore = product.quality_score || null;

  // ── Content draft (for ZIP export) ───────────────────────────────────────
  const content_draft = str(d.content_draft)
    || sections.map(s => `## ${s.title || ''}\n\n${s.body || ''}`).join('\n\n');

  return {
    // Pass-through metadata
    id: product.id,
    status: str(product.status) || 'draft',
    platform: str(product.platform),
    product_type: str(product.product_type),
    niche: str(product.niche),
    tone: str(product.tone),
    language: str(product.language) || 'en',
    idea_description: str(product.idea_description),
    created_date: product.created_date,
    updated_date: product.updated_date,
    last_edited_at: product.last_edited_at,

    // Normalized structured fields
    title,
    subtitle,
    promise,
    buyerProfile,
    targetAudience,
    problemSolved,
    productAngle,
    sections,
    pages,
    checklistItems,
    marketingAssets,
    platformGuides,
    visualStyle,
    qualityScore,
    generationStatus,
    generationProgress,
    exportFiles,
    exportStatus,
    exportError,
    lastExportedAt,

    // Social kit (pass through as-is)
    socialMediaKit: product.social_media_kit || {},

    // Keep raw generated_data accessible for legacy code paths
    generated_data: d,

    // Ready-to-use content draft
    content_draft,
  };
}

/**
 * Build the structured update payload to persist when enrichProduct finishes.
 */
export function buildStructuredUpdate(phase1, contentResult, salesResult, guideResult, productBlocks) {
  return {
    title: phase1.title,
    subtitle: phase1.subtitle,
    promise: phase1.promise,
    target_audience: phase1.audience,
    buyer_profile: phase1.buyer_profile,
    product_angle: phase1.selling_angle,

    sections: contentResult.sections || [],
    pages: productBlocks,
    checklist_items: phase1.benefits || [],

    marketing_assets: {
      listing_title: salesResult.listing_title,
      listing_description: salesResult.listing_description,
      keywords: salesResult.keywords || [],
      platform_cta: salesResult.platform_cta,
      seo_meta_description: salesResult.seo_meta_description,
      price_min: phase1.price_min,
      price_max: phase1.price_max,
      price_rationale: phase1.price_rationale,
      cta: phase1.cta,
    },

    platform_guides: guideResult,

    visual_style: {
      cover_concept: phase1.cover_concept,
      visual_direction: phase1.visual_direction,
    },

    generation_status: 'done',
    generation_progress: null,

    // Legacy blob — kept for backwards compat
    generated_data: {
      title: phase1.title,
      subtitle: phase1.subtitle,
      promise: phase1.promise,
      audience: phase1.audience,
      format: phase1.format,
      structure: phase1.structure,
      benefits: phase1.benefits,
      selling_angle: phase1.selling_angle,
      price_min: phase1.price_min,
      price_max: phase1.price_max,
      price_rationale: phase1.price_rationale,
      buyer_profile: phase1.buyer_profile,
      cta: phase1.cta,
      visual_direction: phase1.visual_direction,
      cover_concept: phase1.cover_concept,
      content_draft: contentResult.content_draft || '',
      listing_title: salesResult.listing_title,
      listing_description: salesResult.listing_description,
      keywords: salesResult.keywords || [],
      platform_cta: salesResult.platform_cta,
      seo_meta_description: salesResult.seo_meta_description,
      platform_guidance: guideResult,
      product_blocks: productBlocks,
      _progress: null,
    },
  };
}
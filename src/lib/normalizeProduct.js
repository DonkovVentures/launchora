/**
 * normalizeProduct.js
 * Central helper that normalizes any Product record (old flat generated_data
 * or new structured fields) into a single, consistent shape.
 *
 * All pages should use `getNorm(product)` instead of manually reading
 * `product.generated_data` and risk missing fields.
 *
 * Rules:
 * - New structured fields always win over generated_data equivalents.
 * - Falls back to generated_data values when structured fields are absent.
 * - Never crashes on missing/null data.
 */

export function normalizeProduct(product) {
  if (!product) return null;

  const d = product.generated_data || {};
  const pg = d.platform_guidance || {};

  // ── Core identity ────────────────────────────────────────────────────────
  const title = product.title || d.title || '';
  const subtitle = product.subtitle || d.subtitle || '';
  const promise = product.promise || d.promise || '';
  const buyerProfile = product.buyer_profile || d.buyer_profile || d.audience || '';
  const targetAudience = product.target_audience || d.audience || buyerProfile;
  const problemSolved = product.problem_solved || '';
  const productAngle = product.product_angle || d.selling_angle || '';

  // ── Content ──────────────────────────────────────────────────────────────
  // sections: prefer product.sections, fall back to generated_data.sections
  const sections = (product.sections && product.sections.length > 0)
    ? product.sections
    : (d.sections && d.sections.length > 0)
      ? d.sections
      : [];

  // pages/blocks: prefer product.pages, fall back to generated_data.product_blocks
  const pages = (product.pages && product.pages.length > 0)
    ? product.pages
    : (d.product_blocks && d.product_blocks.length > 0)
      ? d.product_blocks
      : [];

  const checklistItems = (product.checklist_items && product.checklist_items.length > 0)
    ? product.checklist_items
    : (d.benefits && d.benefits.length > 0)
      ? d.benefits
      : [];

  // ── Marketing assets ─────────────────────────────────────────────────────
  const ma = product.marketing_assets || {};
  const marketingAssets = {
    listing_title: ma.listing_title || d.listing_title || title,
    listing_description: ma.listing_description || d.listing_description || '',
    keywords: ma.keywords || d.keywords || [],
    platform_cta: ma.platform_cta || d.platform_cta || d.cta || '',
    seo_meta_description: ma.seo_meta_description || d.seo_meta_description || '',
    price_min: ma.price_min ?? d.price_min ?? 17,
    price_max: ma.price_max ?? d.price_max ?? 37,
    price_rationale: ma.price_rationale || d.price_rationale || '',
    cta: ma.cta || d.cta || '',
  };

  // ── Platform guides ───────────────────────────────────────────────────────
  const pgStruct = product.platform_guides || {};
  const platformGuides = {
    why_this_platform: pgStruct.why_this_platform || pg.why_this_platform || '',
    platform_audience: pgStruct.platform_audience || pg.platform_audience || '',
    pricing_strategy: pgStruct.pricing_strategy || pg.pricing_strategy || marketingAssets.price_rationale,
    thumbnail_guidance: pgStruct.thumbnail_guidance || pg.thumbnail_guidance || d.cover_concept || '',
    launch_plan: pgStruct.launch_plan || pg.launch_plan || product.launch_plan || '',
    pro_tips: pgStruct.pro_tips || pg.pro_tips || [],
    mistakes_to_avoid: pgStruct.mistakes_to_avoid || pg.mistakes_to_avoid || [],
    best_title: pgStruct.best_title || pg.best_title || marketingAssets.listing_title,
    best_description: pgStruct.best_description || pg.best_description || marketingAssets.listing_description,
    tags: pgStruct.tags || pg.tags || marketingAssets.keywords,
  };

  // ── Visual style ─────────────────────────────────────────────────────────
  const vs = product.visual_style || {};
  const visualStyle = {
    preset: vs.preset || d.style_preset || 'minimal',
    cover_concept: vs.cover_concept || d.cover_concept || '',
    visual_direction: vs.visual_direction || d.visual_direction || '',
    cover_image_url: vs.cover_image_url || d.cover_image_url || '',
  };

  // ── Export info ───────────────────────────────────────────────────────────
  const exportFiles = product.export_files || [];
  const exportStatus = product.export_status || 'idle';
  const exportError = product.export_error || null;
  const lastExportedAt = product.last_exported_at || null;

  // ── Generation progress ───────────────────────────────────────────────────
  const generationStatus = product.generation_status || (product.status === 'ready' ? 'done' : 'idle');
  const generationProgress = product.generation_progress || d._progress || null;

  // ── Quality score ─────────────────────────────────────────────────────────
  const qualityScore = product.quality_score || null;

  return {
    // Raw record fields (always pass through)
    id: product.id,
    status: product.status || 'draft',
    platform: product.platform || '',
    product_type: product.product_type || '',
    niche: product.niche || '',
    tone: product.tone || '',
    language: product.language || 'en',
    idea_description: product.idea_description || '',
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

    // Keep generated_data accessible for legacy code paths
    generated_data: d,

    // Content draft for export
    content_draft: d.content_draft || sections.map(s => `## ${s.title}\n\n${s.body}`).join('\n\n'),
  };
}

/**
 * Build the structured update payload to persist when enrichProduct finishes.
 * Maps from the flat generated_data shape enrichProduct produces → new schema fields.
 */
export function buildStructuredUpdate(phase1, contentResult, salesResult, guideResult, productBlocks) {
  return {
    // Top-level identity fields
    title: phase1.title,
    subtitle: phase1.subtitle,
    promise: phase1.promise,
    target_audience: phase1.audience,
    buyer_profile: phase1.buyer_profile,
    product_angle: phase1.selling_angle,

    // Structured arrays
    sections: contentResult.sections || [],
    pages: productBlocks,
    checklist_items: phase1.benefits || [],

    // Marketing assets object
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

    // Platform guides object
    platform_guides: guideResult,

    // Visual style
    visual_style: {
      cover_concept: phase1.cover_concept,
      visual_direction: phase1.visual_direction,
    },

    // Generation state
    generation_status: 'done',
    generation_progress: null,

    // Legacy flat blob — kept for backwards compat with any old code paths
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
/**
 * Launchora Compatibility Rules
 * Evaluates combinations of productType, niche, tone, and platform
 * to guide users toward stronger, more commercial product setups.
 */

// Strong fits: platforms that naturally suit each product type
export const platformFitByType = {
  'Planner':           { strong: ['Etsy', 'Payhip', 'Gumroad'], weak: ['Creative Market', 'Stan Store', 'Shopify'] },
  'Checklist':         { strong: ['Etsy', 'Payhip', 'Gumroad'], weak: ['Shopify', 'Creative Market', 'Stan Store'] },
  'Tracker':           { strong: ['Etsy', 'Payhip', 'Gumroad'], weak: ['Shopify', 'Stan Store', 'Ko-fi'] },
  'Worksheet':         { strong: ['Etsy', 'Gumroad', 'Payhip'], weak: ['Stan Store', 'Shopify', 'Ko-fi'] },
  'Workbook':          { strong: ['Gumroad', 'Payhip', 'Custom Website'], weak: ['Etsy', 'Creative Market', 'Ko-fi'] },
  'Journal':           { strong: ['Etsy', 'Payhip', 'Gumroad'], weak: ['Creative Market', 'Shopify', 'Stan Store'] },
  'Prompt Pack':       { strong: ['Gumroad', 'Payhip', 'Stan Store', 'Custom Website'], weak: ['Etsy', 'Creative Market', 'Ko-fi'] },
  'Mini eBook':        { strong: ['Gumroad', 'Payhip', 'Custom Website'], weak: ['Etsy', 'Creative Market', 'Ko-fi'] },
  'Template Pack':     { strong: ['Creative Market', 'Gumroad', 'Payhip'], weak: ['Etsy', 'Ko-fi', 'Stan Store'] },
  'Social Media Pack': { strong: ['Gumroad', 'Creative Market', 'Stan Store'], weak: ['Etsy', 'Ko-fi', 'Shopify'] },
  'Printable Bundle':  { strong: ['Etsy', 'Payhip', 'Gumroad'], weak: ['Shopify', 'Stan Store', 'Ko-fi'] },
  'Lead Magnet':       { strong: ['Stan Store', 'Custom Website', 'Gumroad'], weak: ['Etsy', 'Creative Market', 'Ko-fi'] },
};

// Tones that best fit each product type
export const toneFitByType = {
  'Planner':           { strong: ['Professional', 'Friendly', 'Motivational'], weak: ['Calm & Nurturing', 'Bold & Direct'] },
  'Checklist':         { strong: ['Bold & Direct', 'Educational', 'Professional'], weak: ['Calm & Nurturing', 'Friendly'] },
  'Tracker':           { strong: ['Professional', 'Educational', 'Motivational'], weak: ['Calm & Nurturing', 'Friendly'] },
  'Worksheet':         { strong: ['Educational', 'Professional', 'Friendly'], weak: ['Bold & Direct', 'Calm & Nurturing'] },
  'Workbook':          { strong: ['Educational', 'Professional', 'Motivational'], weak: ['Bold & Direct', 'Calm & Nurturing'] },
  'Journal':           { strong: ['Friendly', 'Calm & Nurturing', 'Educational'], weak: ['Bold & Direct', 'Professional'] },
  'Prompt Pack':       { strong: ['Professional', 'Bold & Direct', 'Educational'], weak: ['Calm & Nurturing', 'Friendly'] },
  'Mini eBook':        { strong: ['Educational', 'Professional', 'Friendly'], weak: ['Calm & Nurturing', 'Bold & Direct'] },
  'Template Pack':     { strong: ['Professional', 'Bold & Direct', 'Educational'], weak: ['Calm & Nurturing', 'Friendly'] },
  'Social Media Pack': { strong: ['Bold & Direct', 'Friendly', 'Professional'], weak: ['Calm & Nurturing', 'Educational'] },
  'Printable Bundle':  { strong: ['Friendly', 'Motivational', 'Educational'], weak: ['Bold & Direct', 'Professional'] },
  'Lead Magnet':       { strong: ['Professional', 'Friendly', 'Educational'], weak: ['Bold & Direct', 'Calm & Nurturing'] },
};

// Product types that best suit each niche
export const typeFitByNiche = {
  'Productivity':    ['Planner', 'Checklist', 'Tracker', 'Workbook'],
  'Fitness':         ['Planner', 'Tracker', 'Journal', 'Worksheet'],
  'Self-care':       ['Journal', 'Planner', 'Workbook'],
  'Business':        ['Workbook', 'Mini eBook', 'Prompt Pack', 'Template Pack'],
  'Budgeting':       ['Planner', 'Tracker', 'Checklist', 'Workbook'],
  'Moms':            ['Planner', 'Checklist', 'Journal', 'Printable Bundle'],
  'Students':        ['Worksheet', 'Workbook', 'Planner', 'Checklist'],
  'Freelancers':     ['Prompt Pack', 'Workbook', 'Template Pack', 'Mini eBook'],
  'Real Estate':     ['Prompt Pack', 'Template Pack', 'Workbook', 'Social Media Pack'],
  'Coaches':         ['Workbook', 'Lead Magnet', 'Prompt Pack', 'Mini eBook'],
  'Creators':        ['Prompt Pack', 'Template Pack', 'Social Media Pack', 'Mini eBook'],
  'Social Media':    ['Template Pack', 'Social Media Pack', 'Prompt Pack'],
  'Wellness':        ['Journal', 'Planner', 'Workbook'],
  'Organization':    ['Planner', 'Checklist', 'Journal', 'Tracker'],
};

/**
 * Returns fit score for a platform given the current product type.
 * 'strong' | 'neutral' | 'weak'
 */
export function getPlatformFit(productType, platform) {
  if (!productType || !platform) return 'neutral';
  const rules = platformFitByType[productType];
  if (!rules) return 'neutral';
  if (rules.strong.includes(platform)) return 'strong';
  if (rules.weak.includes(platform)) return 'weak';
  return 'neutral';
}

/**
 * Returns fit score for a tone given the current product type.
 * 'strong' | 'neutral' | 'weak'
 */
export function getToneFit(productType, tone) {
  if (!productType || !tone) return 'neutral';
  const rules = toneFitByType[productType];
  if (!rules) return 'neutral';
  if (rules.strong.includes(tone)) return 'strong';
  if (rules.weak.includes(tone)) return 'weak';
  return 'neutral';
}

/**
 * Returns fit score for a product type given the current niche.
 * 'strong' | 'neutral' | 'weak'
 */
export function getTypeFitForNiche(niche, productType) {
  if (!niche || !productType) return 'neutral';
  const strongTypes = typeFitByNiche[niche];
  if (!strongTypes) return 'neutral';
  return strongTypes.includes(productType) ? 'strong' : 'neutral';
}

/**
 * Returns the best platforms for a given product type (top 3)
 */
export function getBestPlatformsForType(productType) {
  return platformFitByType[productType]?.strong?.slice(0, 3) || [];
}

/**
 * Returns the best tones for a given product type (top 3)
 */
export function getBestTonesForType(productType) {
  return toneFitByType[productType]?.strong?.slice(0, 3) || [];
}

/**
 * Returns the best product types for a given niche (top 4)
 */
export function getBestTypesForNiche(niche) {
  return typeFitByNiche[niche]?.slice(0, 4) || [];
}

/**
 * Evaluates the overall combination strength.
 * Returns: { score: 'strong' | 'acceptable' | 'weak', issues: string[], suggestions: string[] }
 */
export function evaluateCombination({ productType, niche, tone, platform }) {
  const issues = [];
  const suggestions = [];
  let points = 0;
  let total = 0;

  // Platform fit
  if (productType && platform) {
    total++;
    const pFit = getPlatformFit(productType, platform);
    if (pFit === 'strong') points++;
    else if (pFit === 'weak') {
      const best = getBestPlatformsForType(productType);
      issues.push(`${platform} is not ideal for ${productType}`);
      if (best.length) suggestions.push(`Try ${best[0]} or ${best[1] || best[0]} for better ${productType} sales`);
    }
  }

  // Tone fit
  if (productType && tone) {
    total++;
    const tFit = getToneFit(productType, tone);
    if (tFit === 'strong') points++;
    else if (tFit === 'weak') {
      const best = getBestTonesForType(productType);
      issues.push(`${tone} tone is a weak match for ${productType}`);
      if (best.length) suggestions.push(`${best[0]} or ${best[1] || best[0]} tone works better for a ${productType}`);
    }
  }

  // Niche × type fit
  if (productType && niche) {
    total++;
    const nFit = getTypeFitForNiche(niche, productType);
    if (nFit === 'strong') points++;
    else {
      const best = getBestTypesForNiche(niche);
      if (best.length) suggestions.push(`For ${niche}, ${best[0]} or ${best[1] || best[0]} tend to sell well`);
    }
  }

  if (total === 0) return { score: 'acceptable', issues: [], suggestions: [] };

  const ratio = points / total;
  const score = ratio >= 0.66 ? 'strong' : ratio >= 0.33 ? 'acceptable' : 'weak';

  return { score, issues, suggestions };
}
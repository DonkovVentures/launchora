/**
 * Launchora Compatibility & Preset System
 * Preset-driven logic for structured digital product generation.
 */

// ── TONES (simplified to 5 core tones) ──────────────────────────────────────
export const TONES = ['Professional', 'Friendly', 'Motivational', 'Educational', 'Calm'];

// Strong tones per product type (only these are shown)
export const toneFitByType = {
  'Planner':       { strong: ['Professional', 'Friendly', 'Motivational'],     weak: ['Calm'] },
  'Checklist':     { strong: ['Professional', 'Educational', 'Motivational'],  weak: ['Calm'] },
  'Tracker':       { strong: ['Professional', 'Educational', 'Motivational'],  weak: ['Calm'] },
  'Worksheet':     { strong: ['Educational', 'Professional', 'Friendly'],      weak: ['Calm'] },
  'Workbook':      { strong: ['Educational', 'Professional', 'Motivational'],  weak: ['Calm'] },
  'Journal':       { strong: ['Friendly', 'Calm', 'Educational'],              weak: ['Professional'] },
  'Prompt Pack':   { strong: ['Professional', 'Educational', 'Friendly'],      weak: ['Calm'] },
  'Mini Ebook':    { strong: ['Educational', 'Professional', 'Friendly'],      weak: ['Calm'] },
  'Template Pack': { strong: ['Professional', 'Educational', 'Motivational'],  weak: ['Calm'] },
};

// Default tone per product type (auto-selected if user picks none)
export const defaultToneByType = {
  'Planner':       'Motivational',
  'Checklist':     'Professional',
  'Tracker':       'Professional',
  'Worksheet':     'Educational',
  'Workbook':      'Educational',
  'Journal':       'Calm',
  'Prompt Pack':   'Educational',
  'Mini Ebook':    'Educational',
  'Template Pack': 'Professional',
};

// ── NICHES ───────────────────────────────────────────────────────────────────
// Product types that best fit each niche (for sorting/highlighting in UI)
export const typeFitByNiche = {
  'Productivity':  ['Planner', 'Checklist', 'Tracker', 'Workbook'],
  'Fitness':       ['Planner', 'Tracker', 'Journal', 'Worksheet'],
  'Self-care':     ['Journal', 'Planner', 'Workbook'],
  'Business':      ['Workbook', 'Mini Ebook', 'Prompt Pack', 'Template Pack'],
  'Budgeting':     ['Planner', 'Tracker', 'Checklist', 'Workbook'],
  'Moms':          ['Planner', 'Checklist', 'Journal'],
  'Students':      ['Worksheet', 'Workbook', 'Planner', 'Checklist'],
  'Freelancers':   ['Prompt Pack', 'Workbook', 'Template Pack', 'Mini Ebook'],
  'Coaches':       ['Workbook', 'Prompt Pack', 'Mini Ebook'],
  'Creators':      ['Prompt Pack', 'Template Pack', 'Mini Ebook'],
  'Wellness':      ['Journal', 'Planner', 'Workbook'],
  'Organization':  ['Planner', 'Checklist', 'Tracker'],
};

// Niche-specific content guidance injected into prompts
export const nicheContentGuide = {
  'Productivity':  { style: 'action-oriented', language: 'efficiency-focused, time-aware', examples: 'time blocking, task batching, weekly reviews' },
  'Fitness':       { style: 'progress-driven', language: 'energetic, habit-based, measurable', examples: 'workout logs, rep tracking, progress photos, macros' },
  'Self-care':     { style: 'emotionally supportive', language: 'warm, gentle, reflective', examples: 'mood check-ins, self-compassion exercises, boundary setting' },
  'Business':      { style: 'professional utility', language: 'practical, results-focused, strategic', examples: 'client workflows, revenue tracking, pitch frameworks' },
  'Budgeting':     { style: 'structured tracking', language: 'clear, numbers-forward, motivating', examples: 'expense logs, savings goals, debt payoff trackers' },
  'Moms':          { style: 'supportive and organized', language: 'warm, practical, time-saving', examples: 'school schedules, meal planning, family routines' },
  'Students':      { style: 'instructional', language: 'clear, structured, encouraging', examples: 'study schedules, assignment trackers, exam prep' },
  'Freelancers':   { style: 'client-oriented', language: 'professional, productivity-driven', examples: 'client onboarding, project timelines, invoice templates' },
  'Coaches':       { style: 'transformation-focused', language: 'empowering, framework-driven', examples: 'discovery sessions, goal mapping, accountability systems' },
  'Creators':      { style: 'content & audience building', language: 'creative, strategic, growth-minded', examples: 'content calendars, engagement strategies, brand voice docs' },
  'Wellness':      { style: 'holistic and calm', language: 'gentle, mindful, body-positive', examples: 'sleep logs, breathwork, gratitude journaling' },
  'Organization':  { style: 'structured systems', language: 'clear, logical, space-saving', examples: 'home organization, digital filing, declutter checklists' },
};

// ── PRODUCT STRUCTURE TEMPLATES ──────────────────────────────────────────────
// These are the predefined section templates per product type
export const productStructureTemplates = {
  'Planner': [
    'Cover & Welcome',
    'How to Use This Planner',
    'Monthly Overview',
    'Weekly Planning Pages',
    'Daily Action Pages',
    'Habit Tracker',
    'Goal Setting & Reflection',
    'Notes',
    'BONUS: Motivational Affirmations',
  ],
  'Checklist': [
    'Cover & Intro',
    'How to Use This Checklist',
    'Pre-Phase Checklist',
    'Main Action Checklist',
    'Review & Post-Phase Checklist',
    'Quick Reference Summary',
    'Notes',
    'BONUS: Pro Tips',
  ],
  'Tracker': [
    'Cover & Intro',
    'Tracking Instructions',
    'Daily Tracking Log',
    'Weekly Summary',
    'Monthly Progress Overview',
    'Milestone Markers',
    'Notes & Reflections',
    'BONUS: Habit Streak Tracker',
  ],
  'Workbook': [
    'Cover & Welcome',
    'How to Use This Workbook',
    'Module 1: Foundation & Mindset',
    'Module 2: Core Framework',
    'Module 3: Implementation',
    'Exercises & Reflection Prompts',
    'Action Plan',
    'Notes',
    'BONUS: Quick-Start Cheat Sheet',
  ],
  'Journal': [
    'Cover & Welcome',
    'How to Use This Journal',
    'Morning Intention Pages',
    'Midday Check-In Pages',
    'Evening Reflection Pages',
    'Weekly Reflection',
    'Monthly Gratitude & Growth',
    'Notes & Free-Write Pages',
    'BONUS: Guided Affirmations',
  ],
  'Prompt Pack': [
    'Cover & Welcome',
    'How to Use These Prompts',
    'Who This Is For',
    'Category 1: Foundation Prompts',
    'Category 2: Deep-Dive Prompts',
    'Category 3: Advanced Prompts',
    'Bonus Prompts',
    'Notes',
  ],
  'Mini Ebook': [
    'Cover & Title Page',
    'Introduction: The Problem',
    'Chapter 1: Core Concept',
    'Chapter 2: The Framework',
    'Chapter 3: Implementation',
    'Chapter 4: Common Mistakes',
    'Key Takeaways & Summary',
    'Next Steps & Resources',
    'BONUS: Quick Reference Guide',
  ],
  'Template Pack': [
    'Cover & Welcome',
    'What\'s Included',
    'How to Use These Templates',
    'Template 1',
    'Template 2',
    'Template 3',
    'Template 4',
    'Customization Guide',
    'BONUS: Quick-Start Checklist',
  ],
};

// ── PLATFORM ─────────────────────────────────────────────────────────────────
// Default platform (used internally — not user-facing)
export const platformFitByType = {
  'Planner':       'Etsy',
  'Checklist':     'Etsy',
  'Tracker':       'Etsy',
  'Worksheet':     'Gumroad',
  'Workbook':      'Gumroad',
  'Journal':       'Etsy',
  'Prompt Pack':   'Gumroad',
  'Mini Ebook':    'Gumroad',
  'Template Pack': 'Creative Market',
};

// ── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function getToneFit(productType, tone) {
  if (!productType || !tone) return 'neutral';
  const rules = toneFitByType[productType];
  if (!rules) return 'neutral';
  if (rules.strong.includes(tone)) return 'strong';
  if (rules.weak && rules.weak.includes(tone)) return 'weak';
  return 'neutral';
}

export function getStrongTonesForType(productType) {
  return toneFitByType[productType]?.strong || TONES;
}

export function getBestTonesForType(productType) {
  return getStrongTonesForType(productType);
}

export function getTypeFitForNiche(niche, productType) {
  if (!niche || !productType) return 'neutral';
  const strongTypes = typeFitByNiche[niche];
  if (!strongTypes) return 'neutral';
  return strongTypes.includes(productType) ? 'strong' : 'neutral';
}

export function getBestTypesForNiche(niche) {
  return typeFitByNiche[niche]?.slice(0, 4) || [];
}

export function getDefaultPlatform(productType) {
  return platformFitByType[productType] || 'Gumroad';
}

export function getStructureTemplate(productType) {
  return productStructureTemplates[productType] || productStructureTemplates['Workbook'];
}

export function getNicheGuide(niche) {
  return nicheContentGuide[niche] || { style: 'practical', language: 'clear and useful', examples: 'actionable steps and templates' };
}

export function getDefaultTone(productType) {
  return defaultToneByType[productType] || 'Professional';
}

/**
 * Evaluates the overall combination for use in StepGenerate summary card.
 */
export function evaluateCombination({ productType, niche, tone }) {
  const issues = [];
  const suggestions = [];
  let points = 0;
  let total = 0;

  if (productType && tone) {
    total++;
    const tFit = getToneFit(productType, tone);
    if (tFit === 'strong') points++;
    else {
      const best = getBestTonesForType(productType);
      if (best.length) suggestions.push(`${best[0]} tone works best for a ${productType}`);
    }
  }

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
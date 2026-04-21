// Technical requirements and publishing guides for each platform

export const PLATFORM_GUIDES = {
  Etsy: {
    name: 'Etsy',
    fileFormats: ['PDF', 'ZIP', 'EPUB', 'PNG', 'JPG', 'SVG'],
    maxFileSize: '20MB per file (up to 5 files)',
    titleLimit: '140 characters',
    descriptionLimit: '~4000 characters recommended',
    tagsLimit: '13 tags, max 20 characters each',
    imageRequirements: 'Minimum 2000px on shortest side, JPG or PNG, max 10 images',
    categoryTip: 'List under: Digital Downloads → Templates → Planners & Trackers',
    technicalNotes: [
      'Upload your PDF/ZIP as a "Digital" listing — buyers download automatically',
      'Enable "Instant Download" — do NOT require manual sending',
      'Canva template products: include PDF instructions + Canva share link',
      'Use all 13 tags — Etsy\'s algorithm relies heavily on tags',
      'First 40 characters of title are most important for search',
      'Price ending in .00 or .97 converts best on Etsy',
    ],
    publishingSteps: [
      'Go to Etsy Seller Dashboard → Listings → Add a listing',
      'Upload your thumbnail image (first image = main listing photo)',
      'Upload your digital file (PDF, ZIP, etc.) under "Digital files"',
      'Set category to "Digital downloads" and sub-category appropriately',
      'Write your title — front-load your primary keyword',
      'Write your description — use bullet points and keywords naturally',
      'Add all 13 tags using a mix of broad and niche terms',
      'Set your price and click "Publish"',
    ],
  },

  Gumroad: {
    name: 'Gumroad',
    fileFormats: ['PDF', 'ZIP', 'EPUB', 'MP4', 'MP3', 'PNG', 'Any format'],
    maxFileSize: 'No file size limit (recommended under 5GB)',
    titleLimit: 'No hard limit, 60-80 characters recommended',
    descriptionLimit: 'No limit, supports Markdown formatting',
    tagsLimit: 'No official tags — use keywords in description and title',
    imageRequirements: 'Minimum 1280x720px, JPG or PNG',
    categoryTip: 'Select relevant category during setup — "Design" or "Productivity"',
    technicalNotes: [
      'Supports "Pay What You Want" pricing — great for testing price sensitivity',
      'You can offer free + paid tiers (e.g. free 5-page sample, paid full version)',
      'Gumroad handles VAT for EU customers automatically',
      'Use Gumroad\'s built-in affiliate program to incentivize referrals',
      'Embed your Gumroad product directly on your own website via iframe',
      'Markdown supported in description — use **bold**, ## headers, - bullet lists',
    ],
    publishingSteps: [
      'Go to Gumroad Dashboard → Products → New Product',
      'Choose "Digital Product" as product type',
      'Upload your digital file(s)',
      'Set your product name and price (or "Pay What You Want")',
      'Write your description using Markdown for formatting',
      'Upload a high-quality cover image (1280x720px minimum)',
      'Add a short URL/slug for easy sharing (e.g. gumroad.com/l/mom-planner)',
      'Click "Publish" — your product page is instantly live',
    ],
  },

  'Amazon KDP': {
    name: 'Amazon KDP',
    fileFormats: ['PDF (interior)', 'JPEG/TIFF (cover)', 'EPUB (eBooks)'],
    maxFileSize: '650MB for print, 50MB for eBook',
    titleLimit: '200 characters',
    descriptionLimit: '4000 characters, HTML tags supported (b, em, br, ul, li)',
    tagsLimit: '7 keywords (each can be a phrase)',
    imageRequirements: 'Cover: minimum 2560px on longest side, ratio 1.6:1 (e.g. 2560x1600)',
    categoryTip: 'Select 2 categories — use BISAC codes for precise targeting',
    technicalNotes: [
      'Interior PDF must be exact KDP trim size (most common: 8.5x11 for planners)',
      'Bleed setting: 0.125 inch on all sides if you have full-bleed graphics',
      'Margins: minimum 0.25 inch outer, 0.375–0.875 inch inner (gutter)',
      'Embed all fonts in your PDF before uploading',
      'Use HTML in description: <b>Bold</b>, <ul><li>Item</li></ul> for formatting',
      'Set 7 backend keywords — these are not visible but power Amazon search',
    ],
    publishingSteps: [
      'Go to kdp.amazon.com → Create → Paperback (or eBook)',
      'Enter title, subtitle, author name, and description with HTML formatting',
      'Choose 2 categories and enter your 7 backend keyword phrases',
      'Upload your interior PDF file (must match chosen trim size)',
      'Upload your cover file (JPG/TIFF, meets KDP cover size requirements)',
      'Preview your book using the online previewer — check all pages',
      'Set your price — KDP royalty is 60% at $2.99+ for most markets',
      'Click "Publish" — approval takes 24-72 hours',
    ],
  },

  Shopify: {
    name: 'Shopify',
    fileFormats: ['PDF', 'ZIP', 'Any format via Digital Downloads app'],
    maxFileSize: '5GB per file (via Digital Downloads app)',
    titleLimit: 'No hard limit, 60-70 characters recommended for SEO',
    descriptionLimit: 'No limit, rich text editor with HTML support',
    tagsLimit: 'No limit on tags, used for collections and filtering',
    imageRequirements: 'Minimum 2048x2048px, JPG or PNG, up to 250MB',
    categoryTip: 'Create a "Digital Products" or "Planners" collection',
    technicalNotes: [
      'Install the FREE "Digital Downloads" app from Shopify App Store first',
      'After installing, attach digital files directly to any product listing',
      'Buyer receives automatic email with download link after purchase',
      'You can set download expiry and download limits per file',
      'Add product reviews app (e.g. Judge.me — free) to build social proof',
      'Set up abandoned cart emails to recover lost sales',
    ],
    publishingSteps: [
      'Install "Digital Downloads" from your Shopify Admin → Apps',
      'Go to Products → Add product',
      'Write your product title and description',
      'Upload product images (your mockup/cover)',
      'Set price and check "This is a digital product" (no shipping required)',
      'In the Digital Downloads app, attach your PDF/ZIP file to this product',
      'Set up automatic email delivery in the app settings',
      'Save and publish to your Online Store',
    ],
  },

  Payhip: {
    name: 'Payhip',
    fileFormats: ['PDF', 'ZIP', 'MP4', 'MP3', 'Any format'],
    maxFileSize: '5GB per file',
    titleLimit: 'No hard limit, 60-80 characters recommended',
    descriptionLimit: 'No limit, rich text editor',
    tagsLimit: 'No official tags',
    imageRequirements: 'Minimum 800x800px, JPG or PNG',
    categoryTip: 'No strict categories — use a clear product name and description',
    technicalNotes: [
      'Payhip takes 5% transaction fee on free plan (0% on Pro at $29/mo)',
      'Built-in affiliate system — set commission % and let others promote for you',
      'EU VAT handled automatically by Payhip',
      'Add upsells during checkout to increase average order value',
      'Embed your product widget on any external website',
      'Coupon codes are built-in — use for launch discounts',
    ],
    publishingSteps: [
      'Go to payhip.com → Dashboard → Add new product → Digital Download',
      'Upload your digital file',
      'Add your product title and write your description',
      'Upload a cover image',
      'Set your price (or free)',
      'Customize your checkout fields if needed',
      'Click "Save Product" — your product page is instantly live',
      'Share your product link or embed the "Buy" button on your site',
    ],
  },
};

export function getPlatformGuide(platformName) {
  // Try exact match first, then partial match
  if (PLATFORM_GUIDES[platformName]) return PLATFORM_GUIDES[platformName];
  const key = Object.keys(PLATFORM_GUIDES).find(k =>
    k.toLowerCase().includes(platformName.toLowerCase()) ||
    platformName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? PLATFORM_GUIDES[key] : null;
}
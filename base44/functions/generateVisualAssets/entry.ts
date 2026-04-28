import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai@4.86.2';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

// Try gpt-image-1 first, fall back to dall-e-3
async function generateImage(prompt, size, quality) {
  const models = ['gpt-image-1', 'dall-e-3'];
  for (const model of models) {
    try {
      console.log(`[generateVisualAssets] Trying model: ${model}`);
      const params = {
        model,
        prompt,
        n: 1,
        size: size || '1024x1024',
      };
      if (model === 'dall-e-3') {
        params.quality = quality === 'hd' ? 'hd' : 'standard';
        params.response_format = 'url';
      } else {
        // gpt-image-1 uses output_format
        params.output_format = 'png';
      }
      const res = await openai.images.generate(params);
      const url = res.data?.[0]?.url;
      const b64 = res.data?.[0]?.b64_json;
      if (url || b64) {
        console.log(`[generateVisualAssets] ✅ model=${model}`);
        return { url, b64, model };
      }
    } catch (e) {
      console.warn(`[generateVisualAssets] model ${model} failed: ${e.message}`);
    }
  }
  throw new Error('All image models failed');
}

// Build prompt tailored for luxury real estate marketing aesthetic
function buildPrompt(assetDef, n) {
  const base = assetDef.promptBase || '';
  const niche = n.niche || 'real estate';
  const title = n.title || 'Product';
  const style = 'editorial luxury aesthetic, premium minimalist design, high-end marketing material, professional photography style, sophisticated typography, muted warm tones, clean white space';
  return `${base}. Niche: ${niche}. Product: "${title}". Style: ${style}. No text overlays unless specified.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { productId, quality = 'standard', referenceImageUrl } = body;
    if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });

    const product = await base44.asServiceRole.entities.Product.get(productId);
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

    const n = {
      title: product.title || 'Untitled',
      niche: product.niche || 'General',
      subtitle: product.subtitle || '',
      promise: product.promise || '',
      type: product.product_type || 'Digital Product',
      platform: product.platform || 'Gumroad',
    };

    // Define which assets to generate
    const assetDefs = [
      {
        name: 'marketplace_thumbnail',
        type: 'thumbnail',
        purpose: 'Marketplace listing thumbnail (1:1)',
        size: '1024x1024',
        promptBase: `Professional marketplace product thumbnail for a ${n.type} digital product. Clean layout, premium branding, product title visible, suitable for Etsy/Gumroad listing`,
      },
      {
        name: 'preview_mockup',
        type: 'mockup',
        purpose: 'Product preview mockup (4:3 landscape)',
        size: '1792x1024',
        promptBase: `Realistic mockup showing a premium digital document or template opened on a sleek laptop screen, editorial photography style, luxury desk setting with minimal props`,
      },
      {
        name: 'style_board',
        type: 'style_board',
        purpose: 'Brand style reference board (1:1)',
        size: '1024x1024',
        promptBase: `Mood board / style reference for luxury ${n.niche} brand identity. Color palette swatches, typography samples, texture details, premium editorial feel`,
      },
    ];

    const generated = [];
    const warnings = [];

    for (const def of assetDefs) {
      try {
        const prompt = buildPrompt(def, n);
        const { url, b64, model } = await generateImage(prompt, def.size, quality);

        let finalUrl = url;

        // If b64 returned (gpt-image-1), upload to storage
        if (!url && b64) {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'image/png' });
          const file = new File([blob], `${def.name}.png`, { type: 'image/png' });
          const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          finalUrl = uploadRes?.file_url || uploadRes?.url;
        }

        if (!finalUrl) throw new Error('No URL from image generation');

        generated.push({
          name: def.name,
          type: def.type,
          url: finalUrl,
          prompt,
          size: def.size,
          quality,
          model,
          purpose: def.purpose,
          generated_at: new Date().toISOString(),
          source_image_url: referenceImageUrl || null,
        });
        console.log(`[generateVisualAssets] ✅ ${def.name}`);
      } catch (e) {
        warnings.push(`${def.name}: ${e.message}`);
        console.warn(`[generateVisualAssets] ⚠️ ${def.name} failed: ${e.message}`);
      }
    }

    if (generated.length === 0) {
      return Response.json({ success: false, error: 'All image generations failed', warnings });
    }

    // Persist to product
    await base44.asServiceRole.entities.Product.update(productId, {
      visual_assets: generated,
    });

    console.log(`[generateVisualAssets] ✅ Done: ${generated.length} assets, ${warnings.length} warnings`);
    return Response.json({ success: true, assets: generated, warnings });

  } catch (error) {
    console.error('[generateVisualAssets] ❌', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
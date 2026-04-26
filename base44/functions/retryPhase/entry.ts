import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This function is now a thin proxy — retry logic lives in enrichProduct (retryStep param).
// Kept for backwards compatibility with GenerationProgress component's older call signature.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, phase } = await req.json();
    if (!productId || !phase) {
      return Response.json({ error: 'productId and phase are required' }, { status: 400 });
    }

    const validPhases = ['salesCopy', 'platformGuides', 'socialKit', 'launchPlan', 'sectionExpansion'];
    if (!validPhases.includes(phase)) {
      return Response.json({ error: `Invalid phase. Must be one of: ${validPhases.join(', ')}` }, { status: 400 });
    }

    // Delegate to enrichProduct with retryStep
    const res = await base44.asServiceRole.functions.invoke('enrichProduct', { productId, retryStep: phase });
    return Response.json(res);

  } catch (error) {
    console.error('[retryPhase] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
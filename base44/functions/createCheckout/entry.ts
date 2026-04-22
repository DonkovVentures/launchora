import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLANS = {
  starter: { priceId: 'price_1TP0htE9rpkS0j3aR1OaTVRu', name: 'Starter' },
  creator: { priceId: 'price_1TP0htE9rpkS0j3acUNdNMe1', name: 'Creator' },
  pro:     { priceId: 'price_1TP0htE9rpkS0j3aKcSOqef9', name: 'Pro' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!PLANS[plan]) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      customer_email: user.email,
      success_url: successUrl || `${req.headers.get('origin')}/projects`,
      cancel_url: cancelUrl || req.headers.get('origin'),
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plan,
        user_id: user.id,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
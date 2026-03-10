import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 401 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Log all received events — processing will be added when Stripe features go live
  console.log(`Stripe webhook received: ${event.type} [${event.id}]`);

  switch (event.type) {
    case "checkout.session.completed":
      // Future: grant entitlements for one-off purchases
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Future: sync subscription status to subscriptions table
      break;
    case "invoice.payment_succeeded":
      // Future: extend subscription period
      break;
    case "invoice.payment_failed":
      // Future: mark subscription as past_due
      break;
    default:
      // Unhandled event type — log and acknowledge
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

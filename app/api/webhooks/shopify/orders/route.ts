import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyShopifyWebhook } from "@/lib/shopify/webhooks";
import { upsertOrder } from "@/lib/supabase/orders";

const shopifyLineItemSchema = z.object({
  title: z.string(),
  quantity: z.number(),
  price: z.string(),
  variant_title: z.string().nullable().default(null),
  product_id: z.number().nullable().default(null),
  sku: z.string().nullable().default(null),
});

const shopifyOrderSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  email: z.string().email().optional(),
  contact_email: z.string().email().optional(),
  total_price: z.string(),
  currency: z.string().min(1),
  line_items: z.array(shopifyLineItemSchema).min(1),
  financial_status: z.string().min(1),
});

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

  if (!hmacHeader) {
    return NextResponse.json(
      { error: "Missing HMAC header", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json(
      { error: "Invalid webhook signature", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const raw = JSON.parse(rawBody);
    const result = shopifyOrderSchema.safeParse(raw);

    if (!result.success) {
      console.error("Webhook payload validation failed:", result.error.format());
      return NextResponse.json(
        { error: "Invalid order payload", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const order = result.data;
    const email = order.email || order.contact_email;

    if (!email) {
      console.error("Webhook order missing email:", order.id);
      return NextResponse.json(
        { error: "Order missing email", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await upsertOrder({
      id: order.id,
      order_number: order.order_number,
      email,
      total_price: order.total_price,
      currency: order.currency,
      line_items: order.line_items,
      financial_status: order.financial_status,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

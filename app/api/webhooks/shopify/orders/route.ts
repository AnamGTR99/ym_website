import { NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/shopify/webhooks";
import { upsertOrder } from "@/lib/supabase/orders";

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
    const order = JSON.parse(rawBody);

    await upsertOrder({
      id: order.id,
      order_number: order.order_number,
      email: order.email || order.contact_email,
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

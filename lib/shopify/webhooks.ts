import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Shopify webhook HMAC-SHA256 signature.
 * Returns true if the signature is valid.
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("SHOPIFY_WEBHOOK_SECRET is not set");
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");

  try {
    return timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

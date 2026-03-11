const apiVersion = "2025-01";

function getShopifyConfig() {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain) throw new Error("NEXT_PUBLIC_SHOPIFY_DOMAIN is not configured");
  if (!storefrontToken)
    throw new Error(
      "NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is not configured"
    );

  return { domain, storefrontToken };
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const { domain, storefrontToken } = getShopifyConfig();
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(
      `Shopify Storefront API error: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
    );
  }

  return json.data as T;
}

const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
const apiVersion = "2025-01";

const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
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

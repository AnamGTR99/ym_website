import { shopifyFetch } from "./client";
import {
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  SEARCH_PRODUCTS_QUERY,
} from "./queries";
import type {
  ProductsQueryResult,
  ProductQueryResult,
  SearchQueryResult,
  ProductsResponse,
  ShopifyProductFull,
  SearchResponse,
} from "./types";

/**
 * Fetch a paginated list of products (for TV grid).
 */
export async function getProducts(options?: {
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
}): Promise<ProductsResponse> {
  const { first = 20, after, sortKey = "TITLE", reverse = false } = options ?? {};

  const data = await shopifyFetch<ProductsQueryResult>(PRODUCTS_QUERY, {
    first,
    after,
    sortKey,
    reverse,
  });

  return {
    products: data.products.edges.map((edge) => edge.node),
    pageInfo: data.products.pageInfo,
  };
}

/**
 * Fetch a single product by its handle (for product pages).
 */
export async function getProductByHandle(
  handle: string
): Promise<ShopifyProductFull | null> {
  const data = await shopifyFetch<ProductQueryResult>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle }
  );

  if (!data.product) return null;

  const { images, variants, metafield, ...rest } = data.product;

  return {
    ...rest,
    images: images.edges.map((edge) => edge.node),
    variants: variants.edges.map((edge) => edge.node),
    glbUrl: metafield?.value ?? null,
  };
}

/**
 * Search products by query string.
 */
export async function searchProducts(options: {
  query: string;
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
}): Promise<SearchResponse> {
  const { query, first = 20, after, sortKey = "RELEVANCE", reverse = false } = options;

  const data = await shopifyFetch<SearchQueryResult>(SEARCH_PRODUCTS_QUERY, {
    query,
    first,
    after,
    sortKey,
    reverse,
  });

  return {
    products: data.search.edges.map((edge) => edge.node),
    totalCount: data.search.totalCount,
    pageInfo: data.search.pageInfo,
  };
}

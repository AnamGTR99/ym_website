// Shopify Storefront API type definitions

export interface ShopifyImage {
  id: string | null;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface PriceRange {
  minVariantPrice: MoneyV2;
  maxVariantPrice: MoneyV2;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductOptionValue {
  id: string;
  name: string;
  swatch: { color: string | null } | null;
}

export interface ProductOption {
  id: string;
  name: string;
  optionValues: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  selectedOptions: SelectedOption[];
  image: ShopifyImage | null;
}

export interface SEO {
  title: string | null;
  description: string | null;
}

export interface Metafield {
  value: string;
  type: string;
}

/** Lightweight product for listings (TV grid) */
export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  productType: string;
  vendor: string;
  tags: string[];
  priceRange: PriceRange;
  compareAtPriceRange: PriceRange;
  featuredImage: ShopifyImage | null;
}

/** Full product for product pages */
export interface ShopifyProductFull extends ShopifyProduct {
  descriptionHtml: string;
  images: ShopifyImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  glbUrl: string | null;
  seo: SEO;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor: string | null;
  startCursor: string | null;
}

export interface ProductsResponse {
  products: ShopifyProduct[];
  pageInfo: PageInfo;
}

export interface SearchResponse {
  products: ShopifyProduct[];
  totalCount: number;
  pageInfo: PageInfo;
}

// GraphQL response shapes (raw API)

export interface ShopifyEdge<T> {
  node: T;
  cursor: string;
}

export interface ShopifyConnection<T> {
  edges: ShopifyEdge<T>[];
  pageInfo: PageInfo;
}

export interface ProductsQueryResult {
  products: ShopifyConnection<ShopifyProduct>;
}

export interface ProductQueryResult {
  product: (Omit<ShopifyProductFull, "images" | "variants" | "glbUrl"> & {
    images: ShopifyConnection<ShopifyImage>;
    variants: ShopifyConnection<ProductVariant>;
    metafield: Metafield | null;
  }) | null;
}

export interface SearchQueryResult {
  search: ShopifyConnection<ShopifyProduct> & {
    totalCount: number;
  };
}

// Cart types

export interface CartLineMerchandise {
  id: string;
  title: string;
  price: MoneyV2;
  image: { url: string; altText: string | null } | null;
  product: { title: string; handle: string };
}

export interface CartLine {
  id: string;
  quantity: number;
  cost: { totalAmount: MoneyV2 };
  merchandise: CartLineMerchandise;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
  };
  lines: { edges: { node: CartLine }[] };
}

export interface CartCreateResult {
  cartCreate: {
    cart: ShopifyCart | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export interface CartLinesAddResult {
  cartLinesAdd: {
    cart: ShopifyCart | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export interface CartLinesUpdateResult {
  cartLinesUpdate: {
    cart: ShopifyCart | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export interface CartLinesRemoveResult {
  cartLinesRemove: {
    cart: ShopifyCart | null;
    userErrors: { field: string[]; message: string }[];
  };
}

export interface CartQueryResult {
  cart: ShopifyCart | null;
}

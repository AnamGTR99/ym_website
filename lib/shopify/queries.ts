// Product fields shared across queries
const PRODUCT_CARD_FRAGMENT = `
  id
  handle
  title
  description
  availableForSale
  productType
  vendor
  tags
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  compareAtPriceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  featuredImage {
    id
    url
    altText
    width
    height
  }
`;

export const PRODUCTS_QUERY = `
  query GetProducts(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
    products(
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
    ) {
      edges {
        node {
          ${PRODUCT_CARD_FRAGMENT}
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_CARD_FRAGMENT}
      descriptionHtml
      images(first: 10) {
        edges {
          node {
            id
            url
            altText
            width
            height
          }
        }
      }
      options {
        id
        name
        optionValues {
          id
          name
          swatch { color }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            selectedOptions { name value }
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
      metafield(namespace: "custom", key: "glb_url") {
        value
        type
      }
      seo {
        title
        description
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = `
  query SearchProducts(
    $query: String!
    $first: Int!
    $after: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) {
    search(
      query: $query
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      types: [PRODUCT]
    ) {
      edges {
        node {
          ... on Product {
            ${PRODUCT_CARD_FRAGMENT}
          }
        }
        cursor
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }
`;

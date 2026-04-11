"use client";

import { useState, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/shopify/utils";
import type {
  ProductVariant,
  ProductOption,
  ShopifyProductFull,
} from "@/lib/shopify/types";

interface ProductControlsProps {
  product: ShopifyProductFull;
}

export default function ProductControls({ product }: ProductControlsProps) {
  const addItem = useCartStore((s) => s.addItem);
  const loading = useCartStore((s) => s.loading);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const defaults: Record<string, string> = {};
    for (const opt of product.options) {
      if (opt.optionValues.length > 0) {
        defaults[opt.name] = opt.optionValues[0].name;
      }
    }
    return defaults;
  });

  const selectedVariant = findVariant(product.variants, selectedOptions);

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const available = selectedVariant?.availableForSale ?? product.availableForSale;

  const sanitizedHtml = useMemo(
    () =>
      product.descriptionHtml
        ? DOMPurify.sanitize(product.descriptionHtml)
        : "",
    [product.descriptionHtml]
  );

  function handleOptionChange(optionName: string, value: string) {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  }

  async function handleAddToCart() {
    if (!selectedVariant || !available) return;
    await addItem(selectedVariant.id);
  }

  return (
    <div className="w-full md:w-72 flex-shrink-0 bg-abyss border-t md:border-t-0 md:border-l border-charcoal p-6 flex flex-col gap-5">
      {/* Title + Price */}
      <div>
        <p className="text-label text-fog">
          Channel
        </p>
        <h2 className="text-lg font-bold text-bone mt-1">{product.title}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-mono text-amber">
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount) && (
            <span className="text-xs font-mono text-fog line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </span>
          )}
        </div>
      </div>

      <hr className="divider" />

      {/* Variant Options */}
      {product.options.length > 0 &&
        !(
          product.options.length === 1 &&
          product.options[0].name === "Title" &&
          product.options[0].optionValues.length === 1
        ) && (
          <>
            {product.options.map((option) => (
              <OptionSelector
                key={option.id}
                option={option}
                selected={selectedOptions[option.name] ?? ""}
                onChange={(value) => handleOptionChange(option.name, value)}
              />
            ))}
            <hr className="divider" />
          </>
        )}

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={!available || loading}
        className="btn btn-primary w-full"
      >
        {loading ? "Adding..." : available ? "Add to Cart" : "Sold Out"}
      </button>

      <hr className="divider" />

      {/* Description */}
      {sanitizedHtml && (
        <div>
          <p className="text-label text-fog">
            Description
          </p>
          <div
            className="text-xs text-fog mt-2 leading-relaxed prose prose-invert prose-xs max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      )}
    </div>
  );
}

function OptionSelector({
  option,
  selected,
  onChange,
}: {
  option: ProductOption;
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-label text-fog">
        {option.name}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {option.optionValues.map((val) => (
          <button
            key={val.id}
            onClick={() => onChange(val.name)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              selected === val.name
                ? "border-amber text-amber"
                : "border-ash text-fog hover:border-fog"
            }`}
          >
            {val.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function findVariant(
  variants: ProductVariant[],
  selectedOptions: Record<string, string>
): ProductVariant | undefined {
  return variants.find((v) =>
    v.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    )
  );
}

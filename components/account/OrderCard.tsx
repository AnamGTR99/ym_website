interface LineItem {
  title: string;
  quantity: number;
  price: string;
  variant_title: string | null;
}

interface OrderRow {
  id: string;
  shopify_order_number: string;
  total_price: string;
  currency: string;
  line_items: LineItem[];
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  paid: "text-teal",
  pending: "text-amber",
  refunded: "text-fog",
  voided: "text-error",
};

export default function OrderCard({ order }: { order: OrderRow }) {
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const statusColor = statusColors[order.status] ?? "text-fog";

  return (
    <div className="border border-charcoal rounded-lg p-5 flex flex-col gap-3 bg-abyss">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-bone">
            #{order.shopify_order_number}
          </span>
          <span className="text-xs text-smoke">{date}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono uppercase ${statusColor}`}>
            {order.status}
          </span>
          <span className="text-sm font-mono text-amber">
            {order.currency} {order.total_price}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {order.line_items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs text-fog"
          >
            <span>
              {item.title}
              {item.variant_title && (
                <span className="text-smoke"> — {item.variant_title}</span>
              )}
            </span>
            <span className="text-smoke">
              ×{item.quantity} · {order.currency} {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

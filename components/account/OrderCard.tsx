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
  paid: "text-green-400",
  pending: "text-amber-400",
  refunded: "text-zinc-400",
  voided: "text-red-400",
};

export default function OrderCard({ order }: { order: OrderRow }) {
  const date = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const statusColor = statusColors[order.status] ?? "text-zinc-500";

  return (
    <div className="border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white">
            #{order.shopify_order_number}
          </span>
          <span className="text-xs text-zinc-600">{date}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono uppercase ${statusColor}`}>
            {order.status}
          </span>
          <span className="text-sm font-mono text-white">
            {order.currency} {order.total_price}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {order.line_items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-xs text-zinc-400"
          >
            <span>
              {item.title}
              {item.variant_title && (
                <span className="text-zinc-600"> — {item.variant_title}</span>
              )}
            </span>
            <span className="text-zinc-500">
              ×{item.quantity} · {order.currency} {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

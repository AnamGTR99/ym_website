import OrderCard from "./OrderCard";

interface OrderRow {
  id: string;
  shopify_order_number: string;
  email: string;
  total_price: string;
  currency: string;
  line_items: {
    title: string;
    quantity: number;
    price: string;
    variant_title: string | null;
  }[];
  status: string;
  created_at: string;
}

export default function OrderHistory({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-500">
        Purchase History
      </h2>

      {orders.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
          <p className="text-zinc-600 text-sm">No orders yet</p>
          <p className="text-zinc-700 text-xs mt-1">
            Orders placed via Shopify checkout will appear here automatically
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

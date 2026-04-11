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
      <h2 className="text-label text-fog">
        Purchase History
      </h2>

      {orders.length === 0 ? (
        <div className="border border-dashed border-charcoal rounded-lg p-10 text-center">
          <p className="text-smoke text-sm">No orders yet</p>
          <p className="text-ash text-xs mt-1">
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

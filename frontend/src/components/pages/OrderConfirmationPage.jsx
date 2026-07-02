import { HiOutlineCheckCircle } from "react-icons/hi2";
import { useSelector } from "react-redux";
import { Link, useLocation, Navigate } from "react-router-dom";
import { formatBDT } from "../../utils/currency";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const { lastOrder } = useSelector((state) => state.orders);
  const order = location.state?.order || lastOrder;

  if (!order) return <Navigate to="/" replace />;

  const eta = new Date(order.createdAt);
  eta.setDate(eta.getDate() + (/dhaka/i.test(order.shippingAddress?.city) ? 2 : 5));

  return (
    <div className="container mx-auto px-4 py-14 max-w-3xl">
      <div className="bg-white rounded-2xl border border-sand p-8 md:p-12 shadow-sm text-center">
        <HiOutlineCheckCircle className="h-16 w-16 text-deshi-green mx-auto mb-4" />
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Shukriya! Order placed</h1>
        <p className="text-ink-soft mb-1">
          Order <span className="font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</span>
        </p>
        <p className="text-ink-soft text-sm mb-8">
          Estimated delivery by{" "}
          <span className="font-semibold text-ink">
            {eta.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </p>

        <div className="text-left border border-sand rounded-xl divide-y divide-sand mb-8">
          {order.orderItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
              <div className="flex-grow">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-ink-soft">
                  {item.size} · {item.color} · ×{item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatBDT(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-soft">Delivery ({order.shippingAddress.city})</span>
              <span>{order.shippingPrice === 0 ? "FREE" : formatBDT(order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total — Cash on Delivery</span>
              <span>{formatBDT(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/order/${order._id}`}
            className="border border-ink px-8 py-3 rounded-full font-semibold hover:bg-ink hover:text-white transition-colors"
          >
            View Order
          </Link>
          <Link
            to="/collections/all"
            className="bg-deshi-green text-white px-8 py-3 rounded-full font-semibold hover:bg-deshi-green-dark transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;

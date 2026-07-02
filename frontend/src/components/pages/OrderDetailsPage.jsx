import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchOrderDetails } from "../../redux/slices/orderSlice";
import { formatBDT } from "../../utils/currency";

const steps = ["Processing", "Shipped", "Delivered"];

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails: order, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  if (loading || (!order && !error)) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-4">
        <div className="skeleton h-10 w-1/2 rounded" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-60 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-deshi-red font-medium">{error}</p>
        <Link to="/profile" className="text-deshi-green hover:underline mt-3 inline-block">
          Back to profile
        </Link>
      </div>
    );
  }

  const currentStep = order.status === "Cancelled" ? -1 : steps.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Placed {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
        <Link
          to="/profile"
          className="text-sm border border-ink px-5 py-2 rounded-full font-semibold hover:bg-ink hover:text-white transition-colors"
        >
          All orders
        </Link>
      </div>

      {/* Status tracker */}
      <div className="bg-white rounded-2xl border border-sand p-7 mb-6 shadow-sm">
        {order.status === "Cancelled" ? (
          <p className="text-center text-deshi-red font-semibold">This order was cancelled</p>
        ) : (
          <div className="flex items-center">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      i <= currentStep ? "bg-deshi-green text-white" : "bg-sand text-ink-soft"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs mt-2 font-medium text-ink-soft">{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-1 flex-grow mx-2 rounded ${
                      i < currentStep ? "bg-deshi-green" : "bg-sand"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-sand shadow-sm divide-y divide-sand">
          {order.orderItems.map((item, i) => (
            <Link
              to={`/product/${item.productId}`}
              key={i}
              className="flex items-center gap-4 p-5 hover:bg-ivory transition-colors"
            >
              <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg" />
              <div className="flex-grow">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {item.size} · {item.color} · ×{item.quantity}
                </p>
              </div>
              <p className="font-semibold text-sm">{formatBDT(item.price * item.quantity)}</p>
            </Link>
          ))}
        </div>

        {/* Summary + address */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-sand p-6 shadow-sm text-sm space-y-2.5">
            <h3 className="font-display text-lg font-bold mb-3">Summary</h3>
            <div className="flex justify-between">
              <span className="text-ink-soft">Items</span>
              <span>{formatBDT(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Delivery</span>
              <span>{order.shippingPrice === 0 ? "FREE" : formatBDT(order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-sand">
              <span>Total</span>
              <span>{formatBDT(order.totalPrice)}</span>
            </div>
            <p className="text-xs text-ink-soft pt-1">
              {order.paymentMethod} · {order.isPaid ? "Paid" : "Unpaid"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-sand p-6 shadow-sm text-sm">
            <h3 className="font-display text-lg font-bold mb-3">Delivery Address</h3>
            <p className="font-medium">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-ink-soft mt-1 leading-relaxed">
              {order.shippingAddress.address}
              <br />
              {order.shippingAddress.city}
              {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
              <br />
              {order.shippingAddress.country}
            </p>
            <p className="text-ink-soft mt-2">☎ {order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;

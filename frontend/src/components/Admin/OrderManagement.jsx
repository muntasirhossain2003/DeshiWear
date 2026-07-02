import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { fetchAdminOrders, updateOrderStatus } from "../../redux/slices/adminSlice";
import { formatBDT } from "../../utils/currency";

const statuses = ["Processing", "Shipped", "Delivered", "Cancelled"];

const OrderManagement = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const handleStatusChange = (id, status) => {
    dispatch(updateOrderStatus({ id, status }))
      .unwrap()
      .then(() => toast.success(`Order marked ${status}`))
      .catch((message) => toast.error(message));
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-7">Orders</h1>
      <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-5 py-3.5">Order</th>
              <th className="px-5 py-3.5 hidden md:table-cell">Customer</th>
              <th className="px-5 py-3.5 hidden lg:table-cell">City</th>
              <th className="px-5 py-3.5 hidden sm:table-cell">Date</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-t border-sand hover:bg-ivory transition-colors">
                  <td className="px-5 py-3.5 font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p>{order.user?.name || "—"}</p>
                    <p className="text-xs text-ink-soft">{order.shippingAddress?.phone}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-ink-soft">
                    {order.shippingAddress?.city}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold">{formatBDT(order.totalPrice)}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className={`border rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none ${
                        order.status === "Delivered"
                          ? "border-green-300 bg-green-50 text-green-700"
                          : order.status === "Cancelled"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : order.status === "Shipped"
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;

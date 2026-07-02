import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { fetchMyOrders } from "../../redux/slices/orderSlice";
import { formatBDT } from "../../utils/currency";

const statusStyles = {
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* User card */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-sand p-7 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-deshi-green text-white flex items-center justify-center font-display text-2xl font-bold mb-4">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h1 className="font-display text-2xl font-bold mb-1">{user?.name}</h1>
            <p className="text-sm text-ink-soft mb-6">{user?.email}</p>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="block text-center w-full mb-3 border border-ink py-2.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-white transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full bg-deshi-red text-white py-2.5 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Orders */}
        <div className="flex-grow">
          <h2 className="font-display text-2xl font-bold mb-5">My Orders</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-sand rounded-2xl p-10 text-center">
              <p className="font-display text-xl mb-2">No orders yet</p>
              <p className="text-ink-soft text-sm mb-6">Your orders will show up here.</p>
              <Link
                to="/collections/all"
                className="inline-block bg-ink text-white px-8 py-3 rounded-full font-semibold hover:bg-deshi-green transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-sand rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Date</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Items</th>
                    <th className="px-5 py-3.5">Total</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/order/${order._id}`)}
                      className="border-t border-sand hover:bg-ivory cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-medium">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell text-ink-soft">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-ink-soft">
                        {order.orderItems.reduce((n, i) => n + i.quantity, 0)}
                      </td>
                      <td className="px-5 py-4 font-semibold">{formatBDT(order.totalPrice)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            statusStyles[order.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

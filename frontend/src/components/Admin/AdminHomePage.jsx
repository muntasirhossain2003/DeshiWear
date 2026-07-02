import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminOrders, fetchAdminStats } from "../../redux/slices/adminSlice";
import { formatBDT } from "../../utils/currency";

const AdminHomePage = () => {
  const dispatch = useDispatch();
  const { stats, orders } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  const cards = [
    { label: "Revenue", value: stats ? formatBDT(stats.totalRevenue) : "—", accent: "text-deshi-green" },
    { label: "Orders", value: stats?.totalOrders ?? "—", accent: "text-ink", link: "/admin/orders" },
    { label: "Products", value: stats?.totalProducts ?? "—", accent: "text-ink", link: "/admin/products" },
    { label: "Customers", value: stats?.totalUsers ?? "—", accent: "text-ink", link: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-7">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-sand p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold">{card.label}</p>
            <p className={`text-2xl md:text-3xl font-bold mt-2 ${card.accent}`}>{card.value}</p>
            {card.link && (
              <Link to={card.link} className="text-xs text-deshi-green hover:underline mt-2 inline-block">
                Manage →
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Recent Orders</h2>
        <Link to="/admin/orders" className="text-sm text-deshi-green hover:underline font-medium">
          View all
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-5 py-3.5">Order</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 6).map((order) => (
              <tr key={order._id} className="border-t border-sand">
                <td className="px-5 py-3.5 font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                <td className="px-5 py-3.5 text-ink-soft">{order.user?.name || "—"}</td>
                <td className="px-5 py-3.5 font-semibold">{formatBDT(order.totalPrice)}</td>
                <td className="px-5 py-3.5">{order.status}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminHomePage;

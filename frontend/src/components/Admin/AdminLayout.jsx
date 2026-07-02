import { useState } from "react";
import { FaBars, FaBoxOpen, FaClipboardList, FaSignOutAlt, FaStore, FaUsers } from "react-icons/fa";
import { FaGauge } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: FaGauge, end: true },
  { to: "/admin/products", label: "Products", icon: FaBoxOpen },
  { to: "/admin/orders", label: "Orders", icon: FaClipboardList },
  { to: "/admin/users", label: "Users", icon: FaUsers },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      isActive ? "bg-deshi-green text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ivory">
      {/* Mobile header */}
      <div className="flex md:hidden items-center justify-between p-4 bg-ink text-white">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <FaBars className="h-5 w-5" />
        </button>
        <span className="font-display text-lg font-bold">DeshiWear Admin</span>
        <span />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static inset-y-0 left-0 z-50 w-64 bg-ink text-white p-5 transition-transform duration-300 md:translate-x-0 flex flex-col shrink-0`}
      >
        <Link to="/admin" className="font-display text-2xl font-bold block mb-8 px-2">
          Deshi<span className="text-deshi-gold">Wear</span>
          <span className="block text-xs font-sans font-normal text-white/50 tracking-widest uppercase mt-1">
            Admin Panel
          </span>
        </Link>
        <nav className="space-y-1.5 flex-grow">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setSidebarOpen(false)}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FaStore className="h-4 w-4" /> View Shop
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-deshi-red/90 hover:bg-deshi-red text-white transition-colors"
        >
          <FaSignOutAlt className="h-4 w-4" /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-grow p-5 md:p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

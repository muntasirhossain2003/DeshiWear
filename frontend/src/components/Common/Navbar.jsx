import React from "react";
import {
  HiBars3BottomRight,
  HiOutlineShoppingBag,
  HiOutlineUser,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import CartDrawer from "../Layout/CartDrawer";
import SearchBar from "./SearchBar";

const navLinks = [
  { label: "Men", to: "/collections/all?gender=Men" },
  { label: "Women", to: "/collections/all?gender=Women" },
  { label: "Heritage", to: "/collections/Heritage Collection" },
  { label: "Eid", to: "/collections/Eid Collection" },
  { label: "Urban Deshi", to: "/collections/Urban Deshi" },
];

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = React.useState(false);
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const cartItemCount =
    cart?.products?.reduce((total, p) => total + p.quantity, 0) || 0;

  const toggleNavDrawer = () => setNavDrawerOpen(!navDrawerOpen);
  const toggleCartDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Left - Logo */}
        <div>
          <Link to="/" className="font-display text-2xl font-bold tracking-tight">
            Deshi<span className="text-deshi-green">Wear</span>
          </Link>
        </div>

        {/* Center - navigation links */}
        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-ink-soft hover:text-deshi-green text-sm font-medium uppercase tracking-wide transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right - icons */}
        <div className="flex items-center space-x-4">
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="hidden sm:block bg-ink hover:bg-deshi-green transition-colors px-3 py-1 rounded-full text-sm text-white"
            >
              Admin
            </Link>
          )}
          <Link
            to={user ? "/profile" : "/login"}
            className="hover:text-deshi-green transition-colors"
            aria-label={user ? "Profile" : "Sign in"}
          >
            <HiOutlineUser className="h-6 w-6 text-ink-soft hover:text-deshi-green transition-colors" />
          </Link>

          {/* Cart button */}
          <button
            onClick={toggleCartDrawer}
            className="relative hover:text-deshi-green"
            aria-label="Open cart"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-ink-soft hover:text-deshi-green transition-colors" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-deshi-red text-white text-xs rounded-full px-1.5 py-0.5 font-semibold">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Search */}
          <div className="overflow-hidden">
            <SearchBar />
          </div>

          <button onClick={toggleNavDrawer} className="md:hidden" aria-label="Open menu">
            <HiBars3BottomRight className="h-6 w-6 text-ink-soft" />
          </button>
        </div>
      </nav>

      <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

      {/* Mobile navigation drawer */}
      {navDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={toggleNavDrawer}
        />
      )}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-ivory shadow-2xl transform transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleNavDrawer} aria-label="Close menu">
            <IoMdClose className="h-6 w-6 text-ink-soft" />
          </button>
        </div>
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold mb-6">
            Deshi<span className="text-deshi-green">Wear</span>
          </h2>
          <nav className="space-y-5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={toggleNavDrawer}
                className="block text-ink-soft hover:text-deshi-green font-medium uppercase tracking-wide transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;

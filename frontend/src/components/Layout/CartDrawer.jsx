import { IoMdClose } from "react-icons/io";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CartContents from "../Cart/CartContents";
import { formatBDT } from "../../utils/currency";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const hasItems = cart?.products?.length > 0;

  const handleCheckout = () => {
    toggleCartDrawer();
    navigate(user ? "/checkout" : "/login?redirect=/checkout");
  };

  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={toggleCartDrawer} />
      )}
      <div
        className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-[30rem] h-full bg-ivory shadow-2xl transform transition-transform duration-300 flex flex-col z-50 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={toggleCartDrawer} aria-label="Close cart">
            <IoMdClose className="h-6 w-6 text-ink-soft" />
          </button>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          <h2 className="font-display text-2xl font-semibold mb-4">Your Cart</h2>
          <CartContents />
        </div>

        <div className="p-4 bg-ivory border-t border-sand sticky bottom-0">
          {hasItems && (
            <div className="flex justify-between mb-3 font-semibold">
              <span>Subtotal</span>
              <span>{formatBDT(cart.totalPrice)}</span>
            </div>
          )}
          <button
            onClick={handleCheckout}
            disabled={!hasItems}
            className="w-full bg-ink text-white py-3.5 rounded-full font-semibold hover:bg-deshi-green transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
          <p className="text-xs text-ink-soft text-center mt-2.5">
            Shipping calculated at checkout — free over ৳2,000
          </p>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;

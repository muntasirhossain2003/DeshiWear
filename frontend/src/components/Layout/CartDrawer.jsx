import { IoMdClose } from "react-icons/io";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  return (
    <div
      className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-1/4 h-full bg-white shadow-lg transform transition-transform duration-300 flex flex-col z-50 ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }  `}
    >
      {/* Close Button */}
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer}>
          <IoMdClose className="h-6 w-6 text-gray-600 " />
        </button>
      </div>
      {/* Cart contents With scrollable Area */}
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {/* Cart items will be rendered here */}
        {/* Component for cart Contents */}
      </div>

      {/* checkout Button fixxed at bottom*/}
      <div className="p-4 bg-white sticky bottom-0">
        <button className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">
          CheckOut
        </button>
        <p>Shipping , taxes, and discount codes calculated at checkout</p>
      </div>
    </div>
  );
};

export default CartDrawer;

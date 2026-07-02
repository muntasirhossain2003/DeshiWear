import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";
import { formatBDT } from "../../utils/currency";

const CartContents = () => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const { user, guestId } = useSelector((state) => state.auth);

  const ids = { guestId, userId: user?._id };

  const handleQuantity = (item, delta) => {
    dispatch(
      updateCartItemQuantity({
        productId: item.productId,
        quantity: item.quantity + delta,
        size: item.size,
        color: item.color,
        ...ids,
      })
    );
  };

  const handleRemove = (item) => {
    dispatch(
      removeFromCart({
        productId: item.productId,
        size: item.size,
        color: item.color,
        ...ids,
      })
    );
  };

  if (!cart?.products?.length) {
    return (
      <div className="text-center py-14">
        <p className="font-display text-xl mb-1">Your cart is empty</p>
        <p className="text-sm text-ink-soft">Add something you love.</p>
      </div>
    );
  }

  return (
    <div>
      {cart.products.map((item, index) => (
        <div key={index} className="flex items-start justify-between py-4 border-b border-sand">
          <div className="flex items-start">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-24 object-cover mr-4 rounded-lg"
            />
            <div>
              <h3 className="font-medium text-sm">{item.name}</h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Size: {item.size} | Color: {item.color}
              </p>
              <div className="flex items-center mt-2.5">
                <button
                  onClick={() => handleQuantity(item, -1)}
                  className="border border-gray-300 rounded-full w-7 h-7 text-base font-medium hover:border-deshi-green transition-colors"
                >
                  −
                </button>
                <span className="mx-3.5 text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => handleQuantity(item, 1)}
                  className="border border-gray-300 rounded-full w-7 h-7 text-base font-medium hover:border-deshi-green transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">{formatBDT(item.price * item.quantity)}</p>
            <button onClick={() => handleRemove(item)} aria-label="Remove item">
              <RiDeleteBin3Line className="h-5 w-5 mt-2 text-deshi-red hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;

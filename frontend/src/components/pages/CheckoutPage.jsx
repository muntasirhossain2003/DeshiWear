import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearCart } from "../../redux/slices/cartSlice";
import { createOrder } from "../../redux/slices/orderSlice";
import { formatBDT } from "../../utils/currency";

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart } = useSelector((state) => state.cart);
  const { loading } = useSelector((state) => state.orders);

  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    country: "Bangladesh",
  });

  useEffect(() => {
    if (!cart?.products?.length) navigate("/collections/all");
  }, [cart, navigate]);

  const itemsPrice = cart?.totalPrice || 0;
  const shippingPrice = itemsPrice >= 2000 ? 0 : /dhaka/i.test(address.city) ? 60 : 120;
  const totalPrice = itemsPrice + shippingPrice;

  const handleChange = (e) =>
    setAddress({ ...address, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createOrder({ shippingAddress: address, paymentMethod: "Cash on Delivery" }))
      .unwrap()
      .then((order) => {
        dispatch(clearCart());
        navigate("/order-confirmation", { state: { order } });
      })
      .catch((message) => toast.error(message));
  };

  const inputClass =
    "mt-1.5 w-full border border-sand rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory";

  return (
    <div className="container mx-auto px-4 py-10 grid lg:grid-cols-2 gap-10 max-w-6xl">
      {/* Shipping form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-sand p-7 md:p-9 shadow-sm">
        <h1 className="font-display text-3xl font-bold mb-7">Checkout</h1>

        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft mb-4">
          Delivery details
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-semibold">First name *</span>
            <input name="firstName" required value={address.firstName} onChange={handleChange} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Last name</span>
            <input name="lastName" value={address.lastName} onChange={handleChange} className={inputClass} />
          </label>
        </div>
        <label className="block mb-4">
          <span className="text-sm font-semibold">Full address *</span>
          <input
            name="address"
            required
            value={address.address}
            onChange={handleChange}
            placeholder="House, road, area"
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm font-semibold">City *</span>
            <input name="city" required value={address.city} onChange={handleChange} placeholder="Dhaka" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Postal code</span>
            <input name="postalCode" value={address.postalCode} onChange={handleChange} className={inputClass} />
          </label>
        </div>
        <label className="block mb-7">
          <span className="text-sm font-semibold">Phone *</span>
          <input
            name="phone"
            required
            type="tel"
            value={address.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            pattern="01[0-9]{9}"
            title="Enter a valid Bangladeshi mobile number (01XXXXXXXXX)"
            className={inputClass}
          />
        </label>

        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft mb-4">
          Payment
        </h2>
        <div className="border-2 border-deshi-green rounded-xl p-4 mb-7 flex items-center gap-3 bg-deshi-green/5">
          <input type="radio" checked readOnly className="accent-deshi-green h-4 w-4" />
          <div>
            <p className="font-semibold text-sm">Cash on Delivery</p>
            <p className="text-xs text-ink-soft">Pay when your order arrives. bKash & Nagad coming soon.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-deshi-green text-white py-4 rounded-full font-semibold hover:bg-deshi-green-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Placing order…" : `Place Order — ${formatBDT(totalPrice)}`}
        </button>
      </form>

      {/* Order summary */}
      <div className="lg:pl-4">
        <div className="bg-white rounded-2xl border border-sand p-7 shadow-sm sticky top-28">
          <h2 className="font-display text-xl font-bold mb-5">Order Summary</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {cart?.products?.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
                <div className="flex-grow">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-ink-soft">
                    {item.size} · {item.color} · ×{item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatBDT(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-sand mt-5 pt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-medium">{formatBDT(itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Delivery</span>
              <span className="font-medium">
                {shippingPrice === 0 ? (
                  <span className="text-deshi-green font-semibold">FREE</span>
                ) : (
                  formatBDT(shippingPrice)
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-sand">
              <span>Total</span>
              <span>{formatBDT(totalPrice)}</span>
            </div>
          </div>
          {itemsPrice < 2000 && (
            <p className="text-xs text-deshi-green mt-4 bg-deshi-green/10 rounded-lg px-3 py-2">
              Add {formatBDT(2000 - itemsPrice)} more for free delivery!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { clearAuthError, registerUser } from "../../redux/slices/authSlice";
import { fetchCart, mergeCart } from "../../redux/slices/cartSlice";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, error, guestId } = useSelector((state) => state.auth);

  const redirect = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (user) {
      dispatch(mergeCart({ guestId }))
        .unwrap()
        .catch(() => dispatch(fetchCart({ userId: user._id })));
      navigate(redirect, { replace: true });
    }
  }, [user, dispatch, navigate, redirect, guestId]);

  useEffect(() => {
    return () => dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    dispatch(registerUser({ name, email, password }))
      .unwrap()
      .then((u) => toast.success(`Welcome to DeshiWear, ${u.name.split(" ")[0]}!`))
      .catch(() => {});
  };

  return (
    <div className="flex justify-center items-center py-16 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-sand shadow-sm"
      >
        <h2 className="font-display text-3xl font-bold text-center mb-2">
          Create account
        </h2>
        <p className="text-center text-ink-soft text-sm mb-8">
          Join Deshi<span className="text-deshi-green font-semibold">Wear</span> — it takes a minute
        </p>

        {error && (
          <p className="bg-deshi-red/10 text-deshi-red text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </p>
        )}

        <label className="block mb-4">
          <span className="text-sm font-semibold">Full name</span>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full border border-sand rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory"
            placeholder="Your name"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full border border-sand rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory"
            placeholder="you@example.com"
          />
        </label>
        <label className="block mb-6">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            value={password}
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full border border-sand rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory"
            placeholder="At least 6 characters"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-3.5 rounded-full font-semibold hover:bg-deshi-green transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-deshi-green font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;

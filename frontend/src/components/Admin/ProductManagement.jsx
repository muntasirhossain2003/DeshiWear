import { useEffect } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { deleteProduct, fetchAdminProducts } from "../../redux/slices/adminSlice";
import { formatBDT } from "../../utils/currency";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  const handleDelete = (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    dispatch(deleteProduct(product._id))
      .unwrap()
      .then(() => toast.success("Product deleted"))
      .catch((message) => toast.error(message));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-deshi-green text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-deshi-green-dark transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="px-5 py-3.5">Product</th>
              <th className="px-5 py-3.5 hidden md:table-cell">SKU</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5 hidden sm:table-cell">Stock</th>
              <th className="px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-soft">
                  Loading…
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="border-t border-sand hover:bg-ivory transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-10 h-12 object-cover rounded-md"
                      />
                      <span className="font-medium line-clamp-1">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-ink-soft">{product.sku}</td>
                  <td className="px-5 py-3 font-semibold">{formatBDT(product.price)}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.countInStock > 10
                          ? "bg-green-100 text-green-700"
                          : product.countInStock > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.countInStock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="p-2 rounded-lg bg-sand hover:bg-deshi-green hover:text-white transition-colors"
                        aria-label="Edit"
                      >
                        <FaPen className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 rounded-lg bg-sand hover:bg-deshi-red hover:text-white transition-colors"
                        aria-label="Delete"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

export default ProductManagement;

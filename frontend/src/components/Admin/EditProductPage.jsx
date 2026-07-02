import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { createProduct, updateProduct } from "../../redux/slices/adminSlice";

const empty = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  countInStock: "",
  sku: "",
  category: "",
  collections: "",
  gender: "Unisex",
  material: "",
  sizes: "",
  colors: "",
  images: [{ url: "" }, { url: "" }],
  isFeatured: false,
  isPublished: true,
};

const EditProductPage = () => {
  const { id } = useParams();
  const isNew = !id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/api/products/${id}`)
      .then(({ data }) =>
        setForm({
          ...data,
          sizes: data.sizes?.join(", ") || "",
          colors: data.colors?.join(", ") || "",
          discountPrice: data.discountPrice || "",
          images: [...(data.images || []), { url: "" }, { url: "" }].slice(0, 2),
        })
      )
      .catch(() => toast.error("Failed to load product"));
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageChange = (index, url) => {
    const images = form.images.map((img, i) => (i === index ? { ...img, url } : img));
    setForm({ ...form, images });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      countInStock: Number(form.countInStock),
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean),
      images: form.images.filter((img) => img.url.trim()),
    };
    setSaving(true);
    const action = isNew ? createProduct(payload) : updateProduct({ id, ...payload });
    dispatch(action)
      .unwrap()
      .then(() => {
        toast.success(isNew ? "Product created" : "Product updated");
        navigate("/admin/products");
      })
      .catch((message) => toast.error(message))
      .finally(() => setSaving(false));
  };

  const inputClass =
    "mt-1.5 w-full border border-sand rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green bg-ivory";

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-7">
        {isNew ? "Add Product" : "Edit Product"}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-sand p-7 shadow-sm space-y-5">
        <label className="block">
          <span className="text-sm font-semibold">Name *</span>
          <input name="name" required value={form.name} onChange={handleChange} className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Description *</span>
          <textarea
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={handleChange}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Price (৳) *</span>
            <input name="price" type="number" required min={0} value={form.price} onChange={handleChange} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Discount price (৳)</span>
            <input name="discountPrice" type="number" min={0} value={form.discountPrice} onChange={handleChange} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Stock *</span>
            <input name="countInStock" type="number" required min={0} value={form.countInStock} onChange={handleChange} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">SKU *</span>
            <input name="sku" required value={form.sku} onChange={handleChange} className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Category *</span>
            <input name="category" required value={form.category} onChange={handleChange} placeholder="Panjabi" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Collection *</span>
            <input name="collections" required value={form.collections} onChange={handleChange} placeholder="Eid Collection" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Gender</span>
            <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
              <option>Men</option>
              <option>Women</option>
              <option>Unisex</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Material</span>
            <input name="material" value={form.material} onChange={handleChange} placeholder="Cotton" className={inputClass} />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Sizes * (comma separated)</span>
            <input name="sizes" required value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Colors * (comma separated)</span>
            <input name="colors" required value={form.colors} onChange={handleChange} placeholder="White, Green" className={inputClass} />
          </label>
        </div>

        {form.images.map((img, i) => (
          <div key={i} className="flex items-center gap-3">
            <label className="block flex-grow">
              <span className="text-sm font-semibold">Image URL {i + 1}{i === 0 ? " *" : ""}</span>
              <input
                required={i === 0}
                value={img.url}
                onChange={(e) => handleImageChange(i, e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </label>
            {img.url && (
              <img src={img.url} alt="" className="w-14 h-16 object-cover rounded-lg border border-sand mt-6" />
            )}
          </div>
        ))}

        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="accent-deshi-green h-4 w-4" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="accent-deshi-green h-4 w-4" />
            Published
          </label>
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-deshi-green text-white px-9 py-3 rounded-full font-semibold hover:bg-deshi-green-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="border border-ink px-8 py-3 rounded-full font-semibold hover:bg-ink hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;

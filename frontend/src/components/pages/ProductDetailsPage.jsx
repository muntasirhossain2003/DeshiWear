import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { addToCart } from "../../redux/slices/cartSlice";
import {
  fetchProductDetails,
  fetchSimilarProducts,
} from "../../redux/slices/productsSlice";
import ProductGrid from "../Products/ProductGrid";
import { formatBDT } from "../../utils/currency";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedProduct, detailsLoading, similarProducts } = useSelector(
    (state) => state.products
  );
  const { user, guestId } = useSelector((state) => state.auth);
  const { loading: cartLoading } = useSelector((state) => state.cart);

  const [mainImage, setMainImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductDetails(id));
    dispatch(fetchSimilarProducts(id));
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  useEffect(() => {
    setMainImage(selectedProduct?.images?.[0]?.url || null);
  }, [selectedProduct]);

  if (detailsLoading || !selectedProduct) {
    return (
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
        <div className="skeleton rounded-xl aspect-[3/4]" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      </div>
    );
  }

  const p = selectedProduct;
  const hasDiscount = p.discountPrice && p.discountPrice < p.price;

  const handleAddToCart = () => {
    if (p.sizes?.length && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (p.colors?.length && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    dispatch(
      addToCart({
        productId: p._id,
        quantity,
        size: selectedSize,
        color: selectedColor,
        guestId,
        userId: user?._id,
      })
    )
      .unwrap()
      .then(() => toast.success("Added to cart"))
      .catch((message) => toast.error(message));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="flex gap-4">
          <div className="hidden md:flex flex-col gap-3">
            {p.images?.map((img, i) => (
              <button key={i} onClick={() => setMainImage(img.url)}>
                <img
                  src={img.url}
                  alt={img.altText || `${p.name} ${i + 1}`}
                  className={`w-20 h-24 object-cover rounded-lg cursor-pointer border-2 transition-colors ${
                    mainImage === img.url ? "border-deshi-green" : "border-transparent"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex-grow">
            <img
              src={mainImage || p.images?.[0]?.url}
              alt={p.name}
              className="w-full rounded-xl object-cover aspect-[3/4]"
            />
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-deshi-green font-semibold mb-2">
            {p.collections}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{p.name}</h1>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl font-bold text-ink">
              {formatBDT(hasDiscount ? p.discountPrice : p.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-ink-soft/60 line-through">{formatBDT(p.price)}</span>
            )}
            {p.rating > 0 && (
              <span className="text-sm text-ink-soft">
                ★ {p.rating} ({p.numReviews} reviews)
              </span>
            )}
          </div>
          <p className="text-ink-soft leading-relaxed mb-6">{p.description}</p>

          {/* Color */}
          {p.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2">
                Color: <span className="font-normal text-ink-soft">{selectedColor || "Select"}</span>
              </p>
              <div className="flex gap-2">
                {p.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "border-deshi-green ring-2 ring-deshi-green/30"
                        : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor:
                        { Mint: "#98e0c8", Cream: "#f5f0dc", Charcoal: "#36454f", Firoza: "#40e0d0", Multicolor: "#ccc" }[color] ||
                        color.toLowerCase().replace(" ", ""),
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {p.sizes?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2">
                Size: <span className="font-normal text-ink-soft">{selectedSize || "Select"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? "bg-deshi-green text-white border-deshi-green"
                        : "border-gray-300 hover:border-deshi-green"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-7">
            <p className="text-sm font-semibold mb-2">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-gray-300 text-lg hover:border-deshi-green transition-colors"
              >
                −
              </button>
              <span className="font-semibold w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-full border border-gray-300 text-lg hover:border-deshi-green transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={cartLoading || p.countInStock === 0}
            className="w-full md:w-auto bg-ink text-white px-12 py-3.5 rounded-full font-semibold hover:bg-deshi-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p.countInStock === 0 ? "Out of Stock" : cartLoading ? "Adding…" : "Add to Cart"}
          </button>

          {/* Meta */}
          <div className="mt-8 border-t border-sand pt-5 text-sm text-ink-soft space-y-1.5">
            {p.material && (
              <p>
                <span className="font-medium text-ink">Material:</span> {p.material}
              </p>
            )}
            <p>
              <span className="font-medium text-ink">SKU:</span> {p.sku}
            </p>
            <p>
              <span className="font-medium text-ink">Availability:</span>{" "}
              {p.countInStock > 0 ? `In stock (${p.countInStock})` : "Out of stock"}
            </p>
          </div>
        </div>
      </div>

      {/* Similar products */}
      {similarProducts?.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            You May Also Like
          </h2>
          <ProductGrid products={similarProducts} loading={false} error={null} />
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;

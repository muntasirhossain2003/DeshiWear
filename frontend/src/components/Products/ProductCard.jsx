import { Link } from "react-router-dom";
import { formatBDT } from "../../utils/currency";

const ProductCard = ({ product }) => {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <Link to={`/product/${product._id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-sand aspect-[3/4]">
        <img
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.altText || product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.images?.[1]?.url && (
          <img
            src={product.images[1].url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-deshi-red text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        {product.countInStock === 0 && (
          <span className="absolute top-3 right-3 bg-ink/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Out of stock
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-ink/85 text-white text-center text-sm py-2.5 font-medium tracking-wide">
          View Details
        </div>
      </div>
      <div className="mt-3 px-0.5">
        <p className="text-xs uppercase tracking-widest text-ink-soft/70 mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-medium text-ink group-hover:text-deshi-green transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-semibold text-ink">
            {formatBDT(hasDiscount ? product.discountPrice : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-ink-soft/60 line-through">
              {formatBDT(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

import ProductCard from "./ProductCard";

const SkeletonCard = () => (
  <div>
    <div className="skeleton rounded-xl aspect-[3/4]" />
    <div className="skeleton h-3 w-1/3 rounded mt-3" />
    <div className="skeleton h-4 w-2/3 rounded mt-2" />
    <div className="skeleton h-4 w-1/4 rounded mt-2" />
  </div>
);

const ProductGrid = ({ products, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-deshi-red font-medium">{error}</p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-ink mb-2">Nothing found</p>
        <p className="text-ink-soft">Try changing your filters or search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;

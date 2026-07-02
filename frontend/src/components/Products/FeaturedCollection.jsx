import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchFeaturedProducts } from "../../redux/slices/productsSlice";
import ProductCard from "./ProductCard";

const FeaturedCollection = () => {
  const dispatch = useDispatch();
  const { featuredProducts } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
  }, [dispatch]);

  return (
    <section className="py-16 px-4 bg-sand/50">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <p className="uppercase tracking-[0.25em] text-deshi-green text-xs font-semibold mb-2">
            Handpicked for you
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Featured Collection</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/collections/all"
            className="inline-block border border-ink px-8 py-3 rounded-full font-semibold hover:bg-ink hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;

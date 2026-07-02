import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchNewArrivals } from "../../redux/slices/productsSlice";
import { formatBDT } from "../../utils/currency";

const NewArrivals = () => {
  const dispatch = useDispatch();
  const { newArrivals } = useSelector((state) => state.products);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="uppercase tracking-[0.25em] text-deshi-green text-xs font-semibold mb-2">
              Fresh from the loom
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">New Arrivals</h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="p-2.5 rounded-full border border-sand bg-white disabled:opacity-40 hover:border-deshi-green transition-colors"
              aria-label="Scroll left"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="p-2.5 rounded-full border border-sand bg-white disabled:opacity-40 hover:border-deshi-green transition-colors"
              aria-label="Scroll right"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {newArrivals.map((product) => (
            <Link
              key={product._id}
              to={`/product/${product._id}`}
              className="group relative min-w-[70%] sm:min-w-[45%] lg:min-w-[28%] rounded-xl overflow-hidden"
            >
              <img
                src={product.images?.[0]?.url}
                alt={product.name}
                loading="lazy"
                className="w-full h-[420px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent text-white p-5 pt-16">
                <h4 className="font-medium">{product.name}</h4>
                <p className="mt-1 text-deshi-gold font-semibold">
                  {formatBDT(product.discountPrice || product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;

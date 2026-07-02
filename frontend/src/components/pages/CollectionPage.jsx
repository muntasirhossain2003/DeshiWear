import { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchProductsByFilters } from "../../redux/slices/productsSlice";
import FilterSidebar from "../Products/FilterSidebar";
import ProductGrid from "../Products/ProductGrid";
import SortOptions from "../Products/SortOptions";

const CollectionPage = () => {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    dispatch(fetchProductsByFilters({ collection, ...params }));
  }, [dispatch, collection, searchParams]);

  const search = searchParams.get("search");
  const title =
    search
      ? `Results for “${search}”`
      : collection && collection !== "all"
      ? collection
      : "All Products";

  return (
    <div className="container mx-auto flex flex-col lg:flex-row px-4 py-8 gap-8">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden border border-sand bg-white rounded-full px-4 py-2 flex justify-center items-center gap-2 text-sm font-medium w-fit"
      >
        <FaFilter /> Filters
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-72 bg-white overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:w-64 lg:bg-transparent lg:z-auto shrink-0`}
      >
        <FilterSidebar />
      </aside>

      {/* Products */}
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
            {!loading && (
              <p className="text-sm text-ink-soft mt-1">{products.length} products</p>
            )}
          </div>
          <SortOptions />
        </div>
        <ProductGrid products={products} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default CollectionPage;

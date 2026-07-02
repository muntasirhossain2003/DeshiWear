import { useSearchParams } from "react-router-dom";

const SortOptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) params.set("sortBy", e.target.value);
    else params.delete("sortBy");
    setSearchParams(params);
  };

  return (
    <select
      value={searchParams.get("sortBy") || ""}
      onChange={handleSortChange}
      className="border border-sand bg-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deshi-green cursor-pointer"
    >
      <option value="">Default</option>
      <option value="priceAsc">Price: Low to High</option>
      <option value="priceDesc">Price: High to Low</option>
      <option value="popularity">Popularity</option>
    </select>
  );
};

export default SortOptions;

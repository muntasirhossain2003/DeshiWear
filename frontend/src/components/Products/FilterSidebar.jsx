import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const categories = ["Panjabi", "Saree", "Kurti", "Three Piece", "T-Shirt", "Shirt", "Bottom Wear", "Shawl", "Kids"];
const genders = ["Men", "Women", "Unisex"];
const colors = ["White", "Black", "Red", "Green", "Blue", "Pink", "Maroon", "Mint", "Gold"];
const sizes = ["S", "M", "L", "XL", "XXL", "Free Size"];
const materials = ["Cotton", "Silk", "Jamdani", "Katan Silk", "Tant Cotton", "Georgette", "Denim", "Viscose"];

const FilterSidebar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    minPrice: 0,
    maxPrice: 15000,
  });

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [],
      material: params.material ? params.material.split(",") : [],
      minPrice: Number(params.minPrice) || 0,
      maxPrice: Number(params.maxPrice) || 15000,
    });
  }, [searchParams]);

  const updateURL = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      const str = Array.isArray(value) ? value.join(",") : String(value ?? "");
      if (str && str !== "0" && !(key === "maxPrice" && str === "15000")) {
        params.set(key, str);
      } else {
        params.delete(key);
      }
    });
    navigate(`?${params.toString()}`);
  };

  const handleChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    updateURL(next);
  };

  const toggleInArray = (key, value) => {
    const arr = filters[key].includes(value)
      ? filters[key].filter((v) => v !== value)
      : [...filters[key], value];
    handleChange(key, arr);
  };

  const clearAll = () => navigate("?");

  return (
    <div className="p-4 space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold">Filters</h3>
        <button onClick={clearAll} className="text-xs text-deshi-red hover:underline font-medium">
          Clear all
        </button>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Category</p>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-2.5 text-sm cursor-pointer text-ink-soft hover:text-ink">
              <input
                type="radio"
                name="category"
                checked={filters.category === c}
                onChange={() => handleChange("category", filters.category === c ? "" : c)}
                className="accent-deshi-green h-4 w-4"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Gender</p>
        <div className="space-y-2">
          {genders.map((g) => (
            <label key={g} className="flex items-center gap-2.5 text-sm cursor-pointer text-ink-soft hover:text-ink">
              <input
                type="radio"
                name="gender"
                checked={filters.gender === g}
                onChange={() => handleChange("gender", filters.gender === g ? "" : g)}
                className="accent-deshi-green h-4 w-4"
              />
              {g}
            </label>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Color</p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              title={color}
              onClick={() => handleChange("color", filters.color === color ? "" : color)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                filters.color === color ? "border-deshi-green ring-2 ring-deshi-green/30" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.toLowerCase() === "mint" ? "#98e0c8" : color.toLowerCase() }}
            />
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleInArray("size", s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filters.size.includes(s)
                  ? "bg-deshi-green text-white border-deshi-green"
                  : "border-gray-300 text-ink-soft hover:border-deshi-green"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Material</p>
        <div className="space-y-2">
          {materials.map((m) => (
            <label key={m} className="flex items-center gap-2.5 text-sm cursor-pointer text-ink-soft hover:text-ink">
              <input
                type="checkbox"
                checked={filters.material.includes(m)}
                onChange={() => toggleInArray("material", m)}
                className="accent-deshi-green h-4 w-4"
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs uppercase tracking-widest text-ink-soft font-semibold mb-3">Max Price</p>
        <input
          type="range"
          min={0}
          max={15000}
          step={100}
          value={filters.maxPrice}
          onChange={(e) => handleChange("maxPrice", Number(e.target.value))}
          className="w-full accent-deshi-green"
        />
        <div className="flex justify-between text-xs text-ink-soft mt-1">
          <span>৳0</span>
          <span className="font-semibold text-ink">৳{filters.maxPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

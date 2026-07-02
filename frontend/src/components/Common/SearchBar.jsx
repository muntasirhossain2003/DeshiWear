import { useState } from "react";
import { HiMagnifyingGlass, HiMiniXMark } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchToggle = () => setIsOpen(!isOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/collections/all?search=${encodeURIComponent(searchTerm.trim())}`);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      className={`flex items-center justify-center w-full transition-all duration-300 ${
        isOpen ? "absolute top-0 left-0 w-full bg-ivory h-24 z-50 shadow-md" : "w-auto"
      }`}
    >
      {isOpen ? (
        <form onSubmit={handleSearch} className="relative flex items-center justify-center w-full">
          <div className="relative w-3/4 md:w-1/2">
            <input
              type="text"
              placeholder="Search sarees, panjabis, kurtis…"
              value={searchTerm}
              autoFocus
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-sand px-4 py-2.5 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-deshi-green w-full placeholder:text-ink-soft/70 text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-deshi-green transition-colors"
              aria-label="Search"
            >
              <HiMagnifyingGlass className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSearchToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
            aria-label="Close search"
          >
            <HiMiniXMark className="h-6 w-6" />
          </button>
        </form>
      ) : (
        <button onClick={handleSearchToggle} aria-label="Open search">
          <HiMagnifyingGlass className="h-6 w-6 text-ink-soft hover:text-deshi-green transition-colors" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

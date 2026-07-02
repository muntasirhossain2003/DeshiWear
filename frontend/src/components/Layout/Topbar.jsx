import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
import { TbBrandMeta } from "react-icons/tb";

const Topbar = () => {
  return (
    <div className="bg-deshi-green text-white">
      <div className="container mx-auto flex justify-between items-center py-2.5 px-4 text-sm">
        <div className="hidden md:flex items-center space-x-4">
          <a href="#" aria-label="Meta" className="hover:text-deshi-gold transition-colors">
            <TbBrandMeta className="h-4 w-4" />
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-deshi-gold transition-colors">
            <IoLogoInstagram className="h-4 w-4" />
          </a>
          <a href="#" aria-label="X" className="hover:text-deshi-gold transition-colors">
            <RiTwitterXLine className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="flex-grow text-center tracking-wide">
          Free delivery on orders over ৳2,000 — all across Bangladesh 🇧🇩
        </p>
        <div className="hidden md:block">
          <a href="tel:+8801748004936" className="hover:text-deshi-gold transition-colors">
            (+880) 1748 004936
          </a>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

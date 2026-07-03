import { FiPhoneCall } from "react-icons/fi";
import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
import { TbBrandMeta } from "react-icons/tb";
import { Link } from "react-router-dom";

const shopLinks = [
  { label: "Men", to: "/collections/all?gender=Men" },
  { label: "Women", to: "/collections/all?gender=Women" },
  { label: "Eid Collection", to: "/collections/Eid Collection" },
  { label: "Heritage Collection", to: "/collections/Heritage Collection" },
];

const supportLinks = ["Contact Us", "About Us", "FAQs", "Shipping & Returns"];

const Footer = () => {
  return (
    <footer className="bg-ink text-white/80 pt-14 pb-6 mt-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white mb-3">
            Deshi<span className="text-deshi-gold">Wear</span>
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            Traditional and contemporary Bangladeshi fashion — from Jamdani
            heritage to urban street style. Made with ❤️ in Bangladesh.
          </p>
          <p className="font-medium text-sm text-deshi-gold mb-4">
            Sign up and get 10% off your first order
          </p>
          <form className="flex w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 min-w-0 p-3 text-sm bg-white/10 border border-white/20 rounded-l-md focus:outline-none focus:ring-1 focus:ring-deshi-gold placeholder:text-white/50"
            />
            <button
              type="submit"
              className="shrink-0 whitespace-nowrap bg-deshi-green text-white px-4 text-sm rounded-r-md hover:bg-deshi-green-dark transition-colors font-medium"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-widest">Shop</h3>
          <ul className="space-y-2.5 text-sm">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-deshi-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-widest">Support</h3>
          <ul className="space-y-2.5 text-sm">
            {supportLinks.map((label) => (
              <li key={label}>
                <Link to="#" className="hover:text-deshi-gold transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-widest">Follow Us</h3>
          <div className="flex items-center space-x-4 mb-6">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Meta" className="hover:text-deshi-gold transition-colors">
              <TbBrandMeta className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-deshi-gold transition-colors">
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a href="https://www.x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="hover:text-deshi-gold transition-colors">
              <RiTwitterXLine className="h-4 w-4" />
            </a>
          </div>
          <p className="text-sm text-white/60">Call Us (10am – 10pm)</p>
          <p className="text-white mt-1">
            <FiPhoneCall className="inline-block mr-2" />
            (+880) 1748 004936
          </p>
        </div>
      </div>

      <div className="container mx-auto mt-12 px-4 border-t border-white/10 pt-6">
        <p className="text-white/50 text-sm text-center">
          © {new Date().getFullYear()} DeshiWear. All rights reserved. Made in Bangladesh 🇧🇩
        </p>
      </div>
    </footer>
  );
};

export default Footer;

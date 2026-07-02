import { Link } from "react-router-dom";
import Hero from "../Layout/Hero";
import FeaturedCollection from "../Products/FeaturedCollection";
import FeaturesSection from "../Products/FeaturesSection";
import NewArrivals from "../Products/NewArrivals";

const categories = [
  { label: "Panjabi", image: "https://picsum.photos/seed/catpanjabi/600/800", to: "/collections/all?category=Panjabi" },
  { label: "Saree", image: "https://picsum.photos/seed/catsaree/600/800", to: "/collections/all?category=Saree" },
  { label: "Kurti", image: "https://picsum.photos/seed/catkurti/600/800", to: "/collections/all?category=Kurti" },
  { label: "Urban", image: "https://picsum.photos/seed/caturban/600/800", to: "/collections/Urban Deshi" },
];

const Home = () => {
  return (
    <div>
      <Hero />

      {/* Category tiles */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <p className="uppercase tracking-[0.25em] text-deshi-green text-xs font-semibold mb-2">
              Shop by category
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              The Deshi Wardrobe
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link key={cat.label} to={cat.to} className="group relative rounded-xl overflow-hidden aspect-[3/4]">
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 inset-x-0 text-center">
                  <span className="font-display text-2xl font-semibold text-white tracking-wide">
                    {cat.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NewArrivals />
      <FeaturedCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;

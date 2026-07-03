import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      <img
        src="https://images.pexels.com/photos/14928074/pexels-photo-14928074.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt="Woman in a vibrant red saree on a rural Bangladeshi road"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent" />
      <div className="relative container mx-auto h-full flex items-center px-4">
        <div className="max-w-xl text-white animate-fade-up">
          <p className="uppercase tracking-[0.3em] text-deshi-gold text-sm mb-4">
            ঐতিহ্যের সাথে আধুনিকতা
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
            Wear Your <span className="text-deshi-gold">Heritage</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            From handwoven Jamdani to urban street tees — authentic Bangladeshi
            fashion, delivered to your door anywhere in the country.
          </p>
          <div className="flex gap-4">
            <Link
              to="/collections/all"
              className="bg-deshi-green hover:bg-deshi-green-dark text-white px-8 py-3.5 rounded-full font-semibold transition-colors"
            >
              Shop Now
            </Link>
            <Link
              to="/collections/Heritage Collection"
              className="border border-white/60 hover:bg-white hover:text-ink text-white px-8 py-3.5 rounded-full font-semibold transition-colors"
            >
              Heritage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

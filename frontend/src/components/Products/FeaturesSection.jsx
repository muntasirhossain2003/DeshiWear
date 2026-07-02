import { HiOutlineCreditCard, HiOutlineTruck } from "react-icons/hi2";
import { HiArrowPathRoundedSquare } from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineTruck,
    title: "Nationwide Delivery",
    text: "Dhaka in 24–48h, everywhere in Bangladesh within 3–5 days",
  },
  {
    icon: HiOutlineCreditCard,
    title: "Cash on Delivery",
    text: "Pay when your order arrives — bKash & Nagad coming soon",
  },
  {
    icon: HiArrowPathRoundedSquare,
    title: "7-Day Easy Returns",
    text: "Wrong size or change of mind? Hassle-free exchange",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-14 px-4 border-t border-sand">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-deshi-green/10 text-deshi-green mb-4">
              <Icon className="h-7 w-7" />
            </div>
            <h4 className="font-semibold tracking-wide mb-1.5">{title}</h4>
            <p className="text-sm text-ink-soft">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;

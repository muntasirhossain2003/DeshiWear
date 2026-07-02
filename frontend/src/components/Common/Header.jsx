import Topbar from "../Layout/Topbar";
import Navbar from "./Navbar";

const Header = () => {
  return (
    <header className="border-b border-sand sticky top-0 z-30 bg-ivory/90 backdrop-blur-md">
      <Topbar />
      <Navbar />
    </header>
  );
};

export default Header;

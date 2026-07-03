import { Outlet } from "react-router-dom";
import ChatWidget from "../Common/ChatWidget";
import Footer from "../Common/Footer";
import Header from "../Common/Header";

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-ivory">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default UserLayout;

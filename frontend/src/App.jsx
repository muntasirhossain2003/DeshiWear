import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
const App = () => {
  return (
    <BrowserRouter>
      {/* Layouts */}
      <Routes>
        <Route path="/" element={<UserLayout />}>
          {/* User layout*/}
        </Route>
        <Route>{/* Admin layout*/}</Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;


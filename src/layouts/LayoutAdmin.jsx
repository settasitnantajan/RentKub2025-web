import Navbar from "@/components/navbar/Navbar";
import { Outlet } from "react-router";

const LayoutAdmin = () => {
  return (
    <main className="container">
      <Navbar/>
      <hr />
      <Outlet />
    </main>
  );
};
export default LayoutAdmin;

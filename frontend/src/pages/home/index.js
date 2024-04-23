import { Outlet } from "react-router-dom";
import NavBar from "./layout/NavBar";
import Footer from "./layout/Footer";

export default function Layout() {
  return (
    <div className="text-white bg-dark" style={{ height: "100vh", width: "100vw" }}>
      <div className="container d-flex w-100 h-100 p-3 mx-auto flex-column">
        <NavBar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export {default as Welcome} from "./welcome";
export {default as Registration} from "./registration";

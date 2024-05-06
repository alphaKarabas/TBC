import { Link } from "react-router-dom";
import LoginSliderButton from "./LoginSliderButton";
import LogoutButton from "./HomeLogoutButton";
import { useSelector } from "react-redux";

export default function NavBar() {
  const isAuth = useSelector((state) => state.UserSlice.isAuth);
  const currentUser = useSelector((state) => state.UserSlice.currentUser);
  return (
    <nav className="navbar navbar-dark mb-auto">
      <div className="container-fluid">
        <h3>
          <Link className="nav-link active" aria-current="page" to="/">
            Bot Creater
          </Link>
        </h3>
        {isAuth ? <LogoutButton email={currentUser?.email}/> : <LoginSliderButton />}
      </div>
    </nav>
  );
}

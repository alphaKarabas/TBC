import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
// import { useEffect } from "react";

export default function Welcome() {
  const isAuth = useSelector((state) => state.UserSlice.isAuth);
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (isAuth) {
  //     navigate("/botMenegment/myBots");
  //   }
  // }, []);

  // if (isAuth) {
  //   navigate("/botMenegment/myBots");
  // }

  return (
    <div className="px-3 text-center">
      <h1>Create your own Telegram bot.</h1>
      <p className="lead">
        Set up auto-replies, launch promo campaigns, and automate your business
        processes.
      </p>
      <p className="lead">
        <Link
          to={isAuth ? "/botMenegment/myBots" : "/registration"}
          className="btn btn-lg btn-primary fw-bold border-primar"
        >
          Get start
        </Link>
      </p>
    </div>
  );
}

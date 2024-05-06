import React, { Suspense, lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import { auth } from "./store/UserSlice";
import Loading from "./pages/Loading";
import Dashboard from "./pages/Dashboard";
import UserBots from "./pages/ControlPanel";
import Welcome from "./pages/Welcome";
import Registration from "./pages/Registration";
import { RequireAuth } from "./hoc/RequireAuth";

const Home = lazy(() => import("./pages/Home"));
const BotMenegment = lazy(() => import("./pages/BotMenegment"));
const BotEditer = lazy(() => import("./pages/BotEditer"));

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(auth());
  }, [dispatch]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Welcome />} />
          <Route path="registration" element={<Registration />} />
        </Route>
        {/* {isAuth && (
          <Route path="/botMenegment/*" element={<BotMenegment />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="myBots" element={<UserBots />} />
          </Route>
        )} */}
        <Route
          path="/botMenegment/*"
          element={
            <RequireAuth>
              <BotMenegment />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="myBots" element={<UserBots />} />
          <Route path="botEditer" element={<BotEditer />} />
        </Route>

        <Route
          path="/Editer"
          element={
            <RequireAuth>
              <BotEditer />
            </RequireAuth>
          }
        />
        {/* {isAuth && <Route path="/botEditer" element={<BotEditer />} />} */}
      </Routes>
    </Suspense>
  );
}

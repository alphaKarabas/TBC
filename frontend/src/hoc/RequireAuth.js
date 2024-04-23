import { useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";


const RequireAuth = ({children}) => {
  const location = useLocation();
  const isAuth = useSelector((state) => state.UserSlice.isAuth);

  if (!isAuth) {
    return <Navigate to="/" state={{from: location}}/>
  }

  return children
}
export {RequireAuth}
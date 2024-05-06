import { useDispatch } from "react-redux";
import { logout } from "../store/UserSlice";
import { resetBotListData } from "../store/BotListSlice";
import { resetFlowData } from "../store/FlowSlice";

export default function LoginSliderButton({ email }) {
  const dispatch = useDispatch();

  return (
    <div>
      <span className="p-3">{email}</span>
      <button
        onClick={() => {
          dispatch(logout());
          dispatch(resetFlowData());
          dispatch(resetBotListData());
        }}
        className="btn btn-primary"
        type="button"
      >
        Logout
      </button>
    </div>
  );
}

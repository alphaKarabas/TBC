import React from "react";
import { useSelector, useDispatch } from "react-redux";
import styles from "./User.module.sass";
import Dropdown from "../../Dropdown";
import { logout } from "../../../../store/UserSlice";
import { resetAdminData } from "../../../../store/AdminListSlice";
import { resetBotListData } from "../../../../store/BotListSlice";
import { resetFlowData } from "../../../../store/FlowSlice";

export default function User() {
  const user = useSelector((state) => state.UserSlice.currentUser);
  const dispatch = useDispatch();
  return (
    <div className={styles["wrapper"]}>
      <Dropdown lable={"User"} className={styles["btn"]} x={-10} align={"LEFT"}>
        <div className={styles["dropdown"]}>
          <button className={styles["menu-item"]}>{user.email}</button>
          <button
            onClick={() => {
              dispatch(logout());
              dispatch(resetFlowData());
              dispatch(resetBotListData());
              dispatch(resetAdminData());
            }}
            className={styles["menu-item"]}
          >
            Log Out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
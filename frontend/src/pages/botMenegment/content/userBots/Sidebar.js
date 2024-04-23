import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getBots, createBot } from "../../../../store/BotListSlice";
import SidebarItem from "./SidebarItem";
import styles from "./Sidebar.module.sass";

export default function Sidebar() {
  const botList = useSelector((state) => state.BotListSlice.bots);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getBots());
  }, [dispatch]);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {botList?.length > 0 ? (
            botList?.map((bot) => (
              <li key={bot._id}>
                <SidebarItem bot={bot} />
              </li>
            ))
        ) : (
          "You don't have bots"
        )}
      </ul>
      <div>
        <button
          onClick={() => dispatch(createBot({ name: "New bot" }))}
          className={styles.add}
        >
          CREATE NEW BOT
        </button>
      </div>
    </div>
  );
}

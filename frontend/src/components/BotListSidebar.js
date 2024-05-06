import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getBots, createBot } from "../store/BotListSlice";
import BotListSidebarItem from "./BotListSidebarItem";
import styles from "./BotListSidebar.module.sass";

export default function BotListSidebar() {
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
                <BotListSidebarItem bot={bot} />
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

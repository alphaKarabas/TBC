import React from "react";
import styles from "./UserBots.module.sass";
import BotPanel from "./BotPanel";
import Sidebar from "./Sidebar";

export default function UserBots() {
  return (
    <div className={styles.grid}>
      <Sidebar />
      <BotPanel />
    </div>
  );
}

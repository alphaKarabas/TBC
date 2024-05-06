import React from "react";
import styles from "./ControlPanel.module.sass";
import BotPanel from "./BotPanel";
import BotListSidebar from "../components/BotListSidebar";

export default function ControlPanel() {
  return (
    <div className={styles.grid}>
      <BotListSidebar />
      <BotPanel />
    </div>
  );
}

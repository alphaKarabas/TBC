import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./layout/header";
import styles from "./BotMenegment.module.sass";

export default function BotMenegment() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { default as Dashboard } from "./content/dashboard";
export { default as UserBots } from "./content/userBots";

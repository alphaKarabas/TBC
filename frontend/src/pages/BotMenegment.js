import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../layouts/BotMenegmentHeader";
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
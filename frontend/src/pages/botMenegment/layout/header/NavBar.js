import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.sass";

export default function NavBar() {
  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <NavLink className={({isActive}) => isActive ? styles.active : ""} to={"dashboard"}>Dashboard</NavLink>
        </li>
        <li className={styles.item}>
          <NavLink className={({isActive}) => isActive ? styles.active : ""} to={"myBots"}>My Bots</NavLink>
        </li>
      </ul>
    </div>
  );
}

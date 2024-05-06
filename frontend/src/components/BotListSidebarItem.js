import React from "react";
import { useDispatch } from "react-redux";
import Dropdown from "../components/Dropdown";
import {
  renameBot,
  deleteBot,
  currentBot,
  copyBot
} from "../store/BotListSlice";
import styles from "./BotListSidebarItem.module.sass";

export default function BotListSidebarItem({ bot }) {
  const dispatch = useDispatch();

  const RenameBot = () => {
    const newName = prompt("New name", bot.name);
    if (newName && newName !== bot.name) {
      dispatch(renameBot({ name: newName, id: bot._id }));
    }
  };

  const CopyBot = (name) => {
    const newName = name + "(copy)"
    dispatch(copyBot({ name: newName, id: bot._id }));
  };

  const DeleteBot = () => {
    dispatch(deleteBot({ id: bot._id }));
  };

  

  const SetCurrentBot = () => {
    dispatch(currentBot({ id: bot._id }));
  };

  return (
    <div className={styles.wrapper}>
      <button onClick={SetCurrentBot} className={styles.link}>
        {bot.name}
      </button>
      <Dropdown pos="RIGHT" x={10} lable="Ops" className={styles.ops}>
        <div className={styles.dropdown}>
          <button onClick={RenameBot} className={styles.menuItem}>
            Rename
          </button>
          <button onClick={() => CopyBot(bot.name)} className={styles.menuItem}>
            Copy
          </button>
          <button onClick={DeleteBot} className={styles.menuItem}>
            DELETE
          </button>
        </div>
      </Dropdown>
    </div>
  );
}

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./BotPanel.module.sass";
import ControleButtons from "./ControleButtons";

export default function BotPanel() {
  const currentBotId = useSelector((state) => state.BotListSlice.currentBotId);
  const verificationKey = useSelector(
    (state) => state.BotListSlice.verificationKey
  );
  const bots = useSelector((state) => state.BotListSlice.bots);
  const currentBot = bots.find((bot) => bot._id === currentBotId);
  const dispatch = useDispatch();
  useEffect(() => {
    if (verificationKey) {
      alert("Send the key to the bot: " + verificationKey);
    }
  }, [dispatch, verificationKey]);

  return (
    <div className={styles.content}>
      {currentBot ? (
        <>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th className={styles.wrapper}>
                  <div className={styles.header}>
                    <h3 className={styles.botName}>
                      {currentBot.name}{" "}
                      {currentBot.userName && "[@" + currentBot.userName + "]"}{" "}
                      {verificationKey && "Key:" + verificationKey}
                    </h3>
                    <ControleButtons currentBot={currentBot} />
                  </div>
                </th>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <div className={styles.wrapper}>
          <h3 className={styles.header}>Select Bot</h3>
        </div>
      )}
    </div>
  );
}

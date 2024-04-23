import React from "react";
import { useDispatch } from "react-redux";
import styles from "./BotPanel.module.sass";
import { useNavigate } from "react-router-dom";
import {
  startBot,
  stopBot,
  connectBot,
  disconnectBot,
} from "../../../../store/BotListSlice";

export default function ControleButtons({ currentBot }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const goToEditer = () => {
    navigate("/Editer");
  };

  const start = () => {
    dispatch(startBot({ id: currentBot._id }));
  };

  const stop = () => {
    dispatch(stopBot({ id: currentBot._id }));
  };

  const connect = () => {
    const token = prompt("Token");
    if (token) {
      dispatch(connectBot({ token, id: currentBot._id }));
    }
  };

  const disonnect = () => {
    dispatch(disconnectBot({ id: currentBot._id }));
  };
  return (
    <div>
      {currentBot.token ? (
        <div  className={styles.btns}>
          <button onClick={goToEditer} className={styles.btn}>
            Edite flow
          </button>
          {currentBot.isActive ? (
            <button onClick={stop} className={styles.btn}>
              Stop
            </button>
          ) : (
            <>
              <button onClick={start} className={styles.btn}>
                Start
              </button>
              <button onClick={disonnect} className={styles.btn}>
                Diconnect
              </button>
            </>
          )}
        </div>
      ) : (
        <button onClick={connect} className={styles.btn}>
          Connect
        </button>
      )}
    </div>
  );
}

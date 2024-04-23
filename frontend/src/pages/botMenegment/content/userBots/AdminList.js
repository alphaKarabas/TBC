import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./AdminList.module.sass";
import {
  addAdmin,
  deleteAdmin,
  loadAdmins,
} from "../../../../store/AdminListSlice";

export default function AdminList({ currentBot }) {
  const dispatch = useDispatch();
  const admins = useSelector((state) => state.AdminListSlice.admins);
  const inputRule = useRef(null);
  const inputDate = useRef(null);
  useEffect(() => {
    dispatch(loadAdmins({ botId: currentBot._id }));
  }, [currentBot._id]);

  const addAdminHandler = () => {
    dispatch(
      addAdmin({
        botId: currentBot._id,
        rule: inputRule.current.value.trim(),
        terminationDate: inputDate.current.value,
      })
    );
  };

  const deleteAdminHandler = (id) => {
    dispatch(
      deleteAdmin({
        id: id,
      })
    );
  };

  const adminRaw = (admin) => {
    if (admin?.slot?.isOccupied) {
      const rule = admin?.slot?.rule;
      const username = admin?.client?.username;
      const dataJoin = new Date(admin?.slot?.dataJoin).toDateString();
      const termination = new Date(admin?.slot?.terminationDate).toDateString();
      return (
        <li className={styles.item} key={admin?.slot?._id}>
          <span>{rule} | </span>
          <span>{username} | </span>
          <span>Join: {dataJoin} | </span>
          {admin?.slot?.terminationDate && <span>Termination: {termination} | </span>}
          <button onClick={() => deleteAdminHandler(admin?.slot?._id)}>
            Delete
          </button>
        </li>
      );
    } else {
      const rule = admin?.slot?.rule;
      const authKey = admin?.slot?.authKey;
      const termination = new Date(admin?.slot?.terminationDate).toDateString();
      return (
        <li className={styles.item} key={admin?.slot?._id}>
          <span>{rule} | </span>
          <span>Key: {authKey} | </span>
          {admin?.slot?.terminationDate && <span>Termination: {termination} | </span>}
          <button onClick={() => deleteAdminHandler(admin?.slot?._id)}>
            Delete
          </button>
        </li>
      );
    }
  };

  return (
    <div>
      <ul className={styles.list}>{admins.map((admin) => adminRaw(admin))}</ul>
      <div>
        <input ref={inputRule} type="text" name="Rule" />
        <input ref={inputDate} type="date" name="Termination date" />
        <button onClick={addAdminHandler}>Add</button>
      </div>
    </div>
  );
}

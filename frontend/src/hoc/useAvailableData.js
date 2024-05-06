import React, { useState, useEffect, useContext } from 'react';
import { updateUsedKeys } from '../store/FlowAsyncThunks';
import { collectAvailableDataOn, addStateToUsedKey } from '../tools/dataTreeMethods';
import moduleDataTypes from "../moduleInfo/dataTypes";
import { useSelector, useDispatch } from "react-redux";

function useAvailableData(id, inputKey) {
  const dispatch = useDispatch()
  const [dataName, setDataName] = useState('');
  const [availableData, setAvailableData] = useState([]);
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);

  const setData = (name) => {
    const node = dataTree[id]
    const usedKeys = node.usedKeys.filter(usedKey => usedKey.inputKey != inputKey)
    const newUedKey = addStateToUsedKey({ ...availableData[name], inputKey }, name ? 'connected' : 'serialized')
    usedKeys.push(newUedKey)
    dispatch(updateUsedKeys({ id, usedKeys }))
  }

  useEffect(() => {
    console.log('useEffect');
    const data = collectAvailableDataOn(dataTree, id);
    const type = moduleDataTypes[dataTree[id].moduleId].inputs
      .find(input => input.key == inputKey).type
    const usedKeys = dataTree[id].usedKeys;
    const usedKey = usedKeys.find(usedKey => usedKey.inputKey === inputKey);
    let newName = ''
    if (usedKey.state == 'connected') {
      newName = usedKey.name;
    }

    setAvailableData(data[type] || []);
    setDataName(usedKey.name);
  }, [dataTree, id, inputKey]);

  return [dataName, availableData, setData];
}


export default useAvailableData




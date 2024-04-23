import React, { useState, useEffect, useContext } from 'react';
import { collectAvailableDataLinksByTypes, updateUsedKeys } from '../../store/FlowSlice';
import moduleDataTypes from "./moduleDataTypes";
import { useSelector, useDispatch } from "react-redux";

function useAvailableData(id, inputKey) {
  const dispatch = useDispatch()
  const [dataName, setDataName] = useState('');
  const [availableData, setAvailableData] = useState([]);
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);

  const setData = (name) => {
    const newUsedKeys = dataTree[id].usedKeys.filter(usedKey => usedKey.name != dataName)
    const usedKey = { ...availableData[name], inputKey }
    newUsedKeys.push(usedKey)
    dispatch(updateUsedKeys({ id, usedKeys: newUsedKeys }))
  }

  useEffect(() => {
    const newAvailableData = collectAvailableDataLinksByTypes(dataTree, id);

    const type = moduleDataTypes[dataTree[id].moduleId].inputs
      .find(input => input.key == inputKey).type
    const usedKeys = dataTree[id].usedKeys;
    const usedKey = usedKeys.find(usedKey => usedKey.inputKey === inputKey);
    let newName = ''
    if (usedKey.state == 'connected')
      newName = dataTree[usedKey.sourceId].outputKeys[usedKey.outputKey].name;

    setAvailableData(newAvailableData[type] || []);
    setDataName(newName);
  }, [dataTree, id, inputKey]);

  return [dataName, availableData, setData];
}


export default useAvailableData




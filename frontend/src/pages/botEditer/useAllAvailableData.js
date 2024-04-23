import { useState, useEffect } from 'react';
import { collectAvailableDataLinksByTypes, updateUsedKeys } from '../../store/FlowSlice';
import { useSelector, useDispatch } from "react-redux";

function useAllAvailableData(id, inputKey) {
  const dispatch = useDispatch()
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);
  const usedKey = dataTree[id].usedKeys.find(usedKey => usedKey.inputKey === inputKey);
  const [dataName, setDataName] = useState(usedKey.name);
  const [dataType, setDataType] = useState(usedKey.type);
  const [availableData, setAvailableData] = useState([]);

  const setData = (type, name) => {
    const newUsedKeys = dataTree[id].usedKeys.filter(usedKey => usedKey.inputKey != inputKey)
    if (!type || !name) {
      setDataName('');
      setDataType('');
      newUsedKeys.push({ inputKey, 'state': 'serialized' })
    }
    else {
      newUsedKeys.push({ ...availableData[type][name], inputKey, 'state': 'connected' })
    }
    dispatch(updateUsedKeys({ id, usedKeys: newUsedKeys }))
  }

  useEffect(() => {
    const newAvailableData = collectAvailableDataLinksByTypes(dataTree, id);

    if (usedKey.state == 'connected') {
      const newName = dataTree[usedKey.sourceId].outputKeys[usedKey.outputKey].name;
      const newType = usedKey.type;
      setDataName(newName);
      setDataType(newType);
    }

    setAvailableData(newAvailableData);
  }, [dataTree, id, inputKey]);

  return [dataName, dataType, availableData, setData];
}


export default useAllAvailableData




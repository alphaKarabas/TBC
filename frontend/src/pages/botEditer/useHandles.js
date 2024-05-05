import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { updateHandles } from "../../store/FlowAsyncThunks";

function generateUniqueKey(keys) {
  let newKey;
  do {
    newKey = Math.floor(Math.random() * 1000);
  } while (keys.includes(newKey));
  return newKey;
}

function useHandles(id) {
  const dispatch = useDispatch()
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);
  const [targets, setTargets] = useState(dataTree[id].handles.targets);
  const [sources, setSources] = useState(dataTree[id].handles.sources);

  useEffect(() => {
    dispatch(updateHandles({ id, handles: { targets, sources } }))
  }, [targets, sources]);

  const addTarget = (keyPrefix) => {
    const newTargetKey = keyPrefix + generateUniqueKey(targets);
    setTargets(prevTargets => [...prevTargets, newTargetKey]);
    return newTargetKey;
  };

  const addSource = (keyPrefix) => {
    const newSourceKey = keyPrefix + generateUniqueKey(sources);
    setSources(prevSources => [...prevSources, newSourceKey]);
    return newSourceKey;
  };

  const removeTarget = (key) => {
    setTargets(targets.filter(target => target !== key));
  };

  const removeSource = (key) => {
    setSources(sources.filter(source => source !== key));
  };

  return { targets, sources, addTarget, addSource, removeTarget, removeSource };
}

export default useHandles




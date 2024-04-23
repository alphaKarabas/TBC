import React, { useState, useEffect, useContext } from 'react';
import { useNodeActions } from './NodeProvider';

function useAutoSave(id, initialState) {
  const [state, setState] = useState(initialState);
  const { saveData } = useNodeActions();

  useEffect(() => {
    const handleSave = () => {
      console.log(state);

      saveData(state);
    };

    handleSave();
  }, [state, id, useEffect]);

  return [state, setState];
}
export default useAutoSave




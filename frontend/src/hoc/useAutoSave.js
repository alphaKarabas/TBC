import { useState, useEffect } from 'react';
import { useNodeActions } from '../components/NodeProvider';

function useAutoSave(id, initialState) {
  const [state, setState] = useState(initialState);
  const { saveData } = useNodeActions();

  useEffect(() => {
    const handleSave = () => {
      saveData(state);
    };

    handleSave();
  }, [state, id, useEffect]);

  return [state, setState];
}
export default useAutoSave




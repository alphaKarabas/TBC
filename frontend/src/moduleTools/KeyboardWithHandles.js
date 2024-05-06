import React from 'react';
import useHandles from "../hoc/useHandles";

function KeyboardWithHandles({ id, keyboard, setKeyboard, prefix }) {
  const { addSource, removeSource } = useHandles(id);

  const addBtn = (row, col) => {
    const label = prompt('Enter button label:', 'New Button');
    if (!label) return;
    const newGrid = keyboard.map(inner => [...inner]);
    const key = addSource(prefix);
    newGrid[row].splice(col, 0, { key, text: label });
    setKeyboard(newGrid);
  };

  const addRow = (row) => {
    const label = prompt('Enter button label for new row:', 'New Button');
    if (!label) return;
    const newGrid = [...keyboard];
    const key = addSource(prefix);
    newGrid.splice(row, 0, [{ key, text: label }]);
    setKeyboard(newGrid);
  };

  const removeBtn = (row, col) => {
    const key = keyboard[row][col].key;
    const newGrid = keyboard.map(inner => [...inner]);
    newGrid[row].splice(col, 1);
    if (newGrid[row].length === 0) {
      newGrid.splice(row, 1);
      if (newGrid.length === 0) {
        newGrid.push([]);
      }
    }
    removeSource(key);
    setKeyboard(newGrid);
  };

  const handleInputChange = (e, rowIndex, colIndex) => {
    const newGrid = keyboard.map(inner => [...inner]);
    const cell = newGrid[rowIndex][colIndex]
    const newCell = { ...cell, text: e.target.value }
    newGrid[rowIndex][colIndex] = newCell;
    setKeyboard(newGrid);
  };

  return (
    <div>
      {keyboard.map((row, rowIndex) => (
        <div key={rowIndex}>
          {rowIndex === keyboard.length - 1 && keyboard[0].length > 0 && <button onClick={() => addRow(rowIndex)}>+</button>}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => addBtn(rowIndex, 0)}>+</button>
            {row.map((cell, colIndex) => (
              <React.Fragment key={colIndex}>
                <button onClick={() => removeBtn(rowIndex, colIndex)}>X</button>
                <input
                  value={cell.text}
                  onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                />
                <button onClick={() => addBtn(rowIndex, colIndex + 1)}>+</button>
              </React.Fragment>
            ))}
          </div>
          {rowIndex === keyboard.length - 1 && keyboard[0].length > 0 && <button onClick={() => addRow(rowIndex + 1)}>+</button>}
        </div>
      ))}
    </div>
  );
}

export default KeyboardWithHandles;
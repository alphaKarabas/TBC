import { Position, Handle } from 'reactflow';

function KeyboardWithHandlesView({ keyboard }) {
  return (
    <div style={{ position: 'relative', height: 0 }}>
      <div style={{ position: 'absolute', top: '10px' }}>
        {keyboard.flat().map((cell) => (
          <div key={cell.key+'0'} style={{position: 'relative', left: '-10px'}}>
            <div style={{backgroundColor:'white', margin: '5px', padding:'5px', borderRadius: '5px', width: '210px'}}>{cell.text}</div>
            <Handle
              key={cell.key}
              type='source'
              style={{
                backgroundColor: '#38d991',
                width: '10px',
                height: '15px',
                borderRadius: '3px',
                left: '210px'
              }}
              position={Position.Right}
              id={cell.key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default KeyboardWithHandlesView
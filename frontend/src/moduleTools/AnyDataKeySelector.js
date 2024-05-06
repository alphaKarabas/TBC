import useAllAvailableData from '../hoc/useAllAvailableData';
import { useState } from 'react';
function AnyDataKeySelector({ id, inputKey }) {
    const [dataName, dataType, availableData, setData] = useAllAvailableData(id, inputKey);
    const [type, setType] = useState(dataType);
    
    const handleTypeChange = (event) => {
        setType(event.target.value);
        if (!event.target.value) {
            setData('', '')
        }
    };

    const handleNameChange = (event) => {
        setData(type, event.target.value)
    };

    return <div>
        <select value={type} onChange={handleTypeChange}>
            <option value="">Select type</option>
            {Object.keys(availableData).map((type) => (
                <option key={type} value={type}>
                    {type}
                </option>
            ))}
        </select>

        {type && (
            <select value={dataName} onChange={handleNameChange}>
                <option value="">Select name</option>
                {availableData[type] && Object.keys(availableData[type]).map((name) => {
                    const item = availableData[type][name].name;
                    return (
                        <option key={name} value={name}>
                            {item.name || name}
                        </option>
                    );
                })}
            </select>
        )}
    </div>
}

export default AnyDataKeySelector;
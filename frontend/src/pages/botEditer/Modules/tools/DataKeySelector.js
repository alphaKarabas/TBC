import useAvailableData from '../../useAvailableData';

function DataKeySelector({ id, inputKey }) {
    const [dataName, availableData, setData] = useAvailableData(id, inputKey);

    const handleChange = (event) => {
        setData(event.target.value);
        console.log('Выбранное значение:', event.target.value);
    };
    return <select value={dataName} onChange={(event) => handleChange(event)}>
        <option value="">Select name</option>
        {Object.keys(availableData).map(key =>
            <option key={availableData[key].name} value={availableData[key].name}>
                {availableData[key].name}
            </option>)}
    </select>
}

export default DataKeySelector;
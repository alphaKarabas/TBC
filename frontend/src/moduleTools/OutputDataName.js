import useOutputName from '../hoc/useOutputName';

function DataKeySelector({ id, outputKey }) {
    const [name, setInUse, inUse, setName] = useOutputName(id, outputKey);

    const handleCheckboxChange = () => {
        setInUse(!inUse);
    };

    const handleInputChange = (e) => {
        setName(e.target.value);
    };

    return (
        <div>
            <input
                onChange={handleCheckboxChange}
                type="checkbox"
                value="Bike"
                checked={inUse}
            />
            <input
                id={outputKey}
                name={outputKey}
                value={name}
                onChange={handleInputChange}
            />
        </div>
    );
}

export default DataKeySelector;
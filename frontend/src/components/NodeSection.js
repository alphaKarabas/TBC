const NodeSection = ({ section, onDragStart }) => {
    const modulse = section.modulse.map(({ id, name }) => {
        return (
            <div
                style={{
                    display: "block",
                    border: "1px solid #555",
                    borderRadius: "5px",
                    backgroundColor: "#bebdbf",
                }}
                key={name}
                draggable
                onDragStart={(event) =>
                    onDragStart(event, id)
                }
            >
                {name}
            </div>
        );
    });

    return (
        <div>
            <div>{section.name}</div>
            {modulse}
        </div>
    );
};

export default NodeSection;
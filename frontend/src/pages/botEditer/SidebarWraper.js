function SidebarWraper({ Sidebar, node, close }) {
    const data = node.data.publicData;
    return (
        <div style={{ width: '400px', border: '1px solid black' }}>
            <button onClick={close}>X</button>
            <h2>Node settings</h2>
            <p>Node: {node.data.privateData.moduleId}</p>
            <hr />
            <Sidebar id={node.id} data={data} ></Sidebar>
        </div>
    )
}

export default SidebarWraper;
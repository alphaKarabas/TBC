import NodeSection from "./NodeSection";

const NodeSections = ({ onDragStart }) => {
  const sections = [
    {
      name: 'Base', modulse: [
        { id: 'command', name: 'Command' },
        { id: 'loger', name: 'Loger' },
        { id: 'text', name: 'Text' },
      ]
    },
    {
      name: 'Massages', modulse: [
        { id: 'textMassage', name: 'Text Massage' },
        { id: 'question', name: 'Question' },
      ]
    }
  ]

  return (
    <div>
      {
        sections.map((section) => (
          <div key={section.name}>
            <NodeSection section={section} onDragStart={onDragStart} />
          </div>
        ))
      }
    </div>
  );
};

export default NodeSections;
const listeners = {
  activation: async ({ node, next }) => {
    next("main-source", { 'text': node['text'] });
  },
};

const textModule = {
  type: 'logical',
  listeners: listeners,
  targets: [],
  sources: [
    {
      key: 'text',
      type: 'text',
    }
  ],
}

module.exports = textModule;
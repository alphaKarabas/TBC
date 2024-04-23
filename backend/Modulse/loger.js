const listeners = {
  activation: async ({ id, data, next }) => {
    console.log(id, "LOGER :", data['data']);
    next("main-source", {});
  },
};

const logerModule = {
  type: 'logical',
  listeners: listeners,
  targets: [
    {
      key: 'data',
      required: false
    }
  ],
  sources: [],
}

module.exports = logerModule;
const { Schema, ObjectId } = require("mongoose")
const connect = require("../databaseInitializer")

const Node = new Schema({
  flowId: { type: ObjectId, required: true },
  moduleId: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  handles: {
    targets: [{ type: String }],
    sources: [{ type: String }]
  },
  outputKeys: {
    type: Map,
    of: {
      name: { type: String, required: true },
      inUse: { type: Boolean, required: true }
    }
  },
  usedKeys: [
    {
      inputKey: { type: String, required: true },
      state: {
        type: String,
        enum: ['connected', 'disconnected', 'not-serialized', 'serialized'],
        required: true
      },
      type: { type: String },
      sourceId: { type: String },
      name: { type: String },
      outputKey: { type: String },
      link: { type: String },
    }
  ],
  data: { type: Object, required: true },
  new: { type: Boolean, required: true },
}, { minimize: false })

module.exports = connect.model("Node", Node);


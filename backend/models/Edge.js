const {Schema, ObjectId} = require("mongoose")
const connect = require("../databaseInitializer")

const Edge = new Schema({
  flowId: {type: ObjectId, required: true},
  source: {type: ObjectId, required: true},
  sourceKey: {type: String, required: true},
  target: {type: ObjectId, required: true},
  targetKey: {type: String, required: true},
})

module.exports = connect.model("Edge", Edge);
const {Schema, ObjectId} = require("mongoose")
const connect = require("../databaseInitializer")

const Flow = new Schema({
  botId: {type: ObjectId, required: true},
  page: {type: Number, required: true},
  lastChangeDate: {type: Date, required: true},
  createdDate: {type: Date, required: true},
  viewportPosition: {type: Object}
})

module.exports = connect.model("Flow", Flow);
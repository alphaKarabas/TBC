const {Schema, ObjectId} = require("mongoose")
const connect = require("../databaseInitializer")

const Block = new Schema({
    telegramId: {type: String, required: true},
    botId: { type: ObjectId, required: true },
    date: { type: Date},
})

module.exports = connect.model("Block", Block);
const {Schema, ObjectId} = require("mongoose")
const connect = require("../databaseInitializer")

const Client = new Schema({
    telegramId: {type: String, required: true, unique: true},
    language_code: {type: String},
    first_name: {type: String},
    last_name: {type: String},
    username: {type: String},
})

module.exports = connect.model("Client", Client);
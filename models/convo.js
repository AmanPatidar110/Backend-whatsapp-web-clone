const mongoose = require('mongoose');
const Message = require('./messages.js');
const messageSchema = mongoose.model('Message').schema

const Schema = mongoose.Schema

const convoSchema = new Schema({
    members: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Types.ObjectId, ref: 'Message' }
},
{timestamps: true}
);

module.exports = mongoose.model('Convo', convoSchema);
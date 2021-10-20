const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    uuid: String,
    conversationId: String,
    text: String,
    deletedFor: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    by: { type: mongoose.Types.ObjectId, ref: 'User' },
    type: String,
    imgPath: String,
    audioPath: String,
    audioDuration: Number,
    messageStatus: String
},
{timestamps: true}
);

module.exports = mongoose.model('Message', messageSchema);
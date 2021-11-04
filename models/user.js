const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firebaseUserId: String,
    contactNumber: String,
    name: String,
    about: String,
    profileImagePath: String,
    lastSeen: Date,
    connections: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    conversations: [{conversationId: { type: mongoose.Types.ObjectId, ref: 'Convo' }, unseenCount: Number}] 
});

module.exports = mongoose.model('User', userSchema);
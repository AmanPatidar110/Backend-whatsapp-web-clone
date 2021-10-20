const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firebaseUserId: String,
    contactNumber: String,
    name: String,
    profileImagePath: String,
    lastSeen: Date,
    conversations: [{conversationId: { type: mongoose.Types.ObjectId, ref: 'Convo' }, unseenCount: Number}] 
});

module.exports = mongoose.model('User', userSchema);
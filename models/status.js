const mongoose = require('mongoose');

const statusSchema = mongoose.Schema({
    postedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    expiry: Date,
    seenBy: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    statusImagePath: String,
    caption: String,
},
{timestamps: true}
);

module.exports = mongoose.model('Status', statusSchema);
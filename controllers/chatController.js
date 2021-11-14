const Convo = require('../models/convo');
const Message = require('../models/messages');
const User = require('../models/user');

const mongoose = require('mongoose');


exports.getChatList = async (req, res, next) => {
    try {
        const firebaseUserId = res.locals.userDetails.id;

        const guest = await User.findOne({ firebaseUserId: firebaseUserId }, { conversations: 1 })
            .populate({
                path: "conversations.conversationId",
                populate: {
                    path: "members lastMessage"
                }
            }).exec();

        const plain = guest.conversations
        const sorted = guest.conversations.sort((a, b) => a.lastMessage?.createdAt > b.lastMessage?.createdAt ? 1 : -1)
        res.status(200).json(sorted);


        // res.status(200).json(guest.conversations);

    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
};


exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUserId: res.locals.userDetails.id });
        const userObj = {
            userId: user._id,
            profileImagePath: user.profileImagePath,
            userName: user.name,
            about: user.about
        }
        if (user) {

            res.status(200).json({
                userObj: userObj
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
};


exports.getMessages = async (req, res, next) => {
    try {
        const firebaseUserId = res.locals.userDetails.id;
        const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1 })

        const convoId = req.params.convoId;

        const messages = await Message.find({ conversationId: convoId, deletedFor: { $ne: host._id } });
        res.status(200).json({ messages: messages });

    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
};


exports.postMessage = async (req, res, next) => {
    const firebaseUserId = res.locals.userDetails.id;

    const convoId = req.params.convoId;
    const uuid = req.body.uuid;
    const msg = req.body.text;
    const by = req.body.by;
    const type = req.body.type;
    const messageStatus = req.body.messageStatus;
    const audioDuration = req.body.audioDuration;
    const imagePath = req.body.imgPath;
    const audioPath = req.body.audioPath;

    const message = new Message({
        uuid: uuid,
        text: msg,
        conversationId: convoId,
        by: by,
        type: type,
        imgPath: imagePath,
        audioPath: audioPath,
        messageStatus: messageStatus,
        audioDuration: audioDuration,
        deletedFor: []
    });

    try {

        const host = await User.findOne({ firebaseUserId: firebaseUserId }, { conversations: 1, _id: 1 })
        const tempConvo = await Convo.findOne({ _id: message.conversationId });
        console.log("yempconvo" + tempConvo);
        const savedMessage = await message.save();

        if (tempConvo) {
            console.log(tempConvo, "contrmp")
            const youId = tempConvo.members.find((mem) => {
                console.log("check", mem, host._id)
                return mem.toString() !== host._id.toString()
            });
            console.log(youId, "UOUID")
            const guest = await User.findOne({ _id: youId }, { conversations: 1, _id: 1 })
            const updateResult = await Convo.updateOne({ _id: convoId }, { lastMessage: savedMessage._id })

            if (tempConvo && !guest.conversations.some(convo => convo.conversationId.toString() === message.conversationId.toString())) {

                await User.updateOne({ _id: guest._id }, { $addToSet: { conversations: { conversationId: message.conversationId, unseenCount: 1 } } });
                await User.updateOne({ _id: guest._id }, { $addToSet: { connections: host._id } });

                // const receiver = helper(host._id);
                // console.log("receiver", receiver);

                // if (receiver) {
                //     io.to(receiver.socketId).emit("getMessage", {
                //         uuid: uuid,
                //         by: by,
                //         receiverId: guest._id,
                //         text: msg,
                //         conversationId: convoId,
                //         type: type,
                //         imgPath: imagePath,
                //         createdAt: savedMessage.createdAt,
                //         messageStatus: messageStatus
                //     });
                // }
            }
        }
            res.status(200).json({ result: savedMessage });
        
        } catch (error) {
            console.log(error)
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };

    exports.postSetReceivedMessages = async (req, res, next) => {

        const sender = mongoose.Types.ObjectId(req.body.by);
        const receiver = mongoose.Types.ObjectId(req.body.to);

        try {
            const convo = await Convo.findOne({ members: { $all: [sender, receiver] } }, { _id: 1 });

            const result = await Message.updateMany({ conversationId: mongoose.Types.ObjectId(convo._id), by: mongoose.Types.ObjectId(sender), messageStatus: "SENT" }, { messageStatus: "RECEIVED" })
            res.status(200).json({ result: true });

        } catch (error) {
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };

    exports.postSetSeenMessages = async (req, res, next) => {

        const sender = req.body.sender;
        const receiver = req.body.receiver;
        const convoId = req.body.convoId;

        try {
            const result = await Message.updateMany({ conversationId: mongoose.Types.ObjectId(convoId), by: mongoose.Types.ObjectId(sender) }, { messageStatus: "SEEN" })
            res.status(200).json({ result: true });

        } catch (error) {
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };


    // exports.deleteMessages = async (req, res, next) => {
    //     const convoId = req.params.convoId;

    //     try {
    //         const result = await Message.deleteMany({ conversationId: convoId });
    //         const updateResult = await Convo.updateOne({ _id: convoId }, { lastMessage: { conversationId: convoId } })
    //         console.log("deleting messages " + convoId)

    //         if (!result) {
    //             return res.status(501).json({ message: "Messages not deleted." });
    //         }

    //         res.status(200).json({ message: "Messages deleted successfully." });

    //     } catch (error) {
    //         if (!error.statusCode) error.statusCode = 500;
    //         return next(error);
    //     }
    // }


    exports.deleteChat = async (req, res, next) => {
        const firebaseUserId = res.locals.userDetails.id;
        const convoId = req.params.convoId;
        const guestId = req.params.guestId;
        const code = req.params.code;


        try {
            const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1 })
            await User.updateOne({ firebaseUserId: firebaseUserId }, { $pull: { conversations: { conversationId: convoId } } });

            console.log(guestId + "guestId")
            const tempGuest = await User.findOne({ _id: guestId }, { conversations: 1 });

            if (tempGuest && !(tempGuest.conversations.some(convo => convo.conversationId.toString() === convoId.toString()))) {
                await Convo.deleteOne({ members: { $all: [host._id, guestId] } });
            }

            if (code === "dfe") {

                await Convo.deleteOne({ members: { $all: [host._id, guestId] } });

                const r1 = await User.updateOne({ _id: guestId }, { $pull: { conversations: { conversationId: convoId } } });

            }



            res.status(200).json({ message: "Chat deleted successfully." });

        } catch (error) {
            console.log(error);
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    }


    exports.deleteMessage = async (req, res, next) => {
        const firebaseUserId = res.locals.userDetails.id;
        const uuid = req.params.uuid;
        const guestId = req.params.guestId;
        const code = req.params.code;
        const convoId = req.params.convoId;


        try {
            const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1 });
            const convo = await Convo.findOne({ _id: convoId }).populate("lastMessage");



            let response;

            if (code === "dfe") {
                response = await Message.updateOne({ uuid: uuid }, { $addToSet: { deletedFor: { $each: [host._id, guestId] } } });
            }

            response = await Message.updateOne({ uuid: uuid }, { $addToSet: { deletedFor: host._id } });

            if (convo.lastMessage.uuid === uuid) {
                const messages = await Message.find({ conversationId: convoId, deletedFor: { $ne: host._id } }, { _id: 1 });
                const resp = await Convo.updateOne({ _id: convoId }, { lastMessage: (messages[messages.length - 1])._id });
                console.log(resp);
            }

            res.status(200).json({ message: "Message deleted successfully." });

        } catch (error) {
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    }

    exports.postConvo = async (req, res, next) => {
        try {
            const number = req.params.number;
            const userId = res.locals.userDetails.id;


            const guest = await User.findOne({ contactNumber: number }, { firebaseUserId: 1, _id: 1 });
            const host = await User.findOne({ firebaseUserId: userId }, { _id: 1 });

            if (!guest) {
                return res.status(202).json({
                    message: "User doesn't exist"
                });
            }
            if (guest.firebaseUserId === userId)
                return res.status(202).json({ message: "It's your own number" });

            const convo = await Convo.findOne({ members: { $all: [host._id, guest._id] } }).populate({ path: "members lastMessage" }).exec();


            if (convo) {
                return res.status(200).json({
                    message: "Convo already present",
                    selectedConvo: convo
                })
            }

            else {
                const c = new Convo({
                    members: [host._id, guest._id]
                })

                const resp = await c.save();

                const selectedC = await Convo.findOne({ members: { $all: [host._id, guest._id] } }).populate('members lastMessage').exec();


                await User.updateOne({ contactNumber: number }, { $addToSet: { conversations: { conversationId: resp._id, unseenCount: 0 } } });
                await User.updateOne({ firebaseUserId: userId }, { $addToSet: { conversations: { conversationId: resp._id, unseenCount: 0 } } });

                await User.updateOne({ contactNumber: number }, { $addToSet: { connections: host._id } });
                await User.updateOne({ firebaseUserId: userId }, { $addToSet: { connections: guest._id } });



                return res.status(201).json({
                    message: "Convo created!",
                    selectedConvo: selectedC
                });
            }

        } catch (error) {
            console.log(error);
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };


    exports.postIncrementUnseenCount = async (req, res, next) => {
        try {
            const convoId = req.body.convoId;
            const userId = res.locals.userDetails.id;

            console.log("INCREAMENT TRIGGERED", convoId);


            const guest = await User.updateOne({ firebaseUserId: userId, "conversations.conversationId": convoId }, {

                $inc: { 'conversations.$.unseenCount': 1 }

            });

            if (guest)
                return res.status(201).json({
                    message: "Ccount++"
                });


        } catch (error) {
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };


    exports.postClearUnseenCount = async (req, res, next) => {
        try {
            const convoId = req.body.convoId;
            const userId = res.locals.userDetails.id;

            console.log("Clear TRIGGERED", convoId);


            const guest = await User.updateOne({ firebaseUserId: userId, "conversations.conversationId": convoId }, { 'conversations.$.unseenCount': 0 });

            if (guest)
                return res.status(201).json({
                    message: "Count0"
                });


        } catch (error) {
            if (!error.statusCode) error.statusCode = 500;
            return next(error);
        }
    };
const Status = require("../models/status");
const User = require("../models/user");


exports.postStatus = async (req, res, next) => {

    const caption = req.body.caption;
    const statusImagePath = req.body.statusImagePath;
    const firebaseUserId = res.locals.userDetails.id;


    let result;

    try {
        const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1 });

        if (!host) {
            return res.status(203).json({
                message: "User not found!"
            });
        }

        const now = new Date;
        const expiry = now;
        expiry.setDate(now.getDate() + 1);

        const status = new Status({
            postedBy: host._id,
            expiry: expiry,
            statusImagePath: statusImagePath,
            caption: caption
        })

        result = await status.save();

        if (result) {
            res.status(200).json({
                message: "Status saved successfully."
            });
        }
    } catch (error) {
        console.log(error)
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
}



exports.getStatusList = async (req, res, next) => {
    try {
        const firebaseUserId = res.locals.userDetails.id;
        const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1, connections: 1 }).populate({ path: "connections", select: "name" });

        const now = new Date;
        const statusPromises = host.toObject().connections.map(async (userId) => {

            const statusOfUser = await Status.find({ postedBy: userId._id, expiry: { $gt: now }, seenBy: { $ne: host._id } });
            return {
                user: userId,
                statusArray: statusOfUser
            };
        });
        const viewedStatusPromises = host.toObject().connections.map(async (userId) => {

            const statusOfUser = await Status.find({ postedBy: userId._id, expiry: { $gt: now }, seenBy: host._id });
            return {
                user: userId,
                statusArray: statusOfUser
            };
        });

        let statusList = await Promise.all(statusPromises);
        statusList = statusList.filter(single => single.statusArray.length > 0);

        let viewedStatusList = await Promise.all(viewedStatusPromises);
        viewedStatusList = viewedStatusList.filter(single => single.statusArray.length > 0);
        console.log(viewedStatusList);

        const allMyStatus = await Status.find({ postedBy: host._id, expiry: { $gt: new Date } });

        res.status(200).json({
            statusList,
            viewedStatusList,
            allMyStatus
        })

    } catch (error) {
        console.log(error);
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
};




exports.putStatusView = async (req, res, next) => {

    const firebaseUserId = res.locals.userDetails.id;
    const statusId = req.body.statusId;


    let result;

    try {
        const host = await User.findOne({ firebaseUserId: firebaseUserId }, { _id: 1, connections: 1 }).populate({ path: "connections", select: "name" });

        const result = await Status.updateOne({ _id: statusId }, { $addToSet: { seenBy: host._id } });

        if (!result) {
            return res.status(500).json({
                message: "Error accessing database!"
            });
        }

        if (result) {
            res.status(200).json({
                message: "Seen successfully."
            });
        }
    } catch (error) {
        console.log(error)
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
}
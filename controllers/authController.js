// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

const User = require("../models/user");
const Convo = require('../models/convo');

// dotenv.config();

exports.checkUser = async (req, res, next) => {
    try {
        console.log("phone"+ res.locals.userDetails.phone);
        const user = await User.findOne({ firebaseUserId: res.locals.userDetails.id });
        if (!user) {

            const u = new User({
                contactNumber: res.locals.userDetails.phone,
                firebaseUserId: res.locals.userDetails.id
            });

            await u.save();

            return res.status(200).json({
                isNewUser: true,
                isProfileComplete: false
            });
        }

        res.status(200).json({
            userObj: user,
            isNewUser: false,
            isProfileComplete: user.name ? true: false
        });

    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
};



// exports.postLoginNumber = async (req, res, next) => {
//     const contactNumber = req.body.number;

//     console.log(contactNumber + "connnn")

//     try {
//         const matchedUser = await User.findOne({ contactNumber: contactNumber });
//         console.log(contactNumber + "connnn")

//         if (!matchedUser) {

//             const temp = `+918827636604`;

//             console.log("temp " + temp)


//             client.api.messages.create({
//                 body: 'Hello! I am Aman, I welcome you on this platform. You have been initiated for singning up!',
//                 from: '+18653750675',
//                 to: "+919179459168"
//             }).then(message => {
//                 return res.status(200).json({
//                     newUser: true,
//                     number: contactNumber,
//                     message: message
//                 });
//             }).catch(err => {
//                 return res.status(200).json({
//                     newUser: true,
//                     number: contactNumber,
//                     err: err
//                 });
//             });
//         }

//         else {

//             res.status(200).json({
//                 newUser: false,
//                 number: contactNumber
//             });
//         }
//     } catch (error) {
//         if (!error.statusCode) error.statusCode = 500;
//         return next(error);
//     }
// };


// exports.postLoginPassword = async (req, res, next) => {
//     const contactNumber = req.body.number;
//     const password = req.body.password;
//     let result;

//     if (!password) {
//         return res.status(203).json({
//             message: "Please try again!"
//         })
//     }

//     try {
//         const matchedUser = await User.findOne({ contactNumber: contactNumber });
//         let token;


//         if (matchedUser) {
//             token = await jwt.sign({
//                 number: contactNumber,
//                 userId: matchedUser._id
//             },
//                 process.env.JWT_KEY,
//                 { expiresIn: '1h' }
//             );

//             result = await bcrypt.compare(password, matchedUser.password);

//             if (result) {
//                 return res.status(202).json({
//                     newUser: false,
//                     message: "Successfully loggedIn!",
//                     token: token,
//                     userId: matchedUser._id,
//                     expiresIn: 3600
//                 });
//             } else {
//                 return res.status(203).json({
//                     message: "You login info didn't matched"
//                 });
//             }
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         var digits = '0123456789';
//         let OTP = '';
//         for (let i = 0; i < 4; i++) {
//             OTP += digits[Math.floor(Math.random() * 10)];
//         }


//         const user = new User({
//             contactNumber: contactNumber,
//             password: hashedPassword,
//             otp: OTP
//         });

//         result = await user.save();


//         const temp = `+${contactNumber}`;

//         console.log("temp " + temp)
//         client.messages.create({
//             to: temp,
//             from: '+18653750675',
//             body: 'Hey! You are few steps away to get successfully signed-up! This is OTP for your verification : ' + OTP
//         }).then(message => {
//             return res.status(200).json({
//                 newUser: true,
//                 number: contactNumber,
//                 message: message
//             });
//         }).catch(err => {
//             return res.status(200).json({
//                 newUser: true,
//                 number: contactNumber,
//                 err: err
//             });
//         });


//         res.status(200).json({
//             newUser: true,
//             userId: result._id,
//             token: token,
//             expiresIn: 3600
//         });
//     } catch (error) {
//         if (!error.statusCode) error.statusCode = 500;
//         return next(error);
//     }
// };



exports.postSignup = async (req, res, next) => {
    const url = req.protocol + '://' + req.get('host');
    let imagePath = '';
    const file = req.file;

    if (file) {
        imagePath = url + "/images/" + file.filename;
    }
    const userId = res.locals.userDetails.id;
    const userName = req.body.name;

    let result;

    try {
        const matchedUser = await User.findOne({ firebaseUserId: userId });

        if (!matchedUser) {
            return res.status(203).json({
                message: "User not found!"
            });
        }

        result = await User.updateOne({ firebaseUserId: userId }, {name: userName,  contactNumber: matchedUser.contactNumber, profileImagePath: imagePath});
        
        if (result.n) {
            res.status(201).json({
                message: "Successfully signedUp!"
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
}




exports.postOTP = async (req, res, next) => {

    const userId = req.body.userId;
    const userOtp = req.body.otp;

    try {
        const matchedUser = await User.findOne({ _id: userId });

        if (!matchedUser) {
            return res.status(203).json({
                newUser: true,
                message: "User doesn't exist!"
            });
        }

        else {
            if (matchedUser.otp === userOtp) {
                return res.status(200).json({
                    otpMatched: true
                });
            }
            res.status(203).json({
                otpMatched: false,
                message: "OTP doesn't match!"
            });
        }
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        return next(error);
    }
}

const express = require('express');

const authController = require('../controllers/authController');
// const fileExtractor = require('../middlewares/profileUpload');

const router = express.Router();


router.get("/user", authController.checkUser);

// router.post("/login/number", authController.postLoginNumber);
// router.post("/login/password", authController.postLoginPassword);
router.post("/signup", authController.postSignup);
router.post("/signup/otp", authController.postOTP);
router.put("/profileImage" ,authController.putProfileImage);
router.delete("/profileImage" ,authController.deleteProfileImage);
router.put("/userName" ,authController.putUserName);
router.put("/about" ,authController.putAbout);



module.exports = router;
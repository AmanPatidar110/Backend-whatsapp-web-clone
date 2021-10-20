const express = require('express');

const chatController = require('../controllers/chatController');
const fileExtractor = require('../middlewares/profileUpload');
const AudioFileExtractor = require('../middlewares/AudioUpload');

const router = express.Router();

router.post("/setreceived", chatController.postSetReceivedMessages);
router.post("/setseen", chatController.postSetSeenMessages);
router.post("/IncrementUnseenCount", chatController.postIncrementUnseenCount);
router.post("/ClearUnseenCount", chatController.postClearUnseenCount);

router.get("/user", chatController.getUserProfile);
router.get("/chatlist", chatController.getChatList);
// router.delete("/chatlist/messages/:convoId", chatController.deleteMessages);

router.post("/chatlist/:convoId/:guestId/:code", chatController.deleteChat);
router.post("/chatMessage/:convoId/:uuid/:guestId/:code", chatController.deleteMessage);
router.get("/:convoId", chatController.getMessages);
router.post("/:convoId", fileExtractor, chatController.postMessage);
router.post("/audio/:convoId", AudioFileExtractor, chatController.postMessage);
router.post("/convo/:number", chatController.postConvo);

module.exports = router;
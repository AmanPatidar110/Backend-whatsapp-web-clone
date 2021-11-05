const express = require('express');

const statusController = require('../controllers/statusController');
// const fileExtractor = require('../middlewares/profileUpload');

const router = express.Router();


router.post("/", statusController.postStatus);
router.get("/", statusController.getStatusList);
router.put("/view", statusController.putStatusView);


module.exports = router;
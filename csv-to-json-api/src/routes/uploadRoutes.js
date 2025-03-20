const express = require("express");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

router.post("/upload", uploadController.uploadFile);
router.post("/process/:filename", uploadController.processCSV);

module.exports = router;

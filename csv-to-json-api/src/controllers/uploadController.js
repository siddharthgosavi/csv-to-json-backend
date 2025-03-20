const path = require("path");
const multer = require("multer");
const fs = require("fs");
const config = require("../config/config");
const csvParser = require("../services/csvParser");
const dbService = require("../services/dbService");

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads")); // Store files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter: Only allow CSV files
const fileFilter = (req, file, cb) => {
  const allowedFileType = /csv/;
  const extName = allowedFileType.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = file.mimetype === "text/csv";

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).single("file");

/**
 * Upload a CSV file to the configured location
 */
const uploadFile = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    res.status(200).json({
      success: true,
      message: "CSV file uploaded successfully",
      filePath: `/uploads/${req.file.filename}`,
    });
  });
};

/**
 * Process a CSV file from the configured location
 */
async function processCSV(req, res) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(config.csvUploadPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Parse CSV to JSON
    const data = await csvParser.parseCSV(filePath);

    // Save to database
    await dbService.saveToDatabase(data);

    // Calculate age distribution
    const distribution = await dbService.calculateAgeDistribution();

    // Print age distribution report to console
    console.log("\nAge-Group % Distribution");
    console.log("------------------------");
    for (const [group, percentage] of Object.entries(distribution)) {
      console.log(`${group} ${percentage}`);
    }

    return res.status(200).json({
      message: "CSV processed successfully",
      recordCount: data.length,
      ageDistribution: distribution,
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  processCSV,
  uploadFile,
};

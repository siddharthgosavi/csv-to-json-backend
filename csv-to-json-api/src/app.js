const express = require("express");
const uploadRoutes = require("./routes/uploadRoutes");
const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const dbService = require("./services/dbService");
const cors = require("cors");

const uploadsDir = path.join(__dirname, "..", config.csvUploadPath);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.use(cors());

app.use(express.json());
dbService
  .initializeDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

app.use("/api", uploadRoutes);

module.exports = app;

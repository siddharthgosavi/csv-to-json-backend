require("dotenv").config();
module.exports = {
  port: process.env.PORT || 3000,
  csvUploadPath: process.env.CSV_UPLOAD_PATH || "./uploads",
  db: {
    host: process.env.PG_HOST || "localhost",
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || "userdb",
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "password",
  },
};

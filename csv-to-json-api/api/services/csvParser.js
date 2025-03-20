const fs = require("fs");
const readline = require("readline");

/**
 * Parse CSV file and convert to JSON objects
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} - Array of JSON objects
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error("File not found"));
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const results = [];
    let headers = [];
    let lineCount = 0;

    rl.on("line", (line) => {
      lineCount++;
      const values = parseCSVLine(line);

      if (lineCount === 1) {
        // First line contains headers
        headers = values.map((header) => header.trim());
        return;
      }

      if (values.length !== headers.length) {
        console.warn(
          `Line ${lineCount} has ${values.length} values but there are ${headers.length} headers`
        );
        return;
      }

      // Create object from CSV row
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        setNestedProperty(obj, headers[i].trim(), values[i].trim());
      }

      results.push(obj);
    });

    rl.on("close", () => {
      resolve(results);
    });

    rl.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Parse a CSV line respecting quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array} - Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
      continue;
    }

    if (char === '"' && inQuotes) {
      inQuotes = false;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  values.push(currentValue); // Push the last value
  return values;
}

/**
 * Set a nested property in an object using dot notation
 * @param {Object} obj - Target object
 * @param {string} path - Property path (e.g., "name.firstName")
 * @param {any} value - Property value
 */
function setNestedProperty(obj, path, value) {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

module.exports = {
  parseCSV,
};

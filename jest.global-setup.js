// Jest global setup - runs once before all tests
module.exports = async () => {
  // Set timezone for consistent test results
  process.env.TZ = "UTC";

  // Set test environment
  process.env.NODE_ENV = "test";

  // Disable external API calls
  process.env.DISABLE_EXTERNAL_APIS = "true";

  // Create test directories if they don't exist
  const fs = require("fs");
  const path = require("path");

  const testDirs = ["./test-results", "./coverage"];

  testDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log("Jest global setup completed");
};

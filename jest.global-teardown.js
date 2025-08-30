// Jest global teardown - runs once after all tests
module.exports = async () => {
  // Clean up test artifacts
  console.log('Jest global teardown completed')

  // Reset timezone
  delete process.env.TZ
}

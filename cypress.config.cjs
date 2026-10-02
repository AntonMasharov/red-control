const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8082',
    specPattern: 'tests/e2e/**/*.cy.cjs',
    supportFile: false,
  },
  video: false,
});

module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000",
        "http://localhost:3000/models",
        "http://localhost:3000/mcp-servers",
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "categories:pwa": "off",

        // Core Web Vitals
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Performance metrics
        "speed-index": ["warn", { maxNumericValue: 3000 }],
        interactive: ["warn", { maxNumericValue: 5000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],

        // Resource optimization
        "unused-javascript": ["warn", { maxNumericValue: 40000 }],
        "unused-css-rules": ["warn", { maxNumericValue: 20000 }],
        "modern-image-formats": ["warn", {}],
        "efficiently-encode-images": ["warn", {}],
        "render-blocking-resources": ["warn", {}],

        // Security
        "is-on-https": ["error", {}],
        "uses-http2": ["warn", {}],
        "no-vulnerable-libraries": ["error", {}],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    server: {
      port: 9009,
      storage: "./lighthouse-reports",
    },
  },
};

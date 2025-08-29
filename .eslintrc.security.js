module.exports = {
  extends: ["next/core-web-vitals"],
  plugins: ["security", "no-secrets"],
  rules: {
    // High-priority security rules only
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-pseudoRandomBytes": "error",

    // Relaxed rules for React/Next.js apps (turn off common false positives)
    "security/detect-object-injection": "off", // Too many false positives with React props
    "security/detect-non-literal-regexp": "off", // Common pattern for search functionality
    "security/detect-possible-timing-attacks": "off", // False positives with string comparisons

    // Custom security rules
    "no-console": "off", // Allow console in cleanup scripts and development
    "no-debugger": "error",
    "no-alert": "off", // Allow alerts for user confirmation dialogs
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",

    // Prevent sensitive data leaks (off to reduce noise)
    "no-secrets/no-secrets": "off",

    // API key patterns
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/sk-[a-zA-Z0-9]{32,}/]",
        message: "Potential API key detected. Use environment variables.",
      },
      {
        selector: "Literal[value=/AIza[a-zA-Z0-9-_]{35}/]",
        message:
          "Potential Google API key detected. Use environment variables.",
      },
      {
        selector: "Literal[value=/sk-ant-[a-zA-Z0-9-]{50,}/]",
        message:
          "Potential Anthropic API key detected. Use environment variables.",
      },
    ],

    // Prevent dangerous patterns
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["child_process"],
            message: "Child process usage requires security review.",
          },
          {
            group: ["fs", "node:fs"],
            message: "File system access requires security review.",
          },
        ],
      },
    ],
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ["**/*.test.{js,jsx,ts,tsx}", "**/__tests__/**/*", "jest.*.js", "playwright.config.ts"],
      rules: {
        "security/detect-non-literal-fs-filename": "off",
        "security/detect-non-literal-require": "off",
      },
    },
    {
      files: ["api/**/*", "scripts/**/*"],
      rules: {
        "no-console": "off", // Allow console in API routes and scripts
      },
    },
    {
      files: ["src/components/**/*"],
      rules: {
        "react-hooks/exhaustive-deps": "off", // Turn off to reduce noise in security scan
      },
    },
  ],
};

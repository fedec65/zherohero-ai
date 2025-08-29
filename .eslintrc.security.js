module.exports = {
  extends: ["next/core-web-vitals"],
  plugins: ["security", "no-secrets"],
  rules: {
    // Security-focused rules (warnings for common false positives)
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",

    // Custom security rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "warn",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",

    // Prevent sensitive data leaks (warn for false positives)
    "no-secrets/no-secrets": "warn",

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
      files: ["**/*.test.{js,jsx,ts,tsx}", "**/__tests__/**/*"],
      rules: {
        "security/detect-non-literal-fs-filename": "off",
        "security/detect-non-literal-require": "off",
      },
    },
  ],
};

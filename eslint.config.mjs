import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "app.js",
      "node_modules/**",
      "instagram-api-int/**",
      "uploads/**",
      "public/**",
      "views/**",
    ],
  },
];

export default eslintConfig;

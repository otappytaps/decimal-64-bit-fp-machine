# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Test Cases

### 1. Convert decimal to decimal-based double-precision

| Test Case Name | Input | Screenshot |
| :--- | :--- | :---: |
| **Postive Input** | `Decimal Input: 7531123456574426`<br>`Exponent: 20` | ![Test 1](SCREENSHOTS/DECIMAL64/Decimal64-1.png) |
| **Negative Input 1** | `Decimal Input: -8765432345678100`<br>`Exponent: -20` | ![Test 2](SCREENSHOTS/DECIMAL64/Decimal64-2.png) |
| **Negative Input 2** | `Decimal Input:  -0000000001234567`<br>`Exponent: 9` | ![Test 3](SCREENSHOTS/DECIMAL64/Decimal64-3.png) |
| **Different Input 1** | `Decimal Input: 9.875625`<br>`Exponent: 0` | ![Test 4](SCREENSHOTS/DECIMAL64/Decimal64-4.png) |
| **Different Input 2** | `Decimal Input: 98.75625`<br>`Exponent: -1` | ![Test 5](SCREENSHOTS/DECIMAL64/Decimal64-5.png) |
| **Maximum Exponent Input** | `Decimal Input: 1`<br>`Exponent: 369` | ![Test 6](SCREENSHOTS/DECIMAL64/Decimal64-6.png) |
| **Minimum Exponent Input** | `Decimal Input: 1`<br>`Exponent: -398` | ![Test 7](SCREENSHOTS/DECIMAL64/Decimal64-7.png) |
| **Positive Infinity Input** | `Decimal Input: 1`<br>`Exponent: 370` | ![Test 8](SCREENSHOTS/DECIMAL64/Decimal64-8.png) |
| **Underflow Input** | `Decimal Input: 1`<br>`Exponent: -399` | ![Test 9](SCREENSHOTS/DECIMAL64/Decimal64-9.png) |
| **String Input** | `Decimal Input: Hello World`<br>`Exponent: 1` | ![Test 10](SCREENSHOTS/DECIMAL64/Decimal64-10.png) |
| **Input With One Letter** | `Decimal Input: 7531123B56574426`<br>`Exponent: 20` | ![Test 11](SCREENSHOTS/DECIMAL64/Decimal64-11.png) |

## VIDEO WALKTHROUGH

The YouTube link for the video walkthrough of the project can be found [here](https://youtu.be/74KgVZBTCjI).

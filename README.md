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

### 1. Convert Decimal to Decimal-Based Double-Precision

| Test Case Name | Inputs | Screenshot |
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

### 2. Demonstrate Rounding Methods

| Test Case Name | Inputs | Screenshot |
| :--- | :--- | :---: |
| **Postive Decimal Input** | `Input Format: Decimal`<br>`Number: 1.55`<br>`Target Digits: 1` | ![Test 12](SCREENSHOTS/ROUNDING/Rounding-1.png) |
| **Negative Decimal Input** | `Input Format: Decimal`<br>`Number: -1.55`<br>`Target Digits: 1` | ![Test 13](SCREENSHOTS/ROUNDING/Rounding-2.png) |
| **Ties-to-Even Input 1** | `Input Format: Decimal`<br>`Number: 2.5`<br>`Target Digits: 0` | ![Test 14](SCREENSHOTS/ROUNDING/Rounding-3.png) |
| **Ties-to-Even Input 2** | `Input Format: Decimal`<br>`Number: 3.5`<br>`Target Digits: 0` | ![Test 15](SCREENSHOTS/ROUNDING/Rounding-4.png) |
| **Postive Binary Input** | `Input Format: Binary`<br>`Number: 10.01`<br>`Target Digits: 0` | ![Test 16](SCREENSHOTS/ROUNDING/Rounding-5.png) |
| **Negative Binary Input** | `Input Format: Binary`<br>`Number: -10.01`<br>`Target Digits: 0` | ![Test 17](SCREENSHOTS/ROUNDING/Rounding-6.png) |
| **Postive Decimal Input Rounded To 0** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: 0` | ![Test 18](SCREENSHOTS/ROUNDING/Rounding-7.png) |
| **Postive Decimal Input Rounded To 1** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: 1` | ![Test 19](SCREENSHOTS/ROUNDING/Rounding-8.png) |
| **Postive Decimal Input Rounded To 2** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: 2` | ![Test 20](SCREENSHOTS/ROUNDING/Rounding-9.png) |
| **Postive Decimal Input Rounded To 3** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: 3` | ![Test 21](SCREENSHOTS/ROUNDING/Rounding-10.png) |
| **Postive Decimal Input Rounded To 4 (ERROR)** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: 4` | ![Test 22](SCREENSHOTS/ROUNDING/Rounding-11.png) |
| **Postive Decimal Input Rounded To -1 (ERROR)** | `Input Format: Decimal`<br>`Number: 123.456`<br>`Target Digits: -1` | ![Test 23](SCREENSHOTS/ROUNDING/Rounding-12.png) |

### 3. Perform Arithmetic Operations (Subtraction and Division) Using GRS Method

| Test Case Name | Inputs | Screenshot |
| :--- | :--- | :---: |
| **Decimal Subtraction Input** | `Input Format: Decimal`<br>`Operation: Subtraction`<br>`Operand A: 654321.5432`<br>`Operand B: 654321.1000` | ![Test 24 Input](SCREENSHOTS/GRS/GRS-1-INPUT.png)<br>![Test 24 Output](SCREENSHOTS/GRS/GRS-1-OUTPUT.png) |
| **Hexadecimal Subtraction Input** | `Input Format: Hexadecimal`<br>`Operation: Subtraction`<br>`Operand A: 3A12C34563200000`<br>`Operand B: 3A12C34440000000` | ![Test 25 Input](SCREENSHOTS/GRS/GRS-2-INPUT.png)<br>![Test 25 Output](SCREENSHOTS/GRS/GRS-2-OUTPUT.png) |
| **Decimal Division Input** | `Input Format: Decimal`<br>`Operation: Division`<br>`Operand A: 22`<br>`Operand B: 7` | ![Test 26 Input](SCREENSHOTS/GRS/GRS-3-INPUT.png)<br>![Test 26 Output](SCREENSHOTS/GRS/GRS-3-OUTPUT.png) |
| **Hexadecimal Division Input** | `Input Format: Hexadecimal`<br>`Operation: Division`<br>`Operand A: 2A01000000000000`<br>`Operand B: 3DFC000000000000` | ![Test 27 Input](SCREENSHOTS/GRS/GRS-4-INPUT.png)<br>![Test 27 Output](SCREENSHOTS/GRS/GRS-4-OUTPUT.png) |
| **Number Subtracted by Itself Input** | `Input Format: Decimal`<br>`Operation: Subtraction`<br>`Operand A: 1`<br>`Operand B: 1` | ![Test 28 Input](SCREENSHOTS/GRS/GRS-5-INPUT.png)<br>![Test 28 Output](SCREENSHOTS/GRS/GRS-5-OUTPUT.png) |
| **Zero Divided by Any Number Input** | `Input Format: Decimal`<br>`Operation: Division`<br>`Operand A: 0`<br>`Operand B: 1` | ![Test 29](SCREENSHOTS/GRS/GRS-6.png) |
| **Any Number Divided by Zero Input** | `Input Format: Decimal`<br>`Operation: Division`<br>`Operand A: 1`<br>`Operand B: 0` | ![Test 30](SCREENSHOTS/GRS/GRS-7.png) |

## VIDEO WALKTHROUGH

The YouTube link for the video walkthrough of the project can be found [here](https://youtu.be/74KgVZBTCjI).

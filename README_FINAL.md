# CSARCH2 Case Study 1

**Machine:** _Machine 5 - Decimal 64-bit Floating-Point Machine_ <br>
**Subject:** _CSARCH2_ <br>
**Section:** _S01_ <br>
**Group:** _Group 9_ <br>
**GitHub Link:** https://github.com/otappytaps/decimal-64-bit-fp-machine <br>
**Website Link:** <br>
**Youtube Demo Link:** https://youtu.be/74KgVZBTCjI

## Group Members

- Adrian Co
- Tyrone Lee
- Kyle Tiu
- Zach Hallare
- David Javier

---

## Project Overview

The **Machine 5 Decimal 64-bit Floating-Point Machine** is a functional web
application that demonstrates IEEE 754-2008 `decimal64` (decimal 64-bit
floating-point) encoding and arithmetic. It is intended to make the format
easier to follow by showing both the final IEEE encoding and the intermediate
states used to reach it.

The website currently includes three working tools:

1. decimal-to-decimal64 conversion;
2. a rounding-methods demonstrator; and
3. GRS (Guard/Round/Sticky) arithmetic operations, specifically subtraction and
   division.

Each tool accepts user input, validates it against the format rules, and
displays the result with a breakdown of the encoding. Arithmetic also includes
complete step-by-step solution traces that show exponent alignment, coefficient
computation, normalization, and rounding.

---

## Tech Stack

| Technology | Role |
| --- | --- |
| React 19 | Implements the UI components, state, and application logic |
| TypeScript | Adds static typing to the components and the arithmetic engine |
| Vite | Provides the dev server and production build tooling |
| Tailwind CSS | Adds the custom cyberpunk colors, panels, tables, and responsive styling |
| Oxlint | Lints the React/TypeScript codebase |

### 1. React

React provides the presentation layer for the machine. Each feature lives in
its own window component, and the shared arithmetic engine is kept separate
from the interface so it can be reasoned about independently.

**Used for:**

- the Decimal to Decimal64 converter window;
- the Rounding Methods demonstrator window;
- the GRS Arithmetic Operations window;
- form state, inline validation, and result rendering; and
- the layout that assembles all three tools onto a single page.

### 2. TypeScript

TypeScript gives the project a strongly typed calculation core. The arithmetic
engine is written in typed modules that model decimal64 parts, parsed operands,
and step records.

**Used for:**

- typed `Step`, `Decimal64Parts`, and `ParsedOperand` records;
- the DPD (densely packed decimal) encoder/decoder;
- the decimal64 bit parser and encoder;
- the GRS rounding, shifting, and normalization helpers; and
- the subtraction and division algorithm modules.

### 3. Vite

Vite serves the project during development and produces an optimized production
bundle.

**Used for:**

- the local development server with hot module replacement;
- building the production-ready static site; and
- previewing the production build locally.

### 4. Tailwind CSS

Tailwind CSS provides the utility classes behind the custom visual style,
including the cyberpunk theme defined in `src/index.css`.

**Used for:**

- the neon color palette and animated background;
- glassmorphism panel and card styling;
- input, button, alert, and monospace result-block classes; and
- responsive layouts for desktop and mobile widths.

---

## I. Machine Features

### 1. Decimal to Decimal64 Converter

**Concept:** Converts one decimal number (with an optional power-of-ten
exponent) into its IEEE 754-2008 `decimal64` 64-bit encoding, independently
computing the sign bit, combination field, exponent continuation, and the
DPD-encoded 16-digit coefficient.

**Inputs:**

- a decimal number (integer or fractional); and
- an optional exponent of 10 (`×10^e`).

**Outputs:**

- the 64-bit binary encoding grouped as `sign | combination | exponent
  continuation | coefficient DPD groups`;
- the 16-character hexadecimal encoding; and
- a special-case banner when applicable (NaN, ±Infinity, or underflow to ±0).

**How it works:**

- The sign bit is `1` for negative values.
- The input is normalized to a 16-digit coefficient. Values with more than 16
  digits are truncated and the exponent is adjusted accordingly.
- The true exponent is biased by `398` (`e' = e + 398`) and written as a
  10-bit binary field.
- The 5-bit combination field is built from the two most significant exponent
  bits and the most significant digit: when the leading digit is 0-7 the
  combination is `E_top2 + d0(BCD tail)`, and when it is 8-9 it uses the
  `11 E_top2 d0(LSB)` pattern.
- The remaining 15 coefficient digits are split into five groups of three and
  each group is compressed into a 10-bit DPD group.
- If the biased exponent exceeds the maximum `767`, the value overflows to
  ±Infinity. If it falls below `0`, the value underflows and rounds to ±0.

### 2. Rounding Methods Demonstrator

**Concept:** Demonstrates the four common rounding approaches side by side:
Chopped, Rounded Up, Rounded Down, and Rounded to Nearest Ties-to-Even. Input
may be given in decimal or binary.

**Inputs:**

- an input format of Decimal or Binary;
- the number to round; and
- the target number of digits after the decimal point.

**Outputs:**

- the Chopped value;
- the Rounded Up value;
- the Rounded Down value;
- the Rounded to Nearest Ties-to-Even value; and
- an inline validation message for invalid target digits or non-binary input.

**How it works:**

- Chopping simply cuts the number at the target digit.
- Rounding up and rounding down use `ceil` and `floor` after shifting the
  decimal (or binary) point by the target digits, then shifting back.
- Ties-to-Even rounds exact `.5` ties to the nearest even last digit.
- Binary input is parsed bit by bit (halves, quarters, eighths, ...) before the
  same rounding logic is applied.

### 3. GRS Arithmetic Operations (Subtraction & Division)

**Concept:** Performs subtraction and division on decimal64 values while
tracking the Guard, Round, and Sticky digits for correct
round-to-nearest-ties-to-even results, with a complete step-by-step trace.

**Inputs:**

- an input format of Decimal or IEEE hexadecimal;
- an operation of Subtraction (`A − B`) or Division (`A ÷ B`); and
- two operands, `A` and `B`.

**Outputs:**

- a step-by-step solution trace;
- the final result in decimal (scientific notation);
- the final 64-bit binary encoding;
- the final hexadecimal encoding; and
- a special-case banner when applicable.

**How it works:**

- **Subtraction:** the smaller exponent is aligned by shifting the significand
  right while extracting the GRS digits, the signed significands are added
  (`A + (−B)`), the result is normalized, rounded with GRS
  ties-to-even, and renormalized if the coefficient grows past 16 digits.
- **Division:** the coefficients are divided at extended precision (the
  numerator is scaled by `10^18`) so that the Guard, Round, and Sticky digits
  can be extracted from the quotient and remainder. The exponents are
  subtracted, then the result is normalized, rounded, and renormalized.
- Special cases are handled before arithmetic: NaN propagates, `∞ − ∞` and
  `0 ÷ 0` produce NaN, a finite value divided by zero produces ±Infinity, and a
  finite value divided by infinity produces ±0.
- Results whose biased exponent exceeds `767` overflow to ±Infinity, and values
  that underflow round to ±0.

---

## II. Input Rules

The interface uses per-window controls and supports decimal and binary/hex
input formats.

| Input | Accepted values |
| --- | --- |
| Converter decimal input | Signed base-10 number with optional fractional part |
| Converter exponent | Signed base-10 integer (power of ten) |
| Arithmetic decimal operand | Signed base-10 number, optionally in `e`-notation (e.g. `-1.23e5`) |
| Arithmetic hexadecimal operand | Exactly 16 hexadecimal characters (64 bits), optional `0x` prefix |
| Rounding number | Decimal or binary string (optional leading `-`, optional fraction) |
| Target digits | Non-negative integer, no more than the number of digits after the decimal point |

The converter truncates coefficients longer than 16 digits and adjusts the
exponent. Arithmetic operands whose biased exponent would exceed `767` or fall
below `0` are reported as overflow (±Infinity) or underflow (±0). Invalid
inputs are reported beside the form without clearing the user's entries.

---

## III. Running the Website Locally

### 1. Requirements

- Node.js 20 or newer
- npm

### 2. Installation

Clone the repository and enter its folder:

```bash
git clone https://github.com/otappytaps/decimal-64-bit-fp-machine.git
cd decimal-64-bit-fp-machine
```

Install the dependencies:

```bash
npm install
```

### 3. Start the Application

```bash
npm run dev
```

Vite will print a local address, normally `http://localhost:5173`. Open that
address in a browser and stop the server with `Ctrl+C` when finished.

Other useful commands:

```bash
npm run lint     # run the Oxlint linter
npm run build    # type-check and build the production bundle
npm run preview  # preview the production build locally
```

---

## IV. Project Structure

```text
index.html                    Vite HTML entry point
package.json                  Project metadata and scripts
vite.config.ts                Vite and Tailwind plugin configuration
src/
  main.tsx                    React entry point
  index.css                   Tailwind import and cyberpunk theme
  components/
    App.tsx                   Root layout assembling the three tools
    Banner.tsx                Page title and tagline
    ConvertWindow.tsx         Decimal to Decimal64 converter UI
    RoundingWindow.tsx        Rounding methods UI
    ArithmeticWindow.tsx      GRS arithmetic UI
    arithmetic/
      types.ts                Shared step, part, and operand types
      format.ts               Scientific-notation and binary/hex formatting
      dpd.ts                  DPD 10-bit group encoding and decoding
      decimal64Codec.ts       Decimal64 bit parsing and encoding
      inputParsers.ts         Decimal and IEEE-hex input validation
      grs.ts                  GRS rounding, shifting, and normalization
      operations.ts           Subtraction and division algorithms
SCREENSHOTS/                  Test case screenshots
```

The `arithmetic/` folder is the independent calculation core. It has no React
dependency. The window components act as the presentation layer: they collect
inputs, call the appropriate algorithm, and render the results.

---

## V. Test Cases

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

---

# Development Documentation

## All Technical and Creative Accomplishments

- Created a working Vite/React website with a responsive cyberpunk visual style
  built on Tailwind CSS.
- Implemented IEEE 754-2008 `decimal64` encoding with correct sign, combination
  field, biased-exponent (398) handling, and DPD coefficient compression.
- Implemented special cases for the converter: NaN, ±Infinity overflow, and
  underflow to ±0.
- Implemented four rounding methods — Chopped, Rounded Up, Rounded Down, and
  Rounded to Nearest Ties-to-Even — for both decimal and binary input.
- Implemented GRS (Guard/Round/Sticky) subtraction and division with complete
  step-by-step traces and ties-to-even rounding.
- Handled arithmetic special cases: NaN propagation, `∞ − ∞`, `0 ÷ 0`, `x ÷ 0`,
  `finite ÷ ∞`, overflow to ±Infinity, and underflow to ±0.
- Supported both decimal and IEEE hexadecimal operand formats for arithmetic.
- Added inline validation that preserves the user's entered values.
- Separated the arithmetic engine (`src/components/arithmetic/`) from the React
  presentation layer.
- Documented local installation, execution, input rules, limitations, and
  project structure.

## Current Limitations and Pending Work

- The converter truncates coefficients longer than 16 digits instead of
  rounding them.
- Arithmetic currently supports only subtraction and division; addition and
  multiplication are not implemented.
- Arithmetic is limited to the Decimal and IEEE-hexadecimal input formats;
  binary input is not accepted.
- IEEE-hexadecimal operands must be exactly 16 characters (64 bits).
- Per-step animation is not included; the complete states are presented in
  step tables instead.
- A live website deployment link is still pending.
- Repository visibility should be confirmed before final submission.

## Completed Checking

- `npm run lint` passes with the configured Oxlint rules.
- `npm run build` passes, including the TypeScript type check.
- All representative test-case screenshots were captured and linked in the test
  tables.
- Desktop and mobile-width browser layouts were reviewed.
- The README was reviewed to confirm it follows the required project format.

---

# CSARCH Lecture Series: Double Precision Floating-Point Format for Decimal (Decimal 64)

**Instructor:** Sensei RL Uy  
**Institution:** College of Computer Studies, De La Salle University, Manila, Philippines  
**Term:** ‘2110

---

## Slide 2: Overview
* This sub-module introduces the IEEE-754 decimal-64 floating-point format.
* The objective is as follows:
  * Describe the process of representing decimal-64 floating-point data using IEEE-754 standard.

---

## Slide 3: Floating Point
* Scientists and engineers use scientific notation where a number is expressed as:  
  **+/- S × 10^±E**
* Where **S** is the significand (also known as mantissa), **E** is the exponent and **10** is the base.
* Example: `6.022 x 10^23`
  * `6.022` = significand
  * `10` = base
  * `23` = exponent

---

## Slide 4: Floating Point
* Floating point standard for floating-point numbers in computer is the **IEEE-754** (Institute of Electrical and Electronics Engineers Standard 754). Originally 1985, revised 2008, current version 2019.
* Decimal floating point was introduced in 2008.
* The representation is to be used in applications that need to emulate decimal rounding exactly (i.e., financial and tax computations).

---

## Slide 5: IEEE-754 Decimal Floating-Point
* Decimal32 precision
* Decimal64 precision
* Decimal128 precision

---

## Slides 6 & 7: Length of Field / Format

| Format | Decimal32 | Decimal64 | Decimal128 |
| :--- | :--- | :--- | :--- |
| **Format length** | 32 | 64 | 128 |
| **Sign bit** | 1 | 1 | 1 |
| **Combination bit** | 5 | 5 | 5 |
| **Exponent continuation bit** | 6 | 8 | 12 |
| **Coefficient continuation bit** | 20 | 50 | 110 |
| **Total coefficient in digits** | 7 | 16 | 34 |
| **Emax (denormalized/normalized)** | 96 / 90 | 384 / 369 | 6144 / 6111 |
| **Emin (denormalized/normalized)**| -95 / -101 | -383 / -398 | -6143 / -6176 |
| **Bias** | 101 | 398 | 6176 |
| **Elimit** | 191 | 767 | 12287 |

---

## Slide 8: IEEE-754 Decimal-64 Floating-Point Format

| Sign | Combination field | Exponent continuation | Coefficient continuation |
| :---: | :---: | :---: | :---: |
| 1 | 5 | 8 | 50 |

* IEEE-754 decimal64 floating-point format is 64-bit in width.
* The 64-bit is partitioned as 1 bit for sign bit, 5 bits for combination field, 8 bits for exponent continuation, and 50 bits for coefficient continuation.
* **Significand:** Decimal
* **Base:** 10
* **Sign bit:** `0` → positive; `1` → negative
* **Exponent (e’):** `e' = e + 398`
* **Normalization:** Significand is normalized to 16 whole decimal digits before representation:  
  `dddddddddddddddd x 10^e`

---

## Slide 9: Combination Field
* The 5-bit combination field is composed of:
  * Two most significant bits of the exponent representation (valid bits: `00`, `01`, and `10` only).
  * 1 or 3 bits of the most significant digit of the significand.

**Combination Field Table:**

| Combination Field (a b c d e) | Type | Exp MSBs | Coefficient MSD |
| :--- | :--- | :--- | :--- |
| `a b c d e` | Finite | a b | 0 c d e |
| `1 1 c d e` | Finite | c d | 1 0 0 e |
| `1 1 1 1 0` | Infinity | - | - |
| `1 1 1 1 1` | NaN | - | - |

---

## Slide 10: Exponent Continuation Field
* Exponent representation is `e + 398`.
* Two most significant bits of the exponent representation (valid bits: `00`, `01`, and `10` only) are in the **combination field**.
* The rest of the 8 bits are in the **exponent continuation field**.
* Largest exponent value that can be represented is **384**.
* Smallest exponent value that can be represented is **-383**.

---

## Slide 11: Coefficient Continuation Field
* 16 whole decimal digits.
* Most significant digit is stored in the **combination field**.
* Remaining 15 digits are represented as **densely-packed BCD** and stored in the **coefficient continuation field**.

---

## Slide 12: Example 1
* **7531123456574426 x 10^20**
  * Significand in decimal? **Yes**
  * Base-10? **Yes**
  * Normalized? **Yes, 16 whole digits**
  * MSD = **7 (0111)**
  * Sign bit = **0 (+)**
  * e’ = e + 398 = **20 + 398 = 418** (Binary: `01 10100010`)

**Resulting Representation:**

| Sign | Combination field | Exponent continuation | Coefficient continuation |
| :---: | :---: | :---: | :---: |
| 0 | 01 111 | 1010 0010 | 1010110001 0010100011 1001010110 1011110100 1000100110 |

*(Note: Combination field is `a b c d e` since MSBs of exponent are `01` and MSD is `0111` -> `01 111`)*

---

## Slide 13: Example 2
* **-8765432345678100 x 10^-20**
  * Significand in decimal? **Yes**
  * Base-10? **Yes**
  * Normalized? **Yes, 16 whole digits**
  * MSD = **8 (1000)**
  * Sign bit = **1 (-)**
  * e’ = e + 398 = **-20 + 398 = 378** (Binary: `01 01111010`)

**Resulting Representation:**

| Sign | Combination field | Exponent continuation | Coefficient continuation |
| :---: | :---: | :---: | :---: |
| 1 | 11 01 0 | 0111 1010 | 1111100101 1000110100 0111000101 1101111000 0010000000 |

*(Note: MSD is 8 (1000), so Combination Field follows `1 1 c d e` where `c d` = exp MSBs (`01`) and `e` = MSD LSB (`0`) -> `1 1 0 1 0`)*

---

## Slide 14: Try
* **-1.234567 x 10^15**
  * Significand in decimal?
  * Base-10?
  * Normalized?
  * Sign bit
  * e’ = e+101 *(Note: bias should be 398 for Decimal64)*

*(Wait for the next slide for answers...)*

---

## Slide 15: Try (Answered)
* **-1.234567 x 10^15**
  * Significand in decimal? **Yes**
  * Base-10? **Yes**
  * Normalized? **No**, converted to `-0000000001234567 x 10^9`
  * MSD = **0 (0000)**
  * Sign bit = **1 (-)**
  * e’ = e + 398 = **9 + 398 = 407** (Binary: `01 10010111`)

**Resulting Representation:**

| Sign | Combination field | Exponent continuation | Coefficient continuation |
| :---: | :---: | :---: | :---: |
| 1 | 01 000 | 1001 0111 | 0000000000 0000000000 0000000001 0100110100 1011100111 |

*(Note: Combination field is `a b c d e` -> exp MSBs `01` + MSD `000` -> `01 000`)*

---

## Slide 16: To Recall…
* **What have we learned:**
  * Describe the process of representing decimal-64 floating-point data using the IEEE-754 standard.
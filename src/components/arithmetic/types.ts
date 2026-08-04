// types.ts
// Overview:
// Defines TypeScript interfaces used across the Decimal64 arithmetic modules.
// These types represent intermediate computation steps, parsed operands, and
// the final Decimal64 bit-field breakdown.

// A single step in the step-by-step solution display
export interface Step {
    label: string;
    detail: string;
}

// Breakdown of a Decimal64 bit field into its logical parts
export interface Decimal64Parts {
    sign: number;        // 0 or 1
    biasedExp: number;   // e' = e + 398 (the biased exponent stored in the field)
    exponent: number;    // true exponent e (unbiased)
    coefficient: string; // 16-digit decimal string (the significand)
    isInfinity: boolean; // true if the encoding represents +/- Infinity
    isNaN: boolean;      // true if the encoding represents NaN
    isZero: boolean;     // true if the value is +/- 0
}

// Result of parsing a raw user input string into a usable operand
export interface ParsedOperand {
    sign: number;
    coeff: string;
    exp: number;
    isInfinity: boolean;
    isNaN: boolean;
    isZero: boolean;
    error?: string;   // set when parsing fails
    binStr?: string;  // set when input was in hex format
}
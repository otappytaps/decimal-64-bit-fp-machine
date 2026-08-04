// decimal64Codec.ts
// Overview:
// Provides encoding and decoding of IEEE 754-2008 Decimal64 binary representation.
//   - parseBinary64(): decodes a 64-bit binary string into its logical components.
//   - encodeBinary64(): encodes sign, exponent, and 16-digit coefficient into 64 bits.
// Handles special cases: NaN, Infinity, overflow, and underflow.

import type { Decimal64Parts } from "./types";
import { decodeDPD, encodeDPD } from "./dpd";

/** Parse a 64-bit binary string into Decimal64Parts */
export function parseBinary64(bin: string): Decimal64Parts {
    // Bit 0: sign bit (0 = positive, 1 = negative)
    const sign = parseInt(bin[0]);
    // Bits 1-5: 5-bit combination field
    const comb = bin.substring(1, 6);
    // Bits 6-13: 8-bit exponent continuation
    const expCont = bin.substring(6, 14);
    // Bits 14-63: 50 bits for coefficient (five 10-bit DPD groups)
    const dpdBits = bin.substring(14);

    let expMSBs: string;
    let msd: number;
    let isInfinity = false;
    let isNaN = false;

    // Decode the combination field to extract exponent MSBs and most significant digit
    if (comb.startsWith("11111")) {
        // Combination field 11111 = NaN
        isNaN = true;
        expMSBs = "00";
        msd = 0;
    } else if (comb.startsWith("11110")) {
        // Combination field 11110 = Infinity
        isInfinity = true;
        expMSBs = "00";
        msd = 0;
    } else if (comb.startsWith("11")) {
        // Combination field starts with 11: MSD is 8 or 9
        expMSBs = comb[2] + comb[3];
        msd = 8 + parseInt(comb[4]);
    } else {
        // Combination field starts with 00, 01, or 10: MSD is 0-7
        expMSBs = comb[0] + comb[1];
        msd = parseInt(comb.substring(2), 2);
    }

    // Reconstruct biased exponent: 2 MSBs from combination + 8 bits continuation
    const biasedExp = parseInt(expMSBs + expCont, 2);
    // True exponent = biased exponent - bias (398 for Decimal64)
    const exponent = biasedExp - 398;

    // Decode the five 10-bit DPD groups back to 15 decimal digits
    let tail = "";
    for (let i = 0; i < 50; i += 10) {
        tail += decodeDPD(dpdBits.substring(i, i + 10));
    }

    // Full 16-digit coefficient: MSD + 15 digits from DPD groups
    const coefficient = String(msd) + tail;
    const isZero = parseInt(coefficient) === 0;

    return { sign, biasedExp, exponent, coefficient, isInfinity, isNaN, isZero };
}

/** Encode Decimal64 parts into a 64-bit binary string */
export function encodeBinary64(
    sign: number,
    exponent: number,
    coeff16: string
): { bin: string; isOverflow: boolean; isUnderflow: boolean } {
    // Calculate biased exponent (true exponent + bias)
    const biasedExp = exponent + 398;

    // Overflow: biased exponent exceeds max (767) → encode as Infinity
    if (biasedExp > 767) {
        const bin = `${sign}11110` + "0".repeat(58);
        return { bin, isOverflow: true, isUnderflow: false };
    }
    // Underflow: biased exponent below 0 → encode as subnormal/zero
    if (biasedExp < 0) {
        // Smallest subnormal encoding
        const bin = `${sign}01000` + "10001110" + "0".repeat(50);
        return { bin, isOverflow: false, isUnderflow: true };
    }

    // Convert biased exponent to 10-bit binary
    const E_bin = biasedExp.toString(2).padStart(10, "0");
    const E_top2 = E_bin.substring(0, 2);   // Top 2 bits go to combination field
    const E_cont8 = E_bin.substring(2);     // Lower 8 bits go to exponent continuation

    // Extract most significant digit (MSD) from coefficient
    const d0 = parseInt(coeff16[0], 10);
    const d0_bin = d0.toString(2).padStart(4, "0");

    // Build the 5-bit combination field
    let comb: string;
    if (d0 < 8) {
        // MSD 0-7: combination = E_top2 + lower 3 bits of MSD
        comb = E_top2 + d0_bin.substring(1, 4);
    } else {
        // MSD 8-9: combination = 11 + E_top2 + LSB of MSD
        comb = "11" + E_top2 + d0_bin[3];
    }

    // Encode the remaining 15 digits (indices 1-15) into five 10-bit DPD groups
    let coeff_cont50 = "";
    for (let i = 1; i < 16; i += 3) {
        coeff_cont50 += encodeDPD(coeff16[i], coeff16[i + 1], coeff16[i + 2]);
    }

    // Assemble final 64-bit binary string
    const bin = `${sign}` + comb + E_cont8 + coeff_cont50;
    return { bin, isOverflow: false, isUnderflow: false };
}
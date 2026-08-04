// operations.ts
// Overview:
// Core arithmetic operations for Decimal64 numbers
// Implements subtraction and division algorithms using GRS (Guard, Round, Sticky) digit tracking
// Returns detailed step-by-step solution for educational display

import type { Step } from "./types";
import { toSciNotation } from "./format";
import { roundGRS, shiftRight, addSignedDecimals, normalize } from "./grs";

/**
 * Subtraction operation using GRS algorithm
 * Performs A - B by converting to A + (-B) and following Decimal64 arithmetic rules
 * Each step is recorded for display in the UI
 *
 * @param aSign - Sign of A (0 = positive, 1 = negative)
 * @param aCoeff - 16-digit coefficient of A
 * @param aExp - Exponent of A
 * @param bSign - Sign of B (0 = positive, 1 = negative)
 * @param bCoeff - 16-digit coefficient of B
 * @param bExp - Exponent of B
 * @returns Object containing steps, final sign, coefficient, exponent, and any special case
 */
export function performSubtraction(
    aSign: number, aCoeff: string, aExp: number,
    bSign: number, bCoeff: string, bExp: number
): {
    steps: Step[];
    finalSign: number;
    finalCoeff: string;
    finalExp: number;
    specialCase: string;
} {
    const steps: Step[] = [];
    let specialCase = "";

    // Step 1: Identify operands
    steps.push({
        label: "Step 1 — Identify operands",
        detail:
            `A = ${toSciNotation(aSign, aCoeff, aExp)}\n` +
            `B = ${toSciNotation(bSign, bCoeff, bExp)}\n` +
            `Operation: A − B`,
    });

    // Step 2: Negate B (flip sign bit for subtraction)
    const bSignFlipped = bSign ^ 1;
    steps.push({
        label: "Step 2 — Negate B (flip sign bit)",
        detail: `−B = ${toSciNotation(bSignFlipped, bCoeff, bExp)}`,
    });

    // Initialize variables for aligned operands
    let sign1 = aSign, coeff1 = aCoeff, exp1 = aExp;
    let sign2 = bSignFlipped, coeff2 = bCoeff;

    // Step 3: Align exponents by shifting the smaller exponent operand
    const expDiff = exp1 - bExp;
    let g = 0, r = 0, s = 0;
    let alignedCoeff1 = coeff1;
    let alignedCoeff2 = coeff2;

    if (expDiff > 0) {
        // Shift B right by expDiff
        const shifted = shiftRight(coeff2, expDiff);
        alignedCoeff2 = shifted.aligned;
        g = shifted.g; r = shifted.r; s = shifted.s;
        steps.push({
            label: "Step 3 — Align exponents (shift −B right)",
            detail:
                `ExpDiff = ${expDiff}\n` +
                `−B original: ${toSciNotation(bSignFlipped, coeff2, bExp)}\n` +
                `−B aligned:  ${toSciNotation(bSignFlipped, alignedCoeff2, exp1)}\n` +
                `GRS digits: G=${g}, R=${r}, S=${s}`,
        });
    } else if (expDiff < 0) {
        // Shift A right by -expDiff
        const shifted = shiftRight(coeff1, -expDiff);
        alignedCoeff1 = shifted.aligned;
        g = shifted.g; r = shifted.r; s = shifted.s;
        exp1 = bExp;
        steps.push({
            label: "Step 3 — Align exponents (shift A right)",
            detail:
                `ExpDiff = ${-expDiff}\n` +
                `A original: ${toSciNotation(aSign, coeff1, aExp)}\n` +
                `A aligned:  ${toSciNotation(aSign, alignedCoeff1, exp1)}\n` +
                `GRS digits: G=${g}, R=${r}, S=${s}`,
        });
    } else {
        // Exponents already equal
        steps.push({
            label: "Step 3 — Align exponents",
            detail: "Exponents are already equal — no alignment needed.\nGRS digits: G=0, R=0, S=0",
        });
    }

    // Step 4: Add/Subtract aligned significands
    const result = addSignedDecimals(sign1, alignedCoeff1, sign2, alignedCoeff2);
    steps.push({
        label: "Step 4 — Add/Subtract aligned significands",
        detail:
            `  ${sign1 ? "-" : "+"}${alignedCoeff1}\n` +
            `  ${sign2 ? "-" : "+"}${alignedCoeff2}\n` +
            `= ${result.sign ? "-" : "+"}${result.coeff}  (before normalize)\n` +
            `  GRS: G=${g}, R=${r}, S=${s}`,
    });

    let finalSign = result.sign;
    let finalCoeff = result.coeff;
    let finalExp = exp1;

    // Step 5: Normalize the result
    const norm = normalize(finalSign, finalCoeff, finalExp, g, r, s);
    finalSign = norm.sign;
    finalCoeff = norm.coeff;
    finalExp = norm.exp;
    g = norm.g; r = norm.r; s = norm.s;
    steps.push({
        label: "Step 5 — Normalize",
        detail:
            `Normalized: ${toSciNotation(finalSign, finalCoeff, finalExp)}\n` +
            `GRS after normalize: G=${g}, R=${r}, S=${s}`,
    });

    // Step 6: Round using GRS
    const rounded = roundGRS(finalCoeff, g, r, s);
    steps.push({
        label: "Step 6 — Round (GRS Round-to-Nearest, Ties-to-Even)",
        detail:
            `G=${g}, R=${r}, S=${s}\n` +
            `Before round: ${finalCoeff}\n` +
            `After round : ${rounded}`,
    });
    finalCoeff = rounded;

    // Step 7: Handle coefficient overflow after rounding
    if (finalCoeff.length > 16) {
        finalExp += finalCoeff.length - 16;
        finalCoeff = finalCoeff.substring(0, 16);
        steps.push({
            label: "Step 7 — Renormalize after rounding",
            detail:
                `Coefficient overflowed after rounding.\n` +
                `New coeff: ${finalCoeff}\nNew exponent: ${finalExp}`,
        });
    }

    // Step 8: Handle zero result
    if (parseInt(finalCoeff) === 0) {
        specialCase = "Result is ±0";
        finalCoeff = "0000000000000000";
        finalExp = 0;
        finalSign = 0;
    }

    return { steps, finalSign, finalCoeff, finalExp, specialCase };
}

/**
 * Division operation using GRS algorithm
 * Performs A ÷ B using extended precision for GRS digit calculation
 * Follows IEEE 754-2008 Decimal64 division rules
 *
 * @param aSign - Sign of A (0 = positive, 1 = negative)
 * @param aCoeff - 16-digit coefficient of A
 * @param aExp - Exponent of A
 * @param bSign - Sign of B (0 = positive, 1 = negative)
 * @param bCoeff - 16-digit coefficient of B
 * @param bExp - Exponent of B
 * @returns Object containing steps, final sign, coefficient, exponent, and any special case
 */
export function performDivision(
    aSign: number, aCoeff: string, aExp: number,
    bSign: number, bCoeff: string, bExp: number
): {
    steps: Step[];
    finalSign: number;
    finalCoeff: string;
    finalExp: number;
    specialCase: string;
} {
    const steps: Step[] = [];
    let specialCase = "";

    // Step 1: Identify operands
    steps.push({
        label: "Step 1 — Identify operands",
        detail:
            `A = ${toSciNotation(aSign, aCoeff, aExp)}\n` +
            `B = ${toSciNotation(bSign, bCoeff, bExp)}\n` +
            `Operation: A ÷ B`,
    });

    // Handle division by zero cases
    if (parseInt(bCoeff) === 0) {
        specialCase =
            parseInt(aCoeff) === 0
                ? "NaN (0 ÷ 0)"
                : `${aSign ^ bSign ? "−" : "+"}∞ (x ÷ 0)`;
        steps.push({ label: "Special Case — Division by zero", detail: specialCase });
        return {
            steps,
            finalSign: aSign ^ bSign,
            finalCoeff: "0000000000000000",
            finalExp: 0,
            specialCase,
        };
    }

    // Handle zero divided by non-zero
    if (parseInt(aCoeff) === 0) {
        specialCase = "Result is ±0 (0 ÷ x)";
        steps.push({ label: "Special Case — Zero divided by non-zero", detail: specialCase });
        return {
            steps,
            finalSign: aSign ^ bSign,
            finalCoeff: "0000000000000000",
            finalExp: 0,
            specialCase,
        };
    }

    // Determine result sign (XOR of signs)
    const finalSign = aSign ^ bSign;

    // Step 2: Determine sign
    steps.push({
        label: "Step 2 — Determine sign",
        detail:
            `Sign of A: ${aSign ? "−" : "+"}  |  Sign of B: ${bSign ? "−" : "+"}\n` +
            `Result sign: ${finalSign ? "−" : "+"} (XOR of signs)`,
    });

    // Step 3: Subtract exponents
    const rawExp = aExp - bExp;
    steps.push({
        label: "Step 3 — Subtract exponents",
        detail: `Raw exponent = ${aExp} − (${bExp}) = ${rawExp}`,
    });

    // Step 4: Divide coefficients using extended precision
    const aCoeffInt = BigInt(aCoeff);
    const bCoeffInt = BigInt(bCoeff);
    const scaledNumerator = aCoeffInt * BigInt("1000000000000000000"); // Scale by 10^18
    const quotientBig = scaledNumerator / bCoeffInt;
    const remainderBig = scaledNumerator % bCoeffInt;

    const qNoLead = quotientBig.toString().replace(/^0+/, "") || "0";
    const qLen = qNoLead.length;

    steps.push({
        label: "Step 4 — Divide coefficients (extended precision for GRS)",
        detail:
            `A coeff: ${aCoeff}\n` +
            `B coeff: ${bCoeff}\n` +
            `Scale A coeff by 10^18 to get extended numerator\n` +
            `Quotient (${qLen} significant digit${qLen !== 1 ? "s" : ""}): ${qNoLead}\n` +
            `Remainder: ${remainderBig}`,
    });

    // Calculate tentative exponent and coefficient
    let finalExp = rawExp + qLen - 34;
    const q19 = qNoLead.padEnd(19, "0");
    let finalCoeff = q19.substring(0, 16);
    const g = parseInt(q19[16] || "0");
    const r = parseInt(q19[17] || "0");
    const beyondStr = q19.substring(18);
    const s = remainderBig !== 0n || beyondStr.split("").some((c) => c !== "0") ? 1 : 0;

    // Step 5: Extract coefficient and GRS digits
    steps.push({
        label: "Step 5 — Extract coefficient and GRS digits",
        detail:
            `Significant quotient:   ${qNoLead}\n` +
            `Right-padded to 19:     ${q19}\n` +
            `Coefficient (16 digits): ${finalCoeff}\n` +
            `G = ${g}, R = ${r}, S = ${s}\n` +
            `Tentative result: ${toSciNotation(finalSign, finalCoeff, finalExp)}`,
    });

    // Step 6: Normalize
    const norm = normalize(finalSign, finalCoeff, finalExp, g, r, s);
    finalCoeff = norm.coeff;
    finalExp = norm.exp;
    const ng = norm.g, nr = norm.r, ns = norm.s;
    steps.push({
        label: "Step 6 — Normalize",
        detail:
            `Normalized: ${toSciNotation(finalSign, finalCoeff, finalExp)}\n` +
            `GRS after normalize: G=${ng}, R=${nr}, S=${ns}`,
    });

    // Step 7: Round using GRS
    const rounded = roundGRS(finalCoeff, ng, nr, ns);
    steps.push({
        label: "Step 7 — Round (GRS Round-to-Nearest, Ties-to-Even)",
        detail:
            `G=${ng}, R=${nr}, S=${ns}\n` +
            `Before round: ${finalCoeff}\n` +
            `After round : ${rounded}`,
    });
    finalCoeff = rounded;

    // Step 8: Handle coefficient growth after rounding
    if (finalCoeff.length > 16) {
        finalExp += finalCoeff.length - 16;
        finalCoeff = finalCoeff.substring(0, 16);
        steps.push({
            label: "Step 8 — Renormalize after rounding",
            detail:
                `Coefficient grew after rounding.\n` +
                `New coeff: ${finalCoeff}\nNew exponent: ${finalExp}`,
        });
    }

    // Handle zero result
    if (parseInt(finalCoeff) === 0) {
        specialCase = "Result rounds to ±0";
        finalCoeff = "0000000000000000";
        finalExp = 0;
    }

    return { steps, finalSign, finalCoeff, finalExp, specialCase };
}
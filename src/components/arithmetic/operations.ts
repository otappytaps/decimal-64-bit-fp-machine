import type { Step } from "./types";
import { toSciNotation } from "./format";
import { roundGRS, shiftRight, addSignedDecimals, normalize } from "./grs";

/** Subtraction using GRS */
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

    steps.push({
        label: "Step 1 — Identify operands",
        detail:
            `A = ${toSciNotation(aSign, aCoeff, aExp)}\n` +
            `B = ${toSciNotation(bSign, bCoeff, bExp)}\n` +
            `Operation: A − B`,
    });

    const bSignFlipped = bSign ^ 1;

    steps.push({
        label: "Step 2 — Negate B (flip sign bit)",
        detail: `−B = ${toSciNotation(bSignFlipped, bCoeff, bExp)}`,
    });

    let sign1 = aSign, coeff1 = aCoeff, exp1 = aExp;
    let sign2 = bSignFlipped, coeff2 = bCoeff;

    const expDiff = exp1 - bExp;
    let g = 0, r = 0, s = 0;
    let alignedCoeff1 = coeff1;
    let alignedCoeff2 = coeff2;

    if (expDiff > 0) {
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
        steps.push({
            label: "Step 3 — Align exponents",
            detail: "Exponents are already equal — no alignment needed.\nGRS digits: G=0, R=0, S=0",
        });
    }

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

    const rounded = roundGRS(finalCoeff, g, r, s);

    steps.push({
        label: "Step 6 — Round (GRS Round-to-Nearest, Ties-to-Even)",
        detail:
            `G=${g}, R=${r}, S=${s}\n` +
            `Before round: ${finalCoeff}\n` +
            `After round : ${rounded}`,
    });

    finalCoeff = rounded;

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

    if (parseInt(finalCoeff) === 0) {
        specialCase = "Result is ±0";
        finalCoeff = "0000000000000000";
        finalExp = 0;
        finalSign = 0;
    }

    return { steps, finalSign, finalCoeff, finalExp, specialCase };
}

/** Division using GRS */
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

    steps.push({
        label: "Step 1 — Identify operands",
        detail:
            `A = ${toSciNotation(aSign, aCoeff, aExp)}\n` +
            `B = ${toSciNotation(bSign, bCoeff, bExp)}\n` +
            `Operation: A ÷ B`,
    });

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

    const finalSign = aSign ^ bSign;

    steps.push({
        label: "Step 2 — Determine sign",
        detail:
            `Sign of A: ${aSign ? "−" : "+"}  |  Sign of B: ${bSign ? "−" : "+"}\n` +
            `Result sign: ${finalSign ? "−" : "+"} (XOR of signs)`,
    });

    const rawExp = aExp - bExp;

    steps.push({
        label: "Step 3 — Subtract exponents",
        detail: `Raw exponent = ${aExp} − (${bExp}) = ${rawExp}`,
    });

    const aCoeffInt = BigInt(aCoeff);
    const bCoeffInt = BigInt(bCoeff);
    const scaledNumerator = aCoeffInt * BigInt("1000000000000000000"); // ×10^18
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

    let finalExp = rawExp + qLen - 34;

    const q19 = qNoLead.padEnd(19, "0");
    let finalCoeff = q19.substring(0, 16);
    const g = parseInt(q19[16] || "0");
    const r = parseInt(q19[17] || "0");
    const beyondStr = q19.substring(18);
    const s = remainderBig !== 0n || beyondStr.split("").some((c) => c !== "0") ? 1 : 0;

    steps.push({
        label: "Step 5 — Extract coefficient and GRS digits",
        detail:
            `Significant quotient:   ${qNoLead}\n` +
            `Right-padded to 19:     ${q19}\n` +
            `Coefficient (16 digits): ${finalCoeff}\n` +
            `G = ${g}, R = ${r}, S = ${s}\n` +
            `Tentative result: ${toSciNotation(finalSign, finalCoeff, finalExp)}`,
    });

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

    const rounded = roundGRS(finalCoeff, ng, nr, ns);

    steps.push({
        label: "Step 7 — Round (GRS Round-to-Nearest, Ties-to-Even)",
        detail:
            `G=${ng}, R=${nr}, S=${ns}\n` +
            `Before round: ${finalCoeff}\n` +
            `After round : ${rounded}`,
    });

    finalCoeff = rounded;

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

    if (parseInt(finalCoeff) === 0) {
        specialCase = "Result rounds to ±0";
        finalCoeff = "0000000000000000";
        finalExp = 0;
    }

    return { steps, finalSign, finalCoeff, finalExp, specialCase };
}
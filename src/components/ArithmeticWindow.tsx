import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// DPD helpers (decoder): converts 10-bit DPD → three decimal chars
// ─────────────────────────────────────────────────────────────
function decodeDPD(bits: string): string {
  const b = (i: number) => bits[i];
  const bit = (i: number) => parseInt(bits[i], 2);

  // bits are labeled p q r s t u v w x y (indices 0-9)
  const p = bit(0), q = bit(1), r = bit(2);
  const s = bit(3), t = bit(4), u = bit(5);
  const v = bit(6), w = bit(7), x = bit(8), y = bit(9);

  let d0: number, d1: number, d2: number;

  if (v === 0) {
    // vwx = 0xx
    d0 = (p * 4 + q * 2 + r);
    d1 = (s * 4 + t * 2 + u);
    d2 = (w * 4 + x * 2 + y);
  } else if (v === 1 && w === 0 && x === 0) {
    // vwx = 100
    d0 = (p * 4 + q * 2 + r);
    d1 = (s * 4 + t * 2 + u);
    d2 = 8 + y;
  } else if (v === 1 && w === 0 && x === 1) {
    // vwx = 101
    d0 = (p * 4 + q * 2 + r);
    d1 = 8 + u;
    d2 = (s * 4 + t * 2 + y);
  } else if (v === 1 && w === 1 && x === 0) {
    // vwx = 110
    d0 = 8 + r;
    d1 = (s * 4 + t * 2 + u);
    d2 = (p * 4 + q * 2 + y);
  } else {
    // vwx = 111
    const twoBit = s * 2 + t;
    if (twoBit === 0) {
      // vwxst = 11100
      d0 = (p * 4 + q * 2 + r);
      d1 = 8 + u;
      d2 = 8 + y;
    } else if (twoBit === 1) {
      // vwxst = 11101
      d0 = 8 + r;
      d1 = (p * 4 + q * 2 + u);
      d2 = 8 + y;
    } else if (twoBit === 2) {
      // vwxst = 11110
      d0 = 8 + r;
      d1 = 8 + u;
      d2 = (p * 4 + q * 2 + y);
    } else {
      // vwxst = 11111
      d0 = 8 + r;
      d1 = 8 + u;
      d2 = 8 + y;
    }
  }

  // suppress unused variable warning
  void b;
  return `${d0}${d1}${d2}`;
}

// ─────────────────────────────────────────────────────────────
// Encode DPD (reused from ConvertWindow)
// ─────────────────────────────────────────────────────────────
function encodeDPD(d1: string, d2: string, d3: string): string {
  const to4Bit = (n: string) =>
    parseInt(n, 10).toString(2).padStart(4, "0");
  const [a, b, c, d] = to4Bit(d1);
  const [e, f, g, h] = to4Bit(d2);
  const [i, j, k, m] = to4Bit(d3);

  const aei = a + e + i;

  if (aei === "000") return b + c + d + f + g + h + "0" + j + k + m;
  if (aei === "001") return b + c + d + f + g + h + "1" + "00" + m;
  if (aei === "010") return b + c + d + j + k + h + "1" + "01" + m;
  if (aei === "011") return b + c + d + "10" + h + "1" + "11" + m;
  if (aei === "100") return j + k + d + f + g + h + "1" + "10" + m;
  if (aei === "101") return f + g + d + "01" + h + "1" + "11" + m;
  if (aei === "110") return j + k + d + "00" + h + "1" + "11" + m;
  return "00" + d + "11" + h + "1" + "11" + m;
}

// ─────────────────────────────────────────────────────────────
// Parse a 64-bit binary string → { sign, exponent, coefficient }
// ─────────────────────────────────────────────────────────────
interface Decimal64Parts {
  sign: number;        // 0 or 1
  biasedExp: number;   // e' = e + 398
  exponent: number;    // true exponent e
  coefficient: string; // 16-digit decimal string
  isInfinity: boolean;
  isNaN: boolean;
  isZero: boolean;
}

function parseBinary64(bin: string): Decimal64Parts {
  const sign = parseInt(bin[0]);
  const comb = bin.substring(1, 6);
  const expCont = bin.substring(6, 14);
  const dpdBits = bin.substring(14);

  // Decode combination field
  let expMSBs: string;
  let msd: number;
  let isInfinity = false;
  let isNaN = false;

  if (comb.startsWith("11111")) {
    isNaN = true;
    expMSBs = "00";
    msd = 0;
  } else if (comb.startsWith("11110")) {
    isInfinity = true;
    expMSBs = "00";
    msd = 0;
  } else if (comb.startsWith("11")) {
    // 1 1 c d e → exp MSBs = c d, msd = 1 0 0 e
    expMSBs = comb[2] + comb[3];
    msd = 8 + parseInt(comb[4]);
  } else {
    // a b c d e → exp MSBs = a b, msd = 0 c d e
    expMSBs = comb[0] + comb[1];
    msd = parseInt(comb.substring(2), 2);
  }

  const biasedExp = parseInt(expMSBs + expCont, 2);
  const exponent = biasedExp - 398;

  // Decode 5 DPD groups of 10 bits each → 15 digits
  let tail = "";
  for (let i = 0; i < 50; i += 10) {
    tail += decodeDPD(dpdBits.substring(i, i + 10));
  }

  const coefficient = String(msd) + tail; // 16 digits
  const isZero = parseInt(coefficient) === 0;

  return { sign, biasedExp, exponent, coefficient, isInfinity, isNaN, isZero };
}

// ─────────────────────────────────────────────────────────────
// Encode Decimal64 parts → 64-bit binary string
// ─────────────────────────────────────────────────────────────
function encodeBinary64(
  sign: number,
  exponent: number,
  coeff16: string
): { bin: string; isOverflow: boolean; isUnderflow: boolean } {
  const biasedExp = exponent + 398;

  if (biasedExp > 767) {
    // Overflow → Infinity
    const bin = `${sign}11110` + "0".repeat(58);
    return { bin, isOverflow: true, isUnderflow: false };
  }
  if (biasedExp < 0) {
    // Underflow → ±0
    const bin = `${sign}01000` + "10001110" + "0".repeat(50);
    return { bin, isOverflow: false, isUnderflow: true };
  }

  const E_bin = biasedExp.toString(2).padStart(10, "0");
  const E_top2 = E_bin.substring(0, 2);
  const E_cont8 = E_bin.substring(2);

  const d0 = parseInt(coeff16[0], 10);
  const d0_bin = d0.toString(2).padStart(4, "0");

  let comb: string;
  if (d0 < 8) {
    comb = E_top2 + d0_bin.substring(1, 4);
  } else {
    comb = "11" + E_top2 + d0_bin[3];
  }

  let coeff_cont50 = "";
  for (let i = 1; i < 16; i += 3) {
    coeff_cont50 += encodeDPD(coeff16[i], coeff16[i + 1], coeff16[i + 2]);
  }

  const bin = `${sign}` + comb + E_cont8 + coeff_cont50;
  return { bin, isOverflow: false, isUnderflow: false };
}

// ─────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────
function formatBinarySpaced(bin: string): string {
  const sign = bin[0];
  const comb = bin.substring(1, 6);
  const expCont = bin.substring(6, 14);
  const dpdGroups: string[] = [];
  for (let i = 14; i < 64; i += 10) {
    dpdGroups.push(bin.substring(i, i + 10));
  }
  return `${sign} ${comb} ${expCont} ${dpdGroups.join(" ")}`;
}

function binaryToHex(bin: string): string {
  let hexStr = "";
  for (let i = 0; i < bin.length; i += 4) {
    hexStr += parseInt(bin.substring(i, i + 4), 2)
      .toString(16)
      .toUpperCase();
  }
  return hexStr;
}

// ─────────────────────────────────────────────────────────────
// Input parsers
// ─────────────────────────────────────────────────────────────

/** Parse decimal string like "123456.789" or "-1.234e5" into { sign, coeff16, exponent } */
function parseDecimalInput(raw: string): {
  sign: number;
  coeff16: string;
  exponent: number;
  ok: boolean;
  error?: string;
} {
  const str = raw.trim();
  const sign = str.startsWith("-") ? 1 : 0;
  let s = str.replace(/^[+-]/, "");

  // Handle scientific notation like 1.23e5
  let expOffset = 0;
  const eIdx = s.toLowerCase().indexOf("e");
  if (eIdx !== -1) {
    expOffset = parseInt(s.substring(eIdx + 1)) || 0;
    s = s.substring(0, eIdx);
  }

  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") {
    return { sign: 0, coeff16: "0000000000000000", exponent: 0, ok: false, error: "Invalid decimal number" };
  }

  const [intPart = "0", fracPart = ""] = s.split(".");
  let coeff = (intPart + fracPart).replace(/^0+/, "") || "0";
  let exponent = -fracPart.length + expOffset;

  if (coeff.length > 16) {
    exponent += coeff.length - 16;
    coeff = coeff.substring(0, 16);
  }

  const coeff16 = coeff.padStart(16, "0");
  return { sign, coeff16, exponent, ok: true };
}

/** Parse IEEE hex string (16 hex chars = 64 bits) → binary string */
function parseHexInput(raw: string): { bin: string; ok: boolean; error?: string } {
  let s = raw.trim().replace(/^0x/i, "").replace(/\s/g, "");
  if (!/^[0-9a-fA-F]{16}$/.test(s)) {
    return {
      bin: "",
      ok: false,
      error: "IEEE hex must be exactly 16 hexadecimal characters (64 bits)",
    };
  }
  const bin = s
    .split("")
    .map((c) => parseInt(c, 16).toString(2).padStart(4, "0"))
    .join("");
  return { bin, ok: true };
}

// ─────────────────────────────────────────────────────────────
// GRS Round-to-Nearest Ties-to-Even (decimal)
// g, r, s are single decimal digits (as numbers)
// ─────────────────────────────────────────────────────────────
function roundGRS(coeff: string, g: number, r: number, s: number, sign: number): string {
  // GRS rounding for decimal: round half-up toward even last digit
  // Increment the last digit of coeff if g >= 5 and (g > 5 or r > 0 or s > 0 or last digit is odd)
  const arr = coeff.split("").map(Number);
  let roundUp = false;

  if (g > 5) {
    roundUp = true;
  } else if (g === 5) {
    if (r > 0 || s > 0) {
      roundUp = true;
    } else {
      // ties-to-even: round if last digit is odd
      if (arr[arr.length - 1] % 2 !== 0) {
        roundUp = true;
      }
    }
  }

  // Negative numbers: round-half-up is round-half-away from zero direction
  // In IEEE 754 ties-to-even sign doesn't affect the "even" check
  void sign;

  if (!roundUp) return coeff;

  // Add 1 to the last digit with carry
  let carry = 1;
  for (let i = arr.length - 1; i >= 0 && carry; i--) {
    const sum = arr[i] + carry;
    arr[i] = sum % 10;
    carry = Math.floor(sum / 10);
  }

  if (carry) {
    // Overflow: coefficient grew by one digit
    arr.unshift(1);
    // Return as string (caller must handle the extra length)
    return arr.join("");
  }

  return arr.join("");
}

// ─────────────────────────────────────────────────────────────
// Step type for display
// ─────────────────────────────────────────────────────────────
interface Step {
  label: string;
  detail: string;
}

// ─────────────────────────────────────────────────────────────
// Subtraction using GRS
// ─────────────────────────────────────────────────────────────
function performSubtraction(
  aSign: number, aCoeff: string, aExp: number,
  bSign: number, bCoeff: string, bExp: number
): { steps: Step[]; finalSign: number; finalCoeff: string; finalExp: number; specialCase: string } {
  const steps: Step[] = [];
  let specialCase = "";

  steps.push({
    label: "Step 1 — Identify operands",
    detail:
      `A = ${aSign ? "-" : "+"}${aCoeff[0]}.${aCoeff.substring(1)} × 10^${aExp}\n` +
      `B = ${bSign ? "-" : "+"}${bCoeff[0]}.${bCoeff.substring(1)} × 10^${bExp}\n` +
      `Operation: A − B`,
  });

  // Subtraction is A + (-B)
  const bSignFlipped = bSign ^ 1;

  steps.push({
    label: "Step 2 — Negate B (flip sign)",
    detail: `−B = ${bSignFlipped ? "-" : "+"}${bCoeff[0]}.${bCoeff.substring(1)} × 10^${bExp}`,
  });

  // Align exponents: the one with smaller exponent gets right-shifted
  let sign1 = aSign, coeff1 = aCoeff, exp1 = aExp;
  let sign2 = bSignFlipped, coeff2 = bCoeff;

  const expDiff = exp1 - bExp;

  let g = 0, r = 0, s = 0;
  let alignedCoeff1 = coeff1;
  let alignedCoeff2 = coeff2;

  if (expDiff > 0) {
    // B has smaller exponent → shift B right by expDiff
    const shifted = shiftRight(coeff2, expDiff);
    alignedCoeff2 = shifted.aligned;
    g = shifted.g;
    r = shifted.r;
    s = shifted.s;
    steps.push({
      label: "Step 3 — Align exponents (shift −B right)",
      detail:
        `ExpDiff = ${expDiff}\n` +
        `−B aligned: 0.${"0".repeat(expDiff - 1)}${coeff2[0]}.${coeff2.substring(1)} × 10^${exp1}\n` +
        `Aligned −B coeff: ${alignedCoeff2}\n` +
        `GRS digits: G=${g}, R=${r}, S=${s}`,
    });
  } else if (expDiff < 0) {
    // A has smaller exponent → shift A right
    const shifted = shiftRight(coeff1, -expDiff);
    alignedCoeff1 = shifted.aligned;
    g = shifted.g;
    r = shifted.r;
    s = shifted.s;
    exp1 = bExp;
    steps.push({
      label: "Step 3 — Align exponents (shift A right)",
      detail:
        `ExpDiff = ${-expDiff}\n` +
        `A aligned coeff: ${alignedCoeff1}\n` +
        `GRS digits: G=${g}, R=${r}, S=${s}`,
    });
  } else {
    steps.push({
      label: "Step 3 — Align exponents",
      detail: "Exponents are already equal, no alignment needed.\nGRS digits: G=0, R=0, S=0",
    });
  }

  // Add the two signed magnitudes
  const result = addSignedDecimals(sign1, alignedCoeff1, sign2, alignedCoeff2);

  steps.push({
    label: "Step 4 — Add/Subtract aligned significands",
    detail:
      `  ${sign1 ? "-" : "+"}${alignedCoeff1}\n` +
      `  ${sign2 ? "-" : "+"}${alignedCoeff2}\n` +
      `= ${result.sign ? "-" : "+"}${result.coeff} (before normalize)\n` +
      `  GRS: G=${g}, R=${r}, S=${s}`,
  });

  let finalSign = result.sign;
  let finalCoeff = result.coeff;
  let finalExp = exp1;

  // Normalize
  const norm = normalize(finalSign, finalCoeff, finalExp, g, r, s);
  finalSign = norm.sign;
  finalCoeff = norm.coeff;
  finalExp = norm.exp;
  g = norm.g;
  r = norm.r;
  s = norm.s;

  steps.push({
    label: "Step 5 — Normalize",
    detail:
      `Normalized: ${finalSign ? "-" : "+"}${finalCoeff[0]}.${finalCoeff.substring(1)} × 10^${finalExp}\n` +
      `GRS after normalize: G=${g}, R=${r}, S=${s}`,
  });

  // Round using GRS
  const rounded = roundGRS(finalCoeff, g, r, s, finalSign);

  steps.push({
    label: "Step 6 — Round (GRS Round-to-Nearest Ties-to-Even)",
    detail:
      `G=${g}, R=${r}, S=${s}\n` +
      `Before round: ${finalCoeff}\n` +
      `After round : ${rounded}`,
  });

  finalCoeff = rounded;

  // If rounding caused overflow in coefficient (17 digits), renormalize
  if (finalCoeff.length > 16) {
    finalExp += finalCoeff.length - 16;
    finalCoeff = finalCoeff.substring(0, 16);
    steps.push({
      label: "Step 7 — Renormalize after rounding",
      detail: `Coefficient overflowed after rounding.\nNew exponent: ${finalExp}\nNew coeff: ${finalCoeff}`,
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

// ─────────────────────────────────────────────────────────────
// Division using GRS
// ─────────────────────────────────────────────────────────────
function performDivision(
  aSign: number, aCoeff: string, aExp: number,
  bSign: number, bCoeff: string, bExp: number
): { steps: Step[]; finalSign: number; finalCoeff: string; finalExp: number; specialCase: string } {
  const steps: Step[] = [];
  let specialCase = "";

  steps.push({
    label: "Step 1 — Identify operands",
    detail:
      `A = ${aSign ? "-" : "+"}${aCoeff[0]}.${aCoeff.substring(1)} × 10^${aExp}\n` +
      `B = ${bSign ? "-" : "+"}${bCoeff[0]}.${bCoeff.substring(1)} × 10^${bExp}\n` +
      `Operation: A ÷ B`,
  });

  // Division by zero
  if (parseInt(bCoeff) === 0) {
    specialCase = parseInt(aCoeff) === 0 ? "NaN (0 ÷ 0)" : `${aSign ^ bSign ? "−" : "+"}Infinity (x ÷ 0)`;
    steps.push({
      label: "Special Case — Division by zero",
      detail: specialCase,
    });
    return { steps, finalSign: aSign ^ bSign, finalCoeff: "0000000000000000", finalExp: 0, specialCase };
  }

  // Division of zero by non-zero → 0
  if (parseInt(aCoeff) === 0) {
    specialCase = "Result is ±0 (0 ÷ x)";
    steps.push({
      label: "Special Case — Zero divided by non-zero",
      detail: specialCase,
    });
    return { steps, finalSign: aSign ^ bSign, finalCoeff: "0000000000000000", finalExp: 0, specialCase };
  }

  // Sign determination
  const finalSign = aSign ^ bSign;

  steps.push({
    label: "Step 2 — Determine sign",
    detail:
      `Sign of A: ${aSign ? "−" : "+"}  |  Sign of B: ${bSign ? "−" : "+"}\n` +
      `Result sign: ${finalSign ? "−" : "+"} (XOR of signs)`,
  });

  // Exponent subtraction
  const rawExp = aExp - bExp;

  steps.push({
    label: "Step 3 — Subtract exponents",
    detail: `Exponent = ${aExp} − ${bExp} = ${rawExp}`,
  });

  // Coefficient long division with GRS digits
  // We treat coefficients as integers (16 digits) and perform decimal long division
  // to get 16+3 = 19 digits of quotient (for GRS)
  const aCoeffInt = BigInt(aCoeff);
  const bCoeffInt = BigInt(bCoeff);

  // Scale numerator up by 10^18 to get 19 significant digits in quotient
  // (16 for coefficient + 3 for GRS)
  const scaledNumerator = aCoeffInt * BigInt("1000000000000000000"); // × 10^18
  const quotientBig = scaledNumerator / bCoeffInt;
  const remainderBig = scaledNumerator % bCoeffInt;

  let quotientStr = quotientBig.toString();

  steps.push({
    label: "Step 4 — Divide coefficients (extended precision for GRS)",
    detail:
      `A coeff: ${aCoeff}\n` +
      `B coeff: ${bCoeff}\n` +
      `Scale A by 10^18 → ${aCoeff}${"0".repeat(18)}\n` +
      `Quotient (19+ digits): ${quotientStr}\n` +
      `Remainder: ${remainderBig}`,
  });

  // Determine exponent adjustment from quotient length
  // After scaling by 10^18, we want the result to be in the form d.ddd × 10^e
  // The quotient has about 18 digits. We want 16 coefficient digits + 3 GRS digits = 19 digits total.
  // Normalize by leading zeros / digit count.

  // Strip leading zeros for normalization
  const qNoLead = quotientStr.replace(/^0+/, "") || "0";

  // We need quotient to be exactly 19 digits (for 16 coeff + 3 GRS)
  let qPadded: string;
  let expAdj = 0;

  if (qNoLead.length >= 19) {
    qPadded = qNoLead.substring(0, 19);
    expAdj = qNoLead.length - 19;
  } else {
    // Pad to 19 digits
    qPadded = qNoLead.padStart(19, "0");
    expAdj = 0;
  }

  // The actual exponent: we scaled by 10^18, so subtract 18 from exponent
  let finalExp = rawExp - 18 + expAdj;

  // Extract 16-digit coefficient and 3 GRS digits
  let finalCoeff = qPadded.substring(0, 16);
  const g = parseInt(qPadded[16] || "0");
  const r = parseInt(qPadded[17] || "0");
  // S is set if remainder ≠ 0 or any digit beyond position 17 is nonzero
  const beyondStr = qPadded.substring(18);
  const s = remainderBig !== 0n || beyondStr.split("").some((c) => c !== "0") ? 1 : 0;

  steps.push({
    label: "Step 5 — Extract coefficient and GRS digits",
    detail:
      `Quotient (19 digits): ${qPadded}\n` +
      `Coefficient (16 digits): ${finalCoeff}\n` +
      `G = ${g}, R = ${r}, S = ${s}\n` +
      `Tentative exponent: ${finalExp}`,
  });

  // Normalize (ensure leading digit is non-zero)
  const norm = normalize(finalSign, finalCoeff, finalExp, g, r, s);
  finalCoeff = norm.coeff;
  finalExp = norm.exp;
  const ng = norm.g, nr = norm.r, ns = norm.s;

  steps.push({
    label: "Step 6 — Normalize",
    detail:
      `Normalized: ${finalSign ? "-" : "+"}${finalCoeff[0]}.${finalCoeff.substring(1)} × 10^${finalExp}\n` +
      `GRS after normalize: G=${ng}, R=${nr}, S=${ns}`,
  });

  // Round
  const rounded = roundGRS(finalCoeff, ng, nr, ns, finalSign);

  steps.push({
    label: "Step 7 — Round (GRS Round-to-Nearest Ties-to-Even)",
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
      detail: `Coefficient grew after rounding.\nNew exponent: ${finalExp}\nNew coeff: ${finalCoeff}`,
    });
  }

  if (parseInt(finalCoeff) === 0) {
    specialCase = "Result rounds to ±0";
    finalCoeff = "0000000000000000";
    finalExp = 0;
  }

  return { steps, finalSign, finalCoeff, finalExp, specialCase };
}

// ─────────────────────────────────────────────────────────────
// Helper: shift a 16-digit coefficient right by `n` positions
// Returns aligned 16-digit string and GRS extras
// ─────────────────────────────────────────────────────────────
function shiftRight(
  coeff: string,
  n: number
): { aligned: string; g: number; r: number; s: number } {
  // We extend the coeff by appending zeros (up to n+3), then extract
  const extended = coeff + "000"; // extra 3 for G, R, S
  let g = 0, r = 0, s = 0;

  if (n >= 16) {
    // The whole coefficient shifted away
    g = parseInt(extended[n] || "0");
    r = parseInt(extended[n + 1] || "0");
    const sStr = extended.substring(n + 2) + coeff;
    s = sStr.split("").some((c) => c !== "0") ? 1 : 0;
    return { aligned: "0000000000000000", g, r, s };
  }

  // aligned = first 16 digits of (zeros + coeff) shifted
  const padded = "0".repeat(n) + extended; // n zeros prepended
  const aligned = padded.substring(0, 16);
  g = parseInt(padded[16] || "0");
  r = parseInt(padded[17] || "0");
  const sStr = padded.substring(18);
  s = sStr.split("").some((c) => c !== "0") ? 1 : 0;

  return { aligned, g, r, s };
}

// ─────────────────────────────────────────────────────────────
// Helper: add two signed 16-digit decimal integers
// Returns { sign, coeff } where coeff is the magnitude
// ─────────────────────────────────────────────────────────────
function addSignedDecimals(
  sign1: number,
  coeff1: string,
  sign2: number,
  coeff2: string
): { sign: number; coeff: string } {
  const n1 = BigInt(sign1 ? "-" + coeff1 : coeff1);
  const n2 = BigInt(sign2 ? "-" + coeff2 : coeff2);
  const sum = n1 + n2;
  const sign = sum < 0n ? 1 : 0;
  const magnitude = (sum < 0n ? -sum : sum).toString().padStart(16, "0");
  return { sign, coeff: magnitude };
}

// ─────────────────────────────────────────────────────────────
// Helper: normalize a coefficient
// If coeff starts with 0, shift left (increase GRS digits, decrease exponent)
// If coeff has extra digits, shift right (increase exponent)
// ─────────────────────────────────────────────────────────────
function normalize(
  sign: number,
  coeff: string,
  exp: number,
  g: number,
  r: number,
  s: number
): { sign: number; coeff: string; exp: number; g: number; r: number; s: number } {
  // If coeff is longer than 16 digits (from addition overflow), shift right
  if (coeff.length > 16) {
    const extra = coeff.length - 16;
    // Shift GRS right
    let newG = g, newR = r, newS = s;
    for (let i = 0; i < extra; i++) {
      newS = (newR > 0 || newS > 0) ? 1 : 0;
      newR = newG;
      newG = parseInt(coeff[15 + i + 1] || "0");
    }
    const newCoeff = coeff.substring(0, 16);
    return normalize(sign, newCoeff, exp + extra, newG, newR, newS);
  }

  // If coeff is all zeros → already normalized as zero
  if (parseInt(coeff) === 0) {
    return { sign, coeff: "0000000000000000", exp: 0, g: 0, r: 0, s: 0 };
  }

  // If leading digit is 0, shift left by removing leading zeros
  const stripped = coeff.replace(/^0+/, "") || "0";
  const shift = coeff.length - stripped.length;

  if (shift > 0) {
    // Left shift: move GRS digits into the coefficient
    // Each left shift brings in one GRS digit from the right
    let newCoeff = stripped;
    let newG = g, newR = r, newS = s;

    for (let i = 0; i < shift; i++) {
      // shift one digit from GRS into coeff
      newCoeff = newCoeff + String(newG);
      newG = newR;
      newR = newS;
      newS = 0; // we lose sticky precision
    }

    // Pad to 16 digits
    newCoeff = newCoeff.padStart(16, "0");

    return {
      sign,
      coeff: newCoeff,
      exp: exp - shift,
      g: newG,
      r: newR,
      s: newS,
    };
  }

  return { sign, coeff, exp, g, r, s };
}

// ─────────────────────────────────────────────────────────────
// Parse user input (decimal or ieee hex) → Decimal64 parts
// ─────────────────────────────────────────────────────────────
interface ParsedOperand {
  sign: number;
  coeff: string;
  exp: number;
  isInfinity: boolean;
  isNaN: boolean;
  isZero: boolean;
  error?: string;
  binStr?: string;
}

function parseOperand(raw: string, format: "decimal" | "hex"): ParsedOperand {
  if (format === "hex") {
    const { bin, ok, error } = parseHexInput(raw);
    if (!ok) return { sign: 0, coeff: "0000000000000000", exp: 0, isInfinity: false, isNaN: true, isZero: false, error };
    const parts = parseBinary64(bin);
    return {
      sign: parts.sign,
      coeff: parts.coefficient,
      exp: parts.exponent,
      isInfinity: parts.isInfinity,
      isNaN: parts.isNaN,
      isZero: parts.isZero,
      binStr: bin,
    };
  } else {
    const { sign, coeff16, exponent, ok, error } = parseDecimalInput(raw);
    if (!ok) return { sign: 0, coeff: "0000000000000000", exp: 0, isInfinity: false, isNaN: true, isZero: false, error };
    return {
      sign,
      coeff: coeff16,
      exp: exponent,
      isInfinity: false,
      isNaN: false,
      isZero: parseInt(coeff16) === 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
interface ArithResult {
  steps: Step[];
  decimalStr: string;
  binaryStr: string;
  hexStr: string;
  specialCase: string;
}

function ArithmeticWindow() {
  const [inputFormat, setInputFormat] = useState<"decimal" | "hex">("decimal");
  const [operandA, setOperandA] = useState("");
  const [operandB, setOperandB] = useState("");
  const [operation, setOperation] = useState<"subtraction" | "division">("subtraction");
  const [result, setResult] = useState<ArithResult | null>(null);
  const [error, setError] = useState("");

  function compute() {
    setError("");
    setResult(null);

    const a = parseOperand(operandA, inputFormat);
    const b = parseOperand(operandB, inputFormat);

    if (a.error) { setError(`Operand A: ${a.error}`); return; }
    if (b.error) { setError(`Operand B: ${b.error}`); return; }

    let specialCase = "";
    let allSteps: Step[] = [];
    let finalSign = 0, finalCoeff = "0000000000000000", finalExp = 0;

    // Handle special cases upfront
    if (a.isNaN || b.isNaN) {
      specialCase = "NaN — one or both operands is NaN";
      allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
    } else if (a.isInfinity || b.isInfinity) {
      if (operation === "subtraction") {
        if (a.isInfinity && b.isInfinity) {
          specialCase = "NaN — ∞ − ∞ is undefined";
          allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
        } else if (a.isInfinity) {
          specialCase = `${a.sign ? "−" : "+"}∞`;
          finalSign = a.sign;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        } else {
          specialCase = `${b.sign ? "+" : "−"}∞ (negating B which is Infinity)`;
          finalSign = b.sign ^ 1;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        }
      } else {
        // Division with infinity
        if (a.isInfinity && b.isInfinity) {
          specialCase = "NaN — ∞ ÷ ∞ is undefined";
          allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
        } else if (a.isInfinity) {
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}∞`;
          finalSign = a.sign ^ b.sign;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        } else {
          // Finite ÷ ∞ = ±0
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}0 (finite ÷ ∞)`;
          finalSign = a.sign ^ b.sign;
          allSteps = [{ label: "Special Case — Zero", detail: `Result = ${specialCase}` }];
        }
      }
    } else {
      // Normal case
      const out =
        operation === "subtraction"
          ? performSubtraction(a.sign, a.coeff, a.exp, b.sign, b.coeff, b.exp)
          : performDivision(a.sign, a.coeff, a.exp, b.sign, b.coeff, b.exp);

      allSteps = out.steps;
      specialCase = out.specialCase;
      finalSign = out.finalSign;
      finalCoeff = out.finalCoeff;
      finalExp = out.finalExp;
    }

    // Build IEEE 754 encoding
    let binResult: string;
    let hexResult: string;
    let decimalDisplay: string;

    if (specialCase.includes("NaN")) {
      binResult = `${finalSign}111111` + "0".repeat(57);
      // Correctly: sign + 11111 + 1 + 0*57
      binResult = `${finalSign}11111` + "1" + "0".repeat(57);
      hexResult = binaryToHex(binResult);
      decimalDisplay = "NaN";
    } else if (specialCase.includes("∞")) {
      binResult = `${finalSign}11110` + "0".repeat(58);
      hexResult = binaryToHex(binResult);
      decimalDisplay = specialCase.includes("−") ? "-Infinity" : "+Infinity";
    } else {
      const coeff16 = finalCoeff.padStart(16, "0").substring(0, 16);
      const enc = encodeBinary64(finalSign, finalExp, coeff16);
      binResult = enc.bin;

      if (enc.isOverflow) {
        specialCase = specialCase || (finalSign ? "−∞ (overflow)" : "+∞ (overflow)");
        decimalDisplay = finalSign ? "-Infinity" : "+Infinity";
      } else if (enc.isUnderflow) {
        specialCase = specialCase || "Underflow → ±0";
        decimalDisplay = "0";
      } else {
        // Build decimal display string
        const sigStr = finalCoeff.replace(/^0+/, "") || "0";
        decimalDisplay = `${finalSign ? "-" : ""}${sigStr[0]}.${sigStr.substring(1).replace(/0+$/, "") || "0"} × 10^${finalExp}`;
      }

      hexResult = binaryToHex(binResult);
    }

    setResult({
      steps: allSteps,
      decimalStr: decimalDisplay,
      binaryStr: formatBinarySpaced(binResult),
      hexStr: hexResult,
      specialCase,
    });
  }

  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-2xl bg-sky-200 border border-sky-400 text-sky-800 px-4 py-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">GRS Arithmetic Operations</h2>

      {/* Inputs */}
      <div className="flex flex-col gap-4 w-full">
        {/* Input format */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithFormat" className="font-semibold text-sm w-36">
            Input Format:
          </label>
          <select
            id="arithFormat"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1"
            value={inputFormat}
            onChange={(e) => setInputFormat(e.target.value as "decimal" | "hex")}
          >
            <option value="decimal">Decimal</option>
            <option value="hex">IEEE Hexadecimal</option>
          </select>
        </div>

        {/* Operation */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithOp" className="font-semibold text-sm w-36">
            Operation:
          </label>
          <select
            id="arithOp"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1"
            value={operation}
            onChange={(e) => setOperation(e.target.value as "subtraction" | "division")}
          >
            <option value="subtraction">Subtraction (A − B)</option>
            <option value="division">Division (A ÷ B)</option>
          </select>
        </div>

        {/* Operand A */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithA" className="font-semibold text-sm w-36">
            Operand A:
          </label>
          <input
            id="arithA"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 font-mono text-sm"
            type="text"
            placeholder={
              inputFormat === "decimal"
                ? "e.g. 123457.1467 or -1.23e5"
                : "e.g. 22400DE0D7EB6E40"
            }
            value={operandA}
            onChange={(e) => setOperandA(e.target.value)}
          />
        </div>

        {/* Operand B */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithB" className="font-semibold text-sm w-36">
            Operand B:
          </label>
          <input
            id="arithB"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 font-mono text-sm"
            type="text"
            placeholder={
              inputFormat === "decimal"
                ? "e.g. 123456.659 or 5.67e2"
                : "e.g. 2238000000000000"
            }
            value={operandB}
            onChange={(e) => setOperandB(e.target.value)}
          />
        </div>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-2 self-center"
          onClick={compute}
        >
          Compute
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mt-4 w-full text-center font-semibold">
          Error: <span className="font-normal">{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col items-center mt-4 w-full">
          {/* Special case banner */}
          {result.specialCase && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4 w-full text-center font-semibold">
              Special Case:{" "}
              <span className="font-normal">{result.specialCase}</span>
            </div>
          )}

          {/* Step-by-step */}
          <div className="w-full mb-4">
            <p className="font-semibold text-sm mb-2">Step-by-Step Solution:</p>
            <div className="flex flex-col gap-2">
              {result.steps.map((step, idx) => (
                <div key={idx} className="bg-gray-100 rounded p-3">
                  <p className="font-semibold text-xs text-sky-700 mb-1">
                    {step.label}
                  </p>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-800">
                    {step.detail}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Final results */}
          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Decimal:
            </label>
            <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
              {result.decimalStr}
            </p>
          </div>

          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Binary{" "}
              <span className="font-normal italic">
                (sign | combination | continuation | coefficient DPD)
              </span>
              :
            </label>
            <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
              {result.binaryStr}
            </p>
          </div>

          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Hexadecimal:
            </label>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded mt-1">
              0x{result.hexStr}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArithmeticWindow;

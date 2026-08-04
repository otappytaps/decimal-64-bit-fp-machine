// grs.ts
// Overview:
// Handles rounding, shifting, addition, and normalization of Decimal64 coefficients with GRS (Guard, Round, Sticky) digits.
// Rounds a 16-digit coefficient based on GRS digits using round-half-to-even.
// Returns the rounded coefficient string.
export function roundGRS(
  coeff: string,
  g: number,
  r: number,
  s: number,
): string {
  const arr = coeff.split("").map(Number);
  let roundUp = false;

  if (g > 5) {
    roundUp = true;
  } else if (g === 5) {
    if (r > 0 || s > 0) {
      roundUp = true;
    } else {
      if (arr[arr.length - 1] % 2 !== 0) roundUp = true;
    }
  }

  if (!roundUp) return coeff;

  let carry = 1;
  for (let i = arr.length - 1; i >= 0 && carry; i--) {
    const sum = arr[i] + carry;
    arr[i] = sum % 10;
    carry = Math.floor(sum / 10);
  }

  if (carry) {
    arr.unshift(1);
  }

  return arr.join("");
}

// Shifts a coefficient right by n positions, padding with zeros.
// Extracts and returns the GRS digits (g, r, s) along with the aligned 16-digit coefficient.
export function shiftRight(
  coeff: string,
  n: number,
): { aligned: string; g: number; r: number; s: number } {
  let g = 0,
    r = 0,
    s = 0;

  if (n >= 16) {
    const fullStr = "0".repeat(n) + coeff;
    g = parseInt(fullStr[16] || "0");
    r = parseInt(fullStr[17] || "0");
    const sStr = fullStr.substring(18);
    s = sStr.split("").some((c) => c !== "0") ? 1 : 0;
    return { aligned: "0000000000000000", g, r, s };
  }

  const extended = coeff + "000";
  const padded = "0".repeat(n) + extended;
  const aligned = padded.substring(0, 16);
  g = parseInt(padded[16] || "0");
  r = parseInt(padded[17] || "0");
  const sStr = padded.substring(18);
  s = sStr.split("").some((c) => c !== "0") ? 1 : 0;

  return { aligned, g, r, s };
}

// Adds or subtracts two signed decimal magnitudes using BigInt.
// Returns the result sign (1 for negative, 0 for positive) and a 16-digit coefficient string.
export function addSignedDecimals(
  sign1: number,
  coeff1: string,
  sign2: number,
  coeff2: string,
): { sign: number; coeff: string } {
  const n1 = BigInt(sign1 ? "-" + coeff1 : coeff1);
  const n2 = BigInt(sign2 ? "-" + coeff2 : coeff2);
  const sum = n1 + n2;
  const sign = sum < 0n ? 1 : 0;
  const magnitude = (sum < 0n ? -sum : sum).toString().padStart(16, "0");
  return { sign, coeff: magnitude };
}

// Normalizes a coefficient to exactly 16 digits by propagating GRS digits and adjusting the exponent.
// Recursively trims excess digits or shifts leading zeros. Returns the normalized sign, coefficient, exponent, and GRS digits.
export function normalize(
  sign: number,
  coeff: string,
  exp: number,
  g: number,
  r: number,
  s: number,
): {
  sign: number;
  coeff: string;
  exp: number;
  g: number;
  r: number;
  s: number;
} {
  if (coeff.length > 16) {
    const extra = coeff.length - 16;
    let newG = g,
      newR = r,
      newS = s;
    for (let i = 0; i < extra; i++) {
      newS = newR > 0 || newS > 0 ? 1 : 0;
      newR = newG;
      newG = parseInt(coeff[15 + i + 1] || "0");
    }
    const newCoeff = coeff.substring(0, 16);
    return normalize(sign, newCoeff, exp + extra, newG, newR, newS);
  }

  if (parseInt(coeff) === 0) {
    return { sign, coeff: "0000000000000000", exp: 0, g: 0, r: 0, s: 0 };
  }

  const stripped = coeff.replace(/^0+/, "") || "0";
  const shift = coeff.length - stripped.length;

  if (shift > 0) {
    let newCoeff = stripped;
    let newG = g,
      newR = r,
      newS = s;

    for (let i = 0; i < shift; i++) {
      newCoeff = newCoeff + String(newG);
      newG = newR;
      newR = newS;
      newS = 0;
    }

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

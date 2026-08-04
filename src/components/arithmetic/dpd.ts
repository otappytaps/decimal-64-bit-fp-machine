// dpd.ts
// Overview:
// Implements the Digit Pair Decimal (DPD) conversion routines for Decimal64.
//   - decodeDPD(): converts a 10‑bit DPD group back into three decimal digits.
//   - encodeDPD(): converts three decimal digits into their 10‑bit DPD encoding.
// These functions bridge the gap between the compact 16‑digit coefficient stored
// in a Decimal64 encoding and the underlying BCD‑like three‑digit groups.

/** Converts a 10‑bit DPD string back into three decimal digit characters */
export function decodeDPD(bits: string): string {
  // Helper to extract an individual bit (0‑based index) and parse as number
  const bit = (i: number) => parseInt(bits[i], 2);

  // Read the 10 input bits into named variables (p…y)
  const p = bit(0),
    q = bit(1),
    r = bit(2);
  const s = bit(3),
    t = bit(4),
    u = bit(5);
  const v = bit(6),
    w = bit(7),
    x = bit(8),
    y = bit(9);

  // Output digits (each 0‑9)
  let d0: number, d1: number, d2: number;

  // The decoding logic depends on the top‑level flag bits (v, w, x)
  if (v === 0) {
    // Standard case: each digit comes directly from a 3‑bit group
    d0 = p * 4 + q * 2 + r;
    d1 = s * 4 + t * 2 + u;
    d2 = w * 4 + x * 2 + y;
  } else if (v === 1 && w === 0 && x === 0) {
    // vwx = 100: first two digits standard, third digit forced to 8 or 9
    d0 = p * 4 + q * 2 + r;
    d1 = s * 4 + t * 2 + u;
    d2 = 8 + y;
  } else if (v === 1 && w === 0 && x === 1) {
    // vwx = 101: second digit forced to 8 or 9
    d0 = p * 4 + q * 2 + r;
    d1 = 8 + u;
    d2 = s * 4 + t * 2 + y;
  } else if (v === 1 && w === 1 && x === 0) {
    // vwx = 110: first digit forced to 8 or 9
    d0 = 8 + r;
    d1 = s * 4 + t * 2 + u;
    d2 = p * 4 + q * 2 + y;
  } else {
    // vwx = 111: use the two‑bit selector (s, t) to pick from four cases
    const twoBit = s * 2 + t;
    if (twoBit === 0) {
      d0 = p * 4 + q * 2 + r;
      d1 = 8 + u;
      d2 = 8 + y;
    } else if (twoBit === 1) {
      d0 = 8 + r;
      d1 = p * 4 + q * 2 + u;
      d2 = 8 + y;
    } else if (twoBit === 2) {
      d0 = 8 + r;
      d1 = 8 + u;
      d2 = p * 4 + q * 2 + y;
    } else {
      d0 = 8 + r;
      d1 = 8 + u;
      d2 = 8 + y;
    }
  }

  // Concatenate the three digits back into a string
  return `${d0}${d1}${d2}`;
}

/** Converts three decimal digit characters into a 10‑bit DPD string */
export function encodeDPD(d1: string, d2: string, d3: string): string {
  // Helper to convert one decimal digit (0‑9) into a 4‑bit binary string
  const to4Bit = (n: string) => parseInt(n, 10).toString(2).padStart(4, "0");

  // Extract the 4 bits of each digit (d1 → a,b,c,d ; d2 → e,f,g,h ; d3 → i,j,k,m)
  const [a, b, c, d] = to4Bit(d1);
  const [e, f, g, h] = to4Bit(d2);
  const [i, j, k, m] = to4Bit(d3);

  // The combination field (aei) determines which DPD encoding row to use
  const aei = a + e + i;

  // Select the appropriate 10‑bit encoding based on the aei combination
  if (aei === "000") return b + c + d + f + g + h + "0" + j + k + m;
  if (aei === "001") return b + c + d + f + g + h + "1" + "00" + m;
  if (aei === "010") return b + c + d + j + k + h + "1" + "01" + m;
  if (aei === "011") return b + c + d + "10" + h + "1" + "11" + m;
  if (aei === "100") return j + k + d + f + g + h + "1" + "10" + m;
  if (aei === "101") return f + g + d + "01" + h + "1" + "11" + m;
  if (aei === "110") return j + k + d + "00" + h + "1" + "11" + m;
  if (aei === "111") return "00" + d + "11" + h + "1" + "11" + m;

  // If the aei combination is invalid, throw an error to resolve TypeScript error
  throw new Error("Invalid DPD encoding");
}

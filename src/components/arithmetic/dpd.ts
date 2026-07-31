/** Converts 10-bit DPD string → three decimal digits string */
export function decodeDPD(bits: string): string {
    const bit = (i: number) => parseInt(bits[i], 2);

    const p = bit(0), q = bit(1), r = bit(2);
    const s = bit(3), t = bit(4), u = bit(5);
    const v = bit(6), w = bit(7), x = bit(8), y = bit(9);

    let d0: number, d1: number, d2: number;

    if (v === 0) {
        d0 = p * 4 + q * 2 + r;
        d1 = s * 4 + t * 2 + u;
        d2 = w * 4 + x * 2 + y;
    } else if (v === 1 && w === 0 && x === 0) {
        d0 = p * 4 + q * 2 + r;
        d1 = s * 4 + t * 2 + u;
        d2 = 8 + y;
    } else if (v === 1 && w === 0 && x === 1) {
        d0 = p * 4 + q * 2 + r;
        d1 = 8 + u;
        d2 = s * 4 + t * 2 + y;
    } else if (v === 1 && w === 1 && x === 0) {
        d0 = 8 + r;
        d1 = s * 4 + t * 2 + u;
        d2 = p * 4 + q * 2 + y;
    } else {
        // vwx = 111
        const twoBit = s * 2 + t;
        if (twoBit === 0) {
            d0 = p * 4 + q * 2 + r; d1 = 8 + u; d2 = 8 + y;
        } else if (twoBit === 1) {
            d0 = 8 + r; d1 = p * 4 + q * 2 + u; d2 = 8 + y;
        } else if (twoBit === 2) {
            d0 = 8 + r; d1 = 8 + u; d2 = p * 4 + q * 2 + y;
        } else {
            d0 = 8 + r; d1 = 8 + u; d2 = 8 + y;
        }
    }

    return `${d0}${d1}${d2}`;
}

/** Converts three decimal digit chars → 10-bit DPD string */
export function encodeDPD(d1: string, d2: string, d3: string): string {
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
import type { Decimal64Parts } from "./types";
import { decodeDPD, encodeDPD } from "./dpd";

/** Parse a 64-bit binary string → Decimal64Parts */
export function parseBinary64(bin: string): Decimal64Parts {
    const sign = parseInt(bin[0]);
    const comb = bin.substring(1, 6);
    const expCont = bin.substring(6, 14);
    const dpdBits = bin.substring(14);

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
        expMSBs = comb[2] + comb[3];
        msd = 8 + parseInt(comb[4]);
    } else {
        expMSBs = comb[0] + comb[1];
        msd = parseInt(comb.substring(2), 2);
    }

    const biasedExp = parseInt(expMSBs + expCont, 2);
    const exponent = biasedExp - 398;

    let tail = "";
    for (let i = 0; i < 50; i += 10) {
        tail += decodeDPD(dpdBits.substring(i, i + 10));
    }

    const coefficient = String(msd) + tail; // 16 digits
    const isZero = parseInt(coefficient) === 0;

    return { sign, biasedExp, exponent, coefficient, isInfinity, isNaN, isZero };
}

/** Encode Decimal64 parts → 64-bit binary string */
export function encodeBinary64(
    sign: number,
    exponent: number,
    coeff16: string
): { bin: string; isOverflow: boolean; isUnderflow: boolean } {
    const biasedExp = exponent + 398;

    if (biasedExp > 767) {
        const bin = `${sign}11110` + "0".repeat(58);
        return { bin, isOverflow: true, isUnderflow: false };
    }
    if (biasedExp < 0) {
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
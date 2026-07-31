import type { ParsedOperand } from "./types";
import { parseBinary64 } from "./decimal64Codec";

/** Parse decimal string like "123.456" or "-1.234e5" → { sign, coeff16, exponent } */
export function parseDecimalInput(raw: string): {
    sign: number;
    coeff16: string;
    exponent: number;
    ok: boolean;
    error?: string;
} {
    const str = raw.trim();
    const sign = str.startsWith("-") ? 1 : 0;
    let s = str.replace(/^[+-]/, "");

    let expOffset = 0;
    const eIdx = s.toLowerCase().indexOf("e");
    if (eIdx !== -1) {
        expOffset = parseInt(s.substring(eIdx + 1)) || 0;
        s = s.substring(0, eIdx);
    }

    if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") {
        return {
            sign: 0,
            coeff16: "0000000000000000",
            exponent: 0,
            ok: false,
            error: "Invalid decimal number",
        };
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
export function parseHexInput(raw: string): { bin: string; ok: boolean; error?: string } {
    const s = raw.trim().replace(/^0x/i, "").replace(/\s/g, "");
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

/** Parse user input (decimal or IEEE hex) → ParsedOperand */
export function parseOperand(raw: string, format: "decimal" | "hex"): ParsedOperand {
    if (format === "hex") {
        const { bin, ok, error } = parseHexInput(raw);
        if (!ok) {
            return {
                sign: 0, coeff: "0000000000000000", exp: 0,
                isInfinity: false, isNaN: true, isZero: false, error,
            };
        }
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
        if (!ok) {
            return {
                sign: 0, coeff: "0000000000000000", exp: 0,
                isInfinity: false, isNaN: true, isZero: false, error,
            };
        }
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
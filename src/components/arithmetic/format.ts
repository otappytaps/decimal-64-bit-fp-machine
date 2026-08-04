// format.ts
// Overview:
// Utility functions for formatting numerical values and binary representations.
// Converts Decimal64 components to scientific notation, formats binary with spaces,
// and converts between binary and hexadecimal string representations.

// Convert Decimal64 components to scientific notation string
// Example: sign=1, coeff="1234500000000000", exp=-2 → "-1.2345 × 10^13"
export function toSciNotation(sign: number, coeff: string, exp: number): string {
    // Remove leading zeros (but keep at least one digit if all zeros)
    const stripped = coeff.replace(/^0+/, "") || "0";
    if (stripped === "0") return "0";
    // Display exponent = true exponent + (digits in coefficient - 1)
    const displayExp = exp + stripped.length - 1;
    // Mantissa: first digit + "." + remaining digits (if any)
    const mantissa = stripped.length > 1
        ? stripped[0] + "." + stripped.substring(1)
        : stripped;

    return `${sign ? "-" : "+"}${mantissa} × 10^${displayExp}`;
}

// Format a 64-bit binary string with spaces between bit fields
// Format: [sign] [combination] [exponent continuation] [coefficient DPD groups...]
export function formatBinarySpaced(bin: string): string {
    const sign = bin[0];                    // Bit 0: sign
    const comb = bin.substring(1, 6);       // Bits 1-5: combination field
    const expCont = bin.substring(6, 14);   // Bits 6-13: exponent continuation
    const dpdGroups: string[] = [];         // Bits 14-63: five 10-bit DPD groups
    for (let i = 14; i < 64; i += 10) {
        dpdGroups.push(bin.substring(i, i + 10));
    }
    return `${sign} ${comb} ${expCont} ${dpdGroups.join(" ")}`;
}

// Convert a binary string to uppercase hexadecimal
// Processes 4 bits at a time (nibble) to produce hex digits
export function binaryToHex(bin: string): string {
    let hexStr = "";
    for (let i = 0; i < bin.length; i += 4) {
        // Convert 4-bit binary chunk to hex digit
        hexStr += parseInt(bin.substring(i, i + 4), 2)
            .toString(16)
            .toUpperCase();
    }
    return hexStr;
}
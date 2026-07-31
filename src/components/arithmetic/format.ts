export function toSciNotation(sign: number, coeff: string, exp: number): string {
    const stripped = coeff.replace(/^0+/, "") || "0";
    if (stripped === "0") return "0";
    const displayExp = exp + stripped.length - 1;
    const mantissa = stripped.length > 1
        ? stripped[0] + "." + stripped.substring(1)
        : stripped;

    return `${sign ? "-" : "+"}${mantissa} × 10^${displayExp}`;
}

export function formatBinarySpaced(bin: string): string {
    const sign = bin[0];
    const comb = bin.substring(1, 6);
    const expCont = bin.substring(6, 14);
    const dpdGroups: string[] = [];
    for (let i = 14; i < 64; i += 10) {
        dpdGroups.push(bin.substring(i, i + 10));
    }
    return `${sign} ${comb} ${expCont} ${dpdGroups.join(" ")}`;
}

export function binaryToHex(bin: string): string {
    let hexStr = "";
    for (let i = 0; i < bin.length; i += 4) {
        hexStr += parseInt(bin.substring(i, i + 4), 2)
            .toString(16)
            .toUpperCase();
    }
    return hexStr;
}
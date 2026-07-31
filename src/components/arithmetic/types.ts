export interface Step {
    label: string;
    detail: string;
}

export interface Decimal64Parts {
    sign: number;        // 0 or 1
    biasedExp: number;   // e′ = e + 398
    exponent: number;    // true exponent e
    coefficient: string; // 16-digit decimal string
    isInfinity: boolean;
    isNaN: boolean;
    isZero: boolean;
}

export interface ParsedOperand {
    sign: number;
    coeff: string;
    exp: number;
    isInfinity: boolean;
    isNaN: boolean;
    isZero: boolean;
    error?: string;
    binStr?: string;
}
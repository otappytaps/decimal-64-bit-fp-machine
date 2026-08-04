// ConvertWindow.tsx
// Overview:
// This component converts a decimal input into an IEEE 754-2008 Decimal64 binary representation.
// It displays the binary, hexadecimal, and any special cases (NaN, Infinity, underflow, overflow).
// The UI consists of an input form, a compute button, and a result view with special case alerts.

import { useState } from "react";

// State management for input fields and results
function ConvertWindow() {
  const [decimal, setDecimal] = useState("");
  const [binary, setBinary] = useState("");
  const [hex, setHex] = useState("");
  const [isComputed, setIsComputed] = useState(false);
  const [specialCase, setSpecialCase] = useState("");
  const [exponentInput, setExponentInput] = useState("");

  // Encode three decimal digits into a 10‑bit DPD group
  function encodeDPD(d1: string, d2: string, d3: string) {
    // Convert each digit to a 4‑bit binary string
    const to4Bit = (n: string) => parseInt(n, 10).toString(2).padStart(4, "0");
    const [a, b, c, d] = to4Bit(d1);
    const [e, f, g, h] = to4Bit(d2);
    const [i, j, k, m] = to4Bit(d3);

    // Determine combination field based on most significant bits
    const aei = a + e + i; // Checks the most significant bits of the 3 digits
    if (aei === "000") return b + c + d + f + g + h + "0" + j + k + m;
    if (aei === "001") return b + c + d + f + g + h + "1" + "00" + m;
    if (aei === "010") return b + c + d + j + k + h + "1" + "01" + m;
    if (aei === "011") return b + c + d + "10" + h + "1" + "11" + m;
    if (aei === "100") return j + k + d + f + g + h + "1" + "10" + m;
    if (aei === "101") return f + g + d + "01" + h + "1" + "11" + m;
    if (aei === "110") return j + k + d + "00" + h + "1" + "11" + m;
    if (aei === "111") return "00" + d + "11" + h + "1" + "11" + m;
  }

  // Main computation function
  function compute() {
    // Exit early if decimal input is empty
    if (decimal === "") return;

    // Clean input and determine sign bit
    let str = String(decimal).trim();
    const signBit = str.startsWith("-") ? "1" : "0";
    if (str.startsWith("-") || str.startsWith("+")) str = str.substring(1);

    // Validate decimal format
    if (!/^\d*\.?\d*$/.test(str) || str === "" || str === ".") {
      const result = signBit + "11111" + "1" + "0".repeat(57);
      setBinary(formatBinarySpaced(result));
      setHex(binaryToHex(result));
      setSpecialCase("NaN — input is not a valid number");
      setIsComputed(true);
      return;
    }

    // Extract coefficient and exponent
    const [intPart = "0", fracPart = ""] = str.split(".");
    let coeffStr = (intPart + fracPart).replace(/^0+/, "") || "0";
    let exponent = -fracPart.length + (parseInt(exponentInput) || 0);

    // Ensure exactly 16 digits for coefficient (truncate if needed)
    if (coeffStr.length > 16) {
      exponent += coeffStr.length - 16;
      coeffStr = coeffStr.substring(0, 16);
    }
    const coeff16 = coeffStr.padStart(16, "0");
    const E = exponent + 398; // Exponent bias for Decimal64

    // Handle overflow (biased exponent > 767)
    if (E > 767) {
      const result = signBit + "11110" + "0".repeat(58);
      setBinary(formatBinarySpaced(result));
      setHex(binaryToHex(result));
      setSpecialCase(
        signBit === "1" ? "Negative Infinity (-∞)" : "Positive Infinity (+∞)",
      );
      setIsComputed(true);
      return;
    }

    // Handle underflow (biased exponent < 0)
    if (E < 0) {
      const result = signBit + "01000" + "10001110" + "0".repeat(50);
      setBinary(formatBinarySpaced(result));
      setHex(binaryToHex(result));
      setSpecialCase("Underflow — value rounds to ±0");
      setIsComputed(true);
      return;
    }

    // Encode exponent (10 bits) and combination field (5 bits)
    const E_bin = Math.max(0, E).toString(2).padStart(10, "0");
    const E_top2 = E_bin.substring(0, 2);
    const E_cont8 = E_bin.substring(2);

    // Calculate combination field from most significant digit
    const d0 = parseInt(coeff16[0], 10);
    const d0_bin = d0.toString(2).padStart(4, "0");
    let comb;
    if (d0 < 8) {
      comb = E_top2 + d0_bin.substring(1, 4);
    } else {
      comb = "11" + E_top2 + d0_bin[3];
    }

    // Encode remaining 15 digits into 50 bits (five 10‑bit DPD groups)
    let coeff_cont50 = "";
    for (let i = 1; i < 16; i += 3) {
      coeff_cont50 += encodeDPD(coeff16[i], coeff16[i + 1], coeff16[i + 2]);
    }

    // Assemble final binary representation
    const result = signBit + comb + E_cont8 + coeff_cont50;
    setBinary(formatBinarySpaced(result));
    setHex(binaryToHex(result));
    setSpecialCase("");
    setIsComputed(true);
  }

  // Format binary string with spacing for readability
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

  // Convert binary string to hexadecimal representation
  function binaryToHex(bin: string): string {
    let hexStr = "";
    for (let i = 0; i < bin.length; i += 4) {
      hexStr += parseInt(bin.substring(i, i + 4), 2)
        .toString(16)
        .toUpperCase();
    }
    return hexStr;
  }

  // Render component UI
  return (
    <div className="cyber-panel flex flex-col items-center w-full max-w-3xl mx-auto">
      <h2 className="cyber-panel-title">Decimal to Decimal64 Converter</h2>
      <InputWindow
        setDecimal={setDecimal}
        setExponentInput={setExponentInput}
        compute={compute}
      />
      {isComputed && (
        <div className="mt-6">
          <ResultWindow binary={binary} hex={hex} specialCase={specialCase} />
        </div>
      )}
    </div>
  );
}

// Input form component for decimal and exponent entry
function InputWindow({
  setDecimal,
  setExponentInput,
  compute,
}: {
  setDecimal: (decimal: string) => void;
  setExponentInput: (exp: string) => void;
  compute: () => void;
}) {
  return (
    <div className="flex flex-col items-center w-full gap-4">
      {/* Input format selector */}
      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="cyber-label-form">Decimal Input</label>
          <div className="flex items-center gap-2">
            <input
              className="cyber-input w-full"
              type="text"
              id="decimal"
              placeholder="e.g. 3.14159 or -123.45"
              onChange={(e) => {
                setDecimal(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="cyber-label-form">Exponent ×10^</label>
          <input
            className="cyber-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            id="exponent"
            placeholder="0"
            onChange={(e) => {
              setExponentInput(e.target.value);
            }}
          />
        </div>
      </div>

      <button
        className="cyber-button mb-6"
        onClick={() => {
          compute();
        }}
      >
        Compute
      </button>
    </div>
  );
}

// Result display component showing binary, hex, and special case info
function ResultWindow({
  binary,
  hex,
  specialCase,
}: {
  binary: string;
  hex: string;
  specialCase: string;
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      {/* Display special case alert if present */}
      {specialCase && (
        <div className="cyber-alert mt-4 mb-4 w-full">
          <span className="font-bold text-pink-400 mr-2">⚠ SPECIAL CASE:</span>
          {specialCase}
        </div>
      )}

      {/* Binary result section */}
      <div className="w-full mb-6">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-cyan-400">●</span>
          Binary{" "}
          <span className="text-xs opacity-50 font-normal">
            (sign | combination | continuation | coefficient DPD)
          </span>
          :
        </label>
        <pre className="cyber-mono break-all font-bold text-cyan-300/80 text-xs">
          {binary}
        </pre>
      </div>

      {/* Hexadecimal result section */}
      <div className="w-full mb-6">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-purple-400">●</span>
          Hexadecimal:
        </label>
        <pre className="cyber-mono break-all font-bold text-purple-300/80 text-xs">
          0x{hex}
        </pre>
      </div>
    </div>
  );
}

export default ConvertWindow;

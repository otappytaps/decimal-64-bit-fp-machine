import { useState } from "react";

// TODO: add error checking, special cases, and finish the UI
function ConvertWindow() {
  const [decimal, setDecimal] = useState("");
  const [binary, setBinary] = useState("");
  const [hex, setHex] = useState("");
  const [isComputed, setIsComputed] = useState(false);
  const [specialCase, setSpecialCase] = useState("");
  const [exponentInput, setExponentInput] = useState("");

  function encodeDPD(d1: string, d2: string, d3: string) {
    const to4Bit = (n: string) => parseInt(n, 10).toString(2).padStart(4, "0");
    const [a, b, c, d] = to4Bit(d1);
    const [e, f, g, h] = to4Bit(d2);
    const [i, j, k, m] = to4Bit(d3);

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
  function compute() {
    // 1. Clean input and determine sign bit
    let str = String(decimal).trim();
    const signBit = str.startsWith("-") ? "1" : "0";
    if (str.startsWith("-") || str.startsWith("+")) str = str.substring(1);

    // NaN: input is not a valid decimal number
    if (!/^\d*\.?\d*$/.test(str) || str === "" || str === ".") {
      const result = signBit + "11111" + "1" + "0".repeat(57);
      setBinary(formatBinarySpaced(result));
      setHex(binaryToHex(result));
      setSpecialCase("NaN — input is not a valid number");
      setIsComputed(true);
      return;
    }

    // 2. Extract Coefficient and Exponent
    const [intPart = "0", fracPart = ""] = str.split(".");
    let coeffStr = (intPart + fracPart).replace(/^0+/, "") || "0";
    let exponent = -fracPart.length + (parseInt(exponentInput) || 0);

    // Decimal64 is strictly 16 digits. (A true lib rounds; we will truncate and adjust exponent)
    if (coeffStr.length > 16) {
      exponent += coeffStr.length - 16;
      coeffStr = coeffStr.substring(0, 16);
    }

    // Pad to exactly 16 digits so we can split it into DPD groups
    const coeff16 = coeffStr.padStart(16, "0");
    const E = exponent + 398; // Exponent Bias for Decimal64

    // Overflow: biased exponent exceeds Elimit (767) → Infinity
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

    // Underflow: biased exponent below 0 → rounds to ±0
    if (E < 0) {
      const result = signBit + "01000" + "10001110" + "0".repeat(50);
      setBinary(formatBinarySpaced(result));
      setHex(binaryToHex(result));
      setSpecialCase("Underflow — value rounds to ±0");
      setIsComputed(true);
      return;
    }

    // 3. Convert Exponent to 10-bit binary
    const E_bin = Math.max(0, E).toString(2).padStart(10, "0");
    const E_top2 = E_bin.substring(0, 2);
    const E_cont8 = E_bin.substring(2);

    // 4. Calculate 5-bit Combination Field using the Most Significant Digit (d0)
    const d0 = parseInt(coeff16[0], 10);
    const d0_bin = d0.toString(2).padStart(4, "0");

    let comb;
    if (d0 < 8) {
      // If first digit is 0-7: Exponent MSBs + d0(BCD tail)
      comb = E_top2 + d0_bin.substring(1, 4);
    } else {
      // If first digit is 8-9: 11 + Exponent MSBs + d0(BCD LSB)
      comb = "11" + E_top2 + d0_bin[3];
    }

    // 5. Encode the remaining 15 digits into 50 bits (Five 10-bit DPD groups)
    let coeff_cont50 = "";
    for (let i = 1; i < 16; i += 3) {
      coeff_cont50 += encodeDPD(coeff16[i], coeff16[i + 1], coeff16[i + 2]);
    }

    // 6. Assemble and update state
    const result = signBit + comb + E_cont8 + coeff_cont50;

    setBinary(formatBinarySpaced(result));
    setHex(binaryToHex(result));
    setSpecialCase("");
    setIsComputed(true);
  }

  function formatBinarySpaced(bin: string): string {
    const sign = bin[0];
    const comb = bin.substring(1, 6);
    const expCont = bin.substring(6, 14);
    const dpdGroups = [];
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

  return (
    <>
      <InputWindow
        setDecimal={setDecimal}
        setExponentInput={setExponentInput}
        compute={compute}
      />
      {isComputed && (
        <ResultWindow binary={binary} hex={hex} specialCase={specialCase} />
      )}
    </>
  );
}

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
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <label htmlFor="decimal">Decimal:</label>
        <input
          className="border border-gray-300 rounded-md px-2 ml-2"
          type="string"
          id="decimal"
          onChange={(e) => {
            setDecimal(e.target.value);
          }}
        ></input>
        <span className="ml-2">× 10^</span>
        <input
          className="border border-gray-300 rounded-md px-2 w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          type="number"
          id="exponent"
          placeholder="0"
          onChange={(e) => {
            setExponentInput(e.target.value);
          }}
        />
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-4"
        onClick={() => {
          compute();
        }}
      >
        Convert
      </button>
    </div>
  );
}

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
    <div className="flex flex-col items-center mt-6 w-full max-w-2xl">
      {specialCase && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4 w-full text-center font-semibold">
          Special Case:
          <span className="font-normal"> {specialCase} </span>
        </div>
      )}
      <div className="w-full mb-3">
        <label className="font-semibold text-sm text-gray-600">
          Binary{" "}
          <span className="font-normal italic">
            (sign | combination | continuation | coefficient DPD)
          </span>
          :
        </label>
        <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
          {binary}
        </p>
      </div>
      <div className="w-full mb-3">
        <label className="font-semibold text-sm text-gray-600">
          Hexadecimal:
        </label>
        <p className="font-mono text-sm bg-gray-100 p-3 rounded mt-1">
          0x{hex}
        </p>
      </div>
    </div>
  );
}

export default ConvertWindow;

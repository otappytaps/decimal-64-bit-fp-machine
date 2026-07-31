import { useState } from "react";
import {
  type Step,
  parseOperand,
  performSubtraction,
  performDivision,
  encodeBinary64,
  formatBinarySpaced,
  binaryToHex,
  toSciNotation,
} from "./arithmetic";

interface ArithResult {
  steps: Step[];
  decimalStr: string;
  binaryStr: string;
  hexStr: string;
  specialCase: string;
}

function ArithmeticWindow() {
  const [inputFormat, setInputFormat] = useState<"decimal" | "hex">("decimal");
  const [operandA, setOperandA] = useState("");
  const [operandB, setOperandB] = useState("");
  const [operation, setOperation] = useState<"subtraction" | "division">(
    "subtraction"
  );
  const [result, setResult] = useState<ArithResult | null>(null);
  const [error, setError] = useState("");

  // ── Compute ──────────────────────────────────────────────
  function compute() {
    setError("");
    setResult(null);

    const a = parseOperand(operandA, inputFormat);
    const b = parseOperand(operandB, inputFormat);

    if (a.error) { setError(`Operand A: ${a.error}`); return; }
    if (b.error) { setError(`Operand B: ${b.error}`); return; }

    let specialCase = "";
    let allSteps: Step[] = [];
    let finalSign = 0, finalCoeff = "0000000000000000", finalExp = 0;

    // ── Special cases: NaN / Infinity ──────────────────────
    if (a.isNaN || b.isNaN) {
      specialCase = "NaN — one or both operands is NaN";
      allSteps = [{ label: "Special Case — NaN", detail: specialCase }];

    } else if (a.isInfinity || b.isInfinity) {
      if (operation === "subtraction") {
        if (a.isInfinity && b.isInfinity) {
          specialCase = "NaN — ∞ − ∞ is undefined";
          allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
        } else if (a.isInfinity) {
          specialCase = `${a.sign ? "−" : "+"}∞`;
          finalSign = a.sign;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        } else {
          // Only B is infinity; negating B flips its sign
          specialCase = `${b.sign ? "+" : "−"}∞ (negating B which is Infinity)`;
          finalSign = b.sign ^ 1;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        }
      } else {
        // Division
        if (a.isInfinity && b.isInfinity) {
          specialCase = "NaN — ∞ ÷ ∞ is undefined";
          allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
        } else if (a.isInfinity) {
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}∞`;
          finalSign = a.sign ^ b.sign;
          allSteps = [{ label: "Special Case — Infinity", detail: `Result = ${specialCase}` }];
        } else {
          // Finite ÷ Infinity = ±0
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}0 (finite ÷ ∞)`;
          finalSign = a.sign ^ b.sign;
          allSteps = [{ label: "Special Case — Zero", detail: `Result = ${specialCase}` }];
        }
      }

    } else {
      // ── Normal arithmetic ─────────────────────────────────
      const out =
        operation === "subtraction"
          ? performSubtraction(a.sign, a.coeff, a.exp, b.sign, b.coeff, b.exp)
          : performDivision(a.sign, a.coeff, a.exp, b.sign, b.coeff, b.exp);

      allSteps = out.steps;
      specialCase = out.specialCase;
      finalSign = out.finalSign;
      finalCoeff = out.finalCoeff;
      finalExp = out.finalExp;
    }

    // ── Build IEEE 754 encoding ───────────────────────────
    let binResult: string;
    let hexResult: string;
    let decimalDisplay: string;

    if (specialCase.includes("NaN")) {
      // Quiet NaN encoding: sign + 11111 + 1 + 57 zeros
      binResult = `${finalSign}11111` + "1" + "0".repeat(57);
      hexResult = binaryToHex(binResult);
      decimalDisplay = "NaN";

    } else if (specialCase.includes("∞")) {
      // Infinity encoding: sign + 11110 + 58 zeros
      binResult = `${finalSign}11110` + "0".repeat(58);
      hexResult = binaryToHex(binResult);
      decimalDisplay = specialCase.includes("−") ? "-Infinity" : "+Infinity";

    } else {
      const coeff16 = finalCoeff.padStart(16, "0").substring(0, 16);
      const enc = encodeBinary64(finalSign, finalExp, coeff16);
      binResult = enc.bin;

      if (enc.isOverflow) {
        specialCase = specialCase || (finalSign ? "−∞ (overflow)" : "+∞ (overflow)");
        decimalDisplay = finalSign ? "-Infinity" : "+Infinity";
      } else if (enc.isUnderflow) {
        specialCase = specialCase || "Underflow → ±0";
        decimalDisplay = "0";
      } else {
        decimalDisplay = toSciNotation(finalSign, finalCoeff, finalExp);
      }

      hexResult = binaryToHex(binResult);
    }

    setResult({
      steps: allSteps,
      decimalStr: decimalDisplay,
      binaryStr: formatBinarySpaced(binResult),
      hexStr: hexResult,
      specialCase,
    });
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-2xl bg-sky-200 border border-sky-400 text-sky-800 px-4 py-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">GRS Arithmetic Operations</h2>

      {/* ── Input controls ── */}
      <div className="flex flex-col gap-4 w-full">

        {/* Input format */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithFormat" className="font-semibold text-sm w-36">
            Input Format:
          </label>
          <select
            id="arithFormat"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1"
            value={inputFormat}
            onChange={(e) => setInputFormat(e.target.value as "decimal" | "hex")}
          >
            <option value="decimal">Decimal</option>
            <option value="hex">IEEE Hexadecimal</option>
          </select>
        </div>

        {/* Operation */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithOp" className="font-semibold text-sm w-36">
            Operation:
          </label>
          <select
            id="arithOp"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1"
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as "subtraction" | "division")
            }
          >
            <option value="subtraction">Subtraction (A − B)</option>
            <option value="division">Division (A ÷ B)</option>
          </select>
        </div>

        {/* Operand A */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithA" className="font-semibold text-sm w-36">
            Operand A:
          </label>
          <input
            id="arithA"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 font-mono text-sm"
            type="text"
            placeholder={
              inputFormat === "decimal"
                ? "e.g. 123457.1467 or -1.23e5"
                : "e.g. 22400DE0D7EB6E40"
            }
            value={operandA}
            onChange={(e) => setOperandA(e.target.value)}
          />
        </div>

        {/* Operand B */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithB" className="font-semibold text-sm w-36">
            Operand B:
          </label>
          <input
            id="arithB"
            className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 font-mono text-sm"
            type="text"
            placeholder={
              inputFormat === "decimal"
                ? "e.g. 123456.659 or 5.67e2"
                : "e.g. 2238000000000000"
            }
            value={operandB}
            onChange={(e) => setOperandB(e.target.value)}
          />
        </div>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-2 self-center"
          onClick={compute}
        >
          Compute
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mt-4 w-full text-center font-semibold">
          Error:{" "}
          <span className="font-normal">{error}</span>
        </div>
      )}

      {/* ── Result panel ── */}
      {result && (
        <div className="flex flex-col items-center mt-4 w-full">

          {/* Special case banner */}
          {result.specialCase && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4 w-full text-center font-semibold">
              Special Case:{" "}
              <span className="font-normal">{result.specialCase}</span>
            </div>
          )}

          {/* Step-by-step */}
          <div className="w-full mb-4">
            <p className="font-semibold text-sm mb-2">Step-by-Step Solution:</p>
            <div className="flex flex-col gap-2">
              {result.steps.map((step, idx) => (
                <div key={idx} className="bg-gray-100 rounded p-3">
                  <p className="font-semibold text-xs text-sky-700 mb-1">
                    {step.label}
                  </p>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all text-gray-800">
                    {step.detail}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Final decimal result */}
          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Decimal:
            </label>
            <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
              {result.decimalStr}
            </p>
          </div>

          {/* Final binary result */}
          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Binary{" "}
              <span className="font-normal italic">
                (sign | combination | exp continuation | coefficient DPD groups)
              </span>
              :
            </label>
            <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
              {result.binaryStr}
            </p>
          </div>

          {/* Final hex result */}
          <div className="w-full mb-3">
            <label className="font-semibold text-sm">
              Final Result — Hexadecimal:
            </label>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded mt-1">
              0x{result.hexStr}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

export default ArithmeticWindow;

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
    "subtraction",
  );
  const [result, setResult] = useState<ArithResult | null>(null);
  const [error, setError] = useState("");
  // ── Compute ──────────────────────────────────────────────
  function compute() {
    // If both operands are blank, do nothing (no calculation)
    if (operandA.trim() === "" && operandB.trim() === "") {
      return; // Exit early – nothing to compute
    }

    // existing validation and processing logic follows...

    const a = parseOperand(operandA, inputFormat);
    const b = parseOperand(operandB, inputFormat);

    if (a.error) {
      setError(`Operand A: ${a.error}`);
      return;
    }
    if (b.error) {
      setError(`Operand B: ${b.error}`);
      return;
    }

    let specialCase = "";
    let allSteps: Step[] = [];
    let finalSign = 0,
      finalCoeff = "0000000000000000",
      finalExp = 0;

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
          allSteps = [
            {
              label: "Special Case — Infinity",
              detail: `Result = ${specialCase}`,
            },
          ];
        } else {
          // Only B is infinity; negating B flips its sign
          specialCase = `${b.sign ? "+" : "−"}∞ (negating B which is Infinity)`;
          finalSign = b.sign ^ 1;
          allSteps = [
            {
              label: "Special Case — Infinity",
              detail: `Result = ${specialCase}`,
            },
          ];
        }
      } else {
        // Division
        if (a.isInfinity && b.isInfinity) {
          specialCase = "NaN — ∞ ÷ ∞ is undefined";
          allSteps = [{ label: "Special Case — NaN", detail: specialCase }];
        } else if (a.isInfinity) {
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}∞`;
          finalSign = a.sign ^ b.sign;
          allSteps = [
            {
              label: "Special Case — Infinity",
              detail: `Result = ${specialCase}`,
            },
          ];
        } else {
          // Finite ÷ Infinity = ±0
          specialCase = `${a.sign ^ b.sign ? "−" : "+"}0 (finite ÷ ∞)`;
          finalSign = a.sign ^ b.sign;
          allSteps = [
            { label: "Special Case — Zero", detail: `Result = ${specialCase}` },
          ];
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
        specialCase =
          specialCase || (finalSign ? "−∞ (overflow)" : "+∞ (overflow)");
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
    <div className="cyber-panel flex flex-col items-center mt-8 w-full max-w-2xl">
      <h2 className="cyber-panel-title">GRS Arithmetic Operations</h2>

      {/* Input controls */}
      <div className="flex flex-col gap-4 w-full">
        {/* Input format */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithFormat" className="cyber-label-form">
            Input Format:
          </label>
          <select
            id="arithFormat"
            className="cyber-input"
            value={inputFormat}
            onChange={(e) =>
              setInputFormat(e.target.value as "decimal" | "hex")
            }
          >
            <option value="decimal">Decimal</option>
            <option value="hex">Hexadecimal</option>
          </select>
        </div>

        {/* Operation */}
        <div className="flex items-center gap-2">
          <label htmlFor="arithOp" className="cyber-label-form">
            Operation:
          </label>
          <select
            id="arithOp"
            className="cyber-input"
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
          <label htmlFor="arithA" className="cyber-label-form">
            Operand A:
          </label>
          <input
            id="arithA"
            className="cyber-input font-mono"
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
          <label htmlFor="arithB" className="cyber-label-form">
            Operand B:
          </label>
          <input
            id="arithB"
            className="cyber-input font-mono"
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

        <button className="cyber-button mt-1 mb-6" onClick={compute}>
          Compute
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="cyber-alert mt-4 mb-4 w-full">
          <span className="font-bold text-pink-400 mr-2">⚠ ERROR:</span>
          {error}
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className="flex flex-col items-center mt-6">
          {/* Special case banner */}
          {result.specialCase && (
            <div className="cyber-alert mt-4 mb-4 w-full">
              <span className="font-bold text-pink-400 mr-2">
                ⚠ SPECIAL CASE:
              </span>
              {result.specialCase}
            </div>
          )}

          {/* Step-by-step solution */}
          <div className="w-full mb-4">
            <p className="cyber-label">Step-by-Step Solution:</p>
            <div className="flex flex-col gap-2">
              {result.steps.map((step, idx) => (
                <div key={idx} className="cyber-alert py-2 px-3">
                  <p className="font-medium text-xs text-purple-300 mr-2">
                    Step {idx + 1}:
                  </p>
                  <pre className="text-xs whitespace-pre-wrap mb-1">
                    {step.label}
                  </pre>
                  <pre className="text-xs font-mono">{step.detail}</pre>
                </div>
              ))}
            </div>
          </div>

          {/* Final decimal result */}
          <div className="w-full mb-4">
            <div className="cyber-label">Final Result — Decimal:</div>
            <p className="cyber-mono break-all font-mono text-sm">
              {result.decimalStr}
            </p>
          </div>

          {/* Final binary result */}
          <div className="w-full mb-4">
            <div className="cyber-label">
              Final Result — Binary{" "}
              <span className="text-xs opacity-50 tracking-wider">
                (sign | combination | exp continuation | coefficient DPD groups)
              </span>
              :
            </div>
            <p className="cyber-mono break-all font-mono text-sm">
              {result.binaryStr}
            </p>
          </div>

          {/* Final hex result */}
          <div className="w-full mb-4">
            <div className="cyber-label">Final Result — Hexadecimal:</div>
            <p className="cyber-mono font-mono text-sm">0x{result.hexStr}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArithmeticWindow;

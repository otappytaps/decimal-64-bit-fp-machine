// RoundingWindow.tsx
// Overview:
// Component implementing four decimal rounding methods (chopping, round up, round down, and round to nearest ties to even)
// Supports both decimal and binary input formats with target digit specification.

import { useState } from "react";

function RoundingWindow() {
  const [inputValue, setInputValue] = useState("");
  const [inputFormat, setInputFormat] = useState<"decimal" | "binary">(
    "decimal",
  );
  const [targetDigits, setTargetDigits] = useState("");
  const [choppedValue, setChoppedValue] = useState("");
  const [roundUpValue, setRoundUpValue] = useState("");
  const [roundDownValue, setRoundDownValue] = useState("");
  const [roundNTEValue, setRoundNTEValue] = useState("");
  const [isComputed, setIsComputed] = useState(false);
  const [isError, setError] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Parse binary string to decimal number (handles sign and fractional parts)
  function parseBinaryToDecimal(binStr: string) {
    if (!binStr) return 0;

    const isNegative = binStr.startsWith("-");
    const cleanStr = isNegative ? binStr.slice(1) : binStr;
    const [intPart, fracPart = ""] = cleanStr.split(".");

    let num = parseInt(intPart || "0", 2);

    // Add fractional binary bits (1/2, 1/4, 1/8, etc.)
    for (let i = 0; i < fracPart.length; i++) {
      if (fracPart[i] === "1") {
        num += Math.pow(2, -(i + 1));
      }
    }

    return isNegative ? -num : num;
  }

  // Converts a shifted integer back to binary string with proper decimal placement
  function formatShiftedIntToBinary(intVal: number, digits: number) {
    if (digits <= 0) return intVal.toString(2);

    let binStr = Math.abs(intVal).toString(2);

    // Pad with leading zeros if the number is smaller than the decimal shift
    while (binStr.length <= digits) {
      binStr = "0" + binStr;
    }

    // Insert the decimal point at the correct position
    const insertPos = binStr.length - digits;
    const result = binStr.slice(0, insertPos) + "." + binStr.slice(insertPos);

    return intVal < 0 ? "-" + result : result;
  }

  // Compute chopped value (truncation without rounding)
  function computeChopped() {
    const index = inputValue.indexOf(".");

    if (index === -1) {
      setChoppedValue(inputValue);
      return;
    }

    const digits = parseInt(targetDigits, 10) || 0;
    const chopped =
      digits > 0
        ? inputValue.slice(0, index + 1 + digits)
        : inputValue.slice(0, index);

    setChoppedValue(chopped);
  }

  // Check if input is a valid binary string (optional sign, integer and fractional parts)
  function isBinary(str: string) {
    const binaryRegex = /^-?[01]+(\.[01]+)?$/;
    return binaryRegex.test(str);
  }

  // Compute round up value (ceiling)
  function computeRoundUp() {
    if (inputFormat === "binary") {
      const num = parseBinaryToDecimal(inputValue);
      const shifted = num * Math.pow(2, Number(targetDigits)); // Shift binary point right
      const ceil = Math.ceil(shifted);
      setRoundUpValue(formatShiftedIntToBinary(ceil, Number(targetDigits))); // Shift back & format
      return;
    }
    const string = inputValue + "e" + targetDigits;
    const ceil = Math.ceil(Number(string));
    const result = Number(ceil + "e-" + targetDigits);
    setRoundUpValue(String(result));
  }

  // Compute round down value (floor)
  function computeRoundDown() {
    if (inputFormat === "binary") {
      const num = parseBinaryToDecimal(inputValue);
      const shifted = num * Math.pow(2, Number(targetDigits));
      const floor = Math.floor(shifted);
      setRoundDownValue(formatShiftedIntToBinary(floor, Number(targetDigits)));
      return;
    }
    const string = inputValue + "e" + targetDigits;
    const floor = Math.floor(Number(string));
    const result = Number(floor + "e-" + targetDigits);
    setRoundDownValue(String(result));
  }

  // Compute round-to-nearest, ties to even value
  function computeRoundNTE() {
    if (inputFormat === "binary") {
      const num = parseBinaryToDecimal(inputValue);
      const shifted = num * Math.pow(2, Number(targetDigits));
      let roundedInt;

      // Check for an exact tie (ends in precisely .5 in base-10)
      if (Math.abs(shifted % 1) === 0.5) {
        const floor = Math.floor(shifted);
        const ceil = Math.ceil(shifted);
        // "Even" in binary means the last bit is 0, which means the integer is divisible by 2!
        roundedInt = floor % 2 === 0 ? floor : ceil;
      } else {
        roundedInt = Math.round(shifted);
      }

      setRoundNTEValue(
        formatShiftedIntToBinary(roundedInt, Number(targetDigits)),
      );
      return;
    }
    const string = inputValue + "e" + targetDigits;
    const num = Number(string);
    let roundedInt;

    if (Math.abs(num % 1) === 0.5) {
      const floor = Math.floor(num);
      const ceil = Math.ceil(num);

      roundedInt = floor % 2 === 0 ? floor : ceil;
    } else {
      roundedInt = Math.round(num);
    }

    const result = Number(roundedInt + "e-" + targetDigits);
    setRoundNTEValue(String(result));
  }

  // Main compute handler with comprehensive input validation
  function compute() {
    // If all inputs are blank, do nothing (no calculation, no error)
    if (inputValue === "" && targetDigits === "") {
      return;
    }

    if (
      targetDigits === "" ||
      !Number.isInteger(Number(targetDigits)) ||
      Number(targetDigits) < 0
    ) {
      setError(true);
      setErrorText("Invalid Target Digits — must be a non-negative integer.");
      setIsComputed(false);
      return;
    }

    if (inputValue === "") {
      setError(true);
      setErrorText("Invalid Input Value — must not be empty.");
      setIsComputed(false);
      return;
    }

    if (inputFormat === "binary") {
      if (!isBinary(inputValue)) {
        setError(true);
        setErrorText("Invalid Input Format — must be binary.");
        setIsComputed(false);
        return;
      }
    }

    const index = inputValue.indexOf(".");
    if (index !== -1) {
      const digits = inputValue.substring(index + 1).length;
      if (digits < Number(targetDigits)) {
        setError(true);
        setErrorText(
          "Invalid Target Digits — must be less than or equal to the number of digits after the decimal point.",
        );
        setIsComputed(false);
        return;
      }
    }

    setError(false);
    computeChopped();
    computeRoundUp();
    computeRoundDown();
    computeRoundNTE();
    setIsComputed(true);
  }

  // Render component UI
  return (
    <div className="cyber-panel flex flex-col items-center w-full max-w-3xl mx-auto">
      <h2 className="cyber-panel-title">
        Rounding Methods
      </h2>
      <InputWindow
        inputFormat={inputFormat}
        setInputFormat={setInputFormat}
        inputValue={inputValue}
        setInputValue={setInputValue}
        targetDigits={targetDigits}
        setTargetDigits={setTargetDigits}
        compute={compute}
      />
      {isError && <ErrorMsg errorText={errorText} />}
      {isComputed && (
        <ResultWindow
          choppedValue={choppedValue}
          roundUpValue={roundUpValue}
          roundDownValue={roundDownValue}
          roundNTEValue={roundNTEValue}
        />
      )}
    </div>
  );
}

// Input form component for rounding parameters
function InputWindow({
  inputFormat,
  setInputFormat,
  inputValue,
  setInputValue,
  targetDigits,
  setTargetDigits,
  compute,
}: {
  inputFormat: "decimal" | "binary";
  setInputFormat: (format: "decimal" | "binary") => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  targetDigits: string;
  setTargetDigits: (digits: string) => void;
  compute: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Format selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="roundFormat" className="cyber-label w-32">
          Input Format:
        </label>
        <select
          id="roundFormat"
          className="cyber-input flex-1"
          value={inputFormat}
          onChange={(e) =>
            setInputFormat(e.target.value as "decimal" | "binary")
          }
        >
          <option value="decimal">Decimal</option>
          <option value="binary">Binary</option>
        </select>
      </div>

      {/* Number input */}
      <div className="flex items-center gap-2">
        <label htmlFor="roundInput" className="cyber-label w-32">
          Number:
        </label>
        <input
          id="roundInput"
          className="cyber-input flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          type="number"
          placeholder={
            inputFormat === "decimal" ? "e.g. 3.14159" : "e.g. 1101.0101"
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {/* Target digits */}
      <div className="flex items-center gap-2">
        <label htmlFor="targetDigits" className="cyber-label w-32">
          Target Digits:
        </label>
        <input
          id="targetDigits"
          className="cyber-input flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          type="number"
          min="1"
          placeholder="Number of digits to round to"
          value={targetDigits}
          onChange={(e) => setTargetDigits(e.target.value)}
        />
      </div>

      <button
        className="cyber-button mb-6 self-center"
        onClick={() => {
          compute();
        }}
      >
        Round
      </button>
    </div>
  );
}

// Result display component showing all four rounding methods
function ResultWindow({
  choppedValue,
  roundUpValue,
  roundDownValue,
  roundNTEValue,
}: {
  choppedValue: string;
  roundUpValue: string;
  roundDownValue: string;
  roundNTEValue: string;
}) {
  return (
    <div className="flex flex-col items-center mt-6 w-full">
      {/* Chopped result */}
      <div className="w-full mb-4">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-cyan-400">Chopped:</span>
        </label>
        <pre className="cyber-mono break-all font-bold text-cyan-300/80 text-xs">
          {choppedValue}
        </pre>
      </div>

      {/* Rounded up result */}
      <div className="w-full mb-3">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-pink-400">Rounded Up:</span>
        </label>
        <pre className="cyber-mono break-all font-bold text-pink-300/80 text-xs">
          {roundUpValue}
        </pre>
      </div>

      {/* Rounded down result */}
      <div className="w-full mb-3">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-purple-400">Rounded Down:</span>
        </label>
        <pre className="cyber-mono break-all font-bold text-purple-300/80 text-xs">
          {roundDownValue}
        </pre>
      </div>

      {/* Rounded to nearest, ties to even result */}
      <div className="w-full mb-3">
        <label className="cyber-label flex items-center gap-2">
          <span className="text-emerald-400">
            Rounded to Nearest Ties to Even:
          </span>
        </label>
        <pre className="cyber-mono break-all font-bold text-emerald-300/80 text-xs">
          {roundNTEValue}
        </pre>
      </div>
    </div>
  );
}

// Error display component
function ErrorMsg({ errorText }: { errorText: string }) {
  return (
    <div className="cyber-alert mt-4 mb-4 w-full">
      <span className="font-bold text-pink-400 mr-2">⚠ ERROR:</span>
      {errorText}
    </div>
  );
}

export default RoundingWindow;
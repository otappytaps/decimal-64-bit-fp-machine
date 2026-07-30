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

  function parseBinaryToDecimal(binStr: string) {
    if (!binStr) return 0;

    const isNegative = binStr.startsWith("-");
    const cleanStr = isNegative ? binStr.slice(1) : binStr;
    const [intPart, fracPart = ""] = cleanStr.split(".");

    let num = parseInt(intPart || "0", 2);

    // Add fractional bits (1/2, 1/4, 1/8, etc.)
    for (let i = 0; i < fracPart.length; i++) {
      if (fracPart[i] === "1") {
        num += Math.pow(2, -(i + 1));
      }
    }

    return isNegative ? -num : num;
  }

  // Converts a shifted integer like 12 back to "110.0" (if shifted by 1)
  function formatShiftedIntToBinary(intVal: number, digits: number) {
    if (digits <= 0) return intVal.toString(2);

    let binStr = Math.abs(intVal).toString(2);

    // Pad with leading zeros if the number is smaller than the decimal shift
    while (binStr.length <= digits) {
      binStr = "0" + binStr;
    }

    // Insert the dot
    const insertPos = binStr.length - digits;
    const result = binStr.slice(0, insertPos) + "." + binStr.slice(insertPos);

    return intVal < 0 ? "-" + result : result;
  }
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

  function isBinary(str: string) {
    const binaryRegex = /^-?[01]+(\.[01]+)?$/;
    return binaryRegex.test(str);
  }
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

  function compute() {
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

  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-2xl bg-sky-200 border border-sky-400 text-sky-800 px-4 py-4 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Rounding Methods</h2>
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
      <div className="flex items-center gap-2">
        <label htmlFor="roundFormat" className="font-semibold text-sm w-32">
          Input Format:
        </label>
        <select
          id="roundFormat"
          className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1"
          value={inputFormat}
          onChange={(e) =>
            setInputFormat(e.target.value as "decimal" | "binary")
          }
        >
          <option value="decimal">Decimal</option>
          <option value="binary">Binary</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="roundInput" className="font-semibold text-sm w-32">
          Number:
        </label>
        <input
          id="roundInput"
          className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          type="number"
          placeholder={
            inputFormat === "decimal" ? "e.g. 3.14159" : "e.g. 1101.0101"
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="targetDigits" className="font-semibold text-sm w-32">
          Target Digits:
        </label>
        <input
          id="targetDigits"
          className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1 flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          type="number"
          min="1"
          placeholder="Number of digits to round to"
          value={targetDigits}
          onChange={(e) => setTargetDigits(e.target.value)}
        />
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt-2 self-center"
        onClick={() => {
          compute();
        }}
      >
        Round
      </button>
    </div>
  );
}

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
    <div className="flex flex-col items-center mt-4 w-full max-w-2xl">
      <div className="w-full mb-3">
        <label className="font-semibold text-sm ">Chopped:</label>
        <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
          {choppedValue}
        </p>
      </div>
      <div className="w-full mb-3">
        <label className="font-semibold text-sm ">Rounded Up:</label>
        <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
          {roundUpValue}
        </p>
      </div>
      <div className="w-full mb-3">
        <label className="font-semibold text-sm ">Rounded Down:</label>
        <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
          {roundDownValue}
        </p>
      </div>
      <div className="w-full mb-3">
        <label className="font-semibold text-sm ">
          Rounded to Nearest Ties to Even:
        </label>
        <p className="font-mono text-sm break-all bg-gray-100 p-3 rounded mt-1">
          {roundNTEValue}
        </p>
      </div>
    </div>
  );
}

function ErrorMsg({ errorText }: { errorText: string }) {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mt-4  w-full text-center font-semibold">
      Error: <span className="font-normal">{errorText}</span>
    </div>
  );
}
export default RoundingWindow;

import { useState } from "react";

function RoundingWindow() {
  const [inputValue, setInputValue] = useState("");
  const [inputFormat, setInputFormat] = useState<"decimal" | "binary">(
    "decimal",
  );
  const [targetDigits, setTargetDigits] = useState("");

  return (
    <div className="flex flex-col items-center mt-8 w-full max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Rounding Methods</h2>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
          <label
            htmlFor="roundFormat"
            className="font-semibold text-sm text-gray-600 w-32"
          >
            Input Format:
          </label>
          <select
            id="roundFormat"
            className="border border-gray-300 rounded-md px-2 py-1 flex-1"
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
          <label
            htmlFor="roundInput"
            className="font-semibold text-sm text-gray-600 w-32"
          >
            Number:
          </label>
          <input
            id="roundInput"
            className="border border-gray-300 rounded-md px-2 py-1 flex-1"
            type="text"
            placeholder={
              inputFormat === "decimal" ? "e.g. 3.14159" : "e.g. 1101.0101"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="targetDigits"
            className="font-semibold text-sm text-gray-600 w-32"
          >
            Target Digits:
          </label>
          <input
            id="targetDigits"
            className="border border-gray-300 rounded-md px-2 py-1 flex-1"
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
            // TODO: Implement rounding methods (chopping, round-up, round-down, round-to-nearest ties-to-even)
            console.log("Round:", inputFormat, inputValue, targetDigits);
          }}
        >
          Round
        </button>
      </div>
    </div>
  );
}

export default RoundingWindow;

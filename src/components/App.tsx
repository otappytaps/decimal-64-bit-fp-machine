// App.tsx
// Overview:
// Main application container that orchestrates the three primary components:
// Decimal64 converter, arithmetic operations, and rounding methods.
// Features a cyberpunk-themed layout with ambient background gradients.

import Banner from "./Banner.tsx";
import ConvertWindow from "./ConvertWindow.tsx";
import RoundingWindow from "./RoundingWindow.tsx";
import ArithmeticWindow from "./ArithmeticWindow.tsx";

// Root application component
function App() {
  return (
    <div className="relative min-h-screen flex flex-col items-center p-4 md:p-8 gap-8">
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[-1]"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(169, 54, 206, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(0, 243, 255, 0.08), transparent)
          `
        }}
      />

      <Banner />

      <main className="w-full max-w-4xl flex flex-col items-center gap-6">
        <ConvertWindow />
        <RoundingWindow />
        <ArithmeticWindow />
      </main>

      {/* Footer with system info */}
      <footer className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 text-xs text-cyan-400/40 font-mono pointer-events-none">
        <span>SYSTEM: DECIMAL64-FP v1.0.0</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          ONLINE
        </span>
      </footer>
    </div>
  );
}

export default App;
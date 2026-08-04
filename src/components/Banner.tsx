// Banner.tsx
// Overview:
// Header component displaying the project title and tagline.
// Features a circuit board background pattern and cyberpunk gradient styling.

// Header component with project title and tagline
function Banner() {
  return (
    <div className="relative flex flex-col items-center mt-6 mb-8">
      {/* Circuit board pattern overlay */}
      <div
        data-circuit-background
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      />

      {/* Title with cyberpunk glow effect */}
      <h1 className="relative text-4xl md:text-5xl font-extrabold tracking-wider">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_15px_rgba(169,54,206,0.5)]">
          Decimal 64-bit
        </span>
        <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]">
          Floating-Point Machine
        </span>
        {/* Glowing scan line accent */}
        <div className="absolute -inset-x-1 -bottom-2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 blur-sm" />
      </h1>

      {/* Project tagline */}
      <p className="relative mt-3 text-sm text-cyan-300/70 font-mono tracking-widest">
        <span className="text-pink-400/80"></span>{"\y> "} IEEE 754-2008 Decimal64 Encoding &amp; Arithmetic
      </p>
    </div>
  );
}

export default Banner;
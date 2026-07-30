import Banner from "./Banner.tsx";
import ConvertWindow from "./ConvertWindow.tsx";
import RoundingWindow from "./RoundingWindow.tsx";

function App() {
  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <Banner />
      <ConvertWindow />
      <hr className="w-full max-w-2xl border-gray-300 my-8" />
      <RoundingWindow />
    </div>
  );
}

export default App;

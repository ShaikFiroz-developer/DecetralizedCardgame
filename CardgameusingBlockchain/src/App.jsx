import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import PlayerComponent from "./components/playerboard";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <PlayerComponent />
    </>
  );
}

export default App;

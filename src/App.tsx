import { GridExport } from "./components/GridExport";
import { SplashScreen } from "./components/SplashScreen";

const isGridExport =
  new URLSearchParams(window.location.search).get("export") === "grid";

export default function App() {
  return isGridExport ? <GridExport /> : <SplashScreen />;
}

import WaypointSelectionToggleButton from "@src/components/WaypointSelectionToggleButton";
import WaypointSelectionClearButton from "./WaypointSelectionClearButton";
import { useAppContext } from "@src/AppContext";
import BuildDiagramButton from "./BuildDiagramButton";

export default function Header() {
  const { waypointsVector } = useAppContext();

  return (
    <header className="w-full h-[10%] bg-amber-300 shadow-md">
      <div className="mx-auto container flex items-center justify-between py-2 px-4">
        <h1 className="text-xl font-bold text-gray-800">Traffic Lights Flow</h1>
        <nav className="flex space-x-4">
          <WaypointSelectionToggleButton />
          <WaypointSelectionClearButton />
          {waypointsVector.length >= 2 && <BuildDiagramButton />}
        </nav>
      </div>
    </header>
  );
}

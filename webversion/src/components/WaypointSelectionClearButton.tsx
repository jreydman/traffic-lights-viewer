import { useAppContext } from "@src/AppContext";

export default function WaypointSelectionClearButton() {
  const { waypointsVector, setWaypointsVector } = useAppContext();

  return (
    <button
      className={`transition-all px-4 py-2 rounded-xl shadow-sm bg-blue-100 hover:bg-blue-300`}
      disabled={waypointsVector.length == 0}
      onClick={() => setWaypointsVector([])}
    >
      Clear waypoints
    </button>
  );
}

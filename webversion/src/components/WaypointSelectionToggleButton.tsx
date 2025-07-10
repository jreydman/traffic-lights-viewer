import { useAppContext } from "@src/AppContext";

export default function WaypointSelectionToggleButton() {
  const { mapWaypointSelection, toggleMapWaypointSelection } = useAppContext();

  const notSelectedClassName = "bg-blue-100 hover:bg-blue-300";
  const selectedClassName = "bg-red-100 hover:bg-red-300";

  return (
    <button
      className={`transition-all px-4 py-2 rounded-xl shadow-sm ${mapWaypointSelection ? selectedClassName : notSelectedClassName}`}
      onClick={() => toggleMapWaypointSelection()}
    >
      {mapWaypointSelection ? "Stop selection" : "Select waypoints"}
    </button>
  );
}

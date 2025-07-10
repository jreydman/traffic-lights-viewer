import { useAppContext } from "@src/AppContext";

export default function BuildDiagramButton() {
  const { toggleDiagramVisibility } = useAppContext();

  return (
    <button
      className={`transition-all px-4 py-2 rounded-xl shadow-sm bg-blue-100 hover:bg-blue-300`}
      onClick={toggleDiagramVisibility}
    >
      Build diagram
    </button>
  );
}

import { useAppContext } from "@src/AppContext";
import Map from "@src/components/Map";
import Diagram from "@src/components/Diagram";

export default function Main() {
  const { diagramVisibility } = useAppContext();
  return (
    <main className="container my-2 h-[90%]">
      <section className="overflow-y-scroll h-full">
        {diagramVisibility ? <Diagram /> : <Map />}
      </section>
    </main>
  );
}

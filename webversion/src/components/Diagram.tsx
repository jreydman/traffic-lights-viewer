import { useAppContext } from "@src/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PhaseColor = "red" | "yellow" | "green";

type Phase = {
  color: PhaseColor;
  duration: number;
};

type DiagramItem = {
  name: string;
  type: "start" | "road" | "signal" | "end";
  length?: number; // sector length (meters)
  duration?: number;
  phases?: Phase[];
  accumulatedDistance?: number;
};

const DEFAULT_PHASES: Phase[] = [
  { color: "red", duration: 10 },
  { color: "yellow", duration: 3 },
  { color: "green", duration: 17 },
];

const PHASE_REPEAT_COUNT = 3;

export default function Diagram() {
  const {
    OSRMRouteQuery: { data },
  } = useAppContext();

  if (!data) return null;

  const features: DiagramItem[] = data;

  if (!features.length) return null;

  const diagramData: DiagramItem[] = [];

  let accumulatedDistance = 0;
  let roadIndex = 1;

  diagramData.push({
    name: "Начало маршрута",
    type: "start",
    accumulatedDistance: 0,
  });

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const props = feature.properties || {};

    if (props.type === "sector") {
      const length = props.distance || 0;
      const duration = props.duration || 0;

      accumulatedDistance += length;

      diagramData.push({
        name: `Участок ${roadIndex}`,
        type: "road",
        length,
        duration,
        accumulatedDistance,
      });

      roadIndex++;
    } else if (props.type === "traffic_light") {
      const signalId = props.id || diagramData.length;

      // Повторяем фазы
      const repeatedPhases: Phase[] = Array.from({
        length: PHASE_REPEAT_COUNT,
      }).flatMap(() => DEFAULT_PHASES);

      diagramData.push({
        name: `Светофор ${signalId}`,
        type: "signal",
        phases: repeatedPhases,
        duration: repeatedPhases.reduce((acc, p) => acc + p.duration, 0),
        accumulatedDistance,
      });
    } else if (props.type === "marker") {
      if (props.role === "end") {
        diagramData.push({
          name: "Конец маршрута",
          type: "end",
          accumulatedDistance,
        });
      }
    }
  }

  const maxDuration = diagramData.reduce(
    (max, item) => Math.max(max, item.duration || 0),
    0,
  );

  const invertedData = [...diagramData].reverse();

  console.log("Diagram", diagramData);

  return (
    <div className="w-full h-full p-4 bg-white rounded-lg shadow">
      <ResponsiveContainer>
        <BarChart data={invertedData} layout="vertical">
          <XAxis
            type="number"
            label={`Accumulate: dist(${accumulatedDistance}, dur(${maxDuration}))`}
          />
          <YAxis type="category" dataKey="name" />

          {/* Waymap sectors between waypoints(signal, start, end) */}
          <Bar
            dataKey={(item) => (item.type === "road" ? item.duration : null)}
            fill="#3b82f6"
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as DiagramItem;

              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow text-sm">
                  <p className="font-medium">{item.name}</p>
                  {item.type === "road" && (
                    <>
                      <p>Длина: {item.length?.toFixed(0)} м</p>
                      <p>Время: {item.duration?.toFixed(0)} сек</p>
                    </>
                  )}
                  {item.type === "signal" && item.phases && (
                    <div>
                      <p className="mb-1">Фазы светофора:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.phases.map((phase, i) => (
                          <div key={i} className="flex items-center">
                            <div
                              className="w-3 h-3 mr-1 rounded"
                              style={{
                                backgroundColor:
                                  phase.color === "red"
                                    ? "#ef4444"
                                    : phase.color === "yellow"
                                      ? "#fbbf24"
                                      : "#10b981",
                              }}
                            />
                            <span>{phase.duration}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { useAppContext } from "@src/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

type PhaseColor = "red" | "yellow" | "green";

type Phase = {
  color: PhaseColor;
  duration: number;
};

type DiagramItem = {
  name: string;
  type: "start" | "road" | "signal" | "end";
  length?: number;
  duration?: number;
  accumulatedDistance?: number;
  accumulatedTime?: number;
};

export default function Diagram() {
  const {
    OSRMRouteQuery: { data },
  } = useAppContext();

  if (!data || !data.length) return null;

  const features = data;

  const diagramData: DiagramItem[] = [];
  let accumulatedDistance = 0;
  let accumulatedTime = 0;
  let roadIndex = 1;

  diagramData.push({
    name: "Начало маршрута",
    type: "start",
    accumulatedDistance: 0,
    accumulatedTime: 0,
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
        accumulatedTime,
      });

      accumulatedTime += duration;
      roadIndex++;
    } else if (props.type === "marker" && props.role === "end") {
      diagramData.push({
        name: "Конец маршрута",
        type: "end",
        accumulatedDistance,
        accumulatedTime,
      });
    }
  }

  const maxDuration = diagramData.reduce(
    (max, item) =>
      Math.max(max, (item.accumulatedTime || 0) + (item.duration || 0)),
    0,
  );

  const roadItems = diagramData
    .filter((item) => item.type === "road")
    .reverse();

  return (
    <div className="w-full h-full p-4 bg-white rounded-lg shadow">
      <ResponsiveContainer width="100%" height={roadItems.length * 50}>
        <BarChart
          layout="vertical"
          data={roadItems}
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <XAxis
            type="number"
            domain={[0, maxDuration]}
            tick={{ fontSize: 12 }}
            label={{
              value: `Time (sec): sumDur[sec](${accumulatedTime}) / sumDist[m](${accumulatedDistance})`,
              position: "insideBottomRight",
              offset: -5,
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
          />

          {/* Offset Bar (invisible spacer) */}
          <Bar dataKey="accumulatedTime" stackId="a" fill="transparent" />

          {/* Actual duration Bar */}
          <Bar dataKey="duration" stackId="a" fill="#3b82f6">
            <LabelList
              dataKey="duration"
              position="right"
              formatter={(val: number) => `${val.toFixed(0)}s`}
            />
          </Bar>

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[payload.length - 1].payload as DiagramItem;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p>Длина: {item.length?.toFixed(0)} м</p>
                  <p>Время: {item.duration?.toFixed(0)} сек</p>
                  <p>Начало: {item.accumulatedTime?.toFixed(0)} сек</p>
                </div>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

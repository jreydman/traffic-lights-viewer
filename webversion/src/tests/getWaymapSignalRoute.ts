import type { Feature, Position } from "geojson";
import waymap from "../tests/waymap.json";
import waymapSignals from "../tests/waymapSignals.json";

const route = waymap.routes?.[0];
const coordinates: Position[] = route.geometry.coordinates;

const nodes = [
  ...new Set(route.legs.flatMap((leg: any) => leg.annotation?.nodes || [])),
];

const distances: number[] = route.legs.flatMap(
  (leg: any) => leg.annotation?.distance || [],
);
const durations: number[] = route.legs.flatMap(
  (leg: any) => leg.annotation?.duration || [],
);

const steps = [];
for (const leg of route.legs) {
  for (const step of leg.steps) {
    steps.push({
      name: step.name || "unnamed",
      length: step.geometry.coordinates.length,
    });
  }
}

const streetForCoordIndex: string[] = [];

let coordCursor = 0;

for (const step of steps) {
  for (let i = 0; i < step.length; i++) {
    streetForCoordIndex[coordCursor++] = step.name;
  }
}

const signalNodes = new Map<number, any>();

for (const el of waymapSignals.elements || []) {
  if (el.type === "node") {
    signalNodes.set(el.id, el);
  }
}

const nodeIdToCoordIndex = new Map<number, number>();

let coordIndex = 0;

for (const leg of route.legs) {
  const nodes = leg.annotation?.nodes || [];
  const coords = leg.annotation?.distance?.length || 0;

  for (let i = 0; i < coords; i++) {
    const nodeId = nodes[i];
    if (nodeId !== undefined && !nodeIdToCoordIndex.has(nodeId)) {
      nodeIdToCoordIndex.set(nodeId, coordIndex);
    }
    coordIndex++;
  }
}

const features: Feature[] = [];

// Стартовый маркер
features.push({
  type: "Feature",
  geometry: { type: "Point", coordinates: coordinates[0] },
  properties: { type: "marker", role: "start" },
});

let sectorStartNodeIndex = 0;
let sectorStartCoordIndex = 0;

// Сектора между светофорами
for (let i = 1; i < nodes.length; i++) {
  const nodeId = nodes[i];
  const signal = signalNodes.get(nodeId);

  if (signal) {
    const coordIndex = nodeIdToCoordIndex.get(nodeId) ?? i;

    // Суммируем дистанции и длительности между координатами
    const distSlice = distances.slice(sectorStartCoordIndex, coordIndex);
    const durSlice = durations.slice(sectorStartCoordIndex, coordIndex);
    const totalDist = distSlice.reduce((a, b) => a + b, 0);
    const totalDur = durSlice.reduce((a, b) => a + b, 0);

    const sectorCoords = coordinates.slice(
      sectorStartCoordIndex,
      coordIndex + 1,
    );

    const streetsSet = new Set<string>();
    for (
      let si = sectorStartCoordIndex;
      si <= coordIndex && si < streetForCoordIndex.length;
      si++
    ) {
      streetsSet.add(streetForCoordIndex[si]);
    }

    if (sectorCoords.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: sectorCoords,
        },
        properties: {
          type: "sector",
          distance: totalDist,
          duration: totalDur,
          streetNames: Array.from(streetsSet),
        },
      });
    }

    // Светофор
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [signal.lon, signal.lat],
      },
      properties: {
        type: "traffic_light",
        id: signal.id,
        tags: signal.tags,
      },
    });

    sectorStartNodeIndex = i;
    sectorStartCoordIndex = coordIndex;
  }
}

// Последний сектор
if (sectorStartNodeIndex < nodes.length - 1) {
  const distSlice = distances.slice(sectorStartCoordIndex);
  const durSlice = durations.slice(sectorStartCoordIndex);
  const totalDist = distSlice.reduce((a, b) => a + b, 0);
  const totalDur = durSlice.reduce((a, b) => a + b, 0);

  const sectorCoords = coordinates.slice(
    sectorStartCoordIndex,
    coordinates.length,
  );

  const streetsSet = new Set<string>();
  for (let si = sectorStartCoordIndex; si < streetForCoordIndex.length; si++) {
    streetsSet.add(streetForCoordIndex[si]);
  }

  if (sectorCoords.length >= 2) {
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: sectorCoords,
      },
      properties: {
        type: "sector",
        distance: totalDist,
        duration: totalDur,
        streetNames: Array.from(streetsSet),
      },
    });
  }
}

// Финальный маркер
features.push({
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: coordinates[coordinates.length - 1],
  },
  properties: { type: "marker", role: "end" },
});

// --------------------

console.log(features[3]);

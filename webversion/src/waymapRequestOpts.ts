import type { PointType } from "./types";

export default function getWaymapRequestOpts(waypoints: PointType[]) {
  const coords = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}`;

  return {
    url,
    method: "GET",
    params: {
      overview: "full",
      geometries: "geojson",
      annotations: "true",
      steps: "true",
    },
  };
}

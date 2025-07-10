import mockWaypointsVector from "../mock_route.json";
import fs from "fs";
import axios from "axios";

type PointType = {
  readonly longitude: number;
  readonly latitude: number;
};

// получаем маршрут по маршрутным точкам
function getWaymapRequestOpts(waypoints: PointType[]) {
  const coords = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}`;

  return {
    url: url,
    method: "GET",
    params: {
      overview: "full",
      geometries: "geojson",
      annotations: "true",
      steps: "true",
    },
  };
}

const waymapRequestOpts = getWaymapRequestOpts(mockWaypointsVector);
console.log(axios.getUri(waymapRequestOpts));
const response = await axios.request(waymapRequestOpts);

// записываем результат в файл

fs.writeFileSync(
  "src/tests/waymap.json",
  JSON.stringify(response.data, null, 2),
);

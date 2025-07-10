import waymap from "../tests/waymap.json";
import axios from "axios";
import fs from "fs";

const nodes = waymap.routes[0].legs.flatMap(
  (leg) => leg.annotation?.nodes || [],
);

const query = `
[out:json][timeout:25];
(
  node(id:${nodes.join(",")})["highway"="traffic_signals"];
  node(id:${nodes.join(",")})["crossing"="traffic_signals"];
);
out body;
`;

function getWaymapSignalsRequestOpts(query: string) {
  const url = `https://overpass-api.de/api/interpreter`;

  return {
    url: url,
    method: "GET",
    params: {
      data: `${query}`,
    },
  };
}

const waymapSignalsRequestOpts = getWaymapSignalsRequestOpts(query);

console.log(query);

console.log(axios.getUri(waymapSignalsRequestOpts));

const response = await axios.request(waymapSignalsRequestOpts);

// записываем результат в файл

fs.writeFileSync(
  "src/tests/waymapSignals.json",
  JSON.stringify(response.data, null, 2),
);

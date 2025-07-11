import mockWaypointsVector from "../mock_route.json";
import fs from "fs";
import axios from "axios";
import getWaymapRequestOpts from "../waymapRequestOpts";

const waymapRequestOpts = getWaymapRequestOpts(mockWaypointsVector);
console.log(axios.getUri(waymapRequestOpts));
const response = await axios.request(waymapRequestOpts);

fs.writeFileSync(
  "src/tests/waymap.json",
  JSON.stringify(response.data, null, 2),
);

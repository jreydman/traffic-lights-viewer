export default function getWaymapSignalsRequestOpts(query: string) {
  return {
    url: `https://overpass-api.de/api/interpreter`,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    data: query,
  };
}

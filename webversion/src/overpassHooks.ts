import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PointType } from "@src/types";
import type { Feature } from "geojson";
import getWaymapRequestOpts from "./waymapRequestOpts";
import getWaymapSignalsRequestOpts from "./waymapSignalRequestOpts";

export function useOverpassRouteQuery(waypointsVector: PointType[]) {
  return useQuery({
    queryKey: ["route-with-traffic", waypointsVector],
    enabled: waypointsVector.length >= 2,
    queryFn: async () => {
      const osrmOpts = getWaymapRequestOpts(waypointsVector);
      const osrmResponse = await axios.request(osrmOpts);
      const route = osrmResponse.data.routes?.[0];

      if (!route || !route.geometry) throw new Error("No route found");

      const coordinates: [number, number][] = route.geometry.coordinates;

      const nodes = [
        ...new Set(
          route.legs.flatMap((leg: any) => leg.annotation?.nodes || []),
        ),
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

      const query = `
        [out:json][timeout:25];
        (
          node(id:${nodes.join(",")})["highway"="traffic_signals"];
          node(id:${nodes.join(",")})["crossing"="traffic_signals"];
        );
        out body;
      `;
      const overpassOpts = getWaymapSignalsRequestOpts(query);
      const overpassResponse = await axios.request(overpassOpts);

      const signalNodes = new Map<number, any>();
      for (const el of overpassResponse.data.elements || []) {
        if (el.type === "node") {
          signalNodes.set(el.id, el);
        }
      }

      const nodeIdToCoordIndex = new Map<number, number>();
      let coordIdx = 0;
      for (const leg of route.legs) {
        const legNodes = leg.annotation?.nodes || [];
        for (let i = 0; i < legNodes.length; i++) {
          const nodeId = legNodes[i];
          if (nodeId !== undefined && !nodeIdToCoordIndex.has(nodeId)) {
            nodeIdToCoordIndex.set(nodeId, coordIdx);
          }
          coordIdx++;
        }
      }

      const features: Feature[] = [];

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coordinates[0] },
        properties: { type: "marker", role: "start" },
      });

      let sectorStartCoordIndex = 0;

      for (let i = 1; i < nodes.length; i++) {
        const nodeId = nodes[i];
        const coordIndex = nodeIdToCoordIndex.get(nodeId);
        if (coordIndex == null) continue;

        const distSlice = distances.slice(sectorStartCoordIndex, coordIndex);
        const durSlice = durations.slice(sectorStartCoordIndex, coordIndex);
        const totalDist = distSlice.reduce((a, b) => a + b, 0);
        const totalDur = durSlice.reduce((a, b) => a + b, 0);

        const signal = signalNodes.get(nodeId);
        if (signal) {
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

          sectorStartCoordIndex = coordIndex;
        }
      }

      if (sectorStartCoordIndex < coordinates.length - 1) {
        const distSlice = distances.slice(sectorStartCoordIndex);
        const durSlice = durations.slice(sectorStartCoordIndex);
        const totalDist = distSlice.reduce((a, b) => a + b, 0);
        const totalDur = durSlice.reduce((a, b) => a + b, 0);

        const sectorCoords = coordinates.slice(
          sectorStartCoordIndex,
          coordinates.length,
        );

        const streetsSet = new Set<string>();
        for (
          let si = sectorStartCoordIndex;
          si < streetForCoordIndex.length;
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
      }

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coordinates[coordinates.length - 1],
        },
        properties: { type: "marker", role: "end" },
      });

      return features;
    },
  });
}

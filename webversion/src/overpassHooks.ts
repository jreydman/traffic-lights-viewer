import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PointType } from "@src/types";
import type { Feature, LineString, Point } from "geojson";
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

      type StepInfo = { name: string; length: number };
      const steps: StepInfo[] = [];
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
      nodes.forEach((nodeId, idx) => {
        nodeIdToCoordIndex.set(nodeId, idx);
      });

      // Формируем features
      const features: Feature[] = [];

      // Добавляем стартовый маркер
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coordinates[0] },
        properties: { type: "marker", role: "start" },
      });

      let sectorStartCoordIndex = 0; // индекс начала текущего сектора в coordinates
      let totalDist = 0;
      let totalDur = 0;

      // Перебираем ноды и разбиваем на сектора по светофорам
      for (let i = 1; i < nodes.length; i++) {
        const nodeId = nodes[i];
        const coordIndex = nodeIdToCoordIndex.get(nodeId) ?? i;

        // Накапливаем dist и dur между sectorStartCoordIndex и coordIndex
        for (let d = sectorStartCoordIndex; d < coordIndex; d++) {
          totalDist += distances[d] || 0;
          totalDur += durations[d] || 0;
        }

        const signal = signalNodes.get(nodeId);

        if (signal) {
          // Срез координат сектора: от sectorStartCoordIndex до coordIndex включительно
          const sectorCoords = coordinates.slice(
            sectorStartCoordIndex,
            coordIndex + 1,
          );

          // Собираем имена улиц для сектора
          const streetsSet = new Set<string>();
          for (
            let si = sectorStartCoordIndex;
            si <= coordIndex && si < streetForCoordIndex.length;
            si++
          ) {
            streetsSet.add(streetForCoordIndex[si]);
          }

          // Добавляем сектор если хватает точек
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

          // Добавляем светофор
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

          // Сброс счётчиков и обновление начала сектора
          sectorStartCoordIndex = coordIndex;
          totalDist = 0;
          totalDur = 0;
        }
      }

      // Добавляем последний сектор (после последнего светофора до конца маршрута)
      if (sectorStartCoordIndex < coordinates.length - 1) {
        // Накапливаем dist/dur с последнего сектора до конца
        for (let d = sectorStartCoordIndex; d < distances.length; d++) {
          totalDist += distances[d] || 0;
          totalDur += durations[d] || 0;
        }

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

      // Финальный маркер
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

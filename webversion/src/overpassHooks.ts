import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PointType } from "@src/types";
import type { Feature, LineString, Point } from "geojson";

function getWaymapRequestOpts(waypoints: PointType[]) {
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

function getWaymapSignalsRequestOpts(query: string) {
  return {
    url: `https://overpass-api.de/api/interpreter`,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    data: query,
  };
}

export function useOverpassRouteQuery(waypointsVector: PointType[]) {
  return useQuery({
    queryKey: ["route-with-traffic", waypointsVector],
    enabled: waypointsVector.length >= 2,
    queryFn: async () => {
      const osrmOpts = getWaymapRequestOpts(waypointsVector);
      const osrmResponse = await axios.request(osrmOpts);
      const route = osrmResponse.data.routes?.[0];

      if (!route || !route.geometry) throw new Error("No route found");

      const coordinates = route.geometry.coordinates; // все точки маршрута

      // Все ноды с аннотаций
      const nodes: number[] = [
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

      // Для сбора улиц: список шагов всех ног (legs)
      // Каждый step имеет name, distance, duration, geometry
      // Нам нужно синхронизировать индексы step и индексы координат / нод
      type StepInfo = {
        name: string;
        // сколько координат в шаге (geometry.coordinates.length)
        length: number;
      };
      const steps: StepInfo[] = [];

      // Соберём steps по порядку
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          steps.push({
            name: step.name || "unnamed",
            length: step.geometry.coordinates.length,
          });
        }
      }

      // Создадим массив, который для каждого индекса координаты укажет имя улицы
      // Индексы координат шага идут подряд, суммируем length шагов
      const streetForCoordIndex: string[] = [];

      let coordIndexCursor = 0;
      for (const step of steps) {
        for (let i = 0; i < step.length; i++) {
          streetForCoordIndex[coordIndexCursor++] = step.name;
        }
      }

      // Получаем светофоры из Overpass по нодам
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

      const features: Feature[] = [];

      // Стартовый маркер
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coordinates[0] },
        properties: { type: "marker", role: "start" },
      });

      let sectorCoords: number[][] = [coordinates[0]];
      let totalDist = 0;
      let totalDur = 0;

      // Для улиц внутри сектора — собираем по координатным индексам
      let sectorStartCoordIndex = 0;

      for (let i = 0; i < nodes.length - 1; i++) {
        const coordNext = coordinates[i + 1];
        const nodeNext = nodes[i + 1];

        sectorCoords.push(coordNext);
        totalDist += distances[i];
        totalDur += durations[i];

        // Если светофор на этой ноде — закроем сектор
        const signal = signalNodes.get(nodeNext);
        if (signal) {
          // Получим индекс координаты конца сектора (i+1)
          const sectorEndCoordIndex = i + 1;

          // Соберём уникальные улицы из streetForCoordIndex в этом диапазоне
          const streetsSet = new Set<string>();
          for (
            let idx = sectorStartCoordIndex;
            idx <= sectorEndCoordIndex && idx < streetForCoordIndex.length;
            idx++
          ) {
            streetsSet.add(streetForCoordIndex[idx]);
          }

          const streetNames = Array.from(streetsSet);

          // Добавим сектор с улицами
          features.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [...sectorCoords],
            },
            properties: {
              type: "sector",
              distance: totalDist,
              duration: totalDur,
              streetNames,
            },
          });

          // светофор
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

          // сбросим
          sectorCoords = [coordNext];
          totalDist = 0;
          totalDur = 0;
          sectorStartCoordIndex = sectorEndCoordIndex;
        }
      }

      // Финальный сектор от последнего светофора до конца маршрута

      const lastCoord = coordinates[coordinates.length - 1];
      const lastCoordInSector = sectorCoords[sectorCoords.length - 1];

      if (
        !(
          lastCoordInSector[0] === lastCoord[0] &&
          lastCoordInSector[1] === lastCoord[1]
        )
      ) {
        sectorCoords.push(lastCoord);
      }

      // Улица для финального сектора — от sectorStartCoordIndex до конца
      const streetNames = new Set<string>();
      for (
        let idx = sectorStartCoordIndex;
        idx < streetForCoordIndex.length && idx < coordinates.length;
        idx++
      ) {
        streetNames.add(streetForCoordIndex[idx]);
      }

      if (sectorCoords.length >= 2) {
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [...sectorCoords],
          },
          properties: {
            type: "sector",
            distance: totalDist,
            duration: totalDur,
            streetNames: Array.from(streetNames),
          },
        });
      }

      // Финальный маркер
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: lastCoord,
        },
        properties: { type: "marker", role: "end" },
      });

      return features;
    },
  });
}

import { useAppContext } from "@src/AppContext";
import { Layer, Source } from "react-map-gl/maplibre";
import type { Feature, Point, LineString } from "geojson";
import React from "react";

export default function MapRoute() {
  const { OSRMRouteQuery } = useAppContext();
  const { data: features } = OSRMRouteQuery;

  React.useEffect(() => {
    console.log(features);
  }, [features]);

  if (!features || features.length === 0) return null;

  // Группировка по типам
  const sectors: Feature<LineString>[] = [];
  const signals: Feature<Point>[] = [];
  let startMarker: Feature<Point> | null = null;
  let endMarker: Feature<Point> | null = null;

  for (const feature of features) {
    if (
      feature.geometry.type === "LineString" &&
      feature.properties.type === "sector"
    ) {
      sectors.push(feature as Feature<LineString>);
    } else if (feature.geometry.type === "Point") {
      if (feature.properties.type === "traffic_light") {
        signals.push(feature as Feature<Point>);
      } else if (
        feature.properties.type === "marker" &&
        feature.properties.role === "start"
      ) {
        startMarker = feature as Feature<Point>;
      } else if (
        feature.properties.type === "marker" &&
        feature.properties.role === "end"
      ) {
        endMarker = feature as Feature<Point>;
      }
    }
  }

  return (
    <>
      {/* Сектора маршрута */}
      {sectors.length > 0 && (
        <Source
          id="route-sectors"
          type="geojson"
          data={{ type: "FeatureCollection", features: sectors }}
        >
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#007aff",
              "line-width": 4,
              "line-opacity": 0.9,
            }}
          />
        </Source>
      )}

      {/* Светофоры */}
      {signals.length > 0 && (
        <Source
          id="traffic-signals"
          type="geojson"
          data={{ type: "FeatureCollection", features: signals }}
        >
          <Layer
            id="signal-points"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": "#ff3b30",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
            }}
          />
        </Source>
      )}

      {/* Старт */}
      {startMarker && (
        <Source id="start-marker" type="geojson" data={startMarker}>
          <Layer
            id="start-point"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": "#34c759", // зелёный
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            }}
          />
        </Source>
      )}

      {/* Конец */}
      {endMarker && (
        <Source id="end-marker" type="geojson" data={endMarker}>
          <Layer
            id="end-point"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": "#000", // чёрный
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            }}
          />
        </Source>
      )}
    </>
  );
}

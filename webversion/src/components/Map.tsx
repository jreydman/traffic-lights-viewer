import { useAppContext } from "@src/AppContext";
import type { PointType } from "@src/types";
import React from "react";
import {
  GeolocateControl,
  Map,
  Marker,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import { KyivCityCenterPoint } from "@src/constants";
import MapRoute from "@src/components/MapRoute";

const GEOFENCE = turf.circle([...Object.values(KyivCityCenterPoint)], 10, {
  units: "kilometers",
});
const MAPSTYLE = "https://tiles.stadiamaps.com/styles/osm_bright.json";

export default function _Map() {
  const {
    mapViewState,
    setMapViewState,
    waypointsVector,
    mapWaypointSelection,
    setWaypointsVector,
  } = useAppContext();

  const waypointMarkersVector = React.useMemo(
    () =>
      waypointsVector.map((waypoint) => (
        <Marker
          key={waypoint.longitude + waypoint.latitude}
          longitude={waypoint.longitude}
          latitude={waypoint.latitude}
          color="blue"
        />
      )),
    [waypointsVector],
  );

  const onMove = React.useCallback((_event: ViewStateChangeEvent) => {
    const { viewState } = _event;

    const mapCenter: PointType = {
      longitude: viewState.longitude,
      latitude: viewState.latitude,
    };

    if (turf.booleanPointInPolygon(Object.values(mapCenter), GEOFENCE)) {
      setMapViewState(viewState);
    }
  }, []);

  const handleMapClick = React.useCallback(
    (_event: MapLayerMouseEvent) => {
      if (!mapWaypointSelection) return;

      const { lngLat } = _event;
      const newPoint: PointType = {
        longitude: lngLat.lng,
        latitude: lngLat.lat,
      };

      setWaypointsVector((prev: PointType[]) => [...prev, newPoint]);
    },
    [mapWaypointSelection],
  );

  return (
    <Map
      {...mapViewState}
      onMove={onMove}
      onClick={handleMapClick}
      mapStyle={MAPSTYLE}
    >
      <GeolocateControl />
      {waypointMarkersVector}
      {waypointsVector.length >= 2 && <MapRoute />}
    </Map>
  );
}

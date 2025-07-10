import type { UseQueryResult } from "@tanstack/react-query";
import React from "react";
import type {
  Point as GeoPoint,
  LineString,
  Feature,
  FeatureCollection,
} from "geojson";

export type Nullable<T> = T | null;

export type PointType = {
  readonly longitude: number;
  readonly latitude: number;
};

export type MapViewStateType = PointType & {
  readonly zoom: number;
};

export type BBoxRegionStateType = PointType & {
  readonly width: number;
  readonly height: number;
};

export type PolyboxRegionType = readonly [
  PointType,
  PointType,
  PointType,
  PointType,
];

export type AppContextType = {
  bboxRegionState: Nullable<BBoxRegionStateType>;
  setBBoxRegionState: React.Dispatch<
    React.SetStateAction<Nullable<BBoxRegionStateType>>
  >;

  mapViewState: MapViewStateType;
  setMapViewState: React.Dispatch<React.SetStateAction<MapViewStateType>>;

  mapWaypointSelection: boolean;
  toggleMapWaypointSelection: any;

  waypointsVector: PointType[];
  setWaypointsVector: React.Dispatch<React.SetStateAction<PointType[]>>;

  diagramVisibility: boolean;
  toggleDiagramVisibility: any;

  OSRMRouteQuery: UseQueryResult<RouteWithTraffic, Error>;
};

export type ChildrenProps = {
  children: React.ReactNode;
};

import React from "react";
import mockWaypointsVector from "@src/mock_route.json";

import type {
  AppContextType,
  BBoxRegionStateType,
  MapViewStateType,
  Nullable,
  ChildrenProps,
  PointType,
} from "@src/types";
import { KyivCityCenterPoint } from "./constants";
import { useToggle } from "@uidotdev/usehooks";
import { useOverpassRouteQuery } from "./overpassHooks";

const AppContext = React.createContext<Nullable<AppContextType>>(null);

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context)
    throw new Error(
      `Use ${AppContext.name}  context within ${AppContextProvider.name}!`,
    );
  return context;
}

export function useCreateAppContext(): AppContextType {
  const [mapViewState, setMapViewState] = React.useState<MapViewStateType>({
    ...KyivCityCenterPoint,
    zoom: 15,
  });

  const [bboxRegionState, setBBoxRegionState] =
    React.useState<Nullable<BBoxRegionStateType>>(null);

  const [mapWaypointSelection, toggleMapWaypointSelection] = useToggle(false);
  const [diagramVisibility, toggleDiagramVisibility] = useToggle(false);

  const [waypointsVector, setWaypointsVector] =
    React.useState<PointType[]>(mockWaypointsVector);

  const OSRMRouteQuery = useOverpassRouteQuery(waypointsVector);

  return {
    bboxRegionState,
    setBBoxRegionState,

    mapViewState,
    setMapViewState,

    mapWaypointSelection,
    toggleMapWaypointSelection,

    waypointsVector,
    setWaypointsVector,

    diagramVisibility,
    toggleDiagramVisibility,

    OSRMRouteQuery,
  };
}

export const AppContextProvider = ({ children }: ChildrenProps) => {
  const context = useCreateAppContext();
  return <AppContext.Provider value={context}>{children}</AppContext.Provider>;
};

import type { AbstractWidgetConfig } from "@/widget";

export default interface MapConfig extends AbstractWidgetConfig {
  type: "map";
  center: MapCoordinates;
  zoom: number;
  view: MapView;
  children?: undefined;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export const MAP_VIEWS = ["scheme", "satellite", "hybrid"] as const;
export type MapView = (typeof MAP_VIEWS)[number];

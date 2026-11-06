import type { AbstractLayoutConfig } from "@/widgets/layout";
import type WidgetConfig from "@/widget";
import { getChildrenWithAdoptedChild, getChildrenWithDisownedChild } from "@/widget";

export default interface FlexConfig extends AbstractLayoutConfig {
  layout: "flex";
  direction: FlexDirection;
  justify?: FlexJustify;
  alignItems?: FlexAlignItems;
  gap?: number;
  children?: WidgetConfig["id"][];
}

export function getFlexConfigWithAdoptedChild(
  parent: FlexConfig,
  child: WidgetConfig,
): FlexConfig {
  const children = getChildrenWithAdoptedChild(parent, child);
  return { ...parent, children };
}

export function getFlexConfigWithDisownedChild(
  parent: FlexConfig,
  child: WidgetConfig,
): FlexConfig {
  const children = getChildrenWithDisownedChild(parent, child);
  return { ...parent, children };
}

export type FlexDirection = "row" | "column";

export type FlexJustify = "start" | "end" | "center" | "between" | "around" | "evenly";

export type FlexAlignItems = "stretch" | "start" | "end" | "center" | "baseline";

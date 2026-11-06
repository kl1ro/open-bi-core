import type { AbstractLayoutConfig } from "@/widgets/layout";
import type WidgetConfig from "@/widget";
import {
  getChildrenWithAdoptedChild,
  getChildrenWithDisownedChild,
  hasChild,
  InvalidItemConfigTypeError,
  ItemConfigNotFoundError,
  NoItemConfigError,
  type ItemConfig,
} from "@/widget";
import { getRecordWithoutKey } from "@/utils";
import {
  getOverlapsBetweenItemAndArrangement,
  resolveOverlap,
} from "@/widgets/layouts/grid/overlap";

export default interface GridConfig extends AbstractLayoutConfig {
  layout: "grid";
  rows: number;
  columns: number;
  children?: WidgetConfig["id"][];
  arrangement?: GridArrangement;
}

export function getGridConfigWithAdoptedChild(
  parent: GridConfig,
  child: WidgetConfig,
  deps: GetGridConfigWithAdoptedChildDeps,
): GridConfig {
  if (hasChild(parent, child) && !deps.itemConfig) return parent;
  const gridItemConfig = ensureItemConfigParentTypeIsGrid(deps.itemConfig);

  const children = getChildrenWithAdoptedChild(parent, child);

  const arrangementWithUpsertedChild = upsertGridItemToArrangement(
    child.id,
    gridItemConfig,
    parent.arrangement,
  );

  const rearranged = rearrangeAroundItem(arrangementWithUpsertedChild, child.id);
  return { ...parent, children, arrangement: rearranged };
}

export interface GetGridConfigWithAdoptedChildDeps {
  itemConfig?: ItemConfig;
}

export function getGridConfigWithDisownedChild(
  parent: GridConfig,
  child: WidgetConfig,
): GridConfig {
  const children = getChildrenWithDisownedChild(parent, child);
  const arrangement = getRecordWithoutKey(parent.arrangement, child.id);
  return { ...parent, children, arrangement };
}

export function isGridChildRedundant(parent: GridConfig, child: WidgetConfig) {
  const itemConfig = getGridItemConfig(parent, child);

  return (
    (child.type === "slot" && is1x1GridItem(itemConfig)) ||
    isGridItemCollapsed(itemConfig)
  );
}

export function occupySameCells(first: GridItemConfig, second: GridItemConfig) {
  return (
    first.position.row === second.position.row &&
    first.position.column === second.position.column &&
    first.size.rowSpan === second.size.rowSpan &&
    first.size.colSpan === second.size.colSpan
  );
}

function ensureItemConfigParentTypeIsGrid(itemConfig?: ItemConfig) {
  if (!itemConfig) throw new NoItemConfigError({ requiredType: "grid" });

  if (itemConfig.parentType !== "grid")
    throw new InvalidItemConfigTypeError({
      requiredType: "grid",
      gotType: itemConfig.parentType,
    });

  return itemConfig;
}

function upsertGridItemToArrangement(
  id: WidgetConfig["id"],
  itemConfig: GridItemConfig,
  arrangement?: GridArrangement,
): GridArrangement {
  return { ...arrangement, [id]: itemConfig };
}

function rearrangeAroundItem(arrangement: GridArrangement, itemId: WidgetConfig["id"]) {
  const overlaps = getOverlapsBetweenItemAndArrangement(itemId, arrangement);
  const resolved = overlaps.map(resolveOverlap);

  const resolvedArrangement = resolved.reduce(
    (acc, cur) => upsertGridItemToArrangement(cur.id, cur.itemConfig, acc),
    arrangement,
  );

  return resolvedArrangement;
}

export function getGridItemConfig(gridConfig: GridConfig, widgetConfig: WidgetConfig) {
  const itemConfig = gridConfig.arrangement?.[widgetConfig.id];

  if (!itemConfig)
    throw new ItemConfigNotFoundError({
      containerId: gridConfig.id,
      widgetConfigId: widgetConfig.id,
    });

  return itemConfig;
}

export function is1x1GridItem(itemConfig: GridItemConfig) {
  return itemConfig.size.rowSpan === 1 && itemConfig.size.colSpan === 1;
}

export function isGridItemCollapsed(itemConfig: GridItemConfig) {
  return itemConfig.size.rowSpan === 0 || itemConfig.size.colSpan === 0;
}

export interface GridItemConfig {
  parentType: "grid";
  position: GridItemPosition;
  size: GridItemSize;
}

export interface GridItemPosition {
  row: number;
  column: number;
}

export interface GridItemSize {
  rowSpan: number;
  colSpan: number;
}

export type GridArrangement = Record<WidgetConfig["id"], GridItemConfig>;

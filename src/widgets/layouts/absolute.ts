import type { AbstractLayoutConfig } from "@/widgets/layout";
import { getRecordWithoutKey } from "@/utils";
import type WidgetConfig from "@/widget";
import {
  getChildrenWithAdoptedChild,
  getChildrenWithDisownedChild,
  hasChild,
  InvalidItemConfigTypeError,
  NoItemConfigError,
  type ItemConfig,
} from "@/widget";

export default interface AbsoluteConfig extends AbstractLayoutConfig {
  layout: "absolute";
  children?: WidgetConfig["id"][];
  arrangement?: AbsoluteArrangement;
}

export function getAbsoluteConfigWithAdoptedChild(
  parent: AbsoluteConfig,
  child: WidgetConfig,
  deps: GetAbsoluteConfigWithAdoptedChildDeps,
): AbsoluteConfig {
  if (hasChild(parent, child) && !deps.itemConfig) return parent;
  const absoluteItemConfig = ensureItemConfigParentTypeIsAbsolute(deps.itemConfig);

  const children = getChildrenWithAdoptedChild(parent, child);

  const arrangement = upsertAbsoluteItemToArrangement(
    child.id,
    absoluteItemConfig,
    parent.arrangement,
  );

  return { ...parent, children, arrangement };
}

export interface GetAbsoluteConfigWithAdoptedChildDeps {
  itemConfig?: ItemConfig;
}

export function getAbsoluteConfigWithDisownedChild(
  parent: AbsoluteConfig,
  child: WidgetConfig,
): AbsoluteConfig {
  const children = getChildrenWithDisownedChild(parent, child);
  const arrangement = getRecordWithoutKey(parent.arrangement, child.id);
  return { ...parent, children, arrangement };
}

function ensureItemConfigParentTypeIsAbsolute(
  itemConfig?: ItemConfig,
): AbsoluteItemConfig {
  if (!itemConfig) throw new NoItemConfigError({ requiredType: "absolute" });

  if (itemConfig.parentType !== "absolute")
    throw new InvalidItemConfigTypeError({
      requiredType: "absolute",
      gotType: itemConfig.parentType,
    });

  return itemConfig;
}

function upsertAbsoluteItemToArrangement(
  id: WidgetConfig["id"],
  itemConfig: AbsoluteItemConfig,
  arrangement?: AbsoluteArrangement,
): AbsoluteArrangement {
  return { ...arrangement, [id]: itemConfig };
}

export interface AbsoluteItemConfig {
  parentType: "absolute";
  position: AbsoluteItemPosition;
  size: AbsoluteItemSize;
}

export interface AbsoluteItemPosition {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AbsoluteItemSize {
  width?: number;
  height?: number;
}

export type AbsoluteArrangement = Record<WidgetConfig["id"], AbsoluteItemConfig>;

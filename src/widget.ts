import type GraphConfig from "@/widgets/graph";
import type LayoutConfig from "@/widgets/layout";
import {
  getLayoutConfigWithAdoptedChild,
  getLayoutConfigWithDisownedChild,
  isLayoutChildRedundant,
  validateLayoutUpdate,
} from "@/widgets/layout";
import type TitleConfig from "@/widgets/title";
import type MapConfig from "@/widgets/map";
import type SlotConfig from "@/widgets/slot";
import { haveSameElements, type WithRequired } from "@/utils";

type WidgetConfig = LayoutConfig | TitleConfig | GraphConfig | MapConfig | SlotConfig;

export default WidgetConfig;

export type WidgetConfigsById = Record<WidgetConfig["id"], WidgetConfig>;

export function getParentConfigWithAdoptedChild(
  parent: WidgetConfig,
  child: WidgetConfig,
  deps: GetParentConfigWithAdoptedChildDeps,
) {
  switch (parent.type) {
    case "layout":
      return getLayoutConfigWithAdoptedChild(parent, child, deps);

    default:
      throw new ParentIsNotContainerError({
        parentId: parent.id,
        childId: child.id,
      });
  }
}

export interface GetParentConfigWithAdoptedChildDeps {
  itemConfig?: ItemConfig;
}

export function getParentConfigWithDisownedChild(
  parent: WidgetConfig,
  child: WidgetConfig,
) {
  switch (parent.type) {
    case "layout":
      return getLayoutConfigWithDisownedChild(parent, child);

    default:
      throw new ParentIsNotContainerError({
        parentId: parent.id,
        childId: child.id,
      });
  }
}

export class ParentIsNotContainerError extends Error {
  public name = ParentIsNotContainerError.name;
  public parentId: WidgetConfig["id"];
  public childId: WidgetConfig["id"];

  public constructor(
    options: ErrorOptions & {
      parentId: WidgetConfig["id"];
      childId: WidgetConfig["id"];
    },
  ) {
    super(
      `Parent (${options.parentId}) for (${options.childId}) is not a container`,
      options,
    );

    this.parentId = options.parentId;
    this.childId = options.childId;
  }
}

export function getWidgetConfig(id: WidgetConfig["id"], deps: GetWidgetConfigDeps) {
  const widgetConfig = findWidgetConfig(id, deps);
  if (!widgetConfig) throw new WidgetConfigNotFoundError({ id });
  return widgetConfig;
}

export interface GetWidgetConfigDeps {
  widgetConfigs: WidgetConfigsById;
}

export class WidgetConfigNotFoundError extends Error {
  public name = WidgetConfigNotFoundError.name;
  public id: WidgetConfig["id"];

  public constructor(
    options: ErrorOptions & { id: WidgetConfig["id"]; message?: string },
  ) {
    super(
      options.message ??
        `Widget config with id of ${options.id} is not found on the dashboard`,
      options,
    );

    this.id = options.id;
  }
}

export function findWidgetConfig(
  id: WidgetConfig["id"],
  deps: FindWidgetConfigDeps,
): WidgetConfig | undefined {
  return deps.widgetConfigs[id];
}

export interface FindWidgetConfigDeps {
  widgetConfigs: WidgetConfigsById;
}

export function getParentConfig(
  widgetConfig: WithRequired<WidgetConfig, "parentId">,
  deps: GetParentConfigDeps,
) {
  const parent = findParentConfig(widgetConfig, deps);

  if (!parent)
    throw new ParentConfigNotFoundError({
      childId: widgetConfig.id,
      parentId: widgetConfig.parentId,
    });

  return parent;
}

export interface GetParentConfigDeps {
  widgetConfigs: WidgetConfigsById;
}

export class ParentConfigNotFoundError extends WidgetConfigNotFoundError {
  public name = ParentConfigNotFoundError.name;
  public childId: WidgetConfig["id"];
  public parentId: WidgetConfig["id"];

  public constructor(
    options: ErrorOptions & {
      childId: WidgetConfig["id"];
      parentId: WidgetConfig["id"];
    },
  ) {
    super({
      ...options,
      message: `Parent config with id of (${options.parentId}) of child config with id of (${options.childId}) is not found on the dashboard`,
      id: options.parentId,
    });

    this.childId = options.childId;
    this.parentId = options.parentId;
  }
}

export function findParentConfig(
  widgetConfig: WidgetConfig,
  deps: FindParentConfigDeps,
): WidgetConfig | undefined {
  if (!hasParentId(widgetConfig)) return;
  return findWidgetConfig(widgetConfig.parentId, deps);
}

export interface FindParentConfigDeps {
  widgetConfigs: WidgetConfigsById;
}

export function hasParentId(
  widgetConfig: WidgetConfig,
): widgetConfig is WithRequired<WidgetConfig, "parentId"> {
  return Boolean(widgetConfig.parentId);
}

export function hasMovedFromParent(
  oldConfig: WidgetConfig | undefined,
  newConfig: WidgetConfig,
) {
  if (!oldConfig) return false;
  return hasParentId(oldConfig) && !widgetsHaveSameParentId(oldConfig, newConfig);
}

export function widgetsHaveSameParentId(first?: WidgetConfig, second?: WidgetConfig) {
  if (!first || !second) return false;
  return first.parentId === second.parentId;
}

export function getChildConfigs(
  widgetConfig: WidgetConfig,
  deps: GetChildConfigsDeps,
): WidgetConfig[] {
  const childConfigs =
    widgetConfig.children?.map((id) => getWidgetConfig(id, deps)) ?? [];

  return childConfigs;
}

export interface GetChildConfigsDeps {
  widgetConfigs: WidgetConfigsById;
}

export function getDescendantConfigs(
  widgetConfig: WidgetConfig,
  deps: GetDescendantConfigsDeps,
): WidgetConfigsById {
  if (!widgetConfig.children?.length) return {};

  const currentLayerChildren = widgetConfig.children.reduce<WidgetConfigsById>(
    (prev, cur) => ({
      ...prev,
      [cur]: getWidgetConfig(cur, deps),
    }),
    {},
  );

  const deeperDescendants = Object.values(currentLayerChildren).reduce<WidgetConfigsById>(
    (prev, cur) => ({ ...prev, ...getDescendantConfigs(cur, deps) }),
    {},
  );

  const descendants = { ...currentLayerChildren, ...deeperDescendants };
  return descendants;
}

export interface GetDescendantConfigsDeps {
  widgetConfigs: WidgetConfigsById;
}

export function widgetsHaveSameId(first?: WidgetConfig, second?: WidgetConfig) {
  if (!first || !second) return false;
  return first.id === second.id;
}

export function validateWidgetUpdate(
  oldConfig: WidgetConfig | undefined,
  newConfig: WidgetConfig,
) {
  if (!oldConfig || isTurningThroughSlot(oldConfig, newConfig)) return;

  if (!widgetsHaveSameType(oldConfig, newConfig))
    throw new ImpossibleWidgetTypeChangeError({
      id: newConfig.id,
      currentType: oldConfig.type,
      wantedType: newConfig.type,
    });

  if (!widgetsHaveSameChildren(oldConfig, newConfig))
    throw new ImpossibleChildrenChangeError({
      id: newConfig.id,
      currentChildren: oldConfig.children,
      wantedChildren: newConfig.children,
    });

  if (oldConfig.type === "layout" && newConfig.type === "layout")
    return validateLayoutUpdate(oldConfig, newConfig);
}

export class ImpossibleWidgetTypeChangeError extends Error {
  public name = ImpossibleWidgetTypeChangeError.name;
  public id: WidgetConfig["id"];
  public currentType: WidgetType;
  public wantedType: WidgetType;

  public constructor(
    options: ErrorOptions & {
      id: WidgetConfig["id"];
      currentType: WidgetType;
      wantedType: WidgetType;
    },
  ) {
    super(
      `Widget with id of ${options.id} can't be turned from ${options.currentType} into ${options.wantedType}`,
      options,
    );

    this.id = options.id;
    this.currentType = options.currentType;
    this.wantedType = options.wantedType;
  }
}

export class ImpossibleChildrenChangeError extends Error {
  public name = ImpossibleChildrenChangeError.name;
  public id: WidgetConfig["id"];
  public currentChildren: WidgetConfig["children"];
  public wantedChildren: WidgetConfig["children"];

  public constructor(
    options: ErrorOptions & {
      id: WidgetConfig["id"];
      currentChildren: WidgetConfig["children"];
      wantedChildren: WidgetConfig["children"];
    },
  ) {
    super(
      `Impossible to change children of widget with id of ${options.id} from ${JSON.stringify(options.currentChildren)} to ${JSON.stringify(options.wantedChildren)}`,
      options,
    );

    this.id = options.id;
    this.currentChildren = options.currentChildren;
    this.wantedChildren = options.wantedChildren;
  }
}

export function isTurningThroughSlot(oldConfig: WidgetConfig, newConfig: WidgetConfig) {
  return isTurningFromSlot(oldConfig, newConfig) || isTurningToSlot(oldConfig, newConfig);
}

export function isRedundant(widgetConfig: WidgetConfig, deps: IsRedundantDeps) {
  if (!hasParentId(widgetConfig)) return false;

  const parentConfig = getParentConfig(widgetConfig, deps);

  switch (parentConfig.type) {
    case "layout":
      return isLayoutChildRedundant(parentConfig, widgetConfig);

    default:
      return false;
  }
}

export interface IsRedundantDeps {
  widgetConfigs: WidgetConfigsById;
}

export function widgetsHaveSameType(first?: WidgetConfig, second?: WidgetConfig) {
  if (!first || !second) return false;
  return first.type === second.type;
}

export function widgetsHaveSameChildren(first?: WidgetConfig, second?: WidgetConfig) {
  if (!first || !second) return false;
  return haveSameElements(first.children, second.children);
}

export function isTurningFromSlot(oldConfig: WidgetConfig, newConfig: WidgetConfig) {
  return oldConfig.type === "slot" && newConfig.type !== "slot";
}

export function isTurningToSlot(oldConfig: WidgetConfig, newConfig: WidgetConfig) {
  return oldConfig.type !== "slot" && newConfig.type === "slot";
}

export function getChildrenWithAdoptedChild(
  parent: ContainerConfig,
  child: WidgetConfig,
) {
  const children = parent.children ?? [];
  if (hasChild(parent, child)) return children;
  return [...children, child.id];
}

export function hasChild(parent: WidgetConfig, child: WidgetConfig) {
  return Boolean(parent.children?.includes(child.id));
}

export function getChildrenWithDisownedChild(
  parent: ContainerConfig,
  child: WidgetConfig,
) {
  return parent.children?.filter((childId) => childId !== child.id);
}

export interface AbstractWidgetConfig {
  id: string;
  type: WidgetType;
  parentId?: string;
}

export type ContainerConfig = Exclude<WidgetConfig, { children?: undefined }>;

export type ItemConfigOf<Container> = Container extends unknown
  ? Required<Container> extends {
      arrangement: Record<WidgetConfig["id"], infer Item>;
    }
    ? Item
    : never
  : never;

export type ItemConfig = ItemConfigOf<ContainerConfig>;

export type ItemConfigParentType = ItemConfig["parentType"];

export class InvalidItemConfigTypeError extends Error {
  public name = InvalidItemConfigTypeError.name;
  public requiredType: ItemConfigParentType;
  public gotType: ItemConfigParentType;

  public constructor(
    options: ErrorOptions & {
      requiredType: ItemConfigParentType;
      gotType: ItemConfigParentType;
    },
  ) {
    super(
      `Invalid type of item config: ${options.requiredType} required, but got ${options.gotType}`,
      options,
    );

    this.requiredType = options.requiredType;
    this.gotType = options.gotType;
  }
}

export class NoItemConfigError extends Error {
  public name = NoItemConfigError.name;
  public requiredType: ItemConfigParentType;

  public constructor(options: ErrorOptions & { requiredType: ItemConfigParentType }) {
    super(
      `No item config provided for widget insertion: ${options.requiredType} item config required`,
      options,
    );

    this.requiredType = options.requiredType;
  }
}

export class ItemConfigNotFoundError extends Error {
  public name = ItemConfigNotFoundError.name;
  public containerId: WidgetConfig["id"];
  public widgetConfigId: WidgetConfig["id"];

  public constructor(
    options: ErrorOptions & {
      containerId: WidgetConfig["id"];
      widgetConfigId: WidgetConfig["id"];
    },
  ) {
    super(
      `Item config with id of ${options.widgetConfigId} is not found in the container with id of ${options.containerId}`,
      options,
    );

    this.containerId = options.containerId;
    this.widgetConfigId = options.widgetConfigId;
  }
}

export type WidgetType = WidgetConfig["type"];

export const WIDGET_TYPE = {
  layout: "layout",
  title: "title",
  graph: "graph",
  map: "map",
  slot: "slot",
} as const satisfies { [Type in WidgetType]: Type };

import type { AbstractWidgetConfig, ItemConfig } from "@/widget";
import type WidgetConfig from "@/widget";
import type AbsoluteConfig from "@/widgets/layouts/absolute";
import {
  getAbsoluteConfigWithAdoptedChild,
  getAbsoluteConfigWithDisownedChild,
} from "@/widgets/layouts/absolute";
import type FlexConfig from "@/widgets/layouts/flex";
import {
  getFlexConfigWithAdoptedChild,
  getFlexConfigWithDisownedChild,
} from "@/widgets/layouts/flex";
import type GridConfig from "@/widgets/layouts/grid";
import {
  getGridConfigWithAdoptedChild,
  getGridConfigWithDisownedChild,
  isGridChildRedundant,
} from "@/widgets/layouts/grid";

type LayoutConfig = GridConfig | AbsoluteConfig | FlexConfig;

export default LayoutConfig;

export interface AbstractLayoutConfig extends AbstractWidgetConfig {
  type: "layout";
  layout: LayoutType;
}

export type LayoutType = LayoutConfig["layout"];

export function getLayoutConfigWithAdoptedChild(
  parent: LayoutConfig,
  child: WidgetConfig,
  deps: GetLayoutConfigWithAdoptedChildDeps,
) {
  switch (parent.layout) {
    case "grid":
      return getGridConfigWithAdoptedChild(parent, child, deps);

    case "flex":
      return getFlexConfigWithAdoptedChild(parent, child);

    case "absolute":
      return getAbsoluteConfigWithAdoptedChild(parent, child, deps);

    default:
      throw getUnexpectedLayoutTypeError(parent);
  }
}

export interface GetLayoutConfigWithAdoptedChildDeps {
  itemConfig?: ItemConfig;
}

export function getLayoutConfigWithDisownedChild(
  parent: LayoutConfig,
  child: WidgetConfig,
) {
  switch (parent.layout) {
    case "grid":
      return getGridConfigWithDisownedChild(parent, child);

    case "flex":
      return getFlexConfigWithDisownedChild(parent, child);

    case "absolute":
      return getAbsoluteConfigWithDisownedChild(parent, child);

    default:
      throw getUnexpectedLayoutTypeError(parent);
  }
}

export function validateLayoutUpdate(oldLayout: LayoutConfig, newLayout: LayoutConfig) {
  if (!layoutsHaveSameType(oldLayout, newLayout))
    throw new ImpossibleLayoutTypeChangeError({
      id: oldLayout.id,
      currentLayout: oldLayout.layout,
      wantedLayout: newLayout.layout,
    });
}

export class ImpossibleLayoutTypeChangeError extends Error {
  public name = ImpossibleLayoutTypeChangeError.name;
  public id: WidgetConfig["id"];
  public currentLayout: LayoutType;
  public wantedLayout: LayoutType;

  public constructor(
    options: ErrorOptions & {
      id: WidgetConfig["id"];
      currentLayout: LayoutType;
      wantedLayout: LayoutType;
    },
  ) {
    super(
      `Layout widget with id of ${options.id} can't be turned from ${options.currentLayout} into ${options.wantedLayout}`,
      options,
    );

    this.id = options.id;
    this.currentLayout = options.currentLayout;
    this.wantedLayout = options.wantedLayout;
  }
}

export function layoutsHaveSameType(first?: LayoutConfig, second?: LayoutConfig) {
  if (!first || !second) return false;
  return first.layout === second.layout;
}

export function isLayoutChildRedundant(parent: LayoutConfig, child: WidgetConfig) {
  switch (parent.layout) {
    case "grid":
      return isGridChildRedundant(parent, child);

    case "flex":
    case "absolute":
      return false;

    default:
      throw getUnexpectedLayoutTypeError(parent);
  }
}

export function getUnexpectedLayoutTypeError(layout: never) {
  const type = (layout as { layout?: unknown })?.layout;
  return type ? new NonexistentLayoutTypeError({ type }) : new NoLayoutTypeError();
}

export class NoLayoutTypeError extends Error {
  public name = NoLayoutTypeError.name;

  public constructor(options?: ErrorOptions) {
    super(`Layout has no type`, options);
  }
}

export class NonexistentLayoutTypeError extends Error {
  public name = NonexistentLayoutTypeError.name;
  public type: unknown;

  public constructor(options: ErrorOptions & { type: unknown }) {
    super(`Layout type ${String(options.type)} does not exist`, options);
    this.type = options.type;
  }
}

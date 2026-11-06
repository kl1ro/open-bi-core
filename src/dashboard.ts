import type WidgetConfig from "@/widget";
import {
  findWidgetConfig,
  getChildConfigs,
  getDescendantConfigs,
  getParentConfig,
  getParentConfigWithAdoptedChild,
  getParentConfigWithDisownedChild,
  hasMovedFromParent,
  hasParentId,
  isRedundant,
  isTurningToSlot,
  validateWidgetUpdate,
  widgetsHaveSameId,
  type ItemConfig,
  type WidgetConfigsById,
} from "@/widget";

export default interface DashboardConfig {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

export function getDashboardWithUpsertedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
  deps: GetDashboardWithUpsertedWidgetDeps,
): DashboardConfig {
  const oldWidgetConfig = findWidgetConfig(widgetConfig.id, dashboard);
  validateWidgetUpdate(oldWidgetConfig, widgetConfig);

  const unlinked = hasMovedFromParent(oldWidgetConfig, widgetConfig)
    ? getDashboardWithUnlinkedWidget(dashboard, oldWidgetConfig)
    : dashboard;

  const linked = getDashboardWithLinkedWidget(unlinked, widgetConfig, deps);

  const withoutOldBranches =
    oldWidgetConfig && isTurningToSlot(oldWidgetConfig, widgetConfig)
      ? getDashboardWithoutChildBranches(linked, oldWidgetConfig)
      : linked;

  const placed = getDashboardWithPlacedWidget(withoutOldBranches, widgetConfig);
  return getDashboardWithoutRedundantChildrenInParentOf(placed, widgetConfig);
}

export interface GetDashboardWithUpsertedWidgetDeps {
  itemConfig?: ItemConfig;
}

export function getDashboardWithRemovedWidget(
  dashboard: DashboardConfig,
  id: WidgetConfig["id"],
): DashboardConfig {
  const widgetConfig = findWidgetConfig(id, dashboard);
  if (!widgetConfig) return dashboard;

  return getDashboardWithoutWidgetAndDescendants(dashboard, widgetConfig);
}

function getDashboardWithUnlinkedWidget(
  dashboard: DashboardConfig,
  child: WidgetConfig | undefined,
): DashboardConfig {
  if (!child || !hasParentId(child)) return dashboard;

  const parent = getParentConfig(child, dashboard);
  const updatedParent = getParentConfigWithDisownedChild(parent, child);
  return getDashboardWithPlacedWidget(dashboard, updatedParent);
}

function getDashboardWithLinkedWidget(
  dashboard: DashboardConfig,
  child: WidgetConfig,
  deps: GetDashboardWithLinkedWidgetDeps,
): DashboardConfig {
  if (!hasParentId(child)) return dashboard;

  const innerDeps = { ...deps, widgetConfigs: dashboard.widgetConfigs };
  const parent = getParentConfig(child, innerDeps);
  const updatedParent = getParentConfigWithAdoptedChild(parent, child, innerDeps);
  return getDashboardWithPlacedWidget(dashboard, updatedParent);
}

interface GetDashboardWithLinkedWidgetDeps {
  itemConfig?: ItemConfig;
}

function getDashboardWithoutChildBranches(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(widgetConfig, dashboard);

  const withoutChildBranches = children.reduce(
    (prev, child) => getDashboardWithoutWidgetAndDescendants(prev, child),
    dashboard,
  );

  return withoutChildBranches;
}

function getDashboardWithPlacedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { dashboard };

  if (!hasParentId(widgetConfig) && !isRootConfig(widgetConfig, deps))
    return getDashboardWithNewRoot(dashboard, widgetConfig);

  return getDashboardWithUpdatedWidget(dashboard, widgetConfig);
}

function getDashboardWithoutRedundantChildrenInParentOf(
  dashboard: DashboardConfig,
  oneOfChildren: WidgetConfig,
): DashboardConfig {
  if (!hasParentId(oneOfChildren)) return dashboard;

  const parent = getParentConfig(oneOfChildren, dashboard);
  return getDashboardWithoutRedundantChildren(dashboard, parent);
}

function getDashboardWithoutWidgetAndDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const unlinked = getDashboardWithUnlinkedWidget(dashboard, widgetConfig);
  const withoutDescendants = getDashboardWithoutDescendants(unlinked, widgetConfig);
  return getDashboardWithoutWidget(withoutDescendants, widgetConfig);
}

export function isRootConfig(widgetConfig: WidgetConfig, deps: IsRootConfigDeps) {
  const root = findRootConfig(deps.dashboard);
  return widgetsHaveSameId(widgetConfig, root);
}

export interface IsRootConfigDeps {
  dashboard: DashboardConfig;
}

function getDashboardWithNewRoot(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const pruned = getDashboardWithoutWidgetsOutsideSubtree(dashboard, widgetConfig);
  const updated = getDashboardWithUpdatedWidget(pruned, widgetConfig);
  return getDashboardWithRootId(updated, widgetConfig.id);
}

function getDashboardWithUpdatedWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const widgetConfigs = {
    ...dashboard.widgetConfigs,
    [widgetConfig.id]: { ...widgetConfig },
  };

  return { ...dashboard, widgetConfigs };
}

function getDashboardWithoutRedundantChildren(
  dashboard: DashboardConfig,
  parent: WidgetConfig,
): DashboardConfig {
  const children = getChildConfigs(parent, dashboard);
  const redundant = children.filter((child) => isRedundant(child, dashboard));

  const withoutRedundant = redundant.reduce(
    (prev, child) => getDashboardWithoutWidgetAndDescendants(prev, child),
    dashboard,
  );

  return withoutRedundant;
}

function getDashboardWithoutDescendants(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const descendants = Object.values(getDescendantConfigs(widgetConfig, dashboard));

  const withoutDescendants = descendants.reduce(
    (prev, descendant) => getDashboardWithoutWidget(prev, descendant),
    dashboard,
  );

  return withoutDescendants;
}

function getDashboardWithoutWidget(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const deps = { dashboard };

  const withRootCleared = isRootConfig(widgetConfig, deps)
    ? getDashboardWithRootId(dashboard, undefined)
    : dashboard;

  return getDashboardWithoutWidgetEntry(withRootCleared, widgetConfig);
}

export function findRootConfig(dashboard: DashboardConfig): WidgetConfig | undefined {
  if (!dashboard.rootId) return;
  return findWidgetConfig(dashboard.rootId, dashboard);
}

function getDashboardWithoutWidgetsOutsideSubtree(
  dashboard: DashboardConfig,
  subtreeRoot: WidgetConfig,
): DashboardConfig {
  const descendants = getDescendantConfigs(subtreeRoot, dashboard);
  const keptIds = new Set([subtreeRoot.id, ...Object.keys(descendants)]);

  const outside = Object.values(dashboard.widgetConfigs).filter(
    (config) => !keptIds.has(config.id),
  );

  const withoutOutside = outside.reduce(
    (prev, config) => getDashboardWithoutWidget(prev, config),
    dashboard,
  );

  return withoutOutside;
}

function getDashboardWithRootId(
  dashboard: DashboardConfig,
  newId: WidgetConfig["id"] | undefined,
): DashboardConfig {
  return { ...dashboard, rootId: newId };
}

function getDashboardWithoutWidgetEntry(
  dashboard: DashboardConfig,
  widgetConfig: WidgetConfig,
): DashboardConfig {
  const widgetConfigs = { ...dashboard.widgetConfigs };
  delete widgetConfigs[widgetConfig.id];
  return { ...dashboard, widgetConfigs };
}

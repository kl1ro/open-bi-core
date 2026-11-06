import type {
  GridArrangement,
  GridItemConfig,
  GridItemPosition,
} from "@/widgets/layouts/grid";
import type WidgetConfig from "@/widget";

export function getOverlapsBetweenItemAndArrangement(
  itemId: WidgetConfig["id"],
  arrangement: GridArrangement,
): GridItemOverlap[] {
  const suspectIds = Object.keys(arrangement).filter((id) => id !== itemId);

  const overlaps = suspectIds.flatMap(
    (id) => findOverlapInArrangement(itemId, id, arrangement) ?? [],
  );

  return overlaps;
}

export interface GridItemOverlap {
  overlappedItemId: WidgetConfig["id"];
  overlappedItem: GridItemConfig;
  overlap: GridItemConfig;
}

export function resolveOverlap(overlap: GridItemOverlap): GridItemResolution {
  const options = getOverlapResolutionOptions(overlap);

  if (!options.length)
    return {
      id: overlap.overlappedItemId,
      itemConfig: getCollapsedItem(overlap.overlappedItem),
    };

  return {
    id: overlap.overlappedItemId,
    itemConfig: pickBestResolutionOption(options, overlap),
  };
}

export interface GridItemResolution {
  id: WidgetConfig["id"];
  itemConfig: GridItemConfig;
}

function findOverlapInArrangement(
  overlappingItemId: WidgetConfig["id"],
  overlappedItemId: WidgetConfig["id"],
  arrangement: GridArrangement,
): GridItemOverlap | undefined {
  const overlappingItem = arrangement[overlappingItemId];
  const overlappedItem = arrangement[overlappedItemId];
  const overlap = findItemsOverlap(overlappingItem, overlappedItem);
  if (!overlap) return;
  return { overlappedItemId, overlappedItem, overlap };
}

function getOverlapResolutionOptions(overlap: GridItemOverlap): GridItemConfig[] {
  const itemRect = convertItemToRect(overlap.overlappedItem);
  const overlapRect = convertItemToRect(overlap.overlap);

  const resolutionOptions = getStripsAroundOverlap(itemRect, overlapRect)
    .filter((strip) => !isEmptyRect(strip))
    .map((strip) => convertRectToItem(strip));

  return resolutionOptions;
}

export function getCollapsedItem(item: GridItemConfig): GridItemConfig {
  return {
    ...item,

    size: {
      rowSpan: 0,
      colSpan: 0,
    },
  };
}

function pickBestResolutionOption(
  options: GridItemConfig[],
  deps: PickBestResolutionOptionDeps,
): GridItemConfig {
  const orderedByArea = options.toSorted((a, b) => getItemArea(b) - getItemArea(a));
  const largestOption = orderedByArea[0];
  const maxArea = getItemArea(largestOption);
  const withMaxArea = orderedByArea.filter((option) => getItemArea(option) === maxArea);
  const reference = deps.overlappedItem;

  const orderedByAspectDeviation = withMaxArea.toSorted(
    (a, b) => getAspectDeviation(a, reference) - getAspectDeviation(b, reference),
  );

  const bestOption = orderedByAspectDeviation[0];
  return bestOption;
}

interface PickBestResolutionOptionDeps {
  overlappedItem: GridItemConfig;
}

export function findItemsOverlap(
  first: GridItemConfig,
  second: GridItemConfig,
): GridItemConfig | undefined {
  const [firstRect, secondRect] = [convertItemToRect(first), convertItemToRect(second)];
  const overlapRect = findRectsOverlap(firstRect, secondRect);
  if (!overlapRect) return;
  return convertRectToItem(overlapRect);
}

function convertItemToRect(item: GridItemConfig): GridRect {
  return {
    topLeft: item.position,

    bottomRight: {
      row: item.position.row + item.size.rowSpan - 1,
      column: item.position.column + item.size.colSpan - 1,
    },
  };
}

interface GridRect {
  topLeft: GridItemPosition;
  bottomRight: GridItemPosition;
}

function getStripsAroundOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect[] {
  return [
    getStripAboveOverlap(itemRect, overlapRect),
    getStripBelowOverlap(itemRect, overlapRect),
    getStripLeftOfOverlap(itemRect, overlapRect),
    getStripRightOfOverlap(itemRect, overlapRect),
  ];
}

function isEmptyRect(rect: GridRect) {
  return (
    rect.topLeft.row > rect.bottomRight.row ||
    rect.topLeft.column > rect.bottomRight.column
  );
}

function convertRectToItem(rect: GridRect): GridItemConfig {
  return {
    parentType: "grid",
    position: rect.topLeft,

    size: {
      rowSpan: rect.bottomRight.row - rect.topLeft.row + 1,
      colSpan: rect.bottomRight.column - rect.topLeft.column + 1,
    },
  };
}

function getItemArea(item: GridItemConfig) {
  return item.size.rowSpan * item.size.colSpan;
}

function getAspectDeviation(item: GridItemConfig, reference: GridItemConfig) {
  return Math.abs(
    Math.log(item.size.colSpan / item.size.rowSpan) -
      Math.log(reference.size.colSpan / reference.size.rowSpan),
  );
}

function findRectsOverlap(first: GridRect, second: GridRect): GridRect | undefined {
  const overlap = {
    topLeft: {
      row: Math.max(first.topLeft.row, second.topLeft.row),
      column: Math.max(first.topLeft.column, second.topLeft.column),
    },

    bottomRight: {
      row: Math.min(first.bottomRight.row, second.bottomRight.row),
      column: Math.min(first.bottomRight.column, second.bottomRight.column),
    },
  };

  if (isEmptyRect(overlap)) return;
  return overlap;
}

function getStripAboveOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: itemRect.topLeft,

    bottomRight: {
      row: overlapRect.topLeft.row - 1,
      column: itemRect.bottomRight.column,
    },
  };
}

function getStripBelowOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: {
      row: overlapRect.bottomRight.row + 1,
      column: itemRect.topLeft.column,
    },

    bottomRight: itemRect.bottomRight,
  };
}

function getStripLeftOfOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: itemRect.topLeft,

    bottomRight: {
      row: itemRect.bottomRight.row,
      column: overlapRect.topLeft.column - 1,
    },
  };
}

function getStripRightOfOverlap(itemRect: GridRect, overlapRect: GridRect): GridRect {
  return {
    topLeft: {
      row: itemRect.topLeft.row,
      column: overlapRect.bottomRight.column + 1,
    },

    bottomRight: itemRect.bottomRight,
  };
}

import type { AbstractWidgetConfig } from "@/widget";
import type LineGraphConfig from "@/widgets/graphs/line-graph";

type GraphConfig = LineGraphConfig;
export default GraphConfig;

export interface AbstractGraphConfig extends AbstractWidgetConfig {
  type: "graph";
  graph: GraphType;
}

export type GraphType = "line";

export function getUnexpectedGraphTypeError(graph: never) {
  return graph ? new NonexistentGraphTypeError({ type: graph }) : new NoGraphTypeError();
}

export class NoGraphTypeError extends Error {
  public name = NoGraphTypeError.name;

  public constructor(options?: ErrorOptions) {
    super(`Graph has no type`, options);
  }
}

export class NonexistentGraphTypeError extends Error {
  public name = NonexistentGraphTypeError.name;
  public type: unknown;

  public constructor(options: ErrorOptions & { type: unknown }) {
    super(`Graph type ${String(options.type)} does not exist`, options);
    this.type = options.type;
  }
}

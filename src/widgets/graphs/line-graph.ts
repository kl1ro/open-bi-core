import type { AbstractGraphConfig } from "@/widgets/graph";

export default interface LineGraphConfig extends AbstractGraphConfig {
  graph: "line";
  children?: undefined;
}

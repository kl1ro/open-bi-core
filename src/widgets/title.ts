import type { AbstractWidgetConfig } from "@/widget";

export default interface TitleConfig extends AbstractWidgetConfig {
  type: "title";
  text: string;
  children?: undefined;
}

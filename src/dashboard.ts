import type WidgetConfig from "@/widget";
import type { WidgetConfigsById } from "@/widget";

export default interface DashboardConfig {
  widgetConfigs: WidgetConfigsById;
  rootId?: WidgetConfig["id"];
}

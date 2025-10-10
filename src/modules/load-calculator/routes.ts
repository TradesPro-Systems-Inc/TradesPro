import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "load-calculator",
    name: "ElectricalLoadCalculatorTool",
    // ✅ 最终建议：将工具放在顶层的 `tools` 目录下，以实现最佳的结构清晰度
    component: () =>
      import("@/tools/loadCalculator/LoadCalculatorDashboard.vue")
  }
];

export default routes;

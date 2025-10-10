import type { RouteRecordRaw } from "vue-router";
import loadCalculatorRoutes from "../modules/load-calculator/routes";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/IndexPage.vue") },
      // ✅ 从这里加载所有与 load-calculator 相关的路由
      ...loadCalculatorRoutes
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue")
  }
];

export default routes;

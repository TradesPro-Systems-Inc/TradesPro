import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
  path: '/',
  component: () => import('layouts/MainLayout.vue'),
  children: [
    {
      path: '', // 默认首页
      component: () => import('pages/IndexPage.vue')
    },
    {
      path: 'load-calculator',
      name: 'LoadCalculator',
      component: () => import('src/modules/loadCalculator/pages/LoadCalculatorPage.vue')
    }
  ]
}
,

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;

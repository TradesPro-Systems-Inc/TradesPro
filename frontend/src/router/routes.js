const routes = [
  // Authentication pages (no layout)
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('pages/RegisterPage.vue')
  },

  // Main app (with layout)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/CalculatorPage.vue') },
      { path: 'tables', component: () => import('pages/TablesPage.vue') },
      { path: 'user-settings', component: () => import('pages/UserSettings.vue') },
      { path: 'projects', component: () => import('pages/ProjectManagement.vue') },
      { path: 'feedback', component: () => import('pages/FeedbackPage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
// Quasar Boot File - Pinia State Management
import { boot } from 'quasar/wrappers';
import { createPinia } from 'pinia';

// Pinia persistence plugin
import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();

// Add persistence plugin for automatic localStorage sync
pinia.use(createPersistedState({
  key: (id) => `tradespro-${id}`,
  storage: localStorage,
}));

export default boot(({ app }) => {
  app.use(pinia);
});

export { pinia };



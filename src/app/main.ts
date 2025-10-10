// src/main.ts
import { createApp } from "vue";
import { Quasar } from "quasar";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createRouter, createWebHistory } from "vue-router";
import quasarLang from "quasar/lang/en-US";
import quasarIconSet from "quasar/icon-set/material-icons";
import App from "./App.vue";
import routes from "../router/routes";

const app = createApp(App);
const router = createRouter({ history: createWebHistory(), routes });
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

app.use(Quasar, {
  plugins: {},
  lang: quasarLang,
  iconSet: quasarIconSet
});
app.use(router);
app.use(pinia);
app.mount("#q-app");

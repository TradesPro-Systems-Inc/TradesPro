import { defineConfig } from "vitest/config";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import vue from "@vitejs/plugin-vue";

export default defineConfig(() => {
  return {
    test: {
      globals: true,
      environment: "happy-dom",
      // This is the new location for the inline option to fix the deprecation warning.
      server: {
        deps: {
          inline: ["@quasar/extras"]
        }
      }
    },
    plugins: [
      // This is the magic part that integrates Quasar's build config.
      vue({
        template: { transformAssetUrls }
      }),
      quasar({
        autoImportComponentCase: "pascal"
      })
    ]
  };
});

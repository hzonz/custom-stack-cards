// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/custom-stack-cards.js",
      formats: ["es"],
      fileName: () => "custom-stack-cards.js",
    },
    outDir: ".", 
    emptyOutDir: false,
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true }
    }
  },
});

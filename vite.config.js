// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Define inputs here: popup.html and contentScript.js
        popup: resolve(__dirname, "src/popup.html"),
        contentScript: resolve(__dirname, "src/contentScript.js"),
      },
      output: {
        // Ensure JavaScript and HTML assets are placed directly in dist without subfolders
        entryFileNames: "[name].js", // JS files (e.g., contentScript.js, popup.js)
        assetFileNames: "[name][extname]", // HTML and other assets (e.g., popup.html)
        dir: resolve(__dirname, "dist"), // Output directory is dist
        format: "esm", // Use ESM format for JS
        preserveModules: false, // Prevent Vite from preserving the original folder structure
      },
    },
  },
});

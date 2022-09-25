import { defineConfig } from 'vite';
// eslint-disable-next-line quotes
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});

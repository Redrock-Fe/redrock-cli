import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import postcss from "postcss-px-to-viewport";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcss({
          //视窗的宽度，对应的是我们设计稿的宽度，一般是750
          viewportWidth: 375,
          // 指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
          unitPrecision: 3,
          // 指定需要转换成的视窗单位，建议使用vw
          viewportUnit: "vw",
          // 指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
          selectorBlackList: [".ignore", ".hairlines"],
          // 小于或等于`1px`不转换为视窗单位，你也可以设置为你想要的值
          minPixelValue: 1,
          // 允许在媒体查询中转换`px`
          mediaQuery: false,
        }),
      ],
    },
  },
});

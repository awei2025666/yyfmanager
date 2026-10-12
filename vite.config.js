import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api-proxy': {
        target: 'http://hunike.nat100.top/7888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          element: ['element-plus', '@element-plus/icons-vue'],
          chart: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          http: ['axios']
        }
      }
    }
  }
})

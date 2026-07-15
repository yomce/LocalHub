import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { openAiProxyPlugin } from './server/openai-proxy.mjs'

export default defineConfig({
  plugins: [vue(), openAiProxyPlugin()],
})


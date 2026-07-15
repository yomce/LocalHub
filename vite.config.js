import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { openAiProxyPlugin } from './server/openai-proxy.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), openAiProxyPlugin(env)],
  }
})


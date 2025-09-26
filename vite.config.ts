import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { buildParserFile } from '@lezer/generator'
import fs from 'fs'

function lezerPlugin() {
  return {
    name: 'vite-plugin-lezer',
    async transform(_: string, id: string) {
      if (id.endsWith('.grammar')) {
        const grammarSource = fs.readFileSync(id, 'utf8')
        const { parser } = buildParserFile(grammarSource, {
          moduleStyle: 'es',
          exportName: 'parser'
        })
        return { code: parser, map: null }
      }
      return null
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss(), lezerPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000'
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env': {
        R2_ENDPOINT: env.R2_ENDPOINT || "https://c7b58ec191afdc0b4809c0e4e98bcceb.r2.cloudflarestorage.com",
        R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID || "6fde20f97d63c5825d6f9248e483c759",
        R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY || "fd9112ff7a683f679b8ddc54bb23dd0d93d47d12913230eb81b74c4c5cff5986",
        R2_PUBLIC_DOMAIN: env.R2_PUBLIC_DOMAIN || "https://pub-6156ea55b2304305a24cfcecaa026166.r2.dev",
        R2_BUCKET_NAME: env.R2_BUCKET_NAME || "mydigitalmenu-media"
      }
    }
  }
})
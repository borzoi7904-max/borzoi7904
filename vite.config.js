import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/borzoi7904/', // 깃허브 저장소 이름과 동일하게 설정합니다.
})

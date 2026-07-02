import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { defaultSeoConfig } from './app/configs/seo.config'

const wasmPackages = [
  '@jsquash/jpeg',
  '@jsquash/png',
  '@jsquash/webp',
  '@jsquash/oxipng',
]

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#f7f2e8' },
      ],
    },
  },
  build: {
    // @jsquash 的 codec 會載入 WASM，讓 Nuxt/Vite 先處理套件可避免部署後路徑失效。
    transpile: wasmPackages,
  },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  eslint: {
    config: {
      standalone: false,
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],
  runtimeConfig: {
    public: {
      ogImage: process.env.NUXT_PUBLIC_OG_IMAGE ?? defaultSeoConfig.ogImage,
      siteName: process.env.NUXT_PUBLIC_SITE_NAME ?? defaultSeoConfig.siteName,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? defaultSeoConfig.siteUrl,
    },
  },
  i18n: {
    defaultLocale: 'zh-TW',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'zh-TW', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    langDir: 'locales',
  },
  pwa: {
    devOptions: {
      enabled: true,
    },
    registerType: 'autoUpdate',
    manifest: {
      name: defaultSeoConfig.siteName,
      short_name: defaultSeoConfig.siteName,
      description: 'Local-first image and PDF conversion tools powered by Nuxt, WASM, and PWA.',
      theme_color: '#060b10',
      background_color: '#060b10',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,wasm}'],
      // WASM codec 比一般前端資源大，PWA 快取上限要放寬才吃得到離線能力。
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
  },
  typescript: {
    strict: true,
  },
  vite: {
    optimizeDeps: {
      // WASM 套件維持原本的動態載入流程，避免被 optimizeDeps 預打包後找不到 worker/wasm。
      exclude: wasmPackages,
    },
    plugins: [tailwindcss()],
  },
})

import tailwindcss from '@tailwindcss/vite'

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
      name: 'web file',
      short_name: 'web file',
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
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
  },
  typescript: {
    strict: true,
  },
  vite: {
    optimizeDeps: {
      exclude: wasmPackages,
    },
    plugins: [tailwindcss()],
  },
})

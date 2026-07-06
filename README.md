# web file

web file 是一個以瀏覽器端處理為核心的檔案工具網站，主要展示圖片轉檔、圖片壓縮、PDF 處理與 PWA 安裝能力。專案目標不是把檔案送到後端轉換，而是盡量在使用者瀏覽器內完成流程，讓使用者可以直接拖曳檔案、調整輸出設定、預覽結果並下載成品。

線上展示：[https://file.3854335.com](https://file.3854335.com)

## 核心功能

### 圖片工具

- 支援單張與批次圖片處理，兩種模式的設定流程分開，避免批次設定和單張設定互相干擾。
- 支援 JPEG、PNG、WebP 之間的轉檔。
- JPEG / WebP 可調整輸出品質，WebP 支援無損模式。
- PNG 使用 OxiPNG 做無損最佳化，不使用品質滑桿，避免讓使用者誤以為 PNG 可以用有損品質壓縮。
- 支援保留原尺寸、等比例縮放、百分比縮放與單張圖片裁切。
- 單張模式可修改輸出檔名，並提供裁切後的尺寸資訊。
- 圖片轉 PDF 支援頁面預覽、旋轉、邊距設定與輸出。

### PDF 工具

- 支援 PDF 合併，並可透過頁面縮圖重新排序。
- 支援 PDF 頁面擷取，可勾選需要輸出的頁面。
- 支援加入文字浮水印，可調整文字、顏色、大小、透明度與角度，並提供即時預覽。
- 支援 PDF 轉圖片輸出。
- PDF 處理流程以頁面為單位管理，方便合併、擷取與重新排序。

### PWA

- 使用 PWA 讓網站可安裝到裝置上。
- Service Worker 會快取網站靜態資源與 WASM 相關檔案，讓工具頁面在重複開啟時更快載入。
- 安裝流程透過 `beforeinstallprompt` 事件保存瀏覽器提供的安裝提示，再由自訂安裝按鈕觸發。

### 錯誤處理

- 專案有統一的錯誤格式與 error code。
- 使用 Sentry 收集未預期錯誤，並保留功能來源、嚴重程度、錯誤代碼與額外資訊。
- UI 顯示的錯誤訊息走 i18n，Sentry 端則保留穩定的英文訊息，方便後續追蹤與搜尋。

## 技術選型

- Nuxt 4、Vue 3、TypeScript
- Tailwind CSS
- Nuxt i18n
- ESLint
- `@vite-pwa/nuxt`
- `@jsquash/jpeg`、`@jsquash/png`、`@jsquash/webp`、`@jsquash/oxipng`
- `pdf-lib`
- `pdfjs-dist`
- `vue-draggable-plus`
- `@sentry/nuxt`

## 專案設計重點

這個專案的主要設計方向是 local-first。圖片與 PDF 檔案會在瀏覽器端處理，不需要上傳到後端伺服器，適合展示 WASM codec、PDF client-side workflow 與 PWA 的整合方式。

功能邏輯依照責任拆成 `components`、`composables`、`configs`、`types` 與 `utils`。畫面元件只負責呈現與觸發事件，轉檔、估算、PDF 操作、錯誤格式化等流程則放在 composable 或 util 裡，讓主要頁面不會塞滿細節邏輯。

圖片處理流程會先把來源檔案整理成可預覽與可操作的狀態，再依照輸出格式、尺寸設定、裁切資料與品質設定產生輸出。PDF 流程則以頁面資料為核心，讓合併、擷取、排序、浮水印與轉圖片都能共用同一套頁面狀態。

型別設計上以 `as const` 搭配 union type 管理模式、格式與設定值，避免 TypeScript native enum 在前端打包後產生額外 runtime code，同時保留明確的型別限制。

## 專案結構

```txt
app/
  components/      # UI 元件，包含圖片工具、PDF 工具、列表與控制面板
  composables/     # 可重用的狀態與流程邏輯
  configs/         # 固定設定、SEO、Sentry、錯誤代碼與工具選項
  i18n/            # 多語系文字
  types/           # TypeScript 型別定義
  utils/           # 純工具函式，處理檔名、檔案大小、圖片、PDF 等邏輯
public/            # PWA icon、靜態資源與公開檔案
server/            # Nuxt server 目錄
nuxt.config.ts     # Nuxt、PWA、i18n、Sentry 與 build 設定
```

## 環境變數

專案提供 `.env.example` 作為環境變數範本，實際本機設定放在 `.env`，不會提交到版本控制。

```env
NUXT_PUBLIC_SITE_URL=
NUXT_PUBLIC_SITE_NAME=
NUXT_PUBLIC_OG_IMAGE=
NUXT_PUBLIC_SENTRY_DSN=
NUXT_PUBLIC_SENTRY_ENABLED=
```

- `NUXT_PUBLIC_SITE_URL`：網站正式網址，用於 SEO canonical、OG URL 等設定。
- `NUXT_PUBLIC_SITE_NAME`：網站名稱。
- `NUXT_PUBLIC_OG_IMAGE`：社群分享用圖片。
- `NUXT_PUBLIC_SENTRY_DSN`：Sentry 專案 DSN。
- `NUXT_PUBLIC_SENTRY_ENABLED`：是否啟用 Sentry。通常本機開發會設為 `false`。

## 開發指令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

import type { ImageMode } from '~/types/file-tool.type'
import { ImageModeValue } from '~/types/file-tool.type'

export function useImageEstimate(params: {
  estimateOutputSizes: () => Promise<Array<{ index: number, size: number }>>
  files: Ref<File[]>
  imageMode: Ref<ImageMode>
  signature: ComputedRef<string>
}) {
  const estimatedOutputSizes = ref<number[]>([])
  const isEstimatePending = ref(false)
  let estimateTimer: ReturnType<typeof setTimeout> | null = null
  let estimateRequestId = 0

  watch(() => [params.imageMode.value, params.signature.value], scheduleEstimate, { immediate: true })

  function scheduleEstimate() {
    clearEstimate()

    if (estimateTimer)
      clearTimeout(estimateTimer)

    if (!params.files.value.length || params.imageMode.value === ImageModeValue.Pdf)
      return

    // requestId 用來擋已經開始但過期的 async 估算。
    const requestId = ++estimateRequestId
    estimateTimer = setTimeout(async () => {
      isEstimatePending.value = true
      await waitForEstimateSlot()

      // 檢查這次估算的版本號是不是最新版本。
      if (requestId !== estimateRequestId)
        return

      const sizes = await params.estimateOutputSizes().catch(() => [])

      // encode 回來時再確認一次，避免慢回來的舊結果覆蓋新設定。
      if (requestId === estimateRequestId) {
        const nextSizes: number[] = []

        for (const item of sizes)
          nextSizes[item.index] = item.size

        estimatedOutputSizes.value = nextSizes
        isEstimatePending.value = false
      }
    }, 450)
  }

  function waitForEstimateSlot() {
    if (!import.meta.client)
      return Promise.resolve()

    return new Promise<void>((resolve) => {
      // 先等下一個 frame，讓「估算中」狀態有機會畫到畫面上。
      const resolveAfterFrame = () => window.requestAnimationFrame(() => resolve())

      // 有空閒時間就晚一點做重的 encode；最多等 500ms，避免一直不估算。
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(resolveAfterFrame, { timeout: 500 })
        return
      }

      // Safari 等環境沒有 requestIdleCallback，至少先讓出目前這輪 JS。
      globalThis.setTimeout(resolveAfterFrame, 0)
    })
  }

  function clearEstimate() {
    estimatedOutputSizes.value = []
    isEstimatePending.value = false
    estimateRequestId += 1
  }

  onBeforeUnmount(() => {
    if (estimateTimer)
      clearTimeout(estimateTimer)
  })

  return {
    clearEstimate,
    estimatedOutputSizes,
    isEstimatePending,
    scheduleEstimate,
  }
}

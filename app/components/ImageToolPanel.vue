<script setup lang="ts">
import type { ImageCropSelection, ImageMode, ImageOutputFormat, ImageTransformOptions } from '~/types/file-tool.type'
import { Play, Trash2 } from '@lucide/vue'
import { defaultImagePdfOptions } from '~/configs/file-tool.config'
import { ImageModeValue, ImageOutputFormatValue, ImageResizeModeValue } from '~/types/file-tool.type'

const { t } = useI18n()
const {
  addFiles,
  canConvert,
  clear,
  clearSingleCropSelection,
  clearResults,
  convert,
  convertToPdf,
  error,
  estimateOutputSizes,
  files,
  isProcessing,
  options,
  pdfResults,
  previews,
  removeFile,
  resetOptions,
  results,
  setSingleCropSelection,
} = useImageTranscoder()

const imageMode = ref<ImageMode>(ImageModeValue.Batch)
const imagePdfOptions = reactive({ ...defaultImagePdfOptions })
const estimatedOutputSizes = ref<number[]>([])
const isEstimatePending = ref(false)
const isCropEditorOpen = ref(false)
let estimateTimer: ReturnType<typeof setTimeout> | null = null
let estimateRequestId = 0

const activeReference = computed(() => previews.value.length === 1 ? previews.value[0] ?? null : null)
const activeCropPreview = computed(() => isCropEditorOpen.value ? previews.value[0] ?? null : null)
const outputExtensions = computed(() => getOutputExtensions(options.format))
const hasSameExtensionWarning = computed(() => files.value.some(file => getFileExtension(file.name) !== '' && outputExtensions.value.includes(getFileExtension(file.name))))
const activeAspectRatio = computed(() => {
  const preview = activeReference.value

  if (!preview)
    return null

  return preview.width > 0 && preview.height > 0 ? preview.width / preview.height : null
})
const originalSizeReference = computed(() => files.value.reduce((total, file) => total + file.size, 0))
const outputSizeReference = computed(() => {
  const estimatedSize = estimatedOutputSizes.value.reduce((total, size) => total + size, 0)

  if (estimatedSize)
    return estimatedSize

  return results.value.reduce((total, result) => total + result.outputSize, 0)
})
const summaryDelta = computed(() => {
  if (!originalSizeReference.value || !outputSizeReference.value)
    return null

  return createSizeDelta(originalSizeReference.value, outputSizeReference.value)
})
const previewEstimates = computed(() => previews.value.map((preview, index) => {
  const result = results.value.find(item => item.sourceName === preview.file.name)
  const outputSize = estimatedOutputSizes.value[index] || result?.outputSize || 0

  return {
    outputSize,
    delta: outputSize ? createSizeDelta(preview.file.size, outputSize) : null,
  }
}))

watch(() => [
  imageMode.value,
  previews.value.map(preview => `${preview.id}:${preview.width}:${preview.height}`).join('|'),
], scheduleEstimate, { immediate: true })

function setImageMode(mode: ImageMode) {
  if (imageMode.value === mode)
    return

  imageMode.value = mode
  clear()
  resetOptions()
  options.resizeMode = mode === ImageModeValue.Single ? ImageResizeModeValue.Dimensions : ImageResizeModeValue.Percent
  Object.assign(imagePdfOptions, defaultImagePdfOptions)
  isCropEditorOpen.value = false
  clearEstimate()
}

function handleImageFiles(fileList: FileList | File[]) {
  addFiles(fileList, imageMode.value === ImageModeValue.Single)
  isCropEditorOpen.value = false
}

function patchCurrentOptions(patch: Partial<ImageTransformOptions>) {
  clearEstimate()
  Object.assign(options, patch)
  clearResults()
}

function updateWidth(event: Event) {
  const width = Math.max(1, Number((event.target as HTMLInputElement).value) || 1)
  const patch: Partial<ImageTransformOptions> = { maxWidth: width }

  if (activeAspectRatio.value)
    patch.maxHeight = Math.max(1, Math.round(width / activeAspectRatio.value))

  patchCurrentOptions(patch)
}

function updateHeight(event: Event) {
  const height = Math.max(1, Number((event.target as HTMLInputElement).value) || 1)
  const patch: Partial<ImageTransformOptions> = { maxHeight: height }

  if (activeAspectRatio.value)
    patch.maxWidth = Math.max(1, Math.round(height * activeAspectRatio.value))

  patchCurrentOptions(patch)
}

function updateResizePercent(event: Event) {
  patchCurrentOptions({ resizePercent: Math.max(1, Math.min(100, Number((event.target as HTMLInputElement).value) || 100)) })
}

function setResizeMode(resizeMode: ImageTransformOptions['resizeMode']) {
  patchCurrentOptions({ resizeMode })
  scheduleEstimate()
}

function updateQuality(event: Event) {
  patchCurrentOptions({ quality: Math.max(1, Math.min(100, Number((event.target as HTMLInputElement).value) || 1)) })
}

function commitEstimate() {
  scheduleEstimate()
}

function updateFormat(event: Event) {
  patchCurrentOptions({ format: (event.target as HTMLSelectElement).value as ImageOutputFormat })
  scheduleEstimate()
}

function updateOutputFileName(event: Event) {
  patchCurrentOptions({ outputFileName: (event.target as HTMLInputElement).value })
}

function setPreserveDimensions(preserveDimensions: boolean) {
  patchCurrentOptions({ preserveDimensions })
  scheduleEstimate()
}

function setProportionalResize() {
  patchCurrentOptions({
    preserveDimensions: false,
    resizeMode: imageMode.value === ImageModeValue.Batch ? ImageResizeModeValue.Percent : ImageResizeModeValue.Dimensions,
  })
  scheduleEstimate()
}

function saveCrop(crop: ImageCropSelection) {
  if (!activeCropPreview.value)
    return

  setSingleCropSelection(crop)
  isCropEditorOpen.value = false
  scheduleEstimate()
}

function clearCrop() {
  if (!activeCropPreview.value)
    return

  clearSingleCropSelection()
  isCropEditorOpen.value = false
  scheduleEstimate()
}

function setOptimisePng(optimisePng: boolean) {
  patchCurrentOptions({ optimisePng })
  scheduleEstimate()
}

function setWebpLossless(webpLossless: boolean) {
  patchCurrentOptions(webpLossless ? { webpLossless, quality: 100 } : { webpLossless })
  scheduleEstimate()
}

function scheduleEstimate() {
  clearEstimate()

  if (estimateTimer)
    clearTimeout(estimateTimer)

  if (!files.value.length || imageMode.value === ImageModeValue.Pdf)
    return

  // requestId 用來擋已經開始但過期的 async 估算。
  const requestId = ++estimateRequestId
  estimateTimer = setTimeout(async () => {
    isEstimatePending.value = true
    await waitForEstimateSlot()

    // 檢查這次估算的版本號是不是最新版本。
    if (requestId !== estimateRequestId)
      return

    const sizes = await estimateOutputSizes().catch(() => [])

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

function createSizeDelta(sourceSize: number, outputSize: number) {
  const change = outputSize - sourceSize

  if (change === 0)
    return { type: 'same' as const, percent: 0 }

  const percent = Math.round(Math.abs(change) / sourceSize * 100)

  return {
    type: change > 0 ? 'larger' as const : 'saved' as const,
    percent: outputSize > 0 && change < 0 && percent >= 100 ? 99 : percent,
  }
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function getOutputExtensions(format: ImageOutputFormat) {
  if (format === ImageOutputFormatValue.Jpeg)
    return ['jpg', 'jpeg']

  return [format]
}

function updateImagePdfPageSize(event: Event) {
  imagePdfOptions.pageSize = (event.target as HTMLSelectElement).value as typeof imagePdfOptions.pageSize
  clearResults()
}

function updateImagePdfFitMode(event: Event) {
  imagePdfOptions.fitMode = (event.target as HTMLSelectElement).value as typeof imagePdfOptions.fitMode
  clearResults()
}

function updateImagePdfMargin(event: Event) {
  imagePdfOptions.margin = Math.max(0, Number((event.target as HTMLInputElement).value) || 0)
  clearResults()
}

function runImageAction() {
  if (imageMode.value === ImageModeValue.Pdf) {
    convertToPdf(imagePdfOptions)
    return
  }

  convert()
}
</script>

<template>
  <section class="grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.35fr)]">
    <ImageSourcePanel :image-mode="imageMode" :preview-estimates="previewEstimates" :previews="previews" @files-added="handleImageFiles" @mode-changed="setImageMode" @remove-file="removeFile" />

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_var(--fx-sky-7)] backdrop-blur">
      <template v-if="imageMode !== ImageModeValue.Pdf">
        <ImageConversionControls
          :has-same-extension-warning="hasSameExtensionWarning"
          :image-mode="imageMode"
          :is-estimate-pending="isEstimatePending"
          :options="options"
          :original-size-reference="originalSizeReference"
          :output-size-reference="outputSizeReference"
          :previews="previews"
          :summary-delta="summaryDelta"
          @commit-estimate="commitEstimate"
          @open-crop="isCropEditorOpen = true"
          @set-optimise-png="setOptimisePng"
          @set-preserve-dimensions="setPreserveDimensions"
          @set-proportional-resize="setProportionalResize"
          @set-resize-mode="setResizeMode"
          @set-webp-lossless="setWebpLossless"
          @update-format="updateFormat"
          @update-height="updateHeight"
          @update-output-file-name="updateOutputFileName"
          @update-quality="updateQuality"
          @update-resize-percent="updateResizePercent"
          @update-width="updateWidth"
        />
      </template>

      <ImagePdfControls v-else :options="imagePdfOptions" @update-fit-mode="updateImagePdfFitMode" @update-margin="updateImagePdfMargin" @update-page-size="updateImagePdfPageSize" />

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_var(--fx-acid-18)] transition hover:bg-acid/85 disabled:opacity-50"
          :disabled="!canConvert"
          @click="runImageAction"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing ? t('common.processing') : imageMode === ImageModeValue.Pdf ? t('image.createPdf') : t('image.convert') }}
        </button>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 border border-line bg-grid px-5 py-3 font-mono text-sm font-black text-ink/70 transition hover:border-coral hover:text-coral"
          @click="clear"
        >
          <Trash2 class="size-4" aria-hidden="true" />
          {{ t('common.clear') }}
        </button>
      </div>

      <p v-if="error" class="border border-coral bg-coral/12 px-3 py-2 font-mono text-sm font-bold text-coral">
        {{ error }}
      </p>

      <p v-if="!results.length && !pdfResults.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-sm font-bold text-ink/42">
        {{ t('image.empty') }}
      </p>
      <ResultList v-else :image-results="results" :pdf-results="pdfResults" />
    </div>

    <ImageCropEditor v-if="activeCropPreview" :preview="activeCropPreview" @clear="clearCrop" @close="isCropEditorOpen = false" @save="saveCrop" />
  </section>
</template>

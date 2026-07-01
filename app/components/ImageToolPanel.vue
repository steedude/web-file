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
const isCropEditorOpen = ref(false)

const activeReference = computed(() => previews.value.length === 1 ? previews.value[0] ?? null : null)
const activeCropPreview = computed(() => isCropEditorOpen.value ? previews.value[0] ?? null : null)
const outputExtensions = computed(() => getOutputExtensions(options.format))
const hasSameExtensionWarning = computed(() => files.value.some(file => getFileExtension(file.name) !== '' && outputExtensions.value.includes(getFileExtension(file.name))))
const activeAspectRatio = computed(() => {
  const preview = activeReference.value

  if (!preview)
    return null

  const width = preview.crop?.width ?? preview.width
  const height = preview.crop?.height ?? preview.height

  return width > 0 && height > 0 ? width / height : null
})
const estimateSignature = computed(() => JSON.stringify({
  crops: previews.value.map(preview => preview.crop ?? null),
  files: files.value.map(file => `${file.name}:${file.size}:${file.lastModified}`),
  format: options.format,
  maxHeight: options.maxHeight,
  maxWidth: options.maxWidth,
  optimisePng: options.optimisePng,
  preserveDimensions: options.preserveDimensions,
  quality: options.quality,
  resizeMode: options.resizeMode,
  resizePercent: options.resizePercent,
  webpLossless: options.webpLossless,
}))
const {
  clearEstimate,
  estimatedOutputSizes,
  isEstimatePending,
  scheduleEstimate,
} = useImageEstimate({
  estimateOutputSizes,
  files,
  imageMode,
  signature: estimateSignature,
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

function setImageMode(mode: ImageMode) {
  if (imageMode.value === mode)
    return

  imageMode.value = mode
  clear()
  resetOptions()
  Object.assign(imagePdfOptions, defaultImagePdfOptions)
  isCropEditorOpen.value = false
  clearEstimate()
}

function handleImageFiles(fileList: FileList | File[]) {
  if (imageMode.value === ImageModeValue.Single || files.value.length === 0)
    resetOptions()

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
}

function updateQuality(event: Event) {
  patchCurrentOptions({ quality: Math.max(1, Math.min(100, Number((event.target as HTMLInputElement).value) || 1)) })
}

function commitEstimate() {
  scheduleEstimate()
}

function updateFormat(event: Event) {
  patchCurrentOptions({ format: (event.target as HTMLSelectElement).value as ImageOutputFormat })
}

function updateOutputFileName(event: Event) {
  patchCurrentOptions({ outputFileName: (event.target as HTMLInputElement).value })
}

function setPreserveDimensions(preserveDimensions: boolean) {
  patchCurrentOptions({ preserveDimensions })
}

function setProportionalResize() {
  patchCurrentOptions({
    preserveDimensions: false,
    resizeMode: imageMode.value === ImageModeValue.Batch ? ImageResizeModeValue.Percent : ImageResizeModeValue.Dimensions,
  })
}

function saveCrop(crop: ImageCropSelection) {
  if (!activeCropPreview.value)
    return

  patchCurrentOptions({
    maxHeight: crop.height,
    maxWidth: crop.width,
  })
  setSingleCropSelection(crop)
  isCropEditorOpen.value = false
}

function clearCrop() {
  if (!activeCropPreview.value)
    return

  clearSingleCropSelection()
  isCropEditorOpen.value = false
}

function setOptimisePng(optimisePng: boolean) {
  patchCurrentOptions({ optimisePng })
}

function setWebpLossless(webpLossless: boolean) {
  patchCurrentOptions(webpLossless ? { webpLossless, quality: 100 } : { webpLossless })
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

      <p v-if="!results.length && !pdfResults.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-base font-bold text-ink/52">
        {{ t('image.resultEmpty') }}
      </p>
      <ResultList v-else :image-results="results" :pdf-results="pdfResults" />
    </div>

    <ImageCropEditor v-if="activeCropPreview" :preview="activeCropPreview" @clear="clearCrop" @close="isCropEditorOpen = false" @save="saveCrop" />
  </section>
</template>

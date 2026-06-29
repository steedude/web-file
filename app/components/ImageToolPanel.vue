<script setup lang="ts">
import type { ImageCropSelection, ImageMode, ImageOutputFormat, ImageTransformOptions } from '~/types/file-tool.type'
import { Image, Play, Scissors, Trash2 } from '@lucide/vue'
import { defaultImagePdfOptions, imageCropPositionOptions, imageFormatOptions, imagePdfFitModeOptions, imagePdfPageSizeOptions } from '~/configs/file-tool.config'
import { formatFileSize } from '~/utils/file-size.util'

const { t } = useI18n()
const {
  addFiles,
  canConvert,
  clear,
  clearCropSelection,
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
  setCropSelection,
} = useImageTranscoder()

const imageMode = ref<ImageMode>('batch')
const imagePdfOptions = reactive({ ...defaultImagePdfOptions })
const estimatedOutputSizes = ref<number[]>([])
const isEstimatePending = ref(false)
const cropEditorIndex = ref<number | null>(null)
let estimateTimer: ReturnType<typeof setTimeout> | null = null
let estimateRequestId = 0

const displayedQuality = computed(() => options.webpLossless ? 100 : options.quality)
const activeReference = computed(() => previews.value.length === 1 ? previews.value[0] ?? null : null)
const activeCropPreview = computed(() => cropEditorIndex.value === null ? null : previews.value[cropEditorIndex.value] ?? null)
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
  options.resizeMode = mode === 'single' ? 'dimensions' : 'percent'
  Object.assign(imagePdfOptions, defaultImagePdfOptions)
  cropEditorIndex.value = null
  clearEstimate()
}

function handleImageFiles(fileList: FileList | File[]) {
  addFiles(fileList, imageMode.value === 'single')
  cropEditorIndex.value = null
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

function updateCropPosition(event: Event) {
  if (imageMode.value !== 'batch')
    return

  patchCurrentOptions({ cropPosition: (event.target as HTMLSelectElement).value as ImageTransformOptions['cropPosition'] })
  scheduleEstimate()
}

function setPreserveDimensions(preserveDimensions: boolean) {
  patchCurrentOptions({ preserveDimensions, cropPosition: preserveDimensions ? 'none' : options.cropPosition })
  scheduleEstimate()
}

function setProportionalResize() {
  patchCurrentOptions({
    preserveDimensions: false,
    resizeMode: imageMode.value === 'batch' ? 'percent' : 'dimensions',
  })
  scheduleEstimate()
}

function saveCrop(crop: ImageCropSelection) {
  if (cropEditorIndex.value === null)
    return

  setCropSelection(cropEditorIndex.value, crop)
  cropEditorIndex.value = null
  scheduleEstimate()
}

function clearCrop() {
  if (cropEditorIndex.value === null)
    return

  clearCropSelection(cropEditorIndex.value)
  cropEditorIndex.value = null
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

  if (!files.value.length || imageMode.value === 'pdf')
    return

  const requestId = ++estimateRequestId
  estimateTimer = setTimeout(async () => {
    isEstimatePending.value = true
    await waitForEstimateSlot()

    if (requestId !== estimateRequestId)
      return

    const sizes = await estimateOutputSizes().catch(() => [])

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
    const resolveAfterFrame = () => window.requestAnimationFrame(() => resolve())

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(resolveAfterFrame, { timeout: 500 })
      return
    }

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

function getDeltaLabel(delta: { type: 'larger' | 'saved' | 'same', percent: number } | null) {
  if (!delta)
    return t('image.waitingEstimate')

  if (delta.type === 'same')
    return t('image.unchanged')

  return `${delta.type === 'larger' ? t('image.largerReference') : t('image.savedReference')} ${delta.percent}${t('common.percent')}`
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function getOutputExtensions(format: ImageOutputFormat) {
  if (format === 'jpeg')
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
  if (imageMode.value === 'pdf') {
    convertToPdf(imagePdfOptions)
    return
  }

  convert()
}
</script>

<template>
  <section class="grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.35fr)]">
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <span class="grid size-11 shrink-0 place-items-center border border-sky/70 bg-sky/12 text-sky shadow-[0_0_28px_rgb(72_215_255_/_14%)]">
          <Image class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-mono text-2xl font-black tracking-tight text-ink">
            {{ t('image.title') }}
          </h2>
          <p class="mt-2 text-sm leading-6 font-semibold text-ink/52">
            {{ t('image.description') }}
          </p>
        </div>
      </div>

      <div class="border border-line bg-panel/82 p-1 shadow-[0_0_34px_rgb(72_215_255_/_7%)]">
        <div class="grid grid-cols-3 gap-1">
          <button
            type="button"
            class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
            :aria-pressed="imageMode === 'batch'"
            :class="imageMode === 'batch' ? 'border-sky bg-sky text-paper shadow-[0_0_22px_rgb(72_215_255_/_18%)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
            @click="setImageMode('batch')"
          >
            {{ t('image.batchSettings') }}
          </button>
          <button
            type="button"
            class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
            :aria-pressed="imageMode === 'single'"
            :class="imageMode === 'single' ? 'border-sky bg-sky text-paper shadow-[0_0_22px_rgb(72_215_255_/_18%)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
            @click="setImageMode('single')"
          >
            {{ t('image.singleSettings') }}
          </button>
          <button
            type="button"
            class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
            :aria-pressed="imageMode === 'pdf'"
            :class="imageMode === 'pdf' ? 'border-sky bg-sky text-paper shadow-[0_0_22px_rgb(72_215_255_/_18%)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-sky/70 hover:text-sky'"
            @click="setImageMode('pdf')"
          >
            {{ t('image.pdfSettings') }}
          </button>
        </div>
      </div>

      <FileDropZone accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" :label="t('common.dropFiles')" :multiple="imageMode !== 'single'" @files="handleImageFiles" />
      <ImagePreviewList :allow-crop="imageMode === 'single'" :compact="imageMode !== 'single'" :estimates="previewEstimates" :previews="previews" @remove="removeFile" />
      <FileList v-if="!previews.length" :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_rgb(72_215_255_/_7%)] backdrop-blur">
      <template v-if="imageMode !== 'pdf'">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="grid grid-rows-[auto_2.25rem] gap-2">
            <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFormat') }}</span>
            <select :value="options.format" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateFormat">
              <option v-for="format in imageFormatOptions" :key="format.value" :value="format.value">
                {{ format.value.toUpperCase() }}
              </option>
            </select>
          </label>

          <div>
            <div v-if="options.format === 'webp'">
              <label class="grid grid-rows-[auto_2.25rem] gap-2">
                <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ displayedQuality }}</span>
                <input :value="displayedQuality" class="h-9 w-full accent-acid disabled:opacity-40" type="range" min="1" max="100" :disabled="options.webpLossless" @change="commitEstimate" @input="updateQuality">
              </label>
            </div>

            <label v-else-if="options.format === 'jpeg'" class="grid grid-rows-[auto_2.25rem] gap-2">
              <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ options.quality }}</span>
              <input :value="options.quality" class="h-9 w-full accent-acid" type="range" min="1" max="100" @change="commitEstimate" @input="updateQuality">
            </label>

            <div v-else class="grid grid-rows-[auto_2.25rem] gap-2">
              <span class="flex h-4 items-center font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pngQualityTitle') }}</span>
              <div class="flex items-center border border-line bg-grid px-3 font-mono text-xs font-bold text-ink/42">
                {{ t('image.pngQualityUnavailable') }}
              </div>
            </div>
          </div>
        </div>

        <label v-if="options.format === 'png'" class="block space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.losslessPng') }}</span>
          <span class="inline-flex w-full items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
            <input :checked="options.optimisePng" type="checkbox" class="size-4 accent-acid" @change="setOptimisePng(($event.target as HTMLInputElement).checked)">
            {{ t('image.optimisePng') }}
          </span>
        </label>

        <label v-if="options.format === 'webp'" class="block space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.webpLossless') }}</span>
          <span class="inline-flex w-full items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
            <input :checked="options.webpLossless" type="checkbox" class="size-4 accent-acid" @change="setWebpLossless(($event.target as HTMLInputElement).checked)">
            {{ t('image.enableWebpLossless') }}
          </span>
        </label>

        <p v-if="hasSameExtensionWarning" class="border border-coral/70 bg-coral/12 px-3 py-2 font-mono text-xs font-black text-coral">
          {{ t('image.sameExtensionWarning') }}
        </p>

        <label v-if="imageMode === 'single' && previews.length" class="block space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFileName') }}</span>
          <input
            :value="options.outputFileName"
            class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink"
            type="text"
            autocomplete="off"
            spellcheck="false"
            @input="updateOutputFileName"
          >
        </label>

        <div class="grid gap-2 font-mono text-xs font-bold text-ink md:grid-cols-3">
          <span class="border border-line/70 bg-paper/70 px-3 py-2">
            <span class="block text-ink/42"><template v-if="imageMode === 'batch'">{{ t('image.batchSummary') }} </template>{{ t('image.sourceSize') }}</span>
            <span class="mt-1 block text-sm font-black text-ink">{{ formatFileSize(originalSizeReference) }}</span>
          </span>
          <span class="border border-line/70 bg-paper/70 px-3 py-2">
            <span class="block text-ink/42">{{ t('image.outputSizeReference') }}</span>
            <span class="mt-1 block text-sm font-black text-ink">{{ isEstimatePending ? t('image.estimating') : outputSizeReference ? formatFileSize(outputSizeReference) : t('image.waitingEstimate') }}</span>
          </span>
          <span v-if="summaryDelta" class="border px-3 py-2" :class="summaryDelta.type === 'larger' ? 'border-coral/60 bg-coral/12 text-coral' : summaryDelta.type === 'saved' ? 'border-acid/60 bg-acid/12 text-acid' : 'border-line/70 bg-paper/70 text-ink/62'">
            <span class="block text-current/70">{{ summaryDelta.type === 'larger' ? t('image.largerReference') : summaryDelta.type === 'saved' ? t('image.savedReference') : t('image.unchanged') }}</span>
            <span class="mt-1 block text-sm font-black">{{ getDeltaLabel(summaryDelta) }}</span>
          </span>
        </div>

        <button
          v-if="imageMode === 'single' && previews.length"
          type="button"
          class="focus-ring inline-flex w-max items-center gap-2 border border-line bg-grid px-4 py-2 font-mono text-xs font-black text-ink/70 transition hover:border-sky hover:text-sky"
          @click="cropEditorIndex = 0"
        >
          <Scissors class="size-4" aria-hidden="true" />
          {{ t('image.crop') }}
        </button>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
            :class="options.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            @click="setPreserveDimensions(true)"
          >
            {{ t('image.keepOriginal') }}
          </button>
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
            :class="!options.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            @click="setProportionalResize"
          >
            {{ t('image.proportionalResize') }}
          </button>
        </div>

        <div v-if="imageMode === 'single' && !options.preserveDimensions" class="grid grid-cols-2 gap-2 md:w-max">
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
            :class="options.resizeMode === 'dimensions' ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            @click="setResizeMode('dimensions')"
          >
            {{ t('image.resizeByPixels') }}
          </button>
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
            :class="options.resizeMode === 'percent' ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            @click="setResizeMode('percent')"
          >
            {{ t('image.resizeByPercent') }}
          </button>
        </div>

        <label v-if="!options.preserveDimensions && options.resizeMode === 'percent'" class="block space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.resizePercent') }} {{ t('common.dot') }} {{ options.resizePercent }}{{ t('common.percent') }}</span>
          <input :value="options.resizePercent" class="w-full accent-acid" type="range" min="1" max="100" step="1" @change="commitEstimate" @input="updateResizePercent">
        </label>

        <div v-if="imageMode === 'single' && options.resizeMode === 'dimensions'" class="grid gap-4 md:grid-cols-2">
          <label class="space-y-2">
            <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.width') }}</span>
            <input
              :value="options.maxWidth"
              class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink disabled:opacity-40"
              type="number"
              min="1"
              step="1"
              :disabled="options.preserveDimensions"
              @input="updateWidth"
            >
          </label>

          <label class="space-y-2">
            <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.height') }}</span>
            <input
              :value="options.maxHeight"
              class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink disabled:opacity-40"
              type="number"
              min="1"
              step="1"
              :disabled="options.preserveDimensions"
              @input="updateHeight"
            >
          </label>
        </div>

        <label v-if="imageMode === 'batch' && !options.preserveDimensions && options.resizeMode === 'dimensions'" class="block space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.cropPosition') }}</span>
          <select :value="options.cropPosition" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateCropPosition">
            <option v-for="position in imageCropPositionOptions" :key="position" :value="position">
              {{ t(`image.cropPositions.${position}`) }}
            </option>
          </select>
          <span v-if="imageMode === 'batch' && previews.length > 1" class="block font-mono text-xs font-bold text-ink/42">
            {{ t('image.batchRatioHint') }}
          </span>
        </label>
      </template>

      <div v-else class="grid gap-4 md:grid-cols-3">
        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfPageSize') }}</span>
          <select :value="imagePdfOptions.pageSize" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateImagePdfPageSize">
            <option v-for="pageSize in imagePdfPageSizeOptions" :key="pageSize" :value="pageSize">
              {{ t(`image.pdfPageSizes.${pageSize}`) }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfFitMode') }}</span>
          <select :value="imagePdfOptions.fitMode" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateImagePdfFitMode">
            <option v-for="fitMode in imagePdfFitModeOptions" :key="fitMode" :value="fitMode">
              {{ t(`image.pdfFitModes.${fitMode}`) }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.pdfMargin') }}</span>
          <input :value="imagePdfOptions.margin" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" type="number" min="0" step="8" @input="updateImagePdfMargin">
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_rgb(109_255_157_/_18%)] transition hover:bg-acid/85 disabled:opacity-50"
          :disabled="!canConvert"
          @click="runImageAction"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing ? t('common.processing') : imageMode === 'pdf' ? t('image.createPdf') : t('image.convert') }}
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

    <ImageCropEditor v-if="activeCropPreview" :preview="activeCropPreview" @clear="clearCrop" @close="cropEditorIndex = null" @save="saveCrop" />
  </section>
</template>

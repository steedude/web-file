<script setup lang="ts">
import type { ImageTransformOptions } from '~/types/file-tool.type'
import { Image, Play, Trash2 } from '@lucide/vue'
import { imageFormatOptions } from '~/configs/file-tool.config'
import { formatFileSize } from '~/utils/file-size.util'

const { t } = useI18n()
const {
  addFiles,
  canConvert,
  clearCropSelection,
  clearPreviewOptions,
  clear,
  clearResults,
  convert,
  error,
  files,
  isProcessing,
  options,
  previews,
  removeFile,
  results,
  setPreviewOptions,
  setCropSelection,
} = useImageTranscoder()

const settingsScope = ref<'batch' | 'single'>('batch')
const selectedPreviewIndex = ref(0)
const cropEditorIndex = ref<number | null>(null)
const activeCropPreview = computed(() => cropEditorIndex.value === null ? null : previews.value[cropEditorIndex.value] ?? null)
const selectedPreview = computed(() => previews.value[selectedPreviewIndex.value] ?? null)
const currentOptions = computed(() => settingsScope.value === 'single' ? selectedPreview.value?.options ?? options : options)
const displayedQuality = computed(() => currentOptions.value.webpLossless ? 100 : currentOptions.value.quality)
const activeReference = computed(() => {
  if (settingsScope.value === 'single')
    return selectedPreview.value

  return previews.value.length === 1 ? previews.value[0] ?? null : null
})
const activeAspectRatio = computed(() => {
  const preview = activeReference.value

  if (!preview)
    return null

  const width = preview.crop?.width || preview.width
  const height = preview.crop?.height || preview.height

  return width > 0 && height > 0 ? width / height : null
})
const originalSizeReference = computed(() => {
  if (settingsScope.value === 'single')
    return selectedPreview.value?.file.size ?? 0

  return files.value.reduce((total, file) => total + file.size, 0)
})
const outputSizeReference = computed(() => {
  if (settingsScope.value === 'single')
    return results.value[selectedPreviewIndex.value]?.outputSize ?? 0

  return results.value.reduce((total, result) => total + result.outputSize, 0)
})
const savedPercentReference = computed(() => {
  if (!originalSizeReference.value || !outputSizeReference.value)
    return null

  return Math.round((1 - outputSizeReference.value / originalSizeReference.value) * 100)
})

watch([settingsScope, selectedPreviewIndex, previews], () => {
  if (selectedPreviewIndex.value >= previews.value.length)
    selectedPreviewIndex.value = Math.max(0, previews.value.length - 1)

  if (settingsScope.value === 'single' && selectedPreview.value && !selectedPreview.value.options)
    setPreviewOptions(selectedPreviewIndex.value, options)
}, { immediate: true })

function setSettingsScope(scope: 'batch' | 'single') {
  settingsScope.value = scope

  if (scope === 'single' && selectedPreview.value && !selectedPreview.value.options)
    setPreviewOptions(selectedPreviewIndex.value, options)
}

function selectSingleImage(index: number) {
  selectedPreviewIndex.value = index
  settingsScope.value = 'single'

  if (previews.value[index] && !previews.value[index]?.options)
    setPreviewOptions(index, options)
}

function patchCurrentOptions(patch: Partial<ImageTransformOptions>) {
  Object.assign(currentOptions.value, patch)

  if (settingsScope.value === 'single')
    setPreviewOptions(selectedPreviewIndex.value, currentOptions.value)
  else
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

function setPreserveDimensions(preserveDimensions: boolean) {
  patchCurrentOptions({ preserveDimensions })
}

function resetSingleSettings() {
  clearPreviewOptions(selectedPreviewIndex.value)
  settingsScope.value = 'batch'
}

function saveCrop(crop: { x: number, y: number, width: number, height: number }) {
  if (cropEditorIndex.value === null)
    return

  setCropSelection(cropEditorIndex.value, crop)
  cropEditorIndex.value = null
}

function clearCrop() {
  if (cropEditorIndex.value === null)
    return

  clearCropSelection(cropEditorIndex.value)
  cropEditorIndex.value = null
}
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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

      <FileDropZone accept="image/*" :label="t('common.dropFiles')" @files="addFiles" />
      <ImagePreviewList :previews="previews" @crop="cropEditorIndex = $event" @customise="selectSingleImage" @remove="removeFile" />
      <FileList v-if="!previews.length" :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_rgb(72_215_255_/_7%)] backdrop-blur">
      <div class="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
            :class="settingsScope === 'batch' ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            @click="setSettingsScope('batch')"
          >
            {{ t('image.batchSettings') }}
          </button>
          <button
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-xs font-black transition disabled:opacity-40"
            :class="settingsScope === 'single' ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
            :disabled="!previews.length"
            @click="setSettingsScope('single')"
          >
            {{ t('image.singleSettings') }}
          </button>
        </div>

        <div v-if="settingsScope === 'single' && previews.length" class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <select v-model.number="selectedPreviewIndex" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-xs font-bold text-ink">
            <option v-for="(preview, index) in previews" :key="preview.id" :value="index">
              {{ preview.file.name }}
            </option>
          </select>
          <button type="button" class="focus-ring border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/62 hover:border-coral hover:text-coral" @click="resetSingleSettings">
            {{ t('image.useBatchSettings') }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFormat') }}</span>
          <select v-model="currentOptions.format" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="patchCurrentOptions({})">
            <option v-for="format in imageFormatOptions" :key="format.value" :value="format.value">
              {{ format.value.toUpperCase() }}
            </option>
          </select>
        </label>

        <div class="min-h-[4.25rem] space-y-2">
          <label v-if="currentOptions.format === 'png'" class="block space-y-2">
            <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.losslessPng') }}</span>
            <span class="inline-flex w-full items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
              <input v-model="currentOptions.optimisePng" type="checkbox" class="size-4 accent-acid" @change="patchCurrentOptions({})">
              {{ t('image.optimisePng') }}
            </span>
          </label>

          <div v-else-if="currentOptions.format === 'webp'" class="space-y-2">
            <label class="block space-y-2">
              <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ displayedQuality }}</span>
              <input v-model.number="currentOptions.quality" class="w-full accent-acid disabled:opacity-40" type="range" min="1" max="100" :disabled="currentOptions.webpLossless" @change="patchCurrentOptions({})">
            </label>
            <label class="inline-flex items-center gap-2 font-mono text-xs font-black text-ink/70">
              <input v-model="currentOptions.webpLossless" type="checkbox" class="size-4 accent-acid" @change="patchCurrentOptions({})">
              {{ t('image.webpLossless') }}
            </label>
          </div>

          <label v-else class="block space-y-2">
            <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ currentOptions.quality }}</span>
            <input v-model.number="currentOptions.quality" class="w-full accent-acid" type="range" min="1" max="100" @change="patchCurrentOptions({})">
          </label>
        </div>
      </div>

      <div class="grid gap-2 border border-line bg-grid/70 px-3 py-2 font-mono text-xs font-bold text-ink/52 sm:grid-cols-3">
        <span>{{ t('image.sourceSize') }} {{ formatFileSize(originalSizeReference) }}</span>
        <span>{{ t('image.outputSizeReference') }} {{ outputSizeReference ? formatFileSize(outputSizeReference) : t('image.convertForEstimate') }}</span>
        <span v-if="savedPercentReference !== null">{{ t('image.savedReference') }} {{ savedPercentReference }}{{ t('common.percent') }}</span>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.width') }}</span>
          <input
            :value="currentOptions.maxWidth"
            class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink disabled:opacity-40"
            type="number"
            min="1"
            step="1"
            :disabled="currentOptions.preserveDimensions"
            @input="updateWidth"
          >
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.height') }}</span>
          <input
            :value="currentOptions.maxHeight"
            class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink disabled:opacity-40"
            type="number"
            min="1"
            step="1"
            :disabled="currentOptions.preserveDimensions"
            @input="updateHeight"
          >
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
          :class="currentOptions.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
          @click="setPreserveDimensions(true)"
        >
          {{ t('image.keepOriginal') }}
        </button>
        <button
          type="button"
          class="focus-ring border px-3 py-2 font-mono text-xs font-black transition"
          :class="!currentOptions.preserveDimensions ? 'border-sky bg-sky text-paper' : 'border-line bg-grid text-ink/62 hover:border-sky hover:text-sky'"
          @click="setPreserveDimensions(false)"
        >
          {{ t('image.proportionalResize') }}
        </button>
        <span v-if="settingsScope === 'batch' && previews.length > 1" class="inline-flex items-center border border-line bg-grid px-3 py-2 font-mono text-xs font-bold text-ink/42">
          {{ t('image.batchRatioHint') }}
        </span>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_rgb(109_255_157_/_18%)] transition hover:bg-acid/85 disabled:opacity-50"
          :disabled="!canConvert"
          @click="convert"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing ? t('common.processing') : t('image.convert') }}
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

      <p v-if="!results.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-sm font-bold text-ink/42">
        {{ t('image.empty') }}
      </p>
      <ResultList v-else :image-results="results" />
    </div>

    <ImageCropEditor
      v-if="activeCropPreview"
      :preview="activeCropPreview"
      @clear="clearCrop"
      @close="cropEditorIndex = null"
      @save="saveCrop"
    />
  </section>
</template>

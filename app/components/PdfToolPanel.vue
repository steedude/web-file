<script setup lang="ts">
import { FileStack, Play, Trash2 } from '@lucide/vue'
import { pdfModeOptions } from '~/configs/file-tool.config'
import { PdfModeValue } from '~/types/file-tool.type'

const { t } = useI18n()
const { getPdfModeLabel } = useFileToolLang()
const PdfPageWorkspace = defineAsyncComponent(() => import('~/components/PdfPageWorkspace.vue'))
const {
  addFiles,
  canRun,
  clear,
  error,
  files,
  imageResults,
  isRenderingPages,
  isProcessing,
  movePage,
  options,
  pages,
  removePage,
  removeFile,
  reorderPages,
  results,
  run,
  selectAllPages,
  togglePageSelection,
} = usePdfWorkshop()

function updateWatermarkText(event: Event) {
  options.watermarkText = (event.target as HTMLInputElement).value
}

function updateWatermarkFontSize(event: Event) {
  options.watermarkFontSize = Math.max(8, Math.min(160, Number((event.target as HTMLInputElement).value) || 48))
}

function updateWatermarkOpacity(event: Event) {
  options.watermarkOpacity = Math.max(5, Math.min(100, Number((event.target as HTMLInputElement).value) || 25))
}

function updateWatermarkRotation(event: Event) {
  options.watermarkRotation = Math.max(-90, Math.min(90, Number((event.target as HTMLInputElement).value) || 0))
}

function updateWatermarkColor(event: Event) {
  options.watermarkColor = (event.target as HTMLInputElement).value
}

function setWatermarkPreviewScale(scale: typeof options.watermarkPreviewScale) {
  options.watermarkPreviewScale = scale
}

function updateImageFormat(event: Event) {
  options.imageFormat = (event.target as HTMLSelectElement).value as typeof options.imageFormat
}

function updateImageQuality(event: Event) {
  options.imageQuality = Math.max(1, Math.min(100, Number((event.target as HTMLInputElement).value) || 90))
}

function updateImageScale(event: Event) {
  options.imageScale = Math.max(1, Math.min(3, Number((event.target as HTMLInputElement).value) || 2))
}
</script>

<template>
  <section class="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <span class="grid size-11 shrink-0 place-items-center border border-lilac/70 bg-lilac/12 text-lilac shadow-[0_0_28px_var(--fx-lilac-14)]">
          <FileStack class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-mono text-2xl font-black tracking-tight text-ink">
            {{ t('pdf.title') }}
          </h2>
          <p class="mt-2 text-base leading-7 font-semibold text-ink/62">
            {{ t('pdf.description') }}
          </p>
        </div>
      </div>

      <div class="border border-line bg-panel/82 p-1 shadow-[0_0_34px_var(--fx-lilac-7)]">
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="mode in pdfModeOptions"
            :key="mode"
            type="button"
            class="focus-ring min-h-12 border px-4 py-3 font-mono text-sm font-black transition"
            :aria-pressed="options.mode === mode"
            :class="options.mode === mode ? 'border-lilac bg-lilac text-paper shadow-[0_0_22px_var(--fx-lilac-18)]' : 'border-transparent bg-grid/70 text-ink/62 hover:border-lilac/70 hover:text-lilac'"
            @click="options.mode = mode"
          >
            {{ getPdfModeLabel(mode) }}
          </button>
        </div>
      </div>

      <FileDropZone accept="application/pdf,.pdf" :label="t('common.dropFiles')" :multiple="options.mode === PdfModeValue.Merge" @files="addFiles" />
      <FileList :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_var(--fx-lilac-7)] backdrop-blur">
      <PdfWatermarkControls
        v-if="options.mode === PdfModeValue.Watermark"
        :options="options"
        @set-preview-scale="setWatermarkPreviewScale"
        @update-color="updateWatermarkColor"
        @update-font-size="updateWatermarkFontSize"
        @update-opacity="updateWatermarkOpacity"
        @update-rotation="updateWatermarkRotation"
        @update-text="updateWatermarkText"
      />

      <PdfImageExportControls
        v-if="options.mode === PdfModeValue.Images"
        :options="options"
        @update-format="updateImageFormat"
        @update-quality="updateImageQuality"
        @update-scale="updateImageScale"
      />

      <PdfPageWorkspace
        :is-loading="isRenderingPages"
        :mode="options.mode"
        :pages="pages"
        @move="movePage"
        @remove="removePage"
        @reorder="reorderPages"
        @select-all="selectAllPages"
        @toggle="togglePageSelection"
      />

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_var(--fx-acid-18)] transition hover:bg-acid/85 disabled:opacity-50"
          :disabled="!canRun"
          @click="run"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing || isRenderingPages ? t('common.processing') : t('pdf.run') }}
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

      <p v-if="!results.length && !imageResults.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-base font-bold text-ink/52">
        {{ t('pdf.resultEmpty') }}
      </p>
      <ResultList v-else :image-results="imageResults" :pdf-results="results" :show-image-details="options.mode !== PdfModeValue.Images" />
    </div>
  </section>
</template>

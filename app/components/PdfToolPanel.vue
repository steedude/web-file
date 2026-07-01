<script setup lang="ts">
import { FileStack, Play, Trash2 } from '@lucide/vue'
import { pdfImageFormatOptions, pdfModeOptions, pdfWatermarkPositionOptions } from '~/configs/file-tool.config'

const { t } = useI18n()
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

const watermarkPreviewStyle = computed(() => ({
  color: options.watermarkColor,
  opacity: options.watermarkOpacity / 100,
  fontSize: `${Math.max(14, options.watermarkFontSize * 0.6)}px`,
  transform: `rotate(${options.watermarkRotation}deg)`,
}))
const watermarkPreviewPositionClass = computed(() => {
  if (options.watermarkPosition === 'topLeft')
    return 'items-start justify-start'

  if (options.watermarkPosition === 'topRight')
    return 'items-start justify-end'

  if (options.watermarkPosition === 'bottomLeft')
    return 'items-end justify-start'

  if (options.watermarkPosition === 'bottomRight')
    return 'items-end justify-end'

  return 'items-center justify-center'
})

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

function updateWatermarkPosition(event: Event) {
  options.watermarkPosition = (event.target as HTMLSelectElement).value as typeof options.watermarkPosition
}

function updateWatermarkColor(event: Event) {
  options.watermarkColor = (event.target as HTMLInputElement).value
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
        <span class="grid size-11 shrink-0 place-items-center border border-lilac/70 bg-lilac/12 text-lilac shadow-[0_0_28px_rgb(167_139_250_/_14%)]">
          <FileStack class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-mono text-2xl font-black tracking-tight text-ink">
            {{ t('pdf.title') }}
          </h2>
          <p class="mt-2 text-sm leading-6 font-semibold text-ink/52">
            {{ t('pdf.description') }}
          </p>
        </div>
      </div>

      <FileDropZone accept="application/pdf,.pdf" :label="t('common.dropFiles')" :multiple="options.mode === 'merge'" @files="addFiles" />
      <FileList :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_rgb(167_139_250_/_7%)] backdrop-blur">
      <div class="space-y-2">
        <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.mode') }}</span>
        <div class="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <button
            v-for="mode in pdfModeOptions"
            :key="mode"
            type="button"
            class="focus-ring border px-3 py-2 font-mono text-sm font-black transition"
            :class="options.mode === mode ? 'border-lilac bg-lilac text-paper shadow-[0_0_20px_rgb(167_139_250_/_18%)]' : 'border-line bg-grid text-ink/62 hover:border-lilac hover:text-lilac'"
            @click="options.mode = mode"
          >
            {{ t(`pdf.${mode}`) }}
          </button>
        </div>
      </div>

      <div v-if="options.mode === 'watermark'" class="grid gap-4 md:grid-cols-2">
        <label class="space-y-2 md:col-span-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkText') }}</span>
          <input :value="options.watermarkText" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" type="text" autocomplete="off" @input="updateWatermarkText">
        </label>

        <div class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkColor') }}</span>
          <label class="flex h-10 items-center gap-3 border border-line bg-grid px-3">
            <input :value="options.watermarkColor" class="size-6 border border-line bg-transparent" type="color" @input="updateWatermarkColor">
            <span class="font-mono text-sm font-black text-ink">{{ options.watermarkColor.toUpperCase() }}</span>
          </label>
        </div>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkPosition') }}</span>
          <select :value="options.watermarkPosition" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateWatermarkPosition">
            <option v-for="position in pdfWatermarkPositionOptions" :key="position" :value="position">
              {{ t(`pdf.watermarkPositions.${position}`) }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkSize') }} {{ t('common.dot') }} {{ options.watermarkFontSize }}</span>
          <input :value="options.watermarkFontSize" class="h-9 w-full accent-acid" type="range" min="8" max="160" step="1" @input="updateWatermarkFontSize">
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkOpacity') }} {{ t('common.dot') }} {{ options.watermarkOpacity }}{{ t('common.percent') }}</span>
          <input :value="options.watermarkOpacity" class="h-9 w-full accent-acid" type="range" min="5" max="100" step="1" @input="updateWatermarkOpacity">
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkRotation') }} {{ t('common.dot') }} {{ options.watermarkRotation }}{{ t('common.degree') }}</span>
          <input :value="options.watermarkRotation" class="h-9 w-full accent-acid" type="range" min="-90" max="90" step="1" @input="updateWatermarkRotation">
        </label>

        <div class="space-y-2 md:col-span-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkPreview') }}</span>
          <div class="relative h-40 overflow-hidden border border-line bg-paper">
            <div class="absolute inset-0 bg-[linear-gradient(rgb(223_253_242_/_6%)_1px,transparent_1px),linear-gradient(90deg,rgb(223_253_242_/_6%)_1px,transparent_1px)] bg-[length:24px_24px]" />
            <div class="absolute inset-4 overflow-hidden border border-line/70 bg-grid/38">
              <div v-if="options.watermarkPosition === 'tile'" class="absolute inset-0 grid grid-cols-2 place-items-center gap-4 p-4">
                <span v-for="item in 6" :key="item" class="font-mono font-black whitespace-nowrap" :style="watermarkPreviewStyle">
                  {{ options.watermarkText || 'web file' }}
                </span>
              </div>
              <div v-else class="absolute inset-0 flex p-4" :class="watermarkPreviewPositionClass">
                <span class="font-mono font-black whitespace-nowrap" :style="watermarkPreviewStyle">
                  {{ options.watermarkText || 'web file' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="options.mode === 'images'" class="grid gap-4 md:grid-cols-3">
        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageFormat') }}</span>
          <select :value="options.imageFormat" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" @change="updateImageFormat">
            <option v-for="format in pdfImageFormatOptions" :key="format" :value="format">
              {{ format.toUpperCase() }}
            </option>
          </select>
        </label>

        <label v-if="options.imageFormat !== 'png'" class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageQuality') }} {{ t('common.dot') }} {{ options.imageQuality }}</span>
          <input :value="options.imageQuality" class="h-9 w-full accent-acid" type="range" min="1" max="100" step="1" @input="updateImageQuality">
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageScale') }} {{ t('common.dot') }} {{ options.imageScale }}{{ t('common.by') }}</span>
          <input :value="options.imageScale" class="h-9 w-full accent-acid" type="range" min="1" max="3" step="0.5" @input="updateImageScale">
        </label>
      </div>

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
          class="focus-ring inline-flex items-center gap-2 border border-acid/70 bg-acid px-5 py-3 font-mono text-sm font-black text-paper shadow-[0_0_24px_rgb(109_255_157_/_18%)] transition hover:bg-acid/85 disabled:opacity-50"
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

      <p v-if="!results.length && !imageResults.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-sm font-bold text-ink/42">
        {{ t('pdf.empty') }}
      </p>
      <ResultList v-else :image-results="imageResults" :pdf-results="results" :show-image-details="options.mode !== 'images'" />
    </div>
  </section>
</template>

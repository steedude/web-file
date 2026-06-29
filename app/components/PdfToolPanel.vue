<script setup lang="ts">
import { FileStack, Play, Trash2 } from '@lucide/vue'
import { pdfModeOptions } from '~/configs/file-tool.config'

const { t } = useI18n()
const {
  addFiles,
  canRun,
  clear,
  error,
  files,
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
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
        <div class="grid grid-cols-2 gap-2">
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

      <p v-if="!results.length" class="border border-line bg-grid/70 px-3 py-8 text-center font-mono text-sm font-bold text-ink/42">
        {{ t('pdf.empty') }}
      </p>
      <ResultList v-else :pdf-results="results" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Image, Play, Trash2 } from '@lucide/vue'
import { imageFormatOptions } from '~/configs/file-tool.config'

const { t } = useI18n()
const {
  addFiles,
  canConvert,
  clear,
  convert,
  error,
  files,
  isProcessing,
  options,
  removeFile,
  results,
} = useImageTranscoder()
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
      <FileList :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 border border-line bg-panel/82 p-4 shadow-[0_0_44px_rgb(72_215_255_/_7%)] backdrop-blur">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.outputFormat') }}</span>
          <select v-model="options.format" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink">
            <option v-for="format in imageFormatOptions" :key="format.value" :value="format.value">
              {{ format.value.toUpperCase() }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ options.quality }}</span>
          <input v-model.number="options.quality" class="w-full accent-acid" type="range" min="1" max="100">
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.maxWidth') }}</span>
          <input v-model.number="options.maxWidth" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" type="number" min="64" step="64">
        </label>

        <label class="space-y-2">
          <span class="font-mono text-xs font-black tracking-widest text-sky uppercase">{{ t('image.maxHeight') }}</span>
          <input v-model.number="options.maxHeight" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-sm font-bold text-ink" type="number" min="64" step="64">
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <label class="inline-flex items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
          <input v-model="options.preserveDimensions" type="checkbox" class="size-4 accent-acid">
          {{ t('image.keepOriginal') }}
        </label>
        <label class="inline-flex items-center gap-2 border border-line bg-grid px-3 py-2 font-mono text-xs font-black text-ink/70">
          <input v-model="options.optimisePng" type="checkbox" class="size-4 accent-acid">
          {{ t('image.losslessPng') }}
        </label>
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
  </section>
</template>

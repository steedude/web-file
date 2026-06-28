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
        <span class="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sky shadow-[3px_3px_0_#171714]">
          <Image class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="text-2xl font-black">
            {{ t('image.title') }}
          </h2>
          <p class="mt-2 text-sm leading-6 font-semibold text-ink/62">
            {{ t('image.description') }}
          </p>
        </div>
      </div>

      <FileDropZone accept="image/*" :label="t('common.dropFiles')" @files="addFiles" />
      <FileList :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 rounded-lg border-2 border-ink bg-white/80 p-4 shadow-[4px_4px_0_#171714]">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('image.outputFormat') }}</span>
          <select v-model="options.format" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold">
            <option v-for="format in imageFormatOptions" :key="format.value" :value="format.value">
              {{ format.value.toUpperCase() }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('image.quality') }} {{ t('common.dot') }} {{ options.quality }}</span>
          <input v-model.number="options.quality" class="w-full accent-ink" type="range" min="1" max="100">
        </label>

        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('image.maxWidth') }}</span>
          <input v-model.number="options.maxWidth" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold" type="number" min="64" step="64">
        </label>

        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('image.maxHeight') }}</span>
          <input v-model.number="options.maxHeight" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold" type="number" min="64" step="64">
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <label class="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-black">
          <input v-model="options.preserveDimensions" type="checkbox" class="size-4 accent-ink">
          {{ t('image.keepOriginal') }}
        </label>
        <label class="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-3 py-2 text-xs font-black">
          <input v-model="options.optimisePng" type="checkbox" class="size-4 accent-ink">
          {{ t('image.losslessPng') }}
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 py-3 text-sm font-black shadow-[3px_3px_0_#171714] transition hover:-translate-y-0.5 disabled:opacity-50"
          :disabled="!canConvert"
          @click="convert"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing ? t('common.processing') : t('image.convert') }}
        </button>
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-5 py-3 text-sm font-black shadow-[3px_3px_0_#171714] transition hover:-translate-y-0.5"
          @click="clear"
        >
          <Trash2 class="size-4" aria-hidden="true" />
          {{ t('common.clear') }}
        </button>
      </div>

      <p v-if="error" class="rounded-md border-2 border-coral bg-coral/15 px-3 py-2 text-sm font-bold">
        {{ error }}
      </p>

      <p v-if="!results.length" class="rounded-md border-2 border-ink/15 bg-paper px-3 py-8 text-center text-sm font-bold text-ink/55">
        {{ t('image.empty') }}
      </p>
      <ResultList v-else :image-results="results" />
    </div>
  </section>
</template>

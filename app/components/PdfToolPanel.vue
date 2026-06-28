<script setup lang="ts">
import { FileStack, Play, Trash2 } from '@lucide/vue'
import { pdfModeOptions, rotationOptions } from '~/configs/file-tool.config'

const { t } = useI18n()
const {
  addFiles,
  canRun,
  clear,
  error,
  files,
  isProcessing,
  options,
  removeFile,
  results,
  run,
} = usePdfWorkshop()
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <span class="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lilac shadow-[3px_3px_0_#171714]">
          <FileStack class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="text-2xl font-black">
            {{ t('pdf.title') }}
          </h2>
          <p class="mt-2 text-sm leading-6 font-semibold text-ink/62">
            {{ t('pdf.description') }}
          </p>
        </div>
      </div>

      <FileDropZone accept="application/pdf,.pdf" :label="t('common.dropFiles')" @files="addFiles" />
      <FileList :files="files" @remove="removeFile" />
    </div>

    <div class="space-y-4 rounded-lg border-2 border-ink bg-white/80 p-4 shadow-[4px_4px_0_#171714]">
      <div class="space-y-2">
        <span class="text-xs font-black tracking-widest uppercase">{{ t('pdf.mode') }}</span>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="mode in pdfModeOptions"
            :key="mode"
            type="button"
            class="focus-ring rounded-full border-2 border-ink px-3 py-2 text-sm font-black transition"
            :class="options.mode === mode ? 'bg-acid shadow-[2px_2px_0_#171714]' : 'bg-white'"
            @click="options.mode = mode"
          >
            {{ t(`pdf.${mode}`) }}
          </button>
        </div>
      </div>

      <label v-if="options.mode === 'split'" class="block space-y-2">
        <span class="text-xs font-black tracking-widest uppercase">{{ t('pdf.pageRanges') }}</span>
        <input v-model="options.ranges" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold" type="text">
        <span class="text-xs font-bold text-ink/55">{{ t('pdf.pageRangesHelp') }}</span>
      </label>

      <div v-if="options.mode === 'edit'" class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('pdf.rotation') }}</span>
          <select v-model.number="options.rotation" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold">
            <option v-for="rotation in rotationOptions" :key="rotation" :value="rotation">
              {{ rotation }}{{ t('common.degree') }}
            </option>
          </select>
        </label>
        <label class="space-y-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('pdf.titleField') }}</span>
          <input v-model="options.title" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold" type="text">
        </label>
        <label class="space-y-2 sm:col-span-2">
          <span class="text-xs font-black tracking-widest uppercase">{{ t('pdf.author') }}</span>
          <input v-model="options.author" class="focus-ring w-full rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-bold" type="text">
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 py-3 text-sm font-black shadow-[3px_3px_0_#171714] transition hover:-translate-y-0.5 disabled:opacity-50"
          :disabled="!canRun"
          @click="run"
        >
          <Play class="size-4" aria-hidden="true" />
          {{ isProcessing ? t('common.processing') : t('pdf.run') }}
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
        {{ t('pdf.empty') }}
      </p>
      <ResultList v-else :pdf-results="results" />
    </div>
  </section>
</template>

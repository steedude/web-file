<script setup lang="ts">
import type { ConvertedImage, PdfResult } from '~/types/file-tool.type'
import { Download } from '@lucide/vue'
import { formatFileSize, percentSaved } from '~/utils/file-size.util'

defineProps<{
  imageResults?: ConvertedImage[]
  pdfResults?: PdfResult[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-3">
    <article
      v-for="result in imageResults"
      :key="result.id"
      class="grid gap-4 rounded-lg border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#171714] sm:grid-cols-[96px_1fr_auto] sm:items-center"
    >
      <img :src="result.url" :alt="result.fileName" class="h-24 w-24 rounded-md border-2 border-ink object-cover">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-black">
          {{ result.fileName }}
        </h3>
        <p class="mt-1 text-xs font-bold text-ink/60">
          {{ result.width }} {{ t('common.by') }} {{ result.height }} {{ t('common.dot') }} {{ formatFileSize(result.originalSize) }} {{ t('common.arrow') }} {{ formatFileSize(result.outputSize) }}
        </p>
        <p class="mt-1 text-xs font-black" :class="percentSaved(result.originalSize, result.outputSize) >= 0 ? 'text-mint' : 'text-coral'">
          {{ percentSaved(result.originalSize, result.outputSize) }}{{ t('common.percent') }}
        </p>
      </div>
      <a
        class="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-4 py-2 text-xs font-black shadow-[2px_2px_0_#171714] transition hover:-translate-y-0.5"
        :href="result.url"
        :download="result.fileName"
      >
        <Download class="size-4" aria-hidden="true" />
        {{ $t('common.download') }}
      </a>
    </article>

    <article
      v-for="result in pdfResults"
      :key="result.id"
      class="flex flex-col gap-4 rounded-lg border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#171714] sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <h3 class="truncate text-sm font-black">
          {{ result.fileName }}
        </h3>
        <p class="mt-1 text-xs font-bold text-ink/60">
          {{ formatFileSize(result.size) }}
        </p>
      </div>
      <a
        class="focus-ring inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-4 py-2 text-xs font-black shadow-[2px_2px_0_#171714] transition hover:-translate-y-0.5"
        :href="result.url"
        :download="result.fileName"
      >
        <Download class="size-4" aria-hidden="true" />
        {{ $t('common.download') }}
      </a>
    </article>
  </div>
</template>

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
      class="grid gap-4 border border-line bg-grid/80 p-4 shadow-[0_0_24px_rgb(0_0_0_/_18%)] md:grid-cols-[96px_1fr_auto] md:items-center"
    >
      <img :src="result.url" :alt="result.fileName" class="h-24 w-24 border border-line object-cover">
      <div class="min-w-0">
        <h3 class="truncate font-mono text-sm font-black text-ink">
          {{ result.fileName }}
        </h3>
        <p class="mt-1 font-mono text-xs font-bold text-ink/46">
          {{ result.width }} {{ t('common.by') }} {{ result.height }} {{ t('common.dot') }} {{ formatFileSize(result.originalSize) }} {{ t('common.arrow') }} {{ formatFileSize(result.outputSize) }}
        </p>
        <p class="mt-1 font-mono text-xs font-black" :class="percentSaved(result.originalSize, result.outputSize) >= 0 ? 'text-mint' : 'text-coral'">
          {{ percentSaved(result.originalSize, result.outputSize) }}{{ t('common.percent') }}
        </p>
      </div>
      <a
        class="focus-ring inline-flex items-center justify-center gap-2 border border-acid/70 bg-acid px-4 py-2 font-mono text-xs font-black text-paper shadow-[0_0_20px_rgb(109_255_157_/_16%)] transition hover:bg-acid/85"
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
      class="flex flex-col gap-4 border border-line bg-grid/80 p-4 shadow-[0_0_24px_rgb(0_0_0_/_18%)] md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <h3 class="truncate font-mono text-sm font-black text-ink">
          {{ result.fileName }}
        </h3>
        <p class="mt-1 font-mono text-xs font-bold text-ink/46">
          {{ formatFileSize(result.size) }}
        </p>
      </div>
      <a
        class="focus-ring inline-flex items-center justify-center gap-2 border border-acid/70 bg-acid px-4 py-2 font-mono text-xs font-black text-paper shadow-[0_0_20px_rgb(109_255_157_/_16%)] transition hover:bg-acid/85"
        :href="result.url"
        :download="result.fileName"
      >
        <Download class="size-4" aria-hidden="true" />
        {{ $t('common.download') }}
      </a>
    </article>
  </div>
</template>

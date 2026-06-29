<script setup lang="ts">
import type { ToolMode } from '~/types/file-tool.type'
import { FileText, Image } from '@lucide/vue'
import ImageToolPanel from '~/components/ImageToolPanel.vue'
import PdfToolPanel from '~/components/PdfToolPanel.vue'

const { t } = useI18n()
const activeTool = ref<ToolMode>('image')

useSeoMeta({
  title: () => t('home.metaTitle', { brand: t('brand') }),
  description: () => t('home.description'),
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1540px] px-4 pt-6 pb-16 sm:px-5 lg:px-8 lg:pt-8">
    <section class="grid gap-4 border-b border-line/70 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-end">
      <div>
        <h1 class="max-w-4xl text-4xl leading-[0.96] font-black text-ink lg:text-6xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-4 max-w-3xl text-sm leading-6 font-semibold text-ink/58 lg:text-base">
          {{ t('home.summary') }}
        </p>
      </div>

      <div class="grid w-full grid-cols-2 border border-line bg-panel/75 p-1 shadow-[0_0_32px_rgb(72_215_255_/_8%)]">
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-sm font-black tracking-wide transition"
          :class="activeTool === 'image' ? 'bg-sky text-paper' : 'text-ink/58 hover:bg-panel-soft hover:text-sky'"
          @click="activeTool = 'image'"
        >
          <Image class="size-4" aria-hidden="true" />
          {{ t('home.imageTab') }}
        </button>
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-sm font-black tracking-wide transition"
          :class="activeTool === 'pdf' ? 'bg-lilac text-paper' : 'text-ink/58 hover:bg-panel-soft hover:text-lilac'"
          @click="activeTool = 'pdf'"
        >
          <FileText class="size-4" aria-hidden="true" />
          {{ t('home.pdfTab') }}
        </button>
      </div>
    </section>

    <div class="mt-6">
      <ImageToolPanel v-if="activeTool === 'image'" />
      <PdfToolPanel v-else />
    </div>
  </div>
</template>

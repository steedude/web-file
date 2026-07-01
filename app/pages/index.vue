<script setup lang="ts">
import type { ToolMode } from '~/types/file-tool.type'
import { FileText, Image } from '@lucide/vue'
import { ToolModeValue } from '~/types/file-tool.type'

const { t } = useI18n()
const activeTool = ref<ToolMode>(ToolModeValue.Image)
const ImageToolPanel = defineAsyncComponent(() => import('~/components/ImageToolPanel.vue'))
const PdfToolPanel = defineAsyncComponent(() => import('~/components/PdfToolPanel.vue'))

useSeoMeta({
  title: () => t('home.metaTitle', { brand: t('brand') }),
  description: () => t('home.description'),
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1540px] px-4 pt-6 pb-16 md:px-5 xl:px-8 xl:pt-8">
    <section class="grid gap-4 border-b border-line/70 pb-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] xl:items-end">
      <div>
        <h1 class="max-w-4xl text-4xl leading-[0.96] font-black text-ink xl:text-6xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-4 max-w-3xl text-sm leading-6 font-semibold text-ink/58 xl:text-base">
          {{ t('home.summary') }}
        </p>
      </div>

      <div class="grid w-full grid-cols-2 border border-line bg-panel/75 p-1 shadow-[0_0_32px_var(--fx-sky-8)]">
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-sm font-black tracking-wide transition"
          :class="activeTool === ToolModeValue.Image ? 'bg-sky text-paper' : 'text-ink/58 hover:bg-panel-soft hover:text-sky'"
          @click="activeTool = ToolModeValue.Image"
        >
          <Image class="size-4" aria-hidden="true" />
          {{ t('home.imageTab') }}
        </button>
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-sm font-black tracking-wide transition"
          :class="activeTool === ToolModeValue.Pdf ? 'bg-lilac text-paper' : 'text-ink/58 hover:bg-panel-soft hover:text-lilac'"
          @click="activeTool = ToolModeValue.Pdf"
        >
          <FileText class="size-4" aria-hidden="true" />
          {{ t('home.pdfTab') }}
        </button>
      </div>
    </section>

    <div class="mt-6">
      <ImageToolPanel v-if="activeTool === ToolModeValue.Image" />
      <PdfToolPanel v-else />
    </div>
  </div>
</template>

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
  <div class="mx-auto w-full max-w-7xl px-5 pt-8 pb-20 lg:px-10 lg:pt-14">
    <section>
      <div>
        <h1 class="max-w-4xl text-5xl leading-[0.94] font-black text-ink lg:text-7xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-6 max-w-3xl text-base leading-7 font-semibold text-ink/58 lg:text-lg">
          {{ t('home.summary') }}
        </p>
      </div>
    </section>

    <section class="mt-10">
      <div class="inline-grid w-full grid-cols-2 border border-line bg-panel/75 p-1 shadow-[0_0_32px_rgb(72_215_255_/_8%)] sm:w-auto">
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

    <div class="mt-8">
      <ImageToolPanel v-if="activeTool === 'image'" />
      <PdfToolPanel v-else />
    </div>
  </div>
</template>

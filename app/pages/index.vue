<script setup lang="ts">
import type { ToolMode } from '~/types/file-tool.type'
import { FileText, Image, Sparkles } from '@lucide/vue'
import { techBadges } from '~/configs/file-tool.config'

const { t } = useI18n()
const activeTool = ref<ToolMode>('image')

useSeoMeta({
  title: () => t('home.metaTitle', { brand: t('brand') }),
  description: () => t('home.description'),
})
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-5 pt-8 pb-20 lg:px-10 lg:pt-14">
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
      <div>
        <p class="font-mono text-xs font-black tracking-[0.24em] text-sky uppercase">
          {{ t('home.eyebrow') }}
        </p>
        <h1 class="mt-5 max-w-4xl text-5xl leading-[0.94] font-black text-ink lg:text-7xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-6 max-w-3xl text-base leading-7 font-semibold text-ink/58 lg:text-lg">
          {{ t('home.summary') }}
        </p>
      </div>

      <div class="grid gap-3 border border-line bg-panel/80 p-4 shadow-[0_0_44px_rgb(72_215_255_/_8%)] backdrop-blur">
        <div class="flex items-center gap-2 font-mono text-xs font-black tracking-widest text-acid uppercase">
          <Sparkles class="size-4" aria-hidden="true" />
          {{ t('home.stackSignals') }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span
            v-for="badge in techBadges"
            :key="badge"
            class="border border-line bg-grid/80 px-3 py-2 font-mono text-xs font-black text-ink/70"
          >
            {{ t(`tech.${badge}`) }}
          </span>
        </div>
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

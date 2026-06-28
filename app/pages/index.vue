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
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
      <div>
        <p class="font-mono text-xs font-black tracking-[0.22em] text-ink/50 uppercase">
          {{ t('home.eyebrow') }}
        </p>
        <h1 class="mt-5 max-w-4xl text-5xl leading-[0.94] font-black lg:text-7xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-6 max-w-3xl text-base leading-7 font-semibold text-ink/64 lg:text-lg">
          {{ t('home.summary') }}
        </p>
      </div>

      <div class="grid gap-3 rounded-lg border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#171714]">
        <div class="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-ink/55">
          <Sparkles class="size-4" aria-hidden="true" />
          {{ t('home.stackSignals') }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <span
            v-for="badge in techBadges"
            :key="badge"
            class="rounded-md border-2 border-ink bg-paper px-3 py-2 text-xs font-black"
          >
            {{ t(`tech.${badge}`) }}
          </span>
        </div>
      </div>
    </section>

    <section class="mt-10">
      <div class="inline-grid w-full grid-cols-2 gap-2 rounded-full border-2 border-ink bg-white p-1 shadow-[3px_3px_0_#171714] sm:w-auto">
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition"
          :class="activeTool === 'image' ? 'bg-sky' : 'hover:bg-paper'"
          @click="activeTool = 'image'"
        >
          <Image class="size-4" aria-hidden="true" />
          {{ t('home.imageTab') }}
        </button>
        <button
          type="button"
          class="focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition"
          :class="activeTool === 'pdf' ? 'bg-lilac' : 'hover:bg-paper'"
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

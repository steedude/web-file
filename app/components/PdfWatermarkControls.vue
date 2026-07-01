<script setup lang="ts">
import type { PdfOptions } from '~/types/file-tool.type'
import { pdfWatermarkPreviewScaleOptions } from '~/configs/file-tool.config'

const props = defineProps<{
  options: PdfOptions
}>()

const emit = defineEmits<{
  setPreviewScale: [scale: PdfOptions['watermarkPreviewScale']]
  updateColor: [event: Event]
  updateFontSize: [event: Event]
  updateOpacity: [event: Event]
  updateRotation: [event: Event]
  updateText: [event: Event]
}>()

const { t } = useI18n()
const watermarkPreviewText = computed(() => props.options.watermarkText || 'web file')
const watermarkPreviewFontSize = computed(() => Math.max(8, props.options.watermarkFontSize * props.options.watermarkPreviewScale / 100))
const watermarkPreviewStyle = computed(() => ({
  color: props.options.watermarkColor,
  opacity: props.options.watermarkOpacity / 100,
  fontSize: `${watermarkPreviewFontSize.value}px`,
  transform: `translate(-50%, -50%) rotate(${props.options.watermarkRotation}deg)`,
}))
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <label class="grid gap-2 md:col-span-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkText') }}</span>
      <input :value="options.watermarkText" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink" type="text" autocomplete="off" @input="emit('updateText', $event)">
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkColor') }}</span>
      <span class="flex h-10 items-center gap-3 border border-line bg-grid px-3">
        <input :value="options.watermarkColor" class="size-6 border border-line bg-transparent" type="color" @input="emit('updateColor', $event)">
        <span class="font-mono text-sm font-black text-ink">{{ options.watermarkColor.toUpperCase() }}</span>
      </span>
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkSize') }} {{ t('common.dot') }} {{ options.watermarkFontSize }}</span>
      <input :value="options.watermarkFontSize" class="h-9 w-full accent-acid" type="range" min="8" max="160" step="1" @input="emit('updateFontSize', $event)">
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkOpacity') }} {{ t('common.dot') }} {{ options.watermarkOpacity }}{{ t('common.percent') }}</span>
      <input :value="options.watermarkOpacity" class="h-9 w-full accent-acid" type="range" min="5" max="100" step="1" @input="emit('updateOpacity', $event)">
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkRotation') }} {{ t('common.dot') }} {{ options.watermarkRotation }}{{ t('common.degree') }}</span>
      <input :value="options.watermarkRotation" class="h-9 w-full accent-acid" type="range" min="-90" max="90" step="1" @input="emit('updateRotation', $event)">
    </label>

    <div class="space-y-2 md:col-span-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.watermarkPreview') }}</span>
        <div class="flex gap-2">
          <button
            v-for="scale in pdfWatermarkPreviewScaleOptions"
            :key="scale"
            type="button"
            class="focus-ring border px-3 py-1.5 font-mono text-sm font-black transition"
            :class="options.watermarkPreviewScale === scale ? 'border-lilac bg-lilac text-paper' : 'border-line bg-grid text-ink/62 hover:border-lilac hover:text-lilac'"
            @click="emit('setPreviewScale', scale)"
          >
            {{ scale }}{{ t('common.percent') }}
          </button>
        </div>
      </div>
      <div class="relative h-56 overflow-hidden border border-line bg-paper">
        <div class="absolute inset-0 bg-[linear-gradient(var(--fx-ink-6)_1px,transparent_1px),linear-gradient(90deg,var(--fx-ink-6)_1px,transparent_1px)] bg-[length:24px_24px]" />
        <div class="absolute inset-4 overflow-hidden border border-line/70 bg-grid/38">
          <span class="absolute top-1/2 left-1/2 font-mono font-black whitespace-nowrap" :style="watermarkPreviewStyle">
            {{ watermarkPreviewText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

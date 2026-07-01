<script setup lang="ts">
import type { PdfOptions } from '~/types/file-tool.type'
import { pdfImageFormatOptions } from '~/configs/file-tool.config'
import { PdfImageOutputFormatValue } from '~/types/file-tool.type'

defineProps<{
  options: PdfOptions
}>()

const emit = defineEmits<{
  updateFormat: [event: Event]
  updateQuality: [event: Event]
  updateScale: [event: Event]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-3">
    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageFormat') }}</span>
      <select :value="options.imageFormat" class="focus-ring w-full border border-line bg-grid px-3 py-2 font-mono text-base font-bold text-ink" @change="emit('updateFormat', $event)">
        <option v-for="format in pdfImageFormatOptions" :key="format" :value="format">
          {{ format.toUpperCase() }}
        </option>
      </select>
    </label>

    <label v-if="options.imageFormat !== PdfImageOutputFormatValue.Png" class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageQuality') }} {{ t('common.dot') }} {{ options.imageQuality }}</span>
      <input :value="options.imageQuality" class="h-9 w-full accent-acid" type="range" min="1" max="100" step="1" @input="emit('updateQuality', $event)">
    </label>

    <label class="grid gap-2">
      <span class="font-mono text-sm font-black tracking-widest text-lilac uppercase">{{ t('pdf.imageScale') }} {{ t('common.dot') }} {{ options.imageScale }}{{ t('common.by') }}</span>
      <input :value="options.imageScale" class="h-9 w-full accent-acid" type="range" min="1" max="3" step="0.5" @input="emit('updateScale', $event)">
    </label>
  </div>
</template>
